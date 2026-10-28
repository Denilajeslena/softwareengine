import io
import re
import uuid
import hmac
import base64
import hashlib
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Tuple
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app
import qrcode
from app.services.database import get_mongo_client

logger = logging.getLogger(__name__)

# In-memory user fallback store (thread-safe operations in Python GIL)
_in_memory_users: Dict[str, Dict[str, Any]] = {}
_seeded = False


def _seed_initial_accounts():
    """Seeds default demonstration accounts for Student, Librarian, and Admin."""
    global _seeded
    if _seeded:
        return

    default_accounts = [
        {
            "id": "USR-ADMIN-001",
            "name": "Sarah Connor",
            "email": "admin@scholars.shelf",
            "password_hash": generate_password_hash("AdminPass123!", method="pbkdf2:sha256"),
            "role": "admin",
            "department": "Library Systems & University Governance",
            "status": "active",
            "created_at": "2026-01-15T08:00:00Z",
            "preferences": {
                "emailDueReminders": True,
                "holdArrivalAlerts": True,
                "acquisitionsDigest": True,
                "fontSize": "normal",
                "theme": "ivory",
            },
        },
        {
            "id": "USR-LIB-001",
            "name": "Dr. Eleanor Vance",
            "email": "librarian@scholars.shelf",
            "password_hash": generate_password_hash("LibrarianPass123!", method="pbkdf2:sha256"),
            "role": "librarian",
            "department": "Collections Management & Cataloguing",
            "status": "active",
            "created_at": "2026-01-20T09:30:00Z",
            "preferences": {
                "emailDueReminders": True,
                "holdArrivalAlerts": True,
                "acquisitionsDigest": False,
                "fontSize": "normal",
                "theme": "ivory",
            },
        },
        {
            "id": "USR-STU-001",
            "name": "Alexandra Vance",
            "email": "student@scholars.shelf",
            "password_hash": generate_password_hash("StudentPass123!", method="pbkdf2:sha256"),
            "role": "student",
            "student_id": "STU-2024-8841",
            "department": "School of Computing & Mathematical Sciences",
            "status": "active",
            "created_at": "2026-02-01T10:15:00Z",
            "preferences": {
                "emailDueReminders": True,
                "holdArrivalAlerts": True,
                "acquisitionsDigest": True,
                "fontSize": "normal",
                "theme": "ivory",
            },
        },
    ]

    for acc in default_accounts:
        _in_memory_users[acc["id"]] = acc

    _seeded = True


# Run seed once at import time
_seed_initial_accounts()


def get_users_collection():
    """Returns MongoDB users collection if connected, else None."""
    try:
        uri = current_app.config.get("MONGODB_URI", "")
        db_name = current_app.config.get("MONGODB_DB_NAME", "scholars_shelf")
        timeout_ms = current_app.config.get("MONGODB_TIMEOUT_MS", 2000)
        client = get_mongo_client(uri, timeout_ms=timeout_ms)
        if client is not None:
            col = client[db_name]["users"]
            try:
                if col.count_documents({}) == 0 and _in_memory_users:
                    col.insert_many([dict(u) for u in _in_memory_users.values()])
            except Exception:
                pass
            return col
    except Exception:
        pass
    return None


def sanitize_user(user: Dict[str, Any]) -> Dict[str, Any]:
    """Removes sensitive credentials (password_hash) from user dict."""
    if not user:
        return {}
    clean = dict(user)
    clean.pop("password_hash", None)
    if "_id" in clean and "id" not in clean:
        clean["id"] = str(clean.pop("_id"))
    elif "_id" in clean:
        clean.pop("_id")
    return clean


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Retrieves a user by email (case-insensitive)."""
    norm_email = email.strip().lower()
    col = get_users_collection()
    if col is not None:
        try:
            doc = col.find_one({"email": norm_email})
            if doc:
                return doc
        except Exception:
            pass

    # Fallback to in-memory store
    for user in _in_memory_users.values():
        if user.get("email", "").lower() == norm_email:
            return user
    return None


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a user by unique identifier."""
    if not user_id:
        return None

    col = get_users_collection()
    if col is not None:
        try:
            doc = col.find_one({"id": user_id}) or col.find_one({"_id": user_id})
            if doc:
                return doc
        except Exception:
            pass

    return _in_memory_users.get(user_id)


def create_user(
    name: str,
    email: str,
    password: str,
    role: str = "student",
    department: Optional[str] = None,
    student_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Creates a new user record with securely hashed password.
    """
    norm_email = email.strip().lower()

    valid_roles = ["student", "librarian", "admin"]
    if role not in valid_roles:
        role = "student"

    if role == "student" and not student_id:
        student_id = f"STU-{datetime.now().year}-{str(uuid.uuid4().int)[:4]}"

    password_hash = generate_password_hash(password, method="pbkdf2:sha256")
    user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"

    user_record = {
        "id": user_id,
        "name": name.strip(),
        "email": norm_email,
        "password_hash": password_hash,
        "role": role,
        "student_id": student_id,
        "department": department or "General Studies",
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "preferences": {
            "emailDueReminders": True,
            "holdArrivalAlerts": True,
            "acquisitionsDigest": True,
            "fontSize": "normal",
            "theme": "ivory",
        },
    }

    col = get_users_collection()
    if col is not None:
        try:
            col.insert_one(dict(user_record))
        except Exception as e:
            logger.error(f"Failed to insert user to MongoDB: {e}")

    _in_memory_users[user_id] = user_record
    return user_record


def update_user_status(user_id: str, new_status: str, actor_id: str) -> Dict[str, Any]:
    """
    Activates or deactivates an account.
    Safeguard: strictly forbids deactivating the last active administrator.
    """
    user = get_user_by_id(user_id)
    if not user:
        raise ValueError(f"User '{user_id}' not found.")

    if new_status not in ("active", "suspended", "inactive"):
        raise ValueError("Invalid status. Must be 'active', 'suspended', or 'inactive'.")

    # Protection: check if user is an admin and is being deactivated
    if user.get("role") == "admin" and new_status != "active":
        all_admins = [u for u in list_users(role="admin") if u.get("status") == "active"]
        if len(all_admins) <= 1:
            raise ValueError("Governance Safeguard: Cannot deactivate the last active institutional administrator.")

    col = get_users_collection()
    if col is not None:
        try:
            col.update_one({"id": user_id}, {"$set": {"status": new_status}})
        except Exception as e:
            logger.error(f"Failed to update user status in MongoDB: {e}")

    if user_id in _in_memory_users:
        _in_memory_users[user_id]["status"] = new_status
    user["status"] = new_status

    return sanitize_user(user)


def delete_user(user_id: str, actor_id: str) -> Dict[str, Any]:
    """
    Deletes or archives a user.
    Safeguards: Cannot delete the last active administrator. Cannot delete patrons with active loans.
    """
    user = get_user_by_id(user_id)
    if not user:
        raise ValueError(f"User '{user_id}' not found.")

    if user.get("role") == "admin":
        all_admins = [u for u in list_users(role="admin") if u.get("status") == "active"]
        if len(all_admins) <= 1:
            raise ValueError("Governance Safeguard: Cannot remove the last active institutional administrator.")

    # Check for active loans
    try:
        try:
            from backend.app.services.circulation_service import get_all_loans
        except ImportError:
            from app.services.circulation_service import get_all_loans
        active_loans = [
            l for l in get_all_loans(user_id=user["id"])
            if l.get("status") in ("active", "overdue")
        ]
        if active_loans:
            raise ValueError(f"Cannot delete user with {len(active_loans)} outstanding active loans. Process returns first.")
    except ImportError:
        pass

    col = get_users_collection()
    if col is not None:
        try:
            col.delete_one({"id": user_id})
        except Exception as e:
            logger.error(f"Failed to delete user in MongoDB: {e}")

    if user_id in _in_memory_users:
        del _in_memory_users[user_id]

    return {"deleted": True, "userId": user_id, "name": user.get("name")}


def get_user_preferences(user_id: str) -> Dict[str, Any]:
    """Retrieves saved user preferences with sensible defaults."""
    user = get_user_by_id(user_id)
    defaults = {
        "emailDueReminders": True,
        "holdArrivalAlerts": True,
        "acquisitionsDigest": True,
        "fontSize": "normal",
        "theme": "ivory",
    }
    if not user:
        return defaults
    return {**defaults, **user.get("preferences", {})}


def update_user_preferences(user_id: str, preferences: Dict[str, Any]) -> Dict[str, Any]:
    """Saves updated user preferences."""
    user = get_user_by_id(user_id)
    if not user:
        raise ValueError(f"User '{user_id}' not found.")

    current_prefs = user.get("preferences", {})
    clean_prefs = {
        "emailDueReminders": bool(preferences.get("emailDueReminders", current_prefs.get("emailDueReminders", True))),
        "holdArrivalAlerts": bool(preferences.get("holdArrivalAlerts", current_prefs.get("holdArrivalAlerts", True))),
        "acquisitionsDigest": bool(preferences.get("acquisitionsDigest", current_prefs.get("acquisitionsDigest", True))),
        "fontSize": str(preferences.get("fontSize", current_prefs.get("fontSize", "normal"))),
        "theme": str(preferences.get("theme", current_prefs.get("theme", "ivory"))),
    }

    col = get_users_collection()
    if col is not None:
        try:
            col.update_one({"id": user_id}, {"$set": {"preferences": clean_prefs}})
        except Exception as e:
            logger.error(f"Failed to update preferences in MongoDB: {e}")

    if user_id in _in_memory_users:
        _in_memory_users[user_id]["preferences"] = clean_prefs
    user["preferences"] = clean_prefs

    return clean_prefs


def generate_student_card_qr(user_id: str) -> Dict[str, Any]:
    """
    Generates a cryptographically signed verifiable digital library card token and QR code data URL.
    Does NOT contain passwords, raw JWTs, or secret credentials.
    """
    user = get_user_by_id(user_id)
    if not user:
        raise ValueError(f"Student user '{user_id}' not found.")

    secret = current_app.config.get("SECRET_KEY", "scholars-shelf-secret").encode("utf-8")
    student_id = user.get("student_id") or user.get("id")
    name = user.get("name", "Scholar")
    valid_thru = "2028-06-30"

    payload_data = {
        "type": "scholars_shelf_card",
        "student_id": student_id,
        "user_id": user.get("id"),
        "role": user.get("role", "student"),
        "valid_thru": valid_thru,
        "issued_at": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    }
    payload_str = json.dumps(payload_data, sort_keys=True)
    signature = hmac.new(secret, payload_str.encode("utf-8"), hashlib.sha256).hexdigest()[:16]

    verifiable_token = base64.urlsafe_b64encode(
        f"{payload_str}|{signature}".encode("utf-8")
    ).decode("utf-8")

    # Generate QR Code image
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=6,
        border=2,
    )
    # Safe opaque verification URI
    qr_data = f"SCHOLARS-CARD:{student_id}:{verifiable_token[:24]}"
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#183D32", back_color="#FAF8F5")

    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

    return {
        "studentId": student_id,
        "name": name,
        "department": user.get("department", "General Studies"),
        "validThru": valid_thru,
        "verifiableToken": verifiable_token,
        "qrBase64": qr_base64,
        "cardStatus": "Active & Verified",
    }


def verify_student_card_token(token: str) -> Dict[str, Any]:
    """Verifies a scanned student digital library card token."""
    try:
        secret = current_app.config.get("SECRET_KEY", "scholars-shelf-secret").encode("utf-8")
        decoded = base64.urlsafe_b64decode(token.encode("utf-8")).decode("utf-8")
        payload_str, signature = decoded.rsplit("|", 1)
        expected_sig = hmac.new(secret, payload_str.encode("utf-8"), hashlib.sha256).hexdigest()[:16]
        if not hmac.compare_digest(signature, expected_sig):
            return {"valid": False, "reason": "Invalid or tampered card signature."}

        data = json.loads(payload_str)
        user = get_user_by_id(data.get("user_id"))
        if not user or user.get("status") != "active":
            return {"valid": False, "reason": "Account is inactive or not found."}

        return {
            "valid": True,
            "studentId": data.get("student_id"),
            "name": user.get("name"),
            "department": user.get("department"),
            "standing": "Good Standing",
            "role": user.get("role"),
            "validThru": data.get("valid_thru"),
        }
    except Exception as e:
        return {"valid": False, "reason": f"Card token decode error: {str(e)}"}


def list_students_with_circulation_summary(search: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Retrieves students cross-referenced with live circulation metrics
    (active loans, overdue fines, standing).
    """
    try:
        from backend.app.services.circulation_service import get_all_loans
    except ImportError:
        from app.services.circulation_service import get_all_loans

    all_users = list_users(role="student", limit=100)
    all_loans = get_all_loans()

    # Build loan map by user
    loans_by_user: Dict[str, List[Dict[str, Any]]] = {}
    for l in all_loans:
        u_id = l.get("userId") or l.get("userEmail")
        if u_id:
            loans_by_user.setdefault(u_id, []).append(l)

    student_records = []
    for u in all_users:
        if search:
            s_lower = search.lower()
            name_match = s_lower in u.get("name", "").lower()
            email_match = s_lower in u.get("email", "").lower()
            id_match = s_lower in (u.get("student_id") or u.get("id") or "").lower()
            if not (name_match or email_match or id_match):
                continue

        u_id = u["id"]
        u_email = u.get("email", "")
        student_loans = loans_by_user.get(u_id, []) + loans_by_user.get(u_email, [])

        active_loans = sum(1 for l in student_loans if l.get("status") in ("active", "overdue"))
        overdue_loans = sum(1 for l in student_loans if l.get("status") == "overdue")
        total_fines = sum(float(l.get("fineAmount", 0.0)) for l in student_loans)

        standing = "Good Standing" if overdue_loans == 0 and total_fines == 0.0 else "Overdue Fine"

        student_records.append({
            "id": u.get("student_id") or u["id"],
            "userId": u["id"],
            "name": u.get("name"),
            "email": u.get("email"),
            "department": u.get("department", "General Studies"),
            "activeLoans": active_loans,
            "overdueLoans": overdue_loans,
            "totalFines": round(total_fines, 2),
            "standing": standing,
            "status": u.get("status", "active"),
            "enrolledDate": u.get("created_at", "2026-01-01")[:10],
        })

    return student_records[:limit]


def verify_user_password(user: Dict[str, Any], password: str) -> bool:
    """Verifies candidate password against stored password_hash."""
    stored_hash = user.get("password_hash", "")
    if not stored_hash:
        return False
    return check_password_hash(stored_hash, password)


def list_users(role: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    """Lists users with sanitized fields (for admin views)."""
    col = get_users_collection()
    results = []
    if col is not None:
        try:
            query = {"role": role} if role else {}
            cursor = col.find(query).limit(limit)
            for doc in cursor:
                results.append(sanitize_user(doc))
            if results:
                return results
        except Exception:
            pass

    for user in list(_in_memory_users.values())[:limit]:
        if role is None or user.get("role") == role:
            results.append(sanitize_user(user))
    return results

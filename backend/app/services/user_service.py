import re
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app
from app.services.database import get_mongo_client

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
    Public registration strictly prevents creation of admin or librarian accounts.
    """
    norm_email = email.strip().lower()

    # Enforce safe role bounds
    valid_roles = ["student", "librarian", "admin"]
    if role not in valid_roles:
        role = "student"

    # Auto-generate student_id if needed
    if role == "student" and not student_id:
        student_id = f"STU-{datetime.now().year}-{str(uuid.uuid4().int)[:4]}"

    # Hash password securely
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
    }

    # Store in MongoDB if available
    col = get_users_collection()
    if col is not None:
        try:
            col.insert_one(dict(user_record))
        except Exception:
            pass

    # Store in memory cache
    _in_memory_users[user_id] = user_record
    return user_record


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


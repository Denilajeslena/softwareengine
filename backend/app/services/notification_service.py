import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
try:
    from backend.app.services.database import get_mongo_client
    from backend.app.services.circulation_service import get_student_loans, get_all_reservations
    from backend.app.services.book_service import get_book_by_id
except ImportError:
    from app.services.database import get_mongo_client
    from app.services.circulation_service import get_student_loans, get_all_reservations
    from app.services.book_service import get_book_by_id

logger = logging.getLogger(__name__)

_in_memory_notifications: Dict[str, Dict[str, Any]] = {}
_notifications_seeded = False


def get_notifications_collection():
    try:
        from flask import current_app
        client = get_mongo_client(current_app.config.get("MONGODB_URI", ""))
        if client is not None:
            db_name = current_app.config.get("MONGODB_DB_NAME", "scholars_shelf")
            return client[db_name]["notifications"]
    except Exception:
        pass
    return None


def _seed_initial_notifications():
    global _notifications_seeded
    if _notifications_seeded:
        return
    _notifications_seeded = True

    now = datetime.now(timezone.utc)
    two_days_ago = (now - timedelta(days=2)).isoformat()
    three_hours_ago = (now - timedelta(hours=3)).isoformat()
    one_day_ago = (now - timedelta(days=1)).isoformat()

    seed_items = [
        {
            "id": "notif-001",
            "userId": "usr-student-001",
            "role": "student",
            "title": "Upcoming Due Date Reminder",
            "message": "Introduction to Algorithms (CLRS) is due in 3 days on Oct 31, 2026. Please return or renew your volume to avoid overdue fines.",
            "type": "due_date",
            "severity": "warning",
            "read": False,
            "createdAt": three_hours_ago,
            "actionUrl": "/student/borrowed",
        },
        {
            "id": "notif-002",
            "userId": "usr-student-001",
            "role": "student",
            "title": "Reservation Ready for Collection",
            "message": "Your requested copy of Artificial Intelligence: A Modern Approach has arrived at the Main Stacks Circulation Desk. Hold expires in 48 hours.",
            "type": "reservation_ready",
            "severity": "info",
            "read": False,
            "createdAt": one_day_ago,
            "actionUrl": "/student/reservations",
        },
        {
            "id": "notif-003",
            "userId": "usr-student-001",
            "role": "student",
            "title": "Circulation Loan Approved",
            "message": "Your checkout request for Clean Code: A Handbook of Agile Software Craftsmanship was approved and issued by the library staff.",
            "type": "loan_approval",
            "severity": "success",
            "read": True,
            "createdAt": two_days_ago,
            "actionUrl": "/student/borrowed",
        },
        {
            "id": "notif-004",
            "userId": "usr-librarian-001",
            "role": "librarian",
            "title": "Critical Stock Shortage Flagged",
            "message": "Design Patterns has 0 available shelf copies and 2 patrons waiting in the hold queue. Procurement recommended.",
            "type": "inventory_alert",
            "severity": "warning",
            "read": False,
            "createdAt": three_hours_ago,
            "actionUrl": "/librarian/reports",
        },
        {
            "id": "notif-005",
            "userId": "all",
            "role": "all",
            "title": "Fall Semester Library Extended Hours",
            "message": "The Scholar's Shelf Main Reading Room will be open until 2:00 AM daily for midterm examinations.",
            "type": "bulletin",
            "severity": "info",
            "read": True,
            "createdAt": two_days_ago,
            "actionUrl": "/about",
        },
    ]

    for item in seed_items:
        _in_memory_notifications[item["id"]] = item


_seed_initial_notifications()


def sync_dynamic_circulation_notifications(user_id: str, role: str):
    """
    Checks active loans and reservations for the student and synthesizes
    up-to-date notifications for overdue books or items due soon.
    """
    if role != "student" or not user_id:
        return

    try:
        loans_data = get_student_loans(user_id)
        loans = loans_data.get("activeLoans", []) + loans_data.get("history", [])
        now = datetime.now(timezone.utc)

        for loan in loans:
            if loan.get("status") == "overdue":
                notif_id = f"dyn-od-{loan.get('id')}"
                if notif_id not in _in_memory_notifications:
                    _in_memory_notifications[notif_id] = {
                        "id": notif_id,
                        "userId": user_id,
                        "role": "student",
                        "title": "Overdue Book Notice",
                        "message": f"Your borrowed copy of '{loan.get('bookTitle', 'Volume')}' is overdue. Overdue fine is accumulating at $0.50/day. Please return it to the circulation desk.",
                        "type": "overdue",
                        "severity": "danger",
                        "read": False,
                        "createdAt": now.isoformat(),
                        "actionUrl": "/student/borrowed",
                    }
            elif loan.get("status") == "active":
                # Check due date
                due_date_str = loan.get("dueDate", "")
                if due_date_str:
                    try:
                        due_dt = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
                        delta = due_dt - now
                        if 0 <= delta.days <= 2:
                            notif_id = f"dyn-due-{loan.get('id')}-{due_dt.strftime('%Y%m%d')}"
                            if notif_id not in _in_memory_notifications:
                                _in_memory_notifications[notif_id] = {
                                    "id": notif_id,
                                    "userId": user_id,
                                    "role": "student",
                                    "title": "Due Soon Notice",
                                    "message": f"'{loan.get('bookTitle', 'Volume')}' is due in {max(1, delta.days)} day(s) on {due_dt.strftime('%b %d')}. You can renew online if eligible.",
                                    "type": "due_date",
                                    "severity": "warning",
                                    "read": False,
                                    "createdAt": now.isoformat(),
                                    "actionUrl": "/student/borrowed",
                                }
                    except Exception:
                        pass
    except Exception as e:
        logger.warning(f"Error syncing dynamic notifications: {e}")


def get_user_notifications(user_id: str, role: str) -> List[Dict[str, Any]]:
    """Returns all notifications matching user ID or role, sorted by newest first."""
    sync_dynamic_circulation_notifications(user_id, role)

    coll = get_notifications_collection()
    if coll is not None:
        try:
            query = {"$or": [{"userId": user_id}, {"userId": "all"}, {"role": role}, {"role": "all"}]}
            results = list(coll.find(query, {"_id": 0}).sort("createdAt", -1))
            if results:
                return results
        except Exception as e:
            logger.warning(f"MongoDB notification fetch failed, using memory: {e}")

    # Fallback in-memory
    user_items = [
        item for item in _in_memory_notifications.values()
        if item.get("userId") in (user_id, "all") or item.get("role") in (role, "all")
    ]
    user_items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return user_items


def mark_notification_read(notification_id: str, user_id: str) -> bool:
    """Marks a single notification as read."""
    coll = get_notifications_collection()
    if coll is not None:
        try:
            res = coll.update_one({"id": notification_id}, {"$set": {"read": True}})
            if res.matched_count > 0:
                return True
        except Exception as e:
            logger.warning(f"MongoDB notification update failed: {e}")

    if notification_id in _in_memory_notifications:
        _in_memory_notifications[notification_id]["read"] = True
        return True
    return False


def mark_all_notifications_read(user_id: str, role: str) -> int:
    """Marks all notifications for a given user as read."""
    coll = get_notifications_collection()
    count = 0
    if coll is not None:
        try:
            query = {"$or": [{"userId": user_id}, {"userId": "all"}, {"role": role}, {"role": "all"}]}
            res = coll.update_many(query, {"$set": {"read": True}})
            count = res.modified_count
        except Exception as e:
            logger.warning(f"MongoDB bulk update failed: {e}")

    # Update in-memory
    for item in _in_memory_notifications.values():
        if item.get("userId") in (user_id, "all") or item.get("role") in (role, "all"):
            if not item.get("read", False):
                item["read"] = True
                count += 1
    return count


def delete_notification(notification_id: str, user_id: str) -> bool:
    """Dismisses/deletes a notification."""
    coll = get_notifications_collection()
    if coll is not None:
        try:
            res = coll.delete_one({"id": notification_id})
            if res.deleted_count > 0:
                return True
        except Exception as e:
            logger.warning(f"MongoDB delete failed: {e}")

    if notification_id in _in_memory_notifications:
        del _in_memory_notifications[notification_id]
        return True
    return False

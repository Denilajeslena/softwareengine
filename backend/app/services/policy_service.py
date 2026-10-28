import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.services.database import get_mongo_client

logger = logging.getLogger(__name__)

DEFAULT_CIRCULATION_POLICY: Dict[str, Any] = {
    "loan_duration_days": 14,
    "max_active_loans": 5,
    "renewal_limit": 2,
    "renewal_duration_days": 14,
    "overdue_fine_per_day": 0.50,
    "reservation_hold_days": 3,
    "pickup_window_hours": 48,
    "max_reservations_per_student": 3,
    "updated_at": "2026-01-01T00:00:00Z",
    "updated_by": "System Default",
}

_in_memory_policy: Dict[str, Any] = dict(DEFAULT_CIRCULATION_POLICY)


def get_policy_collection():
    try:
        from flask import current_app
        client = get_mongo_client(current_app.config.get("MONGODB_URI", ""))
        if client is not None:
            db_name = current_app.config.get("MONGODB_DB_NAME", "scholars_shelf")
            return client[db_name]["circulation_policy"]
    except Exception:
        pass
    return None


def get_circulation_policy() -> Dict[str, Any]:
    """Retrieves current circulation policy with fallback to safe defaults."""
    col = get_policy_collection()
    if col is not None:
        try:
            doc = col.find_one({"_id": "active_policy"})
            if doc:
                clean = dict(doc)
                clean.pop("_id", None)
                return clean
        except Exception as e:
            logger.warning(f"Failed to fetch circulation policy from MongoDB: {e}")

    return dict(_in_memory_policy)


def update_circulation_policy(updates: Dict[str, Any], actor_email: str = "admin@scholars.shelf") -> Dict[str, Any]:
    """
    Validates and updates institutional circulation rules.
    Immediately applies to all subsequent loan calculations.
    """
    current_policy = get_circulation_policy()

    # Validate numerical boundaries
    loan_duration = int(updates.get("loan_duration_days", current_policy["loan_duration_days"]))
    if not (1 <= loan_duration <= 90):
        raise ValueError("Loan duration must be between 1 and 90 days.")

    max_loans = int(updates.get("max_active_loans", current_policy["max_active_loans"]))
    if not (1 <= max_loans <= 20):
        raise ValueError("Maximum active loans must be between 1 and 20 books.")

    renewal_limit = int(updates.get("renewal_limit", current_policy["renewal_limit"]))
    if not (0 <= renewal_limit <= 10):
        raise ValueError("Renewal limit must be between 0 and 10.")

    renewal_duration = int(updates.get("renewal_duration_days", current_policy["renewal_duration_days"]))
    if not (1 <= renewal_duration <= 60):
        raise ValueError("Renewal duration must be between 1 and 60 days.")

    daily_fine = float(updates.get("overdue_fine_per_day", current_policy["overdue_fine_per_day"]))
    if not (0.0 <= daily_fine <= 20.0):
        raise ValueError("Daily fine rate must be between $0.00 and $20.00.")

    hold_days = int(updates.get("reservation_hold_days", current_policy["reservation_hold_days"]))
    if not (1 <= hold_days <= 14):
        raise ValueError("Reservation hold period must be between 1 and 14 days.")

    pickup_hours = int(updates.get("pickup_window_hours", current_policy["pickup_window_hours"]))
    if not (12 <= pickup_hours <= 168):
        raise ValueError("Pickup window must be between 12 and 168 hours.")

    max_reservations = int(updates.get("max_reservations_per_student", current_policy["max_reservations_per_student"]))
    if not (1 <= max_reservations <= 10):
        raise ValueError("Maximum reservations per student must be between 1 and 10.")

    now_iso = datetime.now(timezone.utc).isoformat()
    new_policy = {
        "loan_duration_days": loan_duration,
        "max_active_loans": max_loans,
        "renewal_limit": renewal_limit,
        "renewal_duration_days": renewal_duration,
        "overdue_fine_per_day": round(daily_fine, 2),
        "reservation_hold_days": hold_days,
        "pickup_window_hours": pickup_hours,
        "max_reservations_per_student": max_reservations,
        "updated_at": now_iso,
        "updated_by": actor_email,
    }

    # Persist in MongoDB
    col = get_policy_collection()
    if col is not None:
        try:
            col.update_one(
                {"_id": "active_policy"},
                {"$set": new_policy},
                upsert=True,
            )
        except Exception as e:
            logger.error(f"Failed to persist circulation policy to MongoDB: {e}")

    # Update in-memory fallback
    global _in_memory_policy
    _in_memory_policy = dict(new_policy)

    return new_policy

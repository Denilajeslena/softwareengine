import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.services.database import get_mongo_client

logger = logging.getLogger(__name__)

# Append-only in-memory storage fallback
_in_memory_audit_logs: List[Dict[str, Any]] = [
    {
        "id": "AUD-2026-INIT-001",
        "timestamp": "2026-10-15T08:00:00Z",
        "actor": "admin@scholars.shelf",
        "role": "admin",
        "action": "SYSTEM_INITIALIZE",
        "resource_type": "system",
        "resource_id": "SYS-CORE",
        "details": "Platform security baseline, seeded catalog, and RBAC initialized.",
        "level": "SUCCESS",
    },
    {
        "id": "AUD-2026-INIT-002",
        "timestamp": "2026-10-20T09:30:00Z",
        "actor": "librarian@scholars.shelf",
        "role": "librarian",
        "action": "INVENTORY_AUDIT",
        "resource_type": "inventory",
        "resource_id": "STACK-01",
        "details": "Stack 1 (Physics & Chemistry) audited. All physical copies verified.",
        "level": "SUCCESS",
    },
]


def get_audit_collection():
    try:
        from flask import current_app
        client = get_mongo_client(current_app.config.get("MONGODB_URI", ""))
        if client is not None:
            db_name = current_app.config.get("MONGODB_DB_NAME", "scholars_shelf")
            return client[db_name]["audit_logs"]
    except Exception:
        pass
    return None


def log_audit_event(
    actor: str,
    role: str,
    action: str,
    details: str,
    resource_type: Optional[str] = "system",
    resource_id: Optional[str] = None,
    level: str = "INFO",
) -> Dict[str, Any]:
    """
    Appends an immutable audit event to MongoDB or in-memory ledger.
    Never stores passwords, tokens, or private secrets in log records.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    event_id = f"AUD-{int(datetime.now(timezone.utc).timestamp())}-{uuid.uuid4().hex[:6].upper()}"

    log_entry: Dict[str, Any] = {
        "id": event_id,
        "timestamp": now_iso,
        "actor": actor or "Anonymous",
        "role": role or "unknown",
        "action": action.upper(),
        "resource_type": resource_type or "system",
        "resource_id": resource_id or "N/A",
        "details": details,
        "level": level.upper() if level in ("INFO", "SUCCESS", "WARNING", "DANGER") else "INFO",
    }

    col = get_audit_collection()
    if col is not None:
        try:
            col.insert_one(dict(log_entry))
        except Exception as e:
            logger.error(f"Failed to append audit event to MongoDB: {e}")

    # Keep in memory list updated
    _in_memory_audit_logs.insert(0, log_entry)
    return log_entry


def get_audit_logs(
    page: int = 1,
    limit: int = 50,
    action: Optional[str] = None,
    level: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Retrieves filtered, paginated audit log entries.
    """
    col = get_audit_collection()
    if col is not None:
        try:
            query: Dict[str, Any] = {}
            if action:
                query["action"] = action.upper()
            if level:
                query["level"] = level.upper()
            if search:
                regex_pattern = {"$regex": search, "$options": "i"}
                query["$or"] = [
                    {"actor": regex_pattern},
                    {"action": regex_pattern},
                    {"details": regex_pattern},
                    {"resource_id": regex_pattern},
                ]
            if start_date or end_date:
                date_filter: Dict[str, Any] = {}
                if start_date:
                    date_filter["$gte"] = start_date
                if end_date:
                    date_filter["$lte"] = end_date
                query["timestamp"] = date_filter

            total = col.count_documents(query)
            skip = max(0, (page - 1) * limit)
            cursor = col.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit)
            logs = list(cursor)
            return {
                "logs": logs,
                "total": total,
                "page": page,
                "limit": limit,
                "totalPages": max(1, (total + limit - 1) // limit),
            }
        except Exception as e:
            logger.warning(f"Failed to query audit logs from MongoDB: {e}")

    # Fallback to in-memory list filtering
    filtered = list(_in_memory_audit_logs)
    if action:
        filtered = [l for l in filtered if l.get("action") == action.upper()]
    if level:
        filtered = [l for l in filtered if l.get("level") == level.upper()]
    if search:
        s_lower = search.lower()
        filtered = [
            l for l in filtered
            if s_lower in l.get("actor", "").lower()
            or s_lower in l.get("action", "").lower()
            or s_lower in l.get("details", "").lower()
            or s_lower in l.get("resource_id", "").lower()
        ]
    if start_date:
        filtered = [l for l in filtered if l.get("timestamp", "") >= start_date]
    if end_date:
        filtered = [l for l in filtered if l.get("timestamp", "") <= end_date]

    total = len(filtered)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    page_logs = filtered[start_idx:end_idx]

    return {
        "logs": page_logs,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": max(1, (total + limit - 1) // limit),
    }

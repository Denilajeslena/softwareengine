import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
try:
    from backend.app.services.database import get_mongo_client
    from backend.app.services.book_service import get_all_books
except ImportError:
    from app.services.database import get_mongo_client
    from app.services.book_service import get_all_books

logger = logging.getLogger(__name__)

DEFAULT_STACKS: List[Dict[str, Any]] = [
    {
        "id": "stack-1",
        "name": "Stack 1 (Physics & Chemistry)",
        "category": "Physics",
        "floorLevel": "Level 1",
        "capacity": 800,
        "status": "Optimal",
        "description": "Natural sciences, classical mechanics, thermodynamics, and organic chemistry.",
    },
    {
        "id": "stack-2",
        "name": "Stack 2 (Mathematics & Logic)",
        "category": "Mathematics",
        "floorLevel": "Level 1",
        "capacity": 800,
        "status": "Optimal",
        "description": "Pure mathematics, calculus, linear algebra, discrete math, and formal logic.",
    },
    {
        "id": "stack-3",
        "name": "Stack 3 (Computer Science)",
        "category": "Computer Science",
        "floorLevel": "Level 2",
        "capacity": 1200,
        "status": "Optimal",
        "description": "Software engineering, algorithms, compilers, networks, and operating systems.",
    },
    {
        "id": "stack-4",
        "name": "Stack 4 (Artificial Intelligence)",
        "category": "Artificial Intelligence",
        "floorLevel": "Level 2",
        "capacity": 1000,
        "status": "Optimal",
        "description": "Machine learning, neural networks, computer vision, and robotics.",
    },
    {
        "id": "stack-5",
        "name": "Stack 5 (World History & Civilizations)",
        "category": "History",
        "floorLevel": "Level 3",
        "capacity": 1000,
        "status": "Optimal",
        "description": "Antiquity, renaissance, modern international relations, and archaeology.",
    },
    {
        "id": "stack-6",
        "name": "Stack 6 (Literature & Arts)",
        "category": "Literature",
        "floorLevel": "Level 3",
        "capacity": 1000,
        "status": "Optimal",
        "description": "Classical poetry, narrative drama, critical essays, and visual art histories.",
    },
]

_in_memory_stacks: Dict[str, Dict[str, Any]] = {s["id"]: dict(s) for s in DEFAULT_STACKS}
_in_memory_audits: List[Dict[str, Any]] = []


def get_stacks_collection():
    try:
        from flask import current_app
        client = get_mongo_client(current_app.config.get("MONGODB_URI", ""))
        if client is not None:
            db_name = current_app.config.get("MONGODB_DB_NAME", "scholars_shelf")
            return client[db_name]["inventory_stacks"]
    except Exception:
        pass
    return None


def get_audits_collection():
    try:
        from flask import current_app
        client = get_mongo_client(current_app.config.get("MONGODB_URI", ""))
        if client is not None:
            db_name = current_app.config.get("MONGODB_DB_NAME", "scholars_shelf")
            return client[db_name]["inventory_audits"]
    except Exception:
        pass
    return None


def get_inventory_overview() -> Dict[str, Any]:
    """
    Computes real physical stack utilization by cross-referencing actual
    copies registered in the book catalog.
    """
    books = get_all_books(include_archived=False)
    stacks = get_all_stacks()

    # Aggregate copies by category or shelf location
    cat_counts: Dict[str, Dict[str, int]] = {}
    total_physical_copies = 0
    available_physical_copies = 0

    for b in books:
        cat = b.get("category", "General")
        total_copies = b.get("totalCopies", 0)
        avail_copies = b.get("availableCopies", 0)

        total_physical_copies += total_copies
        available_physical_copies += avail_copies

        if cat not in cat_counts:
            cat_counts[cat] = {"total": 0, "available": 0}
        cat_counts[cat]["total"] += total_copies
        cat_counts[cat]["available"] += avail_copies

    enriched_stacks = []
    total_capacity = 0

    for s in stacks:
        cap = s.get("capacity", 500)
        total_capacity += cap
        cat = s.get("category", "")
        # Find matching copies for this stack
        copies_data = cat_counts.get(cat, {"total": 0, "available": 0})
        total_in_stack = copies_data["total"]
        avail_in_stack = copies_data["available"]

        util_pct = round((total_in_stack / max(1, cap)) * 100, 1)
        if util_pct >= 90:
            status = "Near Capacity"
        elif util_pct >= 75:
            status = "Optimal"
        else:
            status = "Available Space"

        enriched_stacks.append({
            **s,
            "totalCopies": total_in_stack,
            "availableCopies": avail_in_stack,
            "borrowedCopies": total_in_stack - avail_in_stack,
            "utilizationRate": util_pct,
            "status": status,
        })

    avg_utilization = round((total_physical_copies / max(1, total_capacity)) * 100, 1)

    return {
        "totalStacks": len(stacks),
        "totalCapacity": total_capacity,
        "totalPhysicalCopies": total_physical_copies,
        "availableCopies": available_physical_copies,
        "averageUtilization": avg_utilization,
        "stacks": enriched_stacks,
        "lastAuditDate": _get_last_audit_date(),
    }


def _get_last_audit_date() -> str:
    col = get_audits_collection()
    if col is not None:
        try:
            last = col.find_one(sort=[("timestamp", -1)])
            if last and "timestamp" in last:
                return last["timestamp"]
        except Exception:
            pass
    if _in_memory_audits:
        return _in_memory_audits[0]["timestamp"]
    return "2026-10-20T09:30:00Z"


def get_all_stacks() -> List[Dict[str, Any]]:
    col = get_stacks_collection()
    if col is not None:
        try:
            cursor = col.find({}, {"_id": 0})
            stacks = list(cursor)
            if stacks:
                return stacks
        except Exception as e:
            logger.warning(f"Failed to fetch stacks from MongoDB: {e}")

    return list(_in_memory_stacks.values())


def create_or_update_stack(stack_data: Dict[str, Any]) -> Dict[str, Any]:
    stack_id = stack_data.get("id") or f"stack-{uuid.uuid4().hex[:6]}"
    record = {
        "id": stack_id,
        "name": stack_data.get("name", "New Stack Section"),
        "category": stack_data.get("category", "General"),
        "floorLevel": stack_data.get("floorLevel", "Level 1"),
        "capacity": int(stack_data.get("capacity", 500)),
        "status": stack_data.get("status", "Optimal"),
        "description": stack_data.get("description", ""),
    }

    col = get_stacks_collection()
    if col is not None:
        try:
            col.update_one({"id": stack_id}, {"$set": record}, upsert=True)
        except Exception as e:
            logger.error(f"Failed to persist stack: {e}")

    _in_memory_stacks[stack_id] = record
    return record


def record_inventory_audit(stack_id: str, auditor_email: str, scanned_barcodes: List[str], notes: str = "") -> Dict[str, Any]:
    """
    Executes an inventory reconciliation:
    Compares scanned barcodes against active copies in catalog.
    Flags missing or displaced items.
    """
    books = get_all_books(include_archived=False)
    stacks = get_all_stacks()
    target_stack = next((s for s in stacks if s["id"] == stack_id), None)
    if not target_stack:
        raise ValueError(f"Stack '{stack_id}' does not exist.")

    # Find expected copies for this stack category
    stack_category = target_stack.get("category")
    expected_barcodes = set()
    barcode_to_book = {}

    for b in books:
        if b.get("category") == stack_category:
            for copy in b.get("copies", []):
                bc = copy.get("barcode")
                if bc:
                    expected_barcodes.add(bc)
                    barcode_to_book[bc] = {
                        "bookTitle": b.get("title"),
                        "copyId": copy.get("copyId"),
                        "status": copy.get("status"),
                    }

    scanned_set = set(scanned_barcodes)
    matched = scanned_set.intersection(expected_barcodes)
    missing = expected_barcodes - scanned_set
    unexpected = scanned_set - expected_barcodes

    audit_id = f"AUDIT-{int(datetime.now(timezone.utc).timestamp())}"
    now_iso = datetime.now(timezone.utc).isoformat()

    audit_result = {
        "id": audit_id,
        "stackId": stack_id,
        "stackName": target_stack.get("name"),
        "auditorEmail": auditor_email,
        "timestamp": now_iso,
        "totalExpected": len(expected_barcodes),
        "totalScanned": len(scanned_barcodes),
        "matchedCount": len(matched),
        "missingCount": len(missing),
        "unexpectedCount": len(unexpected),
        "matchRate": round((len(matched) / max(1, len(expected_barcodes))) * 100, 1),
        "missingItems": [barcode_to_book.get(bc, {"barcode": bc}) for bc in list(missing)[:10]],
        "notes": notes,
        "outcome": "Reconciled" if len(missing) == 0 else "Discrepancies Noted",
    }

    col = get_audits_collection()
    if col is not None:
        try:
            col.insert_one(dict(audit_result))
        except Exception as e:
            logger.error(f"Failed to persist audit report: {e}")

    _in_memory_audits.insert(0, audit_result)
    return audit_result

import logging
from typing import Dict, Any, List, Optional
from app.services.database import get_mongo_client

logger = logging.getLogger(__name__)

ALL_PERMISSIONS = [
    {"key": "catalogue.read", "label": "Browse & Search Catalogue", "category": "Catalogue"},
    {"key": "catalogue.write", "label": "Add & Edit Books", "category": "Catalogue"},
    {"key": "circulation.manage", "label": "Circulation Desk Operations", "category": "Circulation"},
    {"key": "loans.request", "label": "Self-Service Borrow Requests", "category": "Circulation"},
    {"key": "loans.renew", "label": "Renew Active Loans", "category": "Circulation"},
    {"key": "reservations.create", "label": "Place Holds & Reservations", "category": "Circulation"},
    {"key": "inventory.manage", "label": "Stack Inventory & Audits", "category": "Inventory"},
    {"key": "students.view", "label": "View Student Directory", "category": "Patrons"},
    {"key": "reports.view", "label": "Analytics & Circulation Reports", "category": "Reports"},
    {"key": "reading_list.manage", "label": "Personal Reading Lists", "category": "Student Tools"},
    {"key": "reviews.create", "label": "Submit Book Reviews", "category": "Student Tools"},
    {"key": "study_assistant.use", "label": "BookMind AI Study Assistant", "category": "Student Tools"},
    {"key": "users.manage", "label": "Provision & Manage Users", "category": "Governance"},
    {"key": "policies.manage", "label": "Circulation Policies Configuration", "category": "Governance"},
    {"key": "roles.manage", "label": "RBAC Role & Permission Config", "category": "Governance"},
    {"key": "audit.view", "label": "View Institutional Audit Logs", "category": "Governance"},
    {"key": "system.analytics", "label": "System Telemetry & Diagnostics", "category": "Governance"},
]

DEFAULT_ROLES_PERMISSIONS: Dict[str, List[str]] = {
    "student": [
        "catalogue.read",
        "loans.request",
        "loans.renew",
        "reservations.create",
        "reading_list.manage",
        "reviews.create",
        "study_assistant.use",
    ],
    "librarian": [
        "catalogue.read",
        "catalogue.write",
        "circulation.manage",
        "loans.renew",
        "inventory.manage",
        "students.view",
        "reports.view",
        "study_assistant.use",
    ],
    "admin": [
        "catalogue.read",
        "catalogue.write",
        "circulation.manage",
        "loans.request",
        "loans.renew",
        "reservations.create",
        "inventory.manage",
        "students.view",
        "reports.view",
        "reading_list.manage",
        "reviews.create",
        "study_assistant.use",
        "users.manage",
        "policies.manage",
        "roles.manage",
        "audit.view",
        "system.analytics",
    ],
}

_in_memory_roles: Dict[str, List[str]] = {k: list(v) for k, v in DEFAULT_ROLES_PERMISSIONS.items()}


def get_roles_collection():
    try:
        from flask import current_app
        client = get_mongo_client(current_app.config.get("MONGODB_URI", ""))
        if client is not None:
            db_name = current_app.config.get("MONGODB_DB_NAME", "scholars_shelf")
            return client[db_name]["roles_permissions"]
    except Exception:
        pass
    return None


def get_all_roles_with_permissions() -> List[Dict[str, Any]]:
    """Returns all roles, metadata, and active permissions."""
    col = get_roles_collection()
    role_perms = dict(_in_memory_roles)
    if col is not None:
        try:
            cursor = col.find({}, {"_id": 0})
            for doc in cursor:
                if "role" in doc and "permissions" in doc:
                    role_perms[doc["role"]] = doc["permissions"]
        except Exception as e:
            logger.warning(f"Failed to fetch roles from MongoDB: {e}")

    roles_data = [
        {
            "role": "student",
            "title": "Student Patron",
            "badge": "Public & Academic",
            "description": "Standard university scholar with borrowing privileges, study aids, and reading lists.",
            "permissions": role_perms.get("student", DEFAULT_ROLES_PERMISSIONS["student"]),
        },
        {
            "role": "librarian",
            "title": "Librarian Staff",
            "badge": "Circulation & Cataloguing",
            "description": "Authorized library personnel managing catalogue, desk checkouts, and stack inventories.",
            "permissions": role_perms.get("librarian", DEFAULT_ROLES_PERMISSIONS["librarian"]),
        },
        {
            "role": "admin",
            "title": "System Administrator",
            "badge": "Full Governance",
            "description": "Institutional governance controlling user provisioning, audit ledgers, and policies.",
            "permissions": role_perms.get("admin", DEFAULT_ROLES_PERMISSIONS["admin"]),
        },
    ]
    return roles_data


def update_role_permissions(role_name: str, permissions: List[str]) -> Dict[str, Any]:
    """
    Updates permission assignments for a specific role.
    Prevents stripping core governance permissions from admin role.
    """
    valid_roles = ["student", "librarian", "admin"]
    if role_name not in valid_roles:
        raise ValueError(f"Invalid role '{role_name}'. Must be one of: {', '.join(valid_roles)}")

    # Admin must retain minimum safety permissions
    if role_name == "admin":
        essential = ["roles.manage", "users.manage", "policies.manage", "audit.view"]
        for p in essential:
            if p not in permissions:
                permissions.append(p)

    valid_keys = {p["key"] for p in ALL_PERMISSIONS}
    cleaned_permissions = [p for p in permissions if p in valid_keys]

    col = get_roles_collection()
    if col is not None:
        try:
            col.update_one(
                {"role": role_name},
                {"$set": {"role": role_name, "permissions": cleaned_permissions}},
                upsert=True,
            )
        except Exception as e:
            logger.error(f"Failed to persist role permissions to MongoDB: {e}")

    _in_memory_roles[role_name] = cleaned_permissions
    return {
        "role": role_name,
        "permissions": cleaned_permissions,
    }

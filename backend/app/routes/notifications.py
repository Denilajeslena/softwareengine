import logging
from flask import Blueprint, request, g
try:
    from backend.app.utils.auth import token_required
    from backend.app.utils.response import success_response, error_response
    from backend.app.services.notification_service import (
        get_user_notifications,
        mark_notification_read,
        mark_all_notifications_read,
        delete_notification,
    )
except ImportError:
    from app.utils.auth import token_required
    from app.utils.response import success_response, error_response
    from app.services.notification_service import (
        get_user_notifications,
        mark_notification_read,
        mark_all_notifications_read,
        delete_notification,
    )

logger = logging.getLogger(__name__)

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("", methods=["GET"])
@token_required
def get_notifications():
    """
    GET /api/notifications
    Retrieves all notifications for the authenticated user, including due date warnings,
    overdue notices, reservation readiness, and borrowing approvals.
    """
    user = g.current_user
    user_id = user.get("id") or user.get("email")
    role = user.get("role", "student")

    items = get_user_notifications(user_id=user_id, role=role)
    unread_count = sum(1 for n in items if not n.get("read", False))

    return success_response(
        data={
            "notifications": items,
            "total": len(items),
            "unreadCount": unread_count,
        },
        message=f"Retrieved {len(items)} notifications ({unread_count} unread).",
        status_code=200,
    )


@notifications_bp.route("/<notification_id>/read", methods=["PATCH"])
@token_required
def mark_read(notification_id: str):
    """
    PATCH /api/notifications/<notification_id>/read
    Marks a single notification as read.
    """
    user = g.current_user
    user_id = user.get("id") or user.get("email")

    success = mark_notification_read(notification_id=notification_id, user_id=user_id)
    if not success:
        return error_response(
            message="Notification not found.",
            status_code=404,
            error_code="NOTIFICATION_NOT_FOUND",
        )

    return success_response(
        message="Notification marked as read.",
        status_code=200,
    )


@notifications_bp.route("/mark-all-read", methods=["POST"])
@token_required
def mark_all_read():
    """
    POST /api/notifications/mark-all-read
    Marks all notifications for the authenticated user as read.
    """
    user = g.current_user
    user_id = user.get("id") or user.get("email")
    role = user.get("role", "student")

    modified_count = mark_all_notifications_read(user_id=user_id, role=role)
    return success_response(
        data={"modifiedCount": modified_count},
        message="All notifications marked as read.",
        status_code=200,
    )


@notifications_bp.route("/<notification_id>", methods=["DELETE"])
@token_required
def dismiss_notification(notification_id: str):
    """
    DELETE /api/notifications/<notification_id>
    Dismisses and removes a notification.
    """
    user = g.current_user
    user_id = user.get("id") or user.get("email")

    success = delete_notification(notification_id=notification_id, user_id=user_id)
    if not success:
        return error_response(
            message="Notification not found.",
            status_code=404,
            error_code="NOTIFICATION_NOT_FOUND",
        )

    return success_response(
        message="Notification dismissed successfully.",
        status_code=200,
    )


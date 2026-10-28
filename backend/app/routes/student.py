from flask import Blueprint, request, g
from app.utils.response import success_response, error_response
from app.utils.auth import token_required
from app.services.user_service import (
    get_user_preferences,
    update_user_preferences,
    generate_student_card_qr,
    verify_student_card_token,
)
from app.services.audit_service import log_audit_event

student_bp = Blueprint("student", __name__)


@student_bp.route("/preferences", methods=["GET"])
@token_required
def get_preferences():
    """
    GET /api/student/preferences
    Retrieves authenticated student's persistent preferences.
    """
    user_id = g.current_user["id"]
    prefs = get_user_preferences(user_id)
    return success_response(
        data={"preferences": prefs},
        message="Preferences retrieved successfully.",
        status_code=200,
    )


@student_bp.route("/preferences", methods=["PUT"])
@token_required
def save_preferences():
    """
    PUT /api/student/preferences
    Saves updated notification and accessibility preferences.
    """
    user_id = g.current_user["id"]
    data = request.get_json(silent=True) or {}

    try:
        updated = update_user_preferences(user_id, data)
        log_audit_event(
            actor=g.current_user.get("email"),
            role=g.current_user.get("role", "student"),
            action="PREFERENCES_UPDATE",
            resource_type="user",
            resource_id=user_id,
            details="Updated patron notification and accessibility preferences.",
            level="INFO",
        )
        return success_response(
            data={"preferences": updated},
            message="Preferences saved successfully.",
            status_code=200,
        )
    except ValueError as e:
        return error_response(
            message=str(e),
            status_code=400,
            error_code="PREFERENCES_UPDATE_FAILED",
        )


@student_bp.route("/card", methods=["GET"])
@token_required
def get_digital_card():
    """
    GET /api/student/card
    Generates verifiable digital library card with cryptographic signature token and QR code PNG.
    """
    user_id = g.current_user["id"]
    try:
        card_data = generate_student_card_qr(user_id)
        return success_response(
            data=card_data,
            message="Digital library card generated successfully.",
            status_code=200,
        )
    except ValueError as e:
        return error_response(
            message=str(e),
            status_code=404,
            error_code="STUDENT_CARD_ERROR",
        )


@student_bp.route("/verify-card", methods=["POST"])
def verify_card():
    """
    POST /api/student/verify-card
    Scans and verifies a student digital card token.
    Public or staff scanner endpoint.
    """
    data = request.get_json(silent=True) or {}
    token = data.get("token", "").strip()

    if not token:
        return error_response(
            message="Card token is required for verification.",
            status_code=400,
            error_code="TOKEN_REQUIRED",
        )

    verification = verify_student_card_token(token)
    if not verification.get("valid"):
        return error_response(
            message=verification.get("reason", "Invalid card verification token."),
            status_code=400,
            error_code="CARD_INVALID",
        )

    return success_response(
        data=verification,
        message=f"Verified valid library card for {verification.get('name')}.",
        status_code=200,
    )

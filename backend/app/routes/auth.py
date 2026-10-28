import re
from flask import Blueprint, request, g
from app.utils.response import success_response, error_response
from app.utils.auth import create_access_token, token_required, roles_required
from app.services.audit_service import log_audit_event
from app.services.user_service import (
    get_user_by_email,
    get_user_by_id,
    create_user,
    verify_user_password,
    sanitize_user,
    list_users,
    update_user_status,
    delete_user,
)

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[\w\.-]+@([\w-]+\.)+[\w-]{2,63}$")


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    POST /api/auth/register
    Public student registration.
    Enforces that public registration NEVER allows creation of admin or librarian roles.
    """
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    requested_role = data.get("role", "student").strip().lower()
    department = data.get("department", "School of Computing & Mathematical Sciences").strip()

    # Form Validation
    if not name or len(name) < 2:
        return error_response(
            message="Full name must be at least 2 characters long.",
            status_code=400,
            error_code="VALIDATION_NAME_INVALID",
        )

    if not email or not EMAIL_REGEX.match(email):
        return error_response(
            message="Please provide a valid institutional email address.",
            status_code=400,
            error_code="VALIDATION_EMAIL_INVALID",
        )

    if not password or len(password) < 6:
        return error_response(
            message="Password must be at least 6 characters long.",
            status_code=400,
            error_code="VALIDATION_PASSWORD_TOO_SHORT",
        )

    # Security: Reject attempts to self-provision admin or librarian accounts
    if requested_role in ("admin", "librarian"):
        log_audit_event(
            actor=email,
            role="unauthorized",
            action="PRIVILEGE_ESCALATION_BLOCKED",
            resource_type="auth",
            resource_id=email,
            details=f"Blocked attempt to self-register as '{requested_role}'.",
            level="DANGER",
        )
        return error_response(
            message="Public self-registration is strictly restricted to student accounts. Privileged staff accounts must be provisioned by an institution administrator.",
            status_code=403,
            error_code="PRIVILEGED_ROLE_FORBIDDEN",
        )

    # Check for existing email
    existing_user = get_user_by_email(email)
    if existing_user is not None:
        return error_response(
            message="An account with this email address is already registered. Please sign in instead.",
            status_code=409,
            error_code="EMAIL_ALREADY_EXISTS",
        )

    # Create new student user
    new_user = create_user(
        name=name,
        email=email,
        password=password,
        role="student",
        department=department,
    )

    token = create_access_token(new_user)
    clean_user = sanitize_user(new_user)

    log_audit_event(
        actor=email,
        role="student",
        action="AUTH_REGISTER",
        resource_type="user",
        resource_id=new_user["id"],
        details=f"Student registered: {name} ({department}).",
        level="SUCCESS",
    )

    return success_response(
        data={
            "user": clean_user,
            "token": token,
        },
        message="Student registration completed successfully. Welcome to The Scholar's Shelf.",
        status_code=201,
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    POST /api/auth/login
    Authenticates registered users (student, librarian, admin) and issues JWT.
    """
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email:
        return error_response(
            message="Email address is required.",
            status_code=400,
            error_code="MISSING_EMAIL",
        )

    if not password:
        return error_response(
            message="Password is required.",
            status_code=400,
            error_code="MISSING_PASSWORD",
        )

    user = get_user_by_email(email)
    if user is None or not verify_user_password(user, password):
        log_audit_event(
            actor=email,
            role="anonymous",
            action="AUTH_LOGIN_FAILED",
            resource_type="auth",
            resource_id=email,
            details=f"Authentication failed for {email}.",
            level="WARNING",
        )
        return error_response(
            message="Invalid institutional email or password. Please verify your credentials.",
            status_code=401,
            error_code="INVALID_CREDENTIALS",
        )

    if user.get("status") == "suspended":
        log_audit_event(
            actor=email,
            role=user.get("role", "unknown"),
            action="AUTH_LOGIN_BLOCKED",
            resource_type="user",
            resource_id=user.get("id"),
            details=f"Suspended account {email} attempted to sign in.",
            level="WARNING",
        )
        return error_response(
            message="Your library account has been suspended. Please contact library administration.",
            status_code=403,
            error_code="ACCOUNT_SUSPENDED",
        )

    token = create_access_token(user)
    clean_user = sanitize_user(user)

    log_audit_event(
        actor=email,
        role=clean_user.get("role", "student"),
        action="AUTH_LOGIN",
        resource_type="user",
        resource_id=clean_user["id"],
        details=f"User {clean_user.get('name')} signed in successfully.",
        level="INFO",
    )

    return success_response(
        data={
            "user": clean_user,
            "token": token,
        },
        message=f"Welcome back, {clean_user.get('name')}.",
        status_code=200,
    )


@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user():
    """
    GET /api/auth/me
    Retrieves currently authenticated user's profile.
    """
    clean_user = sanitize_user(g.current_user)
    return success_response(
        data={"user": clean_user},
        message="Profile retrieved successfully.",
        status_code=200,
    )


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """
    POST /api/auth/logout
    Stateless JWT logout acknowledgment.
    """
    return success_response(
        message="Logged out successfully.",
        status_code=200,
    )


@auth_bp.route("/admin/users", methods=["GET"])
@roles_required("admin")
def get_admin_users():
    """
    GET /api/auth/admin/users
    Protected administrative endpoint listing registered campus users.
    Only accessible by users with role 'admin'.
    """
    role_filter = request.args.get("role")
    users = list_users(role=role_filter)
    return success_response(
        data={"users": users},
        message=f"Retrieved {len(users)} registered user records.",
        status_code=200,
    )


@auth_bp.route("/admin/users", methods=["POST"])
@roles_required("admin")
def provision_user():
    """
    POST /api/auth/admin/users
    Admin provisions new user account with student, librarian, or admin privileges.
    """
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "student").strip().lower()
    department = data.get("department", "General Studies").strip()
    student_id = data.get("studentId", "").strip() or None

    if not name or len(name) < 2:
        return error_response(
            message="Full name must be at least 2 characters.",
            status_code=400,
            error_code="VALIDATION_NAME_INVALID",
        )

    if not email or not EMAIL_REGEX.match(email):
        return error_response(
            message="Please provide a valid email address.",
            status_code=400,
            error_code="VALIDATION_EMAIL_INVALID",
        )

    if not password or len(password) < 6:
        return error_response(
            message="Password must be at least 6 characters long.",
            status_code=400,
            error_code="VALIDATION_PASSWORD_TOO_SHORT",
        )

    if role not in ("student", "librarian", "admin"):
        return error_response(
            message="Role must be 'student', 'librarian', or 'admin'.",
            status_code=400,
            error_code="INVALID_ROLE",
        )

    existing = get_user_by_email(email)
    if existing:
        return error_response(
            message=f"An account with email '{email}' already exists.",
            status_code=409,
            error_code="EMAIL_ALREADY_EXISTS",
        )

    new_user = create_user(
        name=name,
        email=email,
        password=password,
        role=role,
        department=department,
        student_id=student_id,
    )

    clean_user = sanitize_user(new_user)

    log_audit_event(
        actor=g.current_user.get("email", "admin@scholars.shelf"),
        role="admin",
        action="USER_PROVISION",
        resource_type="user",
        resource_id=new_user["id"],
        details=f"Admin provisioned {role.upper()} account for {name} ({email}).",
        level="SUCCESS",
    )

    return success_response(
        data={"user": clean_user},
        message=f"Successfully provisioned {role} account for {name}.",
        status_code=201,
    )


@auth_bp.route("/admin/users/<user_id>/status", methods=["PATCH"])
@roles_required("admin")
def toggle_user_status(user_id: str):
    """
    PATCH /api/auth/admin/users/<user_id>/status
    Toggles user account status ('active', 'suspended').
    Protects the last active administrator from deactivation.
    """
    data = request.get_json(silent=True) or {}
    new_status = data.get("status", "").strip().lower()
    if not new_status:
        if "isActive" in data:
            new_status = "active" if data["isActive"] else "suspended"

    try:
        updated_user = update_user_status(
            user_id=user_id,
            new_status=new_status,
            actor_id=g.current_user.get("id"),
        )

        log_audit_event(
            actor=g.current_user.get("email", "admin@scholars.shelf"),
            role="admin",
            action="USER_STATUS_CHANGE",
            resource_type="user",
            resource_id=user_id,
            details=f"Status for user {updated_user.get('email')} changed to '{new_status}'.",
            level="WARNING" if new_status != "active" else "INFO",
        )

        return success_response(
            data={"user": updated_user, "isActive": updated_user.get("status") == "active", "status": updated_user.get("status")},
            message=f"User status updated to '{new_status}'.",
            status_code=200,
        )
    except ValueError as e:
        return error_response(
            message=str(e),
            status_code=400,
            error_code="STATUS_UPDATE_FAILED",
        )


@auth_bp.route("/admin/users/<user_id>", methods=["DELETE"])
@roles_required("admin")
def remove_user(user_id: str):
    """
    DELETE /api/auth/admin/users/<user_id>
    Removes user account. Safeguards last administrator and patrons with active loans.
    """
    try:
        result = delete_user(user_id=user_id, actor_id=g.current_user.get("id"))
        log_audit_event(
            actor=g.current_user.get("email", "admin@scholars.shelf"),
            role="admin",
            action="USER_DELETE",
            resource_type="user",
            resource_id=user_id,
            details=f"Admin removed user account {result.get('name')} ({user_id}).",
            level="WARNING",
        )
        return success_response(
            data=result,
            message=f"User account '{result.get('name')}' removed successfully.",
            status_code=200,
        )
    except ValueError as e:
        return error_response(
            message=str(e),
            status_code=400,
            error_code="DELETE_USER_FAILED",
        )


@auth_bp.route("/librarian/verify", methods=["GET"])
@roles_required("librarian", "admin")
def verify_librarian_access():
    """
    GET /api/auth/librarian/verify
    Protected endpoint only accessible by librarians and administrators.
    Rejects student accounts with 403 Forbidden.
    """
    return success_response(
        data={"authorized": True, "user": sanitize_user(g.current_user)},
        message="Librarian workstation access verified.",
        status_code=200,
    )

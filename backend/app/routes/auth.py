import re
from flask import Blueprint, request, g
from app.utils.response import success_response, error_response
from app.utils.auth import create_access_token, token_required, roles_required
from app.services.user_service import (
    get_user_by_email,
    create_user,
    verify_user_password,
    sanitize_user,
    list_users,
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
        return error_response(
            message="Invalid institutional email or password. Please verify your credentials.",
            status_code=401,
            error_code="INVALID_CREDENTIALS",
        )

    if user.get("status") == "suspended":
        return error_response(
            message="Your library account has been suspended. Please contact library administration.",
            status_code=403,
            error_code="ACCOUNT_SUSPENDED",
        )

    token = create_access_token(user)
    clean_user = sanitize_user(user)

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
    Protected administrative endpoint demonstrating backend role enforcement.
    Only accessible by users with role 'admin'.
    """
    role_filter = request.args.get("role")
    users = list_users(role=role_filter)
    return success_response(
        data={"users": users},
        message=f"Retrieved {len(users)} registered user records.",
        status_code=200,
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


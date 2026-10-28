import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import List, Dict, Any, Optional
from flask import request, current_app, g
from app.utils.response import error_response


def create_access_token(user: Dict[str, Any], expires_in_hours: Optional[int] = None) -> str:
    """
    Generates a secure HS256 JWT access token containing standard identity claims.
    Never includes password hashes in payload.
    """
    secret = current_app.config.get("JWT_SECRET_KEY") or current_app.config.get("SECRET_KEY", "fallback-secret")
    if expires_in_hours is None:
        expires_in_hours = current_app.config.get("JWT_EXPIRATION_HOURS", 24)

    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.get("id") or user.get("_id", "")),
        "email": user.get("email", ""),
        "name": user.get("name", ""),
        "role": user.get("role", "student"),
        "iat": now,
        "exp": now + timedelta(hours=expires_in_hours),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and verifies a JWT token.
    Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError on failure.
    """
    secret = current_app.config.get("JWT_SECRET_KEY") or current_app.config.get("SECRET_KEY", "fallback-secret")
    return jwt.decode(token, secret, algorithms=["HS256"])


def token_required(f):
    """
    Decorator that enforces a valid Bearer JWT in the Authorization header.
    Attaches authenticated user record to Flask's `g.current_user`.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header:
            return error_response(
                message="Authorization header is missing. Please provide a Bearer token.",
                status_code=401,
                error_code="TOKEN_MISSING",
            )

        parts = auth_header.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return error_response(
                message="Invalid Authorization header format. Expected: 'Bearer <token>'.",
                status_code=401,
                error_code="TOKEN_INVALID_FORMAT",
            )

        token = parts[1].strip()

        try:
            payload = decode_access_token(token)
        except jwt.ExpiredSignatureError:
            return error_response(
                message="Session token has expired. Please log in again.",
                status_code=401,
                error_code="TOKEN_EXPIRED",
            )
        except jwt.InvalidTokenError as err:
            return error_response(
                message=f"Invalid or corrupted access token: {str(err)}",
                status_code=401,
                error_code="TOKEN_INVALID",
            )

        # Retrieve user from user service
        from app.services.user_service import get_user_by_id
        user = get_user_by_id(payload.get("sub"))
        if not user:
            return error_response(
                message="The user associated with this token no longer exists.",
                status_code=401,
                error_code="USER_NOT_FOUND",
            )

        if user.get("status") == "suspended":
            return error_response(
                message="Your library account has been suspended. Please contact library administration.",
                status_code=403,
                error_code="ACCOUNT_SUSPENDED",
            )

        g.current_user = user
        return f(*args, **kwargs)

    return decorated


def roles_required(*allowed_roles: str):
    """
    Decorator enforcing role-based access control.
    Requires @token_required to be applied first or handles it directly.
    """
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(*args, **kwargs):
            user = getattr(g, "current_user", None)
            if not user:
                return error_response(
                    message="Unauthenticated request.",
                    status_code=401,
                    error_code="UNAUTHENTICATED",
                )

            user_role = user.get("role", "student")
            if user_role not in allowed_roles:
                return error_response(
                    message=f"Access forbidden: Role '{user_role}' is not authorized to access this resource. Allowed roles: {', '.join(allowed_roles)}.",
                    status_code=403,
                    error_code="INSUFFICIENT_PERMISSIONS",
                )

            return f(*args, **kwargs)

        return decorated

    return decorator


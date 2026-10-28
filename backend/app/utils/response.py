from typing import Any, Optional, Dict
from flask import jsonify, Response


def success_response(
    data: Any = None,
    message: str = "Operation completed successfully",
    status_code: int = 200,
    meta: Optional[Dict[str, Any]] = None,
) -> tuple[Response, int]:
    payload = {
        "success": True,
        "message": message,
        "data": data,
    }
    if meta is not None:
        payload["meta"] = meta
    return jsonify(payload), status_code


def error_response(
    message: str = "An error occurred",
    status_code: int = 400,
    errors: Optional[Any] = None,
    error_code: Optional[str] = None,
) -> tuple[Response, int]:
    payload = {
        "success": False,
        "message": message,
        "error": {
            "code": error_code or f"HTTP_{status_code}",
            "details": errors,
        },
    }
    return jsonify(payload), status_code


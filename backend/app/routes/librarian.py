from flask import Blueprint, request
from app.utils.response import success_response, error_response
from app.utils.auth import roles_required
from app.services.user_service import list_students_with_circulation_summary

librarian_bp = Blueprint("librarian", __name__)


@librarian_bp.route("/students", methods=["GET"])
@roles_required("librarian", "admin")
def get_students_directory():
    """
    GET /api/librarian/students
    Retrieves student patron directory cross-referenced with real active loans and overdue fine standings.
    """
    search = request.args.get("search", "").strip() or None
    limit = int(request.args.get("limit", 50))

    students = list_students_with_circulation_summary(search=search, limit=limit)
    return success_response(
        data={"students": students, "count": len(students)},
        message=f"Retrieved {len(students)} student patron records.",
        status_code=200,
    )

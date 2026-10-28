import logging
from flask import Blueprint, request, jsonify, g
from backend.app.routes.auth import token_required, roles_required
from backend.app.services.circulation_service import (
    get_all_loans,
    get_student_loans,
    request_book_loan,
    issue_book_by_librarian,
    return_loan,
    renew_loan,
    get_all_reservations,
    create_reservation,
    cancel_reservation,
)

logger = logging.getLogger(__name__)

loans_bp = Blueprint("loans", __name__)


def success_response(data=None, message="Success", status_code=200):
    return jsonify({
        "success": True,
        "message": message,
        "data": data or {},
    }), status_code


def error_response(message="An error occurred", status_code=400, error_code=None):
    payload = {
        "success": False,
        "message": message,
    }
    if error_code:
        payload["error"] = {"code": error_code, "message": message}
    return jsonify(payload), status_code


# -------------------------------------------------------------
# STUDENT LOANS & BORROWING
# -------------------------------------------------------------

@loans_bp.route("/my-loans", methods=["GET"])
@token_required
def get_my_loans():
    """
    GET /api/loans/my-loans
    Retrieves the authenticated student's active loans, loan history, and total fines.
    """
    current_user = g.current_user
    user_id = current_user.get("id") or current_user.get("email")
    student_summary = get_student_loans(user_id, user_email=current_user.get("email"))
    return success_response(
        data=student_summary,
        message=f"Retrieved {student_summary['activeCount']} active loans.",
    )


@loans_bp.route("/request", methods=["POST"])
@token_required
def request_loan():
    """
    POST /api/loans/request
    Student requests or checks out a book volume.
    Body: { "bookId": "b-001", "copyId": "optional" }
    """
    current_user = g.current_user
    data = request.get_json(silent=True) or {}
    book_id = data.get("bookId")
    copy_id = data.get("copyId")

    if not book_id:
        return error_response(
            message="Book identifier ('bookId') is required to borrow.",
            status_code=400,
            error_code="VALIDATION_BOOK_ID_REQUIRED",
        )

    try:
        new_loan = request_book_loan(current_user, book_id, copy_id=copy_id)
        return success_response(
            data={"loan": new_loan},
            message=f"Successfully checked out '{new_loan.get('bookTitle')}'. Due date: {new_loan.get('dueDate')[:10]}.",
            status_code=201,
        )
    except ValueError as val_err:
        return error_response(
            message=str(val_err),
            status_code=400,
            error_code="CIRCULATION_RULE_VIOLATION",
        )
    except Exception as err:
        logger.error(f"Loan request failed: {err}")
        return error_response(
            message=str(err) or "Failed to process loan request.",
            status_code=500,
            error_code="LOAN_CREATION_FAILED",
        )


@loans_bp.route("/<loan_id>/renew", methods=["POST"])
@token_required
def renew_student_loan(loan_id):
    """
    POST /api/loans/<loan_id>/renew
    Extends loan due date by 14 days if allowed by library policy.
    """
    current_user = g.current_user
    try:
        renewed_loan = renew_loan(loan_id, current_user)
        return success_response(
            data={"loan": renewed_loan},
            message=f"Loan renewed successfully. New due date is {renewed_loan.get('dueDate')[:10]}.",
        )
    except ValueError as val_err:
        return error_response(
            message=str(val_err),
            status_code=400,
            error_code="RENEWAL_POLICY_REJECTED",
        )
    except PermissionError as perm_err:
        return error_response(
            message=str(perm_err),
            status_code=403,
            error_code="FORBIDDEN_LOAN_ACCESS",
        )


# -------------------------------------------------------------
# LIBRARIAN CIRCULATION DESK
# -------------------------------------------------------------

@loans_bp.route("", methods=["GET"])
@roles_required("librarian", "admin")
def list_all_loans():
    """
    GET /api/loans
    Librarian views all loans with optional status, bookId, or userId filter.
    """
    status = request.args.get("status", "").strip() or None
    user_id = request.args.get("userId", "").strip() or None
    book_id = request.args.get("bookId", "").strip() or None

    loans = get_all_loans(status=status, user_id=user_id, book_id=book_id)
    return success_response(
        data={"loans": loans, "count": len(loans)},
        message=f"Retrieved {len(loans)} circulation loan records.",
    )


@loans_bp.route("/issue", methods=["POST"])
@roles_required("librarian", "admin")
def issue_book():
    """
    POST /api/loans/issue
    Librarian issues a book directly to a student at the circulation desk.
    Body: { "studentIdentifier": "student@scholars.shelf", "bookId": "b-001", "copyId": "optional", "durationDays": 14 }
    """
    current_user = g.current_user
    data = request.get_json(silent=True) or {}
    student_id = data.get("studentIdentifier", "").strip()
    book_id = data.get("bookId", "").strip()
    copy_id = data.get("copyId", "").strip() or None
    duration = data.get("durationDays", 14)

    if not student_id:
        return error_response(
            message="Student email or institutional ID is required.",
            status_code=400,
            error_code="VALIDATION_STUDENT_REQUIRED",
        )

    if not book_id:
        return error_response(
            message="Book identifier is required.",
            status_code=400,
            error_code="VALIDATION_BOOK_ID_REQUIRED",
        )

    try:
        loan = issue_book_by_librarian(current_user, student_id, book_id, copy_id=copy_id, duration_days=duration)
        return success_response(
            data={"loan": loan},
            message=f"Volume '{loan.get('bookTitle')}' issued to patron '{student_id}'.",
            status_code=201,
        )
    except ValueError as val_err:
        return error_response(
            message=str(val_err),
            status_code=400,
            error_code="CIRCULATION_ISSUE_REJECTED",
        )


@loans_bp.route("/<loan_id>/return", methods=["POST"])
@roles_required("librarian", "admin")
def process_return(loan_id):
    """
    POST /api/loans/<loan_id>/return
    Processes incoming book return, calculates late fines, and restocks inventory.
    """
    current_user = g.current_user
    try:
        result = return_loan(loan_id, librarian_user=current_user)
        loan = result["loan"]
        fine = loan.get("fineAmount", 0.0)
        fine_msg = f" Overdue fine assessed: ${fine:.2f}." if fine > 0 else " No overdue fines."
        hold_msg = f" {result['notification']}" if result.get("notification") else ""
        return success_response(
            data=result,
            message=f"Volume '{loan.get('bookTitle')}' returned successfully.{fine_msg}{hold_msg}",
        )
    except ValueError as val_err:
        return error_response(
            message=str(val_err),
            status_code=400,
            error_code="RETURN_PROCESSING_FAILED",
        )


@loans_bp.route("/overdue", methods=["GET"])
@roles_required("librarian", "admin")
def list_overdue_loans():
    """
    GET /api/loans/overdue
    Librarian views all overdue loans and calculated fines.
    """
    all_loans = get_all_loans()
    overdue_loans = [l for l in all_loans if l.get("status") == "overdue"]
    total_fines = sum(l.get("fineAmount", 0.0) for l in overdue_loans)
    return success_response(
        data={"loans": overdue_loans, "count": len(overdue_loans), "totalFines": round(total_fines, 2)},
        message=f"Retrieved {len(overdue_loans)} overdue loans.",
    )


# -------------------------------------------------------------
# RESERVATIONS & HOLDS
# -------------------------------------------------------------

@loans_bp.route("/reservations/my-reservations", methods=["GET"])
@token_required
def get_my_reservations():
    """
    GET /api/loans/reservations/my-reservations
    Student views their active reservations and waitlist positions.
    """
    current_user = g.current_user
    user_id = current_user.get("id") or current_user.get("email")
    res_list = get_all_reservations(user_id=user_id)
    return success_response(
        data={"reservations": res_list, "count": len(res_list)},
        message=f"Retrieved {len(res_list)} reservations.",
    )


@loans_bp.route("/reservations", methods=["POST"])
@token_required
def place_reservation():
    """
    POST /api/loans/reservations
    Student places a hold reservation on a title.
    Body: { "bookId": "b-001" }
    """
    current_user = g.current_user
    data = request.get_json(silent=True) or {}
    book_id = data.get("bookId")
    if not book_id:
        return error_response(
            message="Book identifier is required to place a reservation.",
            status_code=400,
            error_code="VALIDATION_BOOK_ID_REQUIRED",
        )

    try:
        res = create_reservation(current_user, book_id)
        return success_response(
            data={"reservation": res},
            message=f"Hold reservation confirmed for '{res.get('bookTitle')}'. Queue position: #{res.get('queuePosition')}.",
            status_code=201,
        )
    except ValueError as val_err:
        return error_response(
            message=str(val_err),
            status_code=400,
            error_code="RESERVATION_REJECTED",
        )


@loans_bp.route("/reservations/<reservation_id>", methods=["DELETE"])
@token_required
def cancel_student_reservation(reservation_id):
    """
    DELETE /api/loans/reservations/<reservation_id>
    Patron cancels their hold reservation.
    """
    current_user = g.current_user
    try:
        cancelled = cancel_reservation(reservation_id, current_user)
        return success_response(
            data={"reservation": cancelled},
            message="Reservation cancelled successfully.",
        )
    except ValueError as val_err:
        return error_response(
            message=str(val_err),
            status_code=404,
            error_code="RESERVATION_NOT_FOUND",
        )
    except PermissionError as perm_err:
        return error_response(
            message=str(perm_err),
            status_code=403,
            error_code="FORBIDDEN_RESERVATION_ACCESS",
        )


@loans_bp.route("/reservations", methods=["GET"])
@roles_required("librarian", "admin")
def list_all_reservations():
    """
    GET /api/loans/reservations
    Librarian views all holds and waitlist queues.
    """
    res_list = get_all_reservations()
    return success_response(
        data={"reservations": res_list, "count": len(res_list)},
        message=f"Retrieved {len(res_list)} total library reservations.",
    )

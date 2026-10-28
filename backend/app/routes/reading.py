import logging
from flask import Blueprint, request, g
try:
    from backend.app.utils.auth import token_required
    from backend.app.utils.response import success_response, error_response
    from backend.app.services.reading_service import (
        get_student_reading_list,
        add_to_reading_list,
        remove_from_reading_list,
        is_in_reading_list,
        get_student_reading_goals,
        update_student_reading_goal,
        get_book_reviews,
        add_book_review,
    )
    from backend.app.services.book_service import get_book_by_id
except ImportError:
    from app.utils.auth import token_required
    from app.utils.response import success_response, error_response
    from app.services.reading_service import (
        get_student_reading_list,
        add_to_reading_list,
        remove_from_reading_list,
        is_in_reading_list,
        get_student_reading_goals,
        update_student_reading_goal,
        get_book_reviews,
        add_book_review,
    )
    from app.services.book_service import get_book_by_id

logger = logging.getLogger(__name__)

reading_bp = Blueprint("reading", __name__)


# -------------------------------------------------------------
# READING LIST & FAVOURITES
# -------------------------------------------------------------

@reading_bp.route("/student/reading-list", methods=["GET"])
@token_required
def get_reading_list():
    """
    GET /api/student/reading-list
    Retrieves all books currently saved to student's personal reading list.
    """
    user_id = g.current_user.get("id") or g.current_user.get("email")
    books = get_student_reading_list(user_id=user_id)
    return success_response(
        data={"books": books, "count": len(books)},
        message=f"Retrieved {len(books)} books from reading list.",
        status_code=200,
    )


@reading_bp.route("/student/reading-list", methods=["POST"])
@token_required
def save_to_reading_list():
    """
    POST /api/student/reading-list
    Body: { "bookId": "book-001" }
    """
    data = request.get_json(silent=True) or {}
    book_id = data.get("bookId")
    if not book_id:
        return error_response(
            message="Book ID is required.",
            status_code=400,
            error_code="BOOK_ID_REQUIRED",
        )

    book = get_book_by_id(book_id)
    if not book:
        return error_response(
            message="Book not found.",
            status_code=404,
            error_code="BOOK_NOT_FOUND",
        )

    user_id = g.current_user.get("id") or g.current_user.get("email")
    add_to_reading_list(user_id=user_id, book_id=book_id)

    return success_response(
        data={"bookId": book_id, "saved": True},
        message=f"'{book.get('title')}' added to your reading list.",
        status_code=201,
    )


@reading_bp.route("/student/reading-list/<book_id>", methods=["DELETE"])
@token_required
def delete_from_reading_list(book_id: str):
    """
    DELETE /api/student/reading-list/<book_id>
    Removes a book from student's reading list.
    """
    user_id = g.current_user.get("id") or g.current_user.get("email")
    remove_from_reading_list(user_id=user_id, book_id=book_id)

    return success_response(
        data={"bookId": book_id, "saved": False},
        message="Book removed from reading list.",
        status_code=200,
    )


@reading_bp.route("/student/reading-list/check/<book_id>", methods=["GET"])
@token_required
def check_reading_list(book_id: str):
    """
    GET /api/student/reading-list/check/<book_id>
    Checks if a book is currently in the student's reading list.
    """
    user_id = g.current_user.get("id") or g.current_user.get("email")
    saved = is_in_reading_list(user_id=user_id, book_id=book_id)

    return success_response(
        data={"bookId": book_id, "isSaved": saved},
        status_code=200,
    )


# -------------------------------------------------------------
# READING GOALS & BADGES
# -------------------------------------------------------------

@reading_bp.route("/student/reading-goals", methods=["GET"])
@token_required
def get_reading_goals():
    """
    GET /api/student/reading-goals
    Retrieves reading goal target, semester progress %, and academic badges.
    """
    user_id = g.current_user.get("id") or g.current_user.get("email")
    goals_data = get_student_reading_goals(user_id=user_id)

    return success_response(
        data=goals_data,
        message="Reading goals and achievement badges retrieved successfully.",
        status_code=200,
    )


@reading_bp.route("/student/reading-goals", methods=["POST"])
@token_required
def set_reading_goal():
    """
    POST /api/student/reading-goals
    Body: { "targetBooks": 12 }
    """
    data = request.get_json(silent=True) or {}
    target_books = int(data.get("targetBooks", 10))

    if target_books < 1 or target_books > 100:
        return error_response(
            message="Target books must be between 1 and 100.",
            status_code=400,
            error_code="INVALID_TARGET_BOOKS",
        )

    user_id = g.current_user.get("id") or g.current_user.get("email")
    updated = update_student_reading_goal(user_id=user_id, target_books=target_books)

    return success_response(
        data=updated,
        message=f"Semester reading goal updated to {target_books} volumes.",
        status_code=200,
    )


# -------------------------------------------------------------
# BOOK REVIEWS & RATINGS
# -------------------------------------------------------------

@reading_bp.route("/books/<book_id>/reviews", methods=["GET"])
def get_reviews(book_id: str):
    """
    GET /api/books/<book_id>/reviews
    Retrieves student peer reviews, average rating, and rating distribution for a book.
    """
    reviews_data = get_book_reviews(book_id=book_id)
    return success_response(
        data=reviews_data,
        message=f"Retrieved {reviews_data.get('totalReviews', 0)} reviews.",
        status_code=200,
    )


@reading_bp.route("/books/<book_id>/reviews", methods=["POST"])
@token_required
def submit_review(book_id: str):
    """
    POST /api/books/<book_id>/reviews
    Submits a new book review and star rating.
    Body: { "rating": 5, "reviewText": "Great resource...", "isRecommended": true }
    """
    data = request.get_json(silent=True) or {}
    rating = int(data.get("rating", 5))
    review_text = data.get("reviewText", "").strip()
    is_recommended = bool(data.get("isRecommended", True))

    if rating < 1 or rating > 5:
        return error_response(
            message="Rating must be between 1 and 5 stars.",
            status_code=400,
            error_code="INVALID_RATING",
        )

    if not review_text or len(review_text) < 5:
        return error_response(
            message="Review commentary must be at least 5 characters long.",
            status_code=400,
            error_code="REVIEW_TEXT_TOO_SHORT",
        )

    book = get_book_by_id(book_id)
    if not book:
        return error_response(
            message="Book not found.",
            status_code=404,
            error_code="BOOK_NOT_FOUND",
        )

    user = g.current_user
    user_id = user.get("id") or user.get("email")
    user_name = user.get("name", "Scholar Patron")

    new_rev = add_book_review(
        book_id=book_id,
        user_id=user_id,
        user_name=user_name,
        rating=rating,
        review_text=review_text,
        is_recommended=is_recommended,
    )

    return success_response(
        data=new_rev,
        message="Thank you! Your peer book review has been published.",
        status_code=201,
    )


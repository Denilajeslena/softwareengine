from flask import Blueprint, request, g
from app.utils.response import success_response, error_response
from app.utils.auth import roles_required
from app.services.audit_service import log_audit_event
from app.services.book_service import (
    get_all_books,
    get_book_by_id,
    get_book_by_isbn,
    create_book,
    update_book,
    archive_book,
    add_single_copy,
    remove_single_copy,
    generate_qr_data_url,
    lookup_by_qr_or_code,
)

books_bp = Blueprint("books", __name__)


@books_bp.route("", methods=["GET"])
def list_books():
    """
    GET /api/books
    Retrieves catalogue books with optional search, category, availability filter, and sorting.
    """
    search = request.args.get("search", "").strip() or None
    category = request.args.get("category", "").strip() or None
    available_param = request.args.get("available", "").lower()
    available_only = available_param in ("true", "1", "yes")
    sort_by = request.args.get("sort_by", "").strip() or None
    include_archived = request.args.get("include_archived", "").lower() in ("true", "1")

    books = get_all_books(
        search=search,
        category=category,
        available_only=available_only,
        sort_by=sort_by,
        include_archived=include_archived,
    )

    return success_response(
        data={"books": books, "count": len(books)},
        message=f"Retrieved {len(books)} catalogue volumes.",
        status_code=200,
    )


@books_bp.route("/<book_id>", methods=["GET"])
def get_book(book_id: str):
    """
    GET /api/books/<book_id>
    Retrieves full details and copies for a specific book.
    """
    book = get_book_by_id(book_id)
    if not book:
        return error_response(
            message=f"Book with identifier '{book_id}' was not found in the catalogue.",
            status_code=404,
            error_code="BOOK_NOT_FOUND",
        )

    return success_response(
        data={"book": book},
        message="Book retrieved successfully.",
        status_code=200,
    )


@books_bp.route("", methods=["POST"])
@roles_required("librarian", "admin")
def add_new_book():
    """
    POST /api/books
    Creates a new book and generates individual copy records.
    Restricted to librarians and administrators.
    """
    data = request.get_json(silent=True) or {}

    title = data.get("title", "").strip()
    author = data.get("author", "").strip()
    isbn = data.get("isbn", "").strip()
    category = data.get("category", "").strip()
    total_copies = data.get("totalCopies")

    # Form Validation
    if not title or len(title) < 2:
        return error_response(
            message="Book title is required and must be at least 2 characters.",
            status_code=400,
            error_code="VALIDATION_TITLE_REQUIRED",
        )

    if not author or len(author) < 2:
        return error_response(
            message="Author name is required and must be at least 2 characters.",
            status_code=400,
            error_code="VALIDATION_AUTHOR_REQUIRED",
        )

    if not isbn or len(isbn.replace("-", "").strip()) < 9:
        return error_response(
            message="A valid ISBN is required (minimum 9 digits).",
            status_code=400,
            error_code="VALIDATION_ISBN_INVALID",
        )

    if not category:
        return error_response(
            message="Please select or provide an academic category for the book.",
            status_code=400,
            error_code="VALIDATION_CATEGORY_REQUIRED",
        )

    try:
        total_int = int(total_copies)
        if total_int < 1:
            raise ValueError()
    except (TypeError, ValueError):
        return error_response(
            message="Total copies must be a positive integer greater than or equal to 1.",
            status_code=400,
            error_code="VALIDATION_COPIES_INVALID",
        )

    # Prevent duplicate ISBN
    existing_with_isbn = get_book_by_isbn(isbn)
    if existing_with_isbn:
        return error_response(
            message=f"A book with ISBN '{isbn}' is already catalogued: '{existing_with_isbn.get('title')}'.",
            status_code=409,
            error_code="ISBN_ALREADY_EXISTS",
        )

    new_book = create_book(data)
    actor_user = getattr(g, "current_user", {})
    log_audit_event(
        actor=actor_user.get("email", "librarian@scholars.shelf"),
        role=actor_user.get("role", "librarian"),
        action="BOOK_CREATE",
        resource_type="book",
        resource_id=new_book["id"],
        details=f"Catalogued '{title}' with {new_book.get('totalCopies')} copies in {category}.",
        level="SUCCESS",
    )
    return success_response(
        data={"book": new_book},
        message=f"Book '{title}' catalogued successfully with {new_book.get('totalCopies')} copy units.",
        status_code=201,
    )


@books_bp.route("/<book_id>", methods=["PUT"])
@roles_required("librarian", "admin")
def modify_book(book_id: str):
    """
    PUT /api/books/<book_id>
    Updates book metadata or copy counts.
    Restricted to librarians and administrators.
    """
    data = request.get_json(silent=True) or {}

    existing = get_book_by_id(book_id)
    if not existing:
        return error_response(
            message=f"Book with identifier '{book_id}' not found.",
            status_code=404,
            error_code="BOOK_NOT_FOUND",
        )

    # Check ISBN collision if changed
    new_isbn = data.get("isbn")
    if new_isbn and new_isbn.strip() != existing.get("isbn"):
        clash = get_book_by_isbn(new_isbn.strip())
        if clash and clash.get("id") != book_id:
            return error_response(
                message=f"Cannot update ISBN: '{new_isbn}' is already assigned to '{clash.get('title')}'.",
                status_code=409,
                error_code="ISBN_ALREADY_EXISTS",
            )

    try:
        updated = update_book(book_id, data)
        actor_user = getattr(g, "current_user", {})
        log_audit_event(
            actor=actor_user.get("email", "librarian@scholars.shelf"),
            role=actor_user.get("role", "librarian"),
            action="BOOK_UPDATE",
            resource_type="book",
            resource_id=book_id,
            details=f"Updated volume records for '{updated.get('title')}'.",
            level="INFO",
        )
        return success_response(
            data={"book": updated},
            message="Book records updated successfully.",
            status_code=200,
        )
    except ValueError as val_err:
        return error_response(
            message=str(val_err),
            status_code=400,
            error_code="INVALID_COPY_ADJUSTMENT",
        )


@books_bp.route("/<book_id>", methods=["DELETE"])
@roles_required("librarian", "admin")
def delete_book(book_id: str):
    """
    DELETE /api/books/<book_id>
    Archives a book from active circulation.
    """
    existing = get_book_by_id(book_id)
    if not existing:
        return error_response(
            message=f"Book with identifier '{book_id}' not found.",
            status_code=404,
            error_code="BOOK_NOT_FOUND",
        )

    archived = archive_book(book_id)
    actor_user = getattr(g, "current_user", {})
    log_audit_event(
        actor=actor_user.get("email", "librarian@scholars.shelf"),
        role=actor_user.get("role", "librarian"),
        action="BOOK_ARCHIVE",
        resource_type="book",
        resource_id=book_id,
        details=f"Archived volume '{existing.get('title')}' from active circulation.",
        level="WARNING",
    )
    return success_response(
        data={"book": archived},
        message=f"Book '{existing.get('title')}' has been archived from circulation.",
        status_code=200,
    )


@books_bp.route("/<book_id>/copies", methods=["POST"])
@roles_required("librarian", "admin")
def add_copy_route(book_id: str):
    """
    POST /api/books/<book_id>/copies
    Adds a single copy unit to inventory.
    """
    data = request.get_json(silent=True) or {}
    copy_id = data.get("copyId")
    shelf = data.get("shelfLocation")

    try:
        copy = add_single_copy(book_id, copy_id=copy_id, shelf_location=shelf)
        if not copy:
            return error_response(
                message=f"Book with identifier '{book_id}' not found.",
                status_code=404,
                error_code="BOOK_NOT_FOUND",
            )
        actor_user = getattr(g, "current_user", {})
        log_audit_event(
            actor=actor_user.get("email", "librarian@scholars.shelf"),
            role=actor_user.get("role", "librarian"),
            action="COPY_ADD",
            resource_type="book_copy",
            resource_id=copy.get("copyId"),
            details=f"Added physical copy unit '{copy.get('copyId')}' to '{book_id}'.",
            level="SUCCESS",
        )
        return success_response(
            data={"copy": copy},
            message=f"Copy unit '{copy.get('copyId')}' successfully added to inventory.",
            status_code=201,
        )
    except ValueError as val_err:
        return error_response(
            message=str(val_err),
            status_code=400,
            error_code="DUPLICATE_OR_INVALID_COPY_ID",
        )


@books_bp.route("/<book_id>/copies/<copy_id>", methods=["DELETE"])
@roles_required("librarian", "admin")
def remove_copy_route(book_id: str, copy_id: str):
    """
    DELETE /api/books/<book_id>/copies/<copy_id>
    Removes a copy unit from inventory (fails if copy is currently checked out).
    """
    try:
        removed = remove_single_copy(book_id, copy_id)
        actor_user = getattr(g, "current_user", {})
        log_audit_event(
            actor=actor_user.get("email", "librarian@scholars.shelf"),
            role=actor_user.get("role", "librarian"),
            action="COPY_REMOVE",
            resource_type="book_copy",
            resource_id=copy_id,
            details=f"Removed physical copy unit '{copy_id}' from inventory.",
            level="WARNING",
        )
        if not removed:
            return error_response(
                message=f"Book with identifier '{book_id}' not found.",
                status_code=404,
                error_code="BOOK_NOT_FOUND",
            )
        return success_response(
            data={"removedCopy": removed},
            message=f"Copy unit '{copy_id}' removed from library inventory.",
            status_code=200,
        )
    except ValueError as val_err:
        return error_response(
            message=str(val_err),
            status_code=400,
            error_code="CANNOT_REMOVE_COPY",
        )


@books_bp.route("/<book_id>/qr", methods=["GET"])
def get_book_qr(book_id: str):
    """
    GET /api/books/<book_id>/qr
    Generates a base64 QR code data URL for book reference.
    """
    book = get_book_by_id(book_id)
    if not book:
        return error_response(
            message=f"Book '{book_id}' not found.",
            status_code=404,
            error_code="BOOK_NOT_FOUND",
        )

    qr_payload = f"SCHOLARS-BOOK-{book.get('id')}-ISBN-{book.get('isbn')}"
    data_url = generate_qr_data_url(qr_payload)

    return success_response(
        data={"qrDataUrl": data_url, "payload": qr_payload, "bookId": book_id},
        message="QR Code generated successfully.",
        status_code=200,
    )


@books_bp.route("/copies/<copy_id>/qr", methods=["GET"])
def get_copy_qr(copy_id: str):
    """
    GET /api/books/copies/<copy_id>/qr
    Generates a base64 QR code data URL for a specific copy unit.
    """
    matched = lookup_by_qr_or_code(copy_id)
    if not matched or not matched.get("matchedCopy"):
        return error_response(
            message=f"Copy unit with identifier '{copy_id}' not found.",
            status_code=404,
            error_code="COPY_NOT_FOUND",
        )

    copy = matched["matchedCopy"]
    barcode = copy.get("barcode", f"SCHOLARS-COPY-{copy_id}")
    data_url = generate_qr_data_url(barcode)

    return success_response(
        data={
            "qrDataUrl": data_url,
            "barcode": barcode,
            "copyId": copy_id,
            "book": matched["book"],
            "copy": copy,
        },
        message="Copy QR Code generated successfully.",
        status_code=200,
    )


@books_bp.route("/scan", methods=["POST"])
def scan_and_identify():
    """
    POST /api/books/scan
    Scans a QR code payload, barcode, or copy ID and returns matched book and copy details.
    """
    data = request.get_json(silent=True) or {}
    code = data.get("code", "").strip()

    if not code:
        return error_response(
            message="No barcode or QR code payload provided for scanning.",
            status_code=400,
            error_code="MISSING_SCAN_CODE",
        )

    matched = lookup_by_qr_or_code(code)
    if not matched:
        return error_response(
            message=f"No matching book or copy found for scanned payload '{code}'.",
            status_code=404,
            error_code="ITEM_NOT_FOUND",
        )

    return success_response(
        data=matched,
        message=f"Identified volume: '{matched['book']['title']}'",
        status_code=200,
    )


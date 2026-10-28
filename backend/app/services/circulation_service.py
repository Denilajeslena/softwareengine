import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple
from backend.app.services.database import get_mongo_client
from backend.app.services.book_service import (
    get_book_by_id,
    checkout_book_copy,
    return_book_copy,
    reserve_book_copy,
)

logger = logging.getLogger(__name__)

# Configurable Library Circulation Rules
MAX_ACTIVE_LOANS_PER_STUDENT = 5
DEFAULT_LOAN_DAYS = 14
MAX_RENEWALS = 2
RENEWAL_DAYS = 14
DAILY_FINE_RATE = 0.50  # USD $0.50 per day past due date
PICKUP_WINDOW_HOURS = 48

_in_memory_loans: Dict[str, Dict[str, Any]] = {}
_in_memory_reservations: Dict[str, Dict[str, Any]] = {}
_circulation_seeded = False


def get_loans_collection():
    try:
        from flask import current_app
        client = get_mongo_client(current_app.config.get("MONGODB_URI", ""))
        if client is not None:
            db_name = current_app.config.get("MONGODB_DB_NAME", "scholars_shelf")
            return client[db_name]["loans"]
    except Exception:
        pass
    return None


def get_reservations_collection():
    try:
        from flask import current_app
        client = get_mongo_client(current_app.config.get("MONGODB_URI", ""))
        if client is not None:
            db_name = current_app.config.get("MONGODB_DB_NAME", "scholars_shelf")
            return client[db_name]["reservations"]
    except Exception:
        pass
    return None


def _calculate_loan_fine_and_status(loan: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recalculates dynamic overdue status and fine amount for a loan.
    Fine = days overdue * DAILY_FINE_RATE.
    """
    now = datetime.now(timezone.utc)
    due_str = loan.get("dueDate", "")
    return_str = loan.get("returnDate")

    try:
        due_dt = datetime.fromisoformat(due_str.replace("Z", "+00:00"))
    except Exception:
        due_dt = now

    if return_str:
        # Already returned
        try:
            return_dt = datetime.fromisoformat(return_str.replace("Z", "+00:00"))
        except Exception:
            return_dt = now
        
        if return_dt > due_dt:
            days_late = (return_dt - due_dt).days
            if (return_dt - due_dt).seconds > 0 and days_late == 0:
                days_late = 1
            loan["fineAmount"] = round(days_late * DAILY_FINE_RATE, 2)
        else:
            loan["fineAmount"] = 0.0
        return loan

    # Currently checked out
    if now > due_dt:
        days_overdue = (now - due_dt).days
        if (now - due_dt).seconds > 0 and days_overdue == 0:
            days_overdue = 1
        loan["status"] = "overdue"
        loan["fineAmount"] = round(days_overdue * DAILY_FINE_RATE, 2)
        loan["daysOverdue"] = days_overdue
    else:
        if loan.get("status") != "pending_approval":
            loan["status"] = "active"
        loan["fineAmount"] = 0.0
        loan["daysOverdue"] = 0

    return loan


def _seed_circulation():
    global _circulation_seeded
    if _circulation_seeded:
        return

    now = datetime.now(timezone.utc)
    active_due = (now + timedelta(days=9)).isoformat()
    overdue_due = (now - timedelta(days=4)).isoformat()
    returned_borrow = (now - timedelta(days=20)).isoformat()
    returned_due = (now - timedelta(days=6)).isoformat()
    returned_date = (now - timedelta(days=7)).isoformat()

    seed_loans = [
        {
            "id": "loan-001",
            "bookId": "b-001",
            "bookTitle": "The C Programming Language",
            "copyId": "CPY-b-001-04",
            "barcode": "SCHOLARS-COPY-b-001-04",
            "userId": "USR-STU-001",
            "userEmail": "student@scholars.shelf",
            "userName": "Alexandra Vance",
            "studentId": "STU-2024-8841",
            "borrowDate": (now - timedelta(days=5)).isoformat(),
            "dueDate": active_due,
            "returnDate": None,
            "status": "active",
            "renewalsCount": 0,
            "fineAmount": 0.0,
            "issuedBy": "Desk Librarian",
            "shelfLocation": "Stack 3, Shelf B-12",
        },
        {
            "id": "loan-002",
            "bookId": "b-002",
            "bookTitle": "Introduction to Algorithms (CLRS)",
            "copyId": "CPY-b-002-05",
            "barcode": "SCHOLARS-COPY-b-002-05",
            "userId": "USR-STU-001",
            "userEmail": "student@scholars.shelf",
            "userName": "Alexandra Vance",
            "studentId": "STU-2024-8841",
            "borrowDate": (now - timedelta(days=18)).isoformat(),
            "dueDate": overdue_due,
            "returnDate": None,
            "status": "overdue",
            "renewalsCount": 0,
            "fineAmount": 2.0,  # 4 days * $0.50
            "issuedBy": "Desk Librarian",
            "shelfLocation": "Stack 3, Shelf B-14",
        },
        {
            "id": "loan-003",
            "bookId": "b-003",
            "bookTitle": "Artificial Intelligence: A Modern Approach",
            "copyId": "CPY-b-003-02",
            "barcode": "SCHOLARS-COPY-b-003-02",
            "userId": "USR-STU-001",
            "userEmail": "student@scholars.shelf",
            "userName": "Alexandra Vance",
            "studentId": "STU-2024-8841",
            "borrowDate": returned_borrow,
            "dueDate": returned_due,
            "returnDate": returned_date,
            "status": "returned",
            "renewalsCount": 1,
            "fineAmount": 0.0,
            "issuedBy": "Desk Librarian",
            "shelfLocation": "Stack 4, Shelf A-01",
        },
    ]

    for l in seed_loans:
        _in_memory_loans[l["id"]] = _calculate_loan_fine_and_status(l)

    seed_reservations = [
        {
            "id": "res-001",
            "bookId": "b-005",
            "bookTitle": "Clean Architecture",
            "userId": "USR-STU-001",
            "userEmail": "student@scholars.shelf",
            "userName": "Alexandra Vance",
            "studentId": "STU-2024-8841",
            "reservedAt": (now - timedelta(days=2)).isoformat(),
            "status": "pending",
            "queuePosition": 1,
            "pickupDeadline": None,
        }
    ]

    for r in seed_reservations:
        _in_memory_reservations[r["id"]] = r

    _circulation_seeded = True


def get_all_loans(status: Optional[str] = None, user_id: Optional[str] = None, user_email: Optional[str] = None, book_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves all loans matching criteria, dynamically updating overdue status and fines."""
    _seed_circulation()
    col = get_loans_collection()

    loans_list = []
    if col is not None:
        try:
            query = {}
            if user_id and user_email:
                query["$or"] = [{"userId": user_id}, {"userEmail": user_email}]
            elif user_id:
                query["$or"] = [{"userId": user_id}, {"userEmail": user_id}]
            elif user_email:
                query["userEmail"] = user_email

            if book_id:
                query["bookId"] = book_id
            docs = list(col.find(query, {"_id": 0}))
            for d in docs:
                loans_list.append(_calculate_loan_fine_and_status(d))
        except Exception as e:
            logger.warning(f"Failed to query loans from MongoDB: {e}")
            loans_list = []

    if not loans_list:
        loans_list = [
            _calculate_loan_fine_and_status(l)
            for l in _in_memory_loans.values()
            if (
                (not user_id and not user_email)
                or (user_id and (l.get("userId") == user_id or l.get("userEmail") == user_id))
                or (user_email and l.get("userEmail") == user_email)
            )
            and (not book_id or l.get("bookId") == book_id)
        ]

    if status:
        loans_list = [l for l in loans_list if l.get("status") == status]

    # Sort: active & overdue first, then newest borrowDate
    loans_list.sort(key=lambda x: (x.get("status") in ("returned", "cancelled"), x.get("borrowDate", "")), reverse=False)
    return loans_list


def get_student_loans(user_identifier: str, user_email: Optional[str] = None) -> Dict[str, Any]:
    """Retrieves loans for a student along with summary statistics."""
    all_loans = get_all_loans(user_id=user_identifier, user_email=user_email)
    active = [l for l in all_loans if l.get("status") in ("active", "overdue")]
    history = [l for l in all_loans if l.get("status") == "returned"]
    pending = [l for l in all_loans if l.get("status") == "pending_approval"]
    total_fines = sum(l.get("fineAmount", 0.0) for l in active + history)

    return {
        "activeLoans": active,
        "history": history,
        "pendingRequests": pending,
        "activeCount": len(active),
        "totalCount": len(all_loans),
        "totalFines": round(total_fines, 2),
        "remainingAllowance": max(0, MAX_ACTIVE_LOANS_PER_STUDENT - len(active)),
        "maxAllowance": MAX_ACTIVE_LOANS_PER_STUDENT,
    }


def request_book_loan(user: Dict[str, Any], book_id: str, copy_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Student submits a borrow request for a book.
    Validations:
      1. Student active loan limit (max 5)
      2. No duplicate active loan for the exact same book
      3. Copies available in stacks
    """
    _seed_circulation()
    user_id = user.get("id") or user.get("email")
    student_name = user.get("name", "Student Patron")
    student_email = user.get("email", "")
    student_id = user.get("student_id") or "STU-2026-9000"

    # 1. Check max active loans
    current_loans = get_all_loans(user_id=user_id, user_email=student_email)
    active_loans = [l for l in current_loans if l.get("status") in ("active", "overdue", "pending_approval")]
    if len(active_loans) >= MAX_ACTIVE_LOANS_PER_STUDENT:
        raise ValueError(
            f"You have reached your maximum loan allowance of {MAX_ACTIVE_LOANS_PER_STUDENT} concurrent books. "
            f"Please return a checked-out volume before borrowing another."
        )

    # 2. Prevent duplicate active loan for the same book
    if any(l.get("bookId") == book_id and l.get("status") in ("active", "overdue", "pending_approval") for l in current_loans):
        raise ValueError("You currently have an active loan or pending request for this volume. Duplicate concurrent loans are prohibited.")

    # 3. Check book and copy availability
    book = get_book_by_id(book_id)
    if not book:
        raise ValueError(f"Book with identifier '{book_id}' does not exist.")

    if book.get("availableCopies", 0) <= 0:
        raise ValueError("No physical copies are currently available in the stacks. You may place a reservation hold instead.")

    # Check out copy
    updated_book, target_copy = checkout_book_copy(book_id, copy_id)

    now = datetime.now(timezone.utc)
    due_date = now + timedelta(days=DEFAULT_LOAN_DAYS)
    loan_id = f"loan-{int(now.timestamp())}-{book_id[:4]}"

    new_loan = {
        "id": loan_id,
        "bookId": book_id,
        "bookTitle": book.get("title", "Volume"),
        "copyId": target_copy.get("copyId"),
        "barcode": target_copy.get("barcode"),
        "userId": user_id,
        "userEmail": student_email,
        "userName": student_name,
        "studentId": student_id,
        "borrowDate": now.isoformat(),
        "dueDate": due_date.isoformat(),
        "returnDate": None,
        "status": "active",
        "renewalsCount": 0,
        "fineAmount": 0.0,
        "issuedBy": "Self-Service Checkout",
        "shelfLocation": target_copy.get("shelfLocation") or book.get("shelfLocation", "General Stacks"),
    }

    col = get_loans_collection()
    if col is not None:
        try:
            col.insert_one(dict(new_loan))
        except Exception as e:
            logger.warning(f"Failed to persist loan to MongoDB: {e}")

    _in_memory_loans[loan_id] = new_loan
    return new_loan


def issue_book_by_librarian(librarian_user: Dict[str, Any], student_identifier: str, book_id: str, copy_id: Optional[str] = None, duration_days: int = 14) -> Dict[str, Any]:
    """Librarian issues a book directly to a student at the circulation desk."""
    _seed_circulation()
    book = get_book_by_id(book_id)
    if not book:
        raise ValueError(f"Book '{book_id}' not found.")

    if book.get("availableCopies", 0) <= 0:
        raise ValueError("No copies currently available in stock.")

    # Check student active loan allowance
    existing_loans = get_all_loans(user_id=student_identifier)
    active = [l for l in existing_loans if l.get("status") in ("active", "overdue")]
    if len(active) >= MAX_ACTIVE_LOANS_PER_STUDENT:
        raise ValueError(f"Student has reached the maximum of {MAX_ACTIVE_LOANS_PER_STUDENT} active loans.")

    # Prevent duplicate active loan
    if any(l.get("bookId") == book_id and l.get("status") in ("active", "overdue") for l in existing_loans):
        raise ValueError("Student already has an active loan for this volume.")

    updated_book, target_copy = checkout_book_copy(book_id, copy_id)

    now = datetime.now(timezone.utc)
    due_date = now + timedelta(days=duration_days or DEFAULT_LOAN_DAYS)
    loan_id = f"loan-{int(now.timestamp())}-{target_copy.get('copyId')[-4:]}"

    new_loan = {
        "id": loan_id,
        "bookId": book_id,
        "bookTitle": book.get("title", "Volume"),
        "copyId": target_copy.get("copyId"),
        "barcode": target_copy.get("barcode"),
        "userId": student_identifier,
        "userEmail": student_identifier if "@" in student_identifier else f"{student_identifier}@scholars.shelf",
        "userName": student_identifier.split("@")[0].capitalize(),
        "studentId": student_identifier if "@" not in student_identifier else "STU-2026-AUTO",
        "borrowDate": now.isoformat(),
        "dueDate": due_date.isoformat(),
        "returnDate": None,
        "status": "active",
        "renewalsCount": 0,
        "fineAmount": 0.0,
        "issuedBy": librarian_user.get("name", "Desk Librarian"),
        "shelfLocation": target_copy.get("shelfLocation") or book.get("shelfLocation", "General Stacks"),
    }

    col = get_loans_collection()
    if col is not None:
        try:
            col.insert_one(dict(new_loan))
        except Exception:
            pass

    _in_memory_loans[loan_id] = new_loan
    return new_loan


def return_loan(loan_id: str, librarian_user: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Processes book return:
    - Marks returnDate = now
    - Calculates late fines if overdue
    - Re-stocks copy to available in book_service
    - Checks reservations queue: if students are waiting, sets next reservation to 'ready'
    """
    _seed_circulation()
    all_loans = get_all_loans()
    loan = next((l for l in all_loans if l.get("id") == loan_id), None)
    if not loan:
        raise ValueError(f"Loan record '{loan_id}' not found.")

    if loan.get("status") == "returned":
        raise ValueError("This loan has already been processed as returned.")

    now = datetime.now(timezone.utc)
    loan["returnDate"] = now.isoformat()
    loan = _calculate_loan_fine_and_status(loan)
    loan["status"] = "returned"
    loan["returnedTo"] = librarian_user.get("name", "Circulation Desk") if librarian_user else "Circulation Desk"

    # Restock physical copy
    book_id = loan.get("bookId")
    copy_id = loan.get("copyId")
    if book_id and copy_id:
        return_book_copy(book_id, copy_id)

    # Check reservations queue
    waiting_reservations = get_all_reservations(book_id=book_id, status="pending")
    notification = None
    if waiting_reservations:
        next_res = waiting_reservations[0]
        next_res["status"] = "ready"
        next_res["pickupDeadline"] = (now + timedelta(hours=PICKUP_WINDOW_HOURS)).isoformat()
        next_res["assignedCopyId"] = copy_id
        # Reserve copy
        reserve_book_copy(book_id, copy_id)
        notification = f"Volume held for waiting patron {next_res.get('userName')} (Hold #{next_res.get('id')})."

        # Update in mongo/memory
        res_col = get_reservations_collection()
        if res_col is not None:
            try:
                res_col.update_one({"id": next_res["id"]}, {"$set": next_res})
            except Exception:
                pass
        _in_memory_reservations[next_res["id"]] = next_res

    # Persist loan
    col = get_loans_collection()
    if col is not None:
        try:
            col.update_one({"id": loan_id}, {"$set": loan})
        except Exception:
            pass

    _in_memory_loans[loan_id] = loan
    return {
        "loan": loan,
        "notification": notification,
    }


def renew_loan(loan_id: str, user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extends an active loan's due date by 14 days.
    Validations:
      1. Must be the borrower or librarian/admin
      2. Loan must be 'active' or 'overdue'
      3. Max renewals not exceeded (max 2 renewals)
      4. Cannot renew if another patron has reserved the title
    """
    _seed_circulation()
    all_loans = get_all_loans()
    loan = next((l for l in all_loans if l.get("id") == loan_id), None)
    if not loan:
        raise ValueError(f"Loan record '{loan_id}' not found.")

    user_id = user.get("id") or user.get("email")
    user_role = user.get("role", "student")

    if user_role not in ("librarian", "admin") and loan.get("userId") != user_id and loan.get("userEmail") != user.get("email"):
        raise PermissionError("You can only renew your own borrowed volumes.")

    if loan.get("status") == "returned":
        raise ValueError("Cannot renew a book that has already been returned.")

    current_renewals = loan.get("renewalsCount", 0)
    if current_renewals >= MAX_RENEWALS:
        raise ValueError(f"Maximum renewal limit of {MAX_RENEWALS} reached for this loan. Please return the volume to circulation.")

    # Check if other patrons have reserved this book
    pending_holds = get_all_reservations(book_id=loan.get("bookId"), status="pending")
    if pending_holds:
        raise ValueError("Renewal declined: another patron has placed a hold reservation on this title.")

    # Add 14 days from current due date (or today if overdue)
    now = datetime.now(timezone.utc)
    try:
        due_dt = datetime.fromisoformat(loan.get("dueDate", "").replace("Z", "+00:00"))
        base_dt = max(now, due_dt)
    except Exception:
        base_dt = now

    new_due = base_dt + timedelta(days=RENEWAL_DAYS)
    loan["dueDate"] = new_due.isoformat()
    loan["renewalsCount"] = current_renewals + 1
    loan["status"] = "active"
    loan["fineAmount"] = 0.0

    col = get_loans_collection()
    if col is not None:
        try:
            col.update_one({"id": loan_id}, {"$set": loan})
        except Exception:
            pass

    _in_memory_loans[loan_id] = loan
    return loan


# -------------------------------------------------------------
# RESERVATIONS & HOLDS
# -------------------------------------------------------------

def get_all_reservations(book_id: Optional[str] = None, user_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves all reservations matching optional filters."""
    _seed_circulation()
    col = get_reservations_collection()
    res_list = []

    if col is not None:
        try:
            query = {}
            if book_id:
                query["bookId"] = book_id
            if user_id:
                query["userId"] = user_id
            if status:
                query["status"] = status
            res_list = list(col.find(query, {"_id": 0}))
        except Exception:
            res_list = []

    if not res_list:
        res_list = [
            r for r in _in_memory_reservations.values()
            if (not book_id or r.get("bookId") == book_id)
            and (not user_id or r.get("userId") == user_id or r.get("userEmail") == user_id)
            and (not status or r.get("status") == status)
        ]

    res_list.sort(key=lambda x: x.get("reservedAt", ""), reverse=False)
    return res_list


def create_reservation(user: Dict[str, Any], book_id: str) -> Dict[str, Any]:
    """Places a hold reservation on a title for a student."""
    _seed_circulation()
    user_id = user.get("id") or user.get("email")
    book = get_book_by_id(book_id)
    if not book:
        raise ValueError(f"Book '{book_id}' does not exist.")

    # Prevent duplicate active reservation for same book
    user_res = get_all_reservations(book_id=book_id, user_id=user_id)
    if any(r.get("status") in ("pending", "ready") for r in user_res):
        raise ValueError("You already have an active hold reservation queued for this volume.")

    # Check existing active loans for this student
    current_loans = get_all_loans(user_id=user_id, book_id=book_id)
    if any(l.get("status") in ("active", "overdue") for l in current_loans):
        raise ValueError("You already have this volume checked out.")

    existing_holds = get_all_reservations(book_id=book_id, status="pending")
    queue_pos = len(existing_holds) + 1

    now = datetime.now(timezone.utc)
    res_id = f"res-{int(now.timestamp())}-{book_id[:4]}"

    new_res = {
        "id": res_id,
        "bookId": book_id,
        "bookTitle": book.get("title", "Volume"),
        "userId": user_id,
        "userEmail": user.get("email", ""),
        "userName": user.get("name", "Student Patron"),
        "studentId": user.get("student_id") or "STU-2026-9000",
        "reservedAt": now.isoformat(),
        "status": "pending",
        "queuePosition": queue_pos,
        "pickupDeadline": None,
    }

    col = get_reservations_collection()
    if col is not None:
        try:
            col.insert_one(dict(new_res))
        except Exception:
            pass

    _in_memory_reservations[res_id] = new_res
    return new_res


def cancel_reservation(reservation_id: str, user: Dict[str, Any]) -> Dict[str, Any]:
    """Cancels a reservation hold."""
    _seed_circulation()
    all_res = get_all_reservations()
    target_res = next((r for r in all_res if r.get("id") == reservation_id), None)
    if not target_res:
        raise ValueError(f"Reservation '{reservation_id}' not found.")

    user_id = user.get("id") or user.get("email")
    user_role = user.get("role", "student")

    if user_role not in ("librarian", "admin") and target_res.get("userId") != user_id and target_res.get("userEmail") != user.get("email"):
        raise PermissionError("You can only cancel your own reservations.")

    # If it was ready with a held copy, release the copy
    if target_res.get("status") == "ready" and target_res.get("assignedCopyId"):
        return_book_copy(target_res.get("bookId"), target_res.get("assignedCopyId"))

    target_res["status"] = "cancelled"

    col = get_reservations_collection()
    if col is not None:
        try:
            col.update_one({"id": reservation_id}, {"$set": target_res})
        except Exception:
            pass

    _in_memory_reservations[reservation_id] = target_res
    return target_res

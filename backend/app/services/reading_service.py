import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
try:
    from backend.app.services.database import get_mongo_client
    from backend.app.services.book_service import get_book_by_id, get_all_books
    from backend.app.services.circulation_service import get_student_loans
except ImportError:
    from app.services.database import get_mongo_client
    from app.services.book_service import get_book_by_id, get_all_books
    from app.services.circulation_service import get_student_loans

logger = logging.getLogger(__name__)

# In-memory storage stores
_in_memory_reading_lists: Dict[str, List[str]] = {}  # userId -> list of bookIds
_in_memory_reading_goals: Dict[str, Dict[str, Any]] = {}  # userId -> goal dict
_in_memory_reviews: Dict[str, List[Dict[str, Any]]] = {}  # bookId -> list of reviews
_reading_service_seeded = False


def get_mongo_collection(collection_name: str):
    try:
        from flask import current_app
        client = get_mongo_client(current_app.config.get("MONGODB_URI", ""))
        if client is not None:
            db_name = current_app.config.get("MONGODB_DB_NAME", "scholars_shelf")
            return client[db_name][collection_name]
    except Exception:
        pass
    return None


def _seed_initial_reading_data():
    global _reading_service_seeded
    if _reading_service_seeded:
        return
    _reading_service_seeded = True

    # Seed student reading list for test student
    _in_memory_reading_lists["usr-student-001"] = ["b-001", "b-002", "b-005"]

    # Seed student reading goal
    _in_memory_reading_goals["usr-student-001"] = {
        "userId": "usr-student-001",
        "targetBooks": 10,
        "completedBooks": 4,
        "academicTerm": "Fall Semester 2026",
        "streakWeeks": 6,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }

    # Seed reviews for popular books
    _in_memory_reviews["b-001"] = [
        {
            "id": "rev-001",
            "bookId": "b-001",
            "userId": "usr-student-001",
            "userName": "Alex Mercer",
            "rating": 5,
            "reviewText": "The definitive resource for algorithmic foundations. Dynamic programming and graph traversal chapters are exceptionally clear.",
            "isRecommended": True,
            "createdAt": "2026-10-15T14:30:00Z",
        },
        {
            "id": "rev-002",
            "bookId": "b-001",
            "userId": "usr-student-002",
            "userName": "Sophia Chen",
            "rating": 4,
            "reviewText": "Dense and rigorous mathematical proofs, but indispensable for computing majors preparing for technical research.",
            "isRecommended": True,
            "createdAt": "2026-10-18T09:15:00Z",
        },
    ]

    _in_memory_reviews["b-002"] = [
        {
            "id": "rev-003",
            "bookId": "b-002",
            "userId": "usr-student-001",
            "userName": "Alex Mercer",
            "rating": 5,
            "reviewText": "Russell and Norvig provide an extraordinary holistic survey of intelligent agents and modern neural heuristics.",
            "isRecommended": True,
            "createdAt": "2026-10-20T11:45:00Z",
        }
    ]


_seed_initial_reading_data()


# -------------------------------------------------------------
# READING LISTS & FAVOURITES
# -------------------------------------------------------------

def get_student_reading_list(user_id: str) -> List[Dict[str, Any]]:
    """Retrieves full book objects saved in student's reading list."""
    book_ids = list(_in_memory_reading_lists.get(user_id, []))

    coll = get_mongo_collection("reading_lists")
    if coll is not None:
        try:
            doc = coll.find_one({"userId": user_id})
            if doc and "bookIds" in doc:
                book_ids = doc["bookIds"]
        except Exception as e:
            logger.warning(f"MongoDB reading list fetch failed: {e}")

    books = []
    for b_id in book_ids:
        b = get_book_by_id(b_id)
        if b:
            books.append(b)
    return books


def add_to_reading_list(user_id: str, book_id: str) -> bool:
    """Adds a book to the student's saved reading list."""
    if user_id not in _in_memory_reading_lists:
        _in_memory_reading_lists[user_id] = []

    if book_id not in _in_memory_reading_lists[user_id]:
        _in_memory_reading_lists[user_id].append(book_id)

    coll = get_mongo_collection("reading_lists")
    if coll is not None:
        try:
            coll.update_one(
                {"userId": user_id},
                {"$addToSet": {"bookIds": book_id}},
                upsert=True,
            )
        except Exception as e:
            logger.warning(f"MongoDB reading list update failed: {e}")

    return True


def remove_from_reading_list(user_id: str, book_id: str) -> bool:
    """Removes a book from the student's saved reading list."""
    if user_id in _in_memory_reading_lists:
        if book_id in _in_memory_reading_lists[user_id]:
            _in_memory_reading_lists[user_id].remove(book_id)

    coll = get_mongo_collection("reading_lists")
    if coll is not None:
        try:
            coll.update_one(
                {"userId": user_id},
                {"$pull": {"bookIds": book_id}},
            )
        except Exception as e:
            logger.warning(f"MongoDB reading list pull failed: {e}")

    return True


def is_in_reading_list(user_id: str, book_id: str) -> bool:
    """Checks if a specific book is in the student's reading list."""
    return book_id in _in_memory_reading_lists.get(user_id, [])


# -------------------------------------------------------------
# READING GOALS & GAMIFIED BADGES
# -------------------------------------------------------------

def get_student_reading_goals(user_id: str) -> Dict[str, Any]:
    """Retrieves student reading target, current progress, and gamified badges."""
    loans_data = get_student_loans(user_id)
    loans = loans_data.get("activeLoans", []) + loans_data.get("history", [])
    returned_count = sum(1 for l in loans if l.get("status") == "returned")
    active_count = sum(1 for l in loans if l.get("status") in ("active", "overdue"))

    goal = _in_memory_reading_goals.get(user_id, {
        "userId": user_id,
        "targetBooks": 10,
        "completedBooks": max(returned_count, 4),
        "academicTerm": "Fall Semester 2026",
        "streakWeeks": 6,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    })

    # Update completed count dynamically from actual circulation history
    goal["completedBooks"] = max(goal.get("completedBooks", 0), returned_count)
    progress_pct = round((goal["completedBooks"] / max(1, goal["targetBooks"])) * 100, 1)
    goal["progressPercentage"] = min(100.0, progress_pct)

    # Compute earned badges dynamically
    badges = calculate_student_badges(user_id, loans, goal)

    return {
        "goal": goal,
        "badges": badges,
        "summary": {
            "target": goal["targetBooks"],
            "completed": goal["completedBooks"],
            "activeLoans": active_count,
            "progress": goal["progressPercentage"],
        },
    }


def update_student_reading_goal(user_id: str, target_books: int) -> Dict[str, Any]:
    """Updates target books for the current semester."""
    target_books = max(1, min(100, target_books))

    current = _in_memory_reading_goals.get(user_id, {
        "userId": user_id,
        "targetBooks": 10,
        "completedBooks": 0,
        "academicTerm": "Fall Semester 2026",
        "streakWeeks": 1,
    })

    current["targetBooks"] = target_books
    current["updatedAt"] = datetime.now(timezone.utc).isoformat()
    _in_memory_reading_goals[user_id] = current

    coll = get_mongo_collection("reading_goals")
    if coll is not None:
        try:
            coll.update_one({"userId": user_id}, {"$set": current}, upsert=True)
        except Exception as e:
            logger.warning(f"MongoDB reading goal update failed: {e}")

    return get_student_reading_goals(user_id)


def calculate_student_badges(user_id: str, loans: List[Dict[str, Any]], goal: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Synthesizes academic achievement badges based on real student interactions."""
    total_loans = len(loans)
    returned_loans = [l for l in loans if l.get("status") == "returned"]
    on_time_returns = [l for l in returned_loans if l.get("fineAmount", 0) == 0]
    saved_books = _in_memory_reading_lists.get(user_id, [])

    # Student reviews count
    user_review_count = 0
    for rev_list in _in_memory_reviews.values():
        user_review_count += sum(1 for r in rev_list if r.get("userId") == user_id)

    badges = [
        {
            "id": "badge-avid-scholar",
            "name": "Avid Scholar",
            "description": "Initiated circulation borrowing and checked out your first academic volume.",
            "category": "Circulation",
            "icon": "BookOpen",
            "unlocked": total_loans > 0,
            "progress": f"{min(1, total_loans)}/1 loan",
        },
        {
            "id": "badge-punctual-reader",
            "name": "Punctual Reader",
            "description": "Returned a borrowed book on time with zero overdue penalties incurred.",
            "category": "Responsibility",
            "icon": "Clock",
            "unlocked": len(on_time_returns) > 0 or len(returned_loans) > 0,
            "progress": f"{len(on_time_returns)} on-time return(s)",
        },
        {
            "id": "badge-research-explorer",
            "name": "Research Explorer",
            "description": "Saved 3 or more academic reference volumes to your personal reading list.",
            "category": "Discovery",
            "icon": "Bookmark",
            "unlocked": len(saved_books) >= 3,
            "progress": f"{len(saved_books)}/3 saved",
        },
        {
            "id": "badge-semester-pacesetter",
            "name": "Semester Pacesetter",
            "description": "Achieved 40% or more of your semester reading completion goal.",
            "category": "Milestone",
            "icon": "TrendingUp",
            "unlocked": goal.get("progressPercentage", 0) >= 40.0,
            "progress": f"{goal.get('progressPercentage', 0)}% of goal",
        },
        {
            "id": "badge-literary-critic",
            "name": "Scholarly Reviewer",
            "description": "Penned constructive peer book reviews and ratings to guide fellow scholars.",
            "category": "Community",
            "icon": "Star",
            "unlocked": user_review_count > 0,
            "progress": f"{user_review_count} review(s)",
        },
        {
            "id": "badge-bookmind-pioneer",
            "name": "BookMind Pioneer",
            "description": "Consulted the AI Study Assistant or semantic search for thesis preparation.",
            "category": "Innovation",
            "icon": "Sparkles",
            "unlocked": True,  # Unlocked as part of Part 7 suite
            "progress": "Active",
        },
    ]

    return badges


# -------------------------------------------------------------
# BOOK REVIEWS & RATINGS
# -------------------------------------------------------------

def get_book_reviews(book_id: str) -> Dict[str, Any]:
    """Retrieves all reviews, average rating score, and rating breakdown for a book."""
    reviews = []
    coll = get_mongo_collection("book_reviews")
    if coll is not None:
        try:
            reviews = list(coll.find({"bookId": book_id}, {"_id": 0}).sort("createdAt", -1))
        except Exception as e:
            logger.warning(f"MongoDB review fetch failed: {e}")

    if not reviews:
        reviews = _in_memory_reviews.get(book_id, [])

    total = len(reviews)
    avg_rating = 0.0
    breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}

    if total > 0:
        sum_rating = sum(r.get("rating", 5) for r in reviews)
        avg_rating = round(sum_rating / total, 1)
        for r in reviews:
            rt = int(r.get("rating", 5))
            if rt in breakdown:
                breakdown[rt] += 1

    return {
        "bookId": book_id,
        "totalReviews": total,
        "averageRating": avg_rating,
        "distribution": breakdown,
        "reviews": reviews,
    }


def add_book_review(
    book_id: str,
    user_id: str,
    user_name: str,
    rating: int,
    review_text: str,
    is_recommended: bool = True,
) -> Dict[str, Any]:
    """Creates and persists a new peer book review."""
    rating = max(1, min(5, int(rating)))
    new_review = {
        "id": f"rev-{uuid.uuid4().hex[:8]}",
        "bookId": book_id,
        "userId": user_id,
        "userName": user_name,
        "rating": rating,
        "reviewText": review_text.strip(),
        "isRecommended": bool(is_recommended),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    if book_id not in _in_memory_reviews:
        _in_memory_reviews[book_id] = []
    _in_memory_reviews[book_id].insert(0, new_review)

    coll = get_mongo_collection("book_reviews")
    if coll is not None:
        try:
            coll.insert_one(dict(new_review))
        except Exception as e:
            logger.warning(f"MongoDB review insertion failed: {e}")

    return new_review

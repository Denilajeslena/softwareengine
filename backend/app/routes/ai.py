import logging
from flask import Blueprint, request, jsonify, g
from backend.app.routes.auth import token_required
from backend.app.services.ai_service import get_ai_engine

logger = logging.getLogger(__name__)

ai_bp = Blueprint("ai", __name__)


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


@ai_bp.route("/search", methods=["POST"])
def semantic_search():
    """
    POST /api/ai/search
    Natural language semantic search powered by BookMind AI.
    Body: { "query": "Suggest beginner-friendly machine learning books", "top_k": 6, "category": "optional", "available_only": false }
    """
    data = request.get_json(silent=True) or {}
    query = data.get("query", "").strip()
    top_k = int(data.get("top_k", 6))
    category = data.get("category")
    available_only = bool(data.get("available_only", False))

    if not query:
        return error_response(
            message="Search query is required.",
            status_code=400,
            error_code="QUERY_REQUIRED",
        )

    engine = get_ai_engine()
    results_data = engine.semantic_search(
        query=query,
        top_k=top_k,
        category=category,
        available_only=available_only,
    )

    return success_response(
        data=results_data,
        message=f"BookMind AI found {len(results_data.get('results', []))} relevant volumes.",
    )


@ai_bp.route("/similar/<book_id>", methods=["GET"])
def get_similar_books(book_id: str):
    """
    GET /api/ai/similar/<book_id>
    Finds semantically similar books with explanatory reasoning.
    """
    top_k = int(request.args.get("top_k", 4))
    engine = get_ai_engine()
    similar = engine.recommend_similar_books(book_id=book_id, top_k=top_k)

    return success_response(
        data={"similarBooks": similar, "count": len(similar)},
        message=f"Retrieved {len(similar)} semantically related volumes.",
    )


@ai_bp.route("/alternatives/<book_id>", methods=["GET"])
def get_available_alternatives(book_id: str):
    """
    GET /api/ai/alternatives/<book_id>
    When a book is checked out or unavailable, recommends in-stock alternative volumes.
    """
    top_k = int(request.args.get("top_k", 3))
    engine = get_ai_engine()
    data = engine.suggest_available_alternatives(book_id=book_id, top_k=top_k)

    return success_response(
        data=data,
        message=f"Retrieved {len(data.get('alternatives', []))} in-stock alternatives.",
    )


@ai_bp.route("/personalized", methods=["GET"])
@token_required
def get_personalized_recommendations():
    """
    GET /api/ai/personalized
    Personalized recommendations based on student borrowing history and reading interests.
    """
    current_user = g.current_user
    user_id = current_user.get("id") or current_user.get("email")
    top_k = int(request.args.get("top_k", 4))

    engine = get_ai_engine()
    recommendations = engine.recommend_for_user(user_id=user_id, top_k=top_k)

    return success_response(
        data={"recommendations": recommendations, "count": len(recommendations)},
        message=f"Retrieved {len(recommendations)} personalized book recommendations.",
    )


@ai_bp.route("/study-assist", methods=["POST"])
def study_assistant():
    """
    POST /api/ai/study-assist
    AI Study Assistant for authorized or user-uploaded academic materials.
    Body: { "content": "Text excerpt...", "mode": "all" | "summarize" | "key_concepts" | "quiz", "title": "Optional title" }
    """
    data = request.get_json(silent=True) or {}
    content = data.get("content", "").strip()
    mode = data.get("mode", "all")
    title = data.get("title")

    if not content:
        return error_response(
            message="Content text is required to synthesize study assistant notes.",
            status_code=400,
            error_code="CONTENT_REQUIRED",
        )

    engine = get_ai_engine()
    study_materials = engine.generate_study_assistant(
        content=content,
        mode=mode,
        title=title,
    )

    return success_response(
        data=study_materials,
        message="AI study assistant materials generated successfully.",
        status_code=200,
    )



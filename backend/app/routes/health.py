from datetime import datetime, timezone
from flask import Blueprint, current_app
from app.services.database import check_database_status
from app.utils.response import success_response

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    """
    GET /api/health
    Provides live backend and database connectivity status.
    """
    db_status = check_database_status(current_app.config)

    health_info = {
        "service": "The Scholar's Shelf API",
        "tagline": "Where Knowledge Finds Its Place.",
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "phase": "Part 8 of 8 — Final Integration & Production Readiness",
        "environment": current_app.config.get("ENV", "development"),
        "database": db_status,
        "features": {
            "auth": "Implemented in Part 2 (JWT & RBAC)",
            "catalogue": "Implemented in Part 3 (Catalogue, Inventory & QR)",
            "borrowing": "Implemented in Part 4 (Circulation, Returns, Renewals & Overdue Fines)",
            "ai_search_recommendations": "Implemented in Part 5 (BookMind Semantic Search & Alternatives)",
            "analytics_ml": "Implemented in Part 6 (BookPulse Analytics & ML Demand Forecasting)",
            "accessibility_smart_tools": "Implemented in Part 7 (TTS, Voice Search, Notification Centre, Reading Goals & AI Study Assistant)",
            "final_integration_quality": "Implemented in Part 8 (Final System Verification, Security Hardening & Complete Documentation)",
        },
    }

    return success_response(
        data=health_info,
        message="Backend API service is operating normally",
        status_code=200,
    )

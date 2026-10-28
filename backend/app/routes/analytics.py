import logging
from flask import Blueprint, request, jsonify, g
try:
    from backend.app.utils.auth import token_required, roles_required
    from backend.app.utils.response import success_response, error_response
    from backend.app.services.analytics_service import (
        get_analytics_overview,
        get_category_statistics,
        get_borrowing_trends,
        get_popular_books,
        get_low_stock_alerts,
        predict_book_demand_and_procurement,
    )
except ImportError:
    from app.utils.auth import token_required, roles_required
    from app.utils.response import success_response, error_response
    from app.services.analytics_service import (
        get_analytics_overview,
        get_category_statistics,
        get_borrowing_trends,
        get_popular_books,
        get_low_stock_alerts,
        predict_book_demand_and_procurement,
    )

logger = logging.getLogger(__name__)

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/overview", methods=["GET"])
@roles_required("librarian", "admin")
def get_overview():
    """
    GET /api/analytics/overview
    Provides real-time aggregate KPI metrics across all inventory and circulation records.
    Restricted to librarian and admin roles.
    """
    try:
        overview = get_analytics_overview()
        return success_response(
            data=overview,
            message="Analytics overview metrics calculated successfully.",
            status_code=200,
        )
    except Exception as e:
        logger.error(f"Error computing analytics overview: {e}")
        return error_response(
            message=f"Failed to generate analytics overview: {str(e)}",
            status_code=500,
            error_code="ANALYTICS_OVERVIEW_ERROR",
        )


@analytics_bp.route("/trends", methods=["GET"])
@roles_required("librarian", "admin")
def get_trends():
    """
    GET /api/analytics/trends
    Provides month-by-month historical borrowing and returns trend series.
    """
    try:
        trends = get_borrowing_trends()
        return success_response(
            data=trends,
            message="Borrowing trends retrieved successfully.",
            status_code=200,
        )
    except Exception as e:
        logger.error(f"Error retrieving borrowing trends: {e}")
        return error_response(
            message=f"Failed to retrieve borrowing trends: {str(e)}",
            status_code=500,
            error_code="TRENDS_ERROR",
        )


@analytics_bp.route("/categories", methods=["GET"])
@roles_required("librarian", "admin")
def get_categories():
    """
    GET /api/analytics/categories
    Returns collection distribution and utilization statistics by academic category.
    """
    try:
        categories = get_category_statistics()
        return success_response(
            data={"categories": categories},
            message=f"Retrieved statistics across {len(categories)} categories.",
            status_code=200,
        )
    except Exception as e:
        logger.error(f"Error calculating category statistics: {e}")
        return error_response(
            message=f"Failed to calculate category statistics: {str(e)}",
            status_code=500,
            error_code="CATEGORY_STATS_ERROR",
        )


@analytics_bp.route("/popular-books", methods=["GET"])
@roles_required("librarian", "admin")
def get_popular():
    """
    GET /api/analytics/popular-books
    Returns top circulating books ranked by borrow counts and inventory turnover.
    Query param: top_k (default 5, max 20)
    """
    try:
        top_k = min(int(request.args.get("top_k", 5)), 20)
        popular = get_popular_books(top_k=top_k)
        return success_response(
            data={"popularBooks": popular},
            message=f"Retrieved top {len(popular)} popular books.",
            status_code=200,
        )
    except Exception as e:
        logger.error(f"Error fetching popular books: {e}")
        return error_response(
            message=f"Failed to fetch popular books: {str(e)}",
            status_code=500,
            error_code="POPULAR_BOOKS_ERROR",
        )


@analytics_bp.route("/low-stock", methods=["GET"])
@roles_required("librarian", "admin")
def get_low_stock():
    """
    GET /api/analytics/low-stock
    Flags titles with zero available copies or high waitlist-to-inventory ratio.
    """
    try:
        alerts = get_low_stock_alerts()
        return success_response(
            data={"alerts": alerts, "totalAlerts": len(alerts)},
            message=f"Found {len(alerts)} stock replenishment alerts.",
            status_code=200,
        )
    except Exception as e:
        logger.error(f"Error fetching low stock alerts: {e}")
        return error_response(
            message=f"Failed to fetch low stock alerts: {str(e)}",
            status_code=500,
            error_code="LOW_STOCK_ERROR",
        )


@analytics_bp.route("/forecast", methods=["GET"])
@roles_required("librarian", "admin")
def get_demand_forecast():
    """
    GET /api/analytics/forecast
    Machine-learning demand forecasting using Pandas and Scikit-learn Ridge Regression.
    Includes model evaluation metrics (MAE, RMSE, R² Score), forecast series,
    and copy procurement recommendations based on waitlist pressure and loan velocity.
    """
    try:
        forecast_data = predict_book_demand_and_procurement()
        return success_response(
            data=forecast_data,
            message="Demand forecast and procurement recommendations computed successfully.",
            status_code=200,
        )
    except Exception as e:
        logger.error(f"Error executing demand forecast model: {e}")
        return error_response(
            message=f"Failed to compute demand forecast: {str(e)}",
            status_code=500,
            error_code="FORECAST_MODEL_ERROR",
        )


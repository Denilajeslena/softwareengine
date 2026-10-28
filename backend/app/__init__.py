import os
import sys

# Ensure both workspace root and backend directory are in sys.path
_app_dir = os.path.abspath(os.path.dirname(__file__))
_backend_dir = os.path.abspath(os.path.join(_app_dir, ".."))
_workspace_dir = os.path.abspath(os.path.join(_backend_dir, ".."))
for _p in (_backend_dir, _workspace_dir):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from flask import Flask
from flask_cors import CORS
from app.config import config_by_name
from app.utils.response import error_response


def create_app(config_name: str = None) -> Flask:
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    config_class = config_by_name.get(config_name, config_by_name["default"])
    app.config.from_object(config_class)

    # Configure CORS
    allowed_origins = app.config.get("CORS_ORIGINS", ["http://localhost:5173", "http://127.0.0.1:5173"])
    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,
    )

    # Register Blueprints
    from app.routes.health import health_bp
    from app.routes.auth import auth_bp
    from app.routes.books import books_bp
    from app.routes.loans import loans_bp
    from app.routes.ai import ai_bp
    from app.routes.analytics import analytics_bp
    from app.routes.notifications import notifications_bp
    from app.routes.reading import reading_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(books_bp, url_prefix="/api/books")
    app.register_blueprint(loans_bp, url_prefix="/api/loans")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(reading_bp, url_prefix="/api")

    # Centralized error handlers
    @app.errorhandler(404)
    def handle_not_found(e):
        return error_response(
            message="The requested endpoint was not found on this server.",
            status_code=404,
            error_code="ENDPOINT_NOT_FOUND",
        )

    @app.errorhandler(405)
    def handle_method_not_allowed(e):
        return error_response(
            message="Method not allowed for the requested endpoint.",
            status_code=405,
            error_code="METHOD_NOT_ALLOWED",
        )

    @app.errorhandler(500)
    def handle_internal_server_error(e):
        return error_response(
            message="Internal server error encountered.",
            status_code=500,
            error_code="INTERNAL_SERVER_ERROR",
        )

    return app

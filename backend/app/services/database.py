import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
    PYMONGO_AVAILABLE = True
except ImportError:
    MongoClient = None
    ConnectionFailure = Exception
    ServerSelectionTimeoutError = Exception
    PYMONGO_AVAILABLE = False

_mongo_client: Optional[Any] = None


def get_mongo_client(uri: str, timeout_ms: int = 2500) -> Optional[Any]:
    global _mongo_client
    if _mongo_client is not None:
        return _mongo_client

    if not PYMONGO_AVAILABLE or not uri:
        return None

    try:
        client = MongoClient(
            uri,
            serverSelectionTimeoutMS=timeout_ms,
            connectTimeoutMS=timeout_ms,
        )
        # Verify connection
        client.admin.command("ping")
        _mongo_client = client
        return _mongo_client
    except (ConnectionFailure, ServerSelectionTimeoutError) as err:
        logger.warning(f"MongoDB connection failed: {err}")
        return None
    except Exception as err:
        logger.error(f"Unexpected MongoDB error: {err}")
        return None


def check_database_status(config: Any) -> Dict[str, Any]:
    """
    Checks whether MongoDB is configured and reachable without crashing the app.
    Reports honest status: 'connected', 'unavailable', 'unconfigured', or 'driver_missing'.
    """
    if not PYMONGO_AVAILABLE:
        return {
            "status": "driver_missing",
            "connected": False,
            "database": getattr(config, "MONGODB_DB_NAME", "scholars_shelf"),
            "message": "PyMongo driver is not installed in the current environment. Run: pip install -r backend/requirements.txt",
        }

    uri = getattr(config, "MONGODB_URI", "")
    db_name = getattr(config, "MONGODB_DB_NAME", "scholars_shelf")
    timeout_ms = getattr(config, "MONGODB_TIMEOUT_MS", 2500)

    if not uri:
        return {
            "status": "unconfigured",
            "connected": False,
            "database": db_name,
            "message": "MONGODB_URI is not set. Running in offline/unconfigured database mode.",
        }

    try:
        client = MongoClient(
            uri,
            serverSelectionTimeoutMS=timeout_ms,
            connectTimeoutMS=timeout_ms,
        )
        # Attempt quick ping command
        client.admin.command("ping")
        db = client[db_name]
        collections = db.list_collection_names()
        return {
            "status": "connected",
            "connected": True,
            "database": db_name,
            "collections_count": len(collections),
            "message": "Connected to MongoDB successfully.",
        }
    except (ConnectionFailure, ServerSelectionTimeoutError) as err:
        return {
            "status": "unavailable",
            "connected": False,
            "database": db_name,
            "message": f"MongoDB server reachable check timed out: {str(err).splitlines()[0] if str(err) else 'Unreachable'}",
        }
    except Exception as err:
        return {
            "status": "error",
            "connected": False,
            "database": db_name,
            "message": f"Database status check error: {str(err)}",
        }

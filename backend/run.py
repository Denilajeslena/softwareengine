import os
import sys

# Ensure both workspace root and backend directory are in sys.path
_current_dir = os.path.abspath(os.path.dirname(__file__))
_parent_dir = os.path.abspath(os.path.join(_current_dir, ".."))
for _p in (_current_dir, _parent_dir):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

from app import create_app

app = create_app(os.getenv("FLASK_ENV", "development"))

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "1").lower() in ("1", "true", "yes")

    print(f"Starting The Scholar's Shelf backend on http://{host}:{port}")
    print(f"Health check available at http://{host}:{port}/api/health")
    app.run(host=host, port=port, debug=debug)


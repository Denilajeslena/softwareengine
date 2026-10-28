"""
Non-destructive MongoDB Initialization Script for The Scholar's Shelf.
Creates required collection indexes and seeds initial accounts without modifying
or overwriting existing records.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

load_dotenv()

from werkzeug.security import generate_password_hash
from app.config import Config
from app.services.database import get_mongo_client, PYMONGO_AVAILABLE


def init_database():
    print("=" * 60)
    print("The Scholar's Shelf — Non-Destructive Database Initializer")
    print("=" * 60)

    if not PYMONGO_AVAILABLE:
        print("[ERROR] pymongo is not installed in the active environment.")
        print("Please run: pip install -r backend/requirements.txt")
        return False

    uri = Config.MONGODB_URI
    db_name = Config.MONGODB_DB_NAME

    if not uri:
        print("[WARNING] MONGODB_URI is not set in environment or .env file.")
        print("Set MONGODB_URI=mongodb://localhost:27017/scholars_shelf to enable database features.")
        return False

    print(f"Connecting to MongoDB database '{db_name}'...")
    client = get_mongo_client(uri, timeout_ms=3000)

    if client is None:
        print(f"[FAIL] Could not connect to MongoDB server at: {uri}")
        print("Ensure your local or remote MongoDB service (mongod) is running.")
        return False

    try:
        db = client[db_name]
        existing_collections = db.list_collection_names()
        print(f"[INFO] Existing collections in '{db_name}': {existing_collections}")

        # Core collections planned for Parts 2-8
        target_collections = ["users", "books", "loans", "reservations", "audit_logs", "system_config"]

        for col_name in target_collections:
            if col_name not in existing_collections:
                db.create_collection(col_name)
                print(f"[CREATED] Collection: {col_name}")
            else:
                print(f"[PRESERVED] Collection already exists: {col_name} (data untouched)")

        # Create unique and compound indexes non-destructively
        print("\nEnsuring non-destructive indexes...")
        db.users.create_index("email", unique=True, sparse=True)
        db.books.create_index("isbn", unique=True, sparse=True)
        db.books.create_index([("title", "text"), ("author", "text"), ("category", "text")])
        db.loans.create_index([("bookId", 1), ("status", 1)])
        db.audit_logs.create_index([("timestamp", -1)])

        # Seed initial default accounts if not present
        initial_users = [
            {
                "id": "USR-ADMIN-001",
                "name": "Sarah Connor",
                "email": "admin@scholars.shelf",
                "password_hash": generate_password_hash("AdminPass123!", method="pbkdf2:sha256"),
                "role": "admin",
                "department": "Library Systems & University Governance",
                "status": "active",
                "created_at": "2026-01-15T08:00:00Z",
            },
            {
                "id": "USR-LIB-001",
                "name": "Dr. Eleanor Vance",
                "email": "librarian@scholars.shelf",
                "password_hash": generate_password_hash("LibrarianPass123!", method="pbkdf2:sha256"),
                "role": "librarian",
                "department": "Collections Management & Cataloguing",
                "status": "active",
                "created_at": "2026-01-20T09:30:00Z",
            },
            {
                "id": "USR-STU-001",
                "name": "Alexandra Vance",
                "email": "student@scholars.shelf",
                "password_hash": generate_password_hash("StudentPass123!", method="pbkdf2:sha256"),
                "role": "student",
                "student_id": "STU-2024-8841",
                "department": "School of Computing & Mathematical Sciences",
                "status": "active",
                "created_at": "2026-02-01T10:15:00Z",
            },
        ]

        print("\nChecking initial user accounts...")
        for u in initial_users:
            if not db.users.find_one({"email": u["email"]}):
                db.users.insert_one(u)
                print(f"[SEEDED] Created account: {u['email']} ({u['role']})")
            else:
                print(f"[PRESERVED] Account already exists: {u['email']}")

        print("[SUCCESS] MongoDB initialization completed non-destructively.")
        return True
    except Exception as e:
        print(f"[ERROR] Database initialization encountered an error: {e}")
        return False


if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)

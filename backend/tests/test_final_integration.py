import unittest
import json
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import create_app
from app.services.user_service import _seed_initial_accounts
from app.services.book_service import _seed_initial_books
from app.services.circulation_service import _seed_circulation
from app.services.notification_service import _seed_initial_notifications
from app.services.reading_service import _seed_initial_reading_data


class TestFinalSystemIntegration(unittest.TestCase):
    """
    Part 8 Complete System Integration Test:
    Validates end-to-end integration across all 8 architectural modules:
    Foundation, Auth & RBAC, Catalogue & QR, Borrowing & Fines, BookMind AI,
    BookPulse ML Analytics, Smart Features & Accessibility.
    """

    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()
        _seed_initial_accounts()
        _seed_initial_books()
        _seed_circulation()
        _seed_initial_notifications()
        _seed_initial_reading_data()

    def test_complete_library_lifecycle_integration(self):
        # 1. Health API diagnostic
        res_health = self.client.get("/api/health")
        self.assertEqual(res_health.status_code, 200)
        health_data = json.loads(res_health.data)["data"]
        self.assertEqual(health_data["status"], "healthy")
        self.assertEqual(health_data["service"], "The Scholar's Shelf API")
        self.assertIn("Part 8", health_data["phase"])

        # 2. Authentication & RBAC Security Verification
        # 2a. Rejection of privileged self-registration
        bad_reg = self.client.post(
            "/api/auth/register",
            data=json.dumps({
                "name": "Malicious Actor",
                "email": "hacker@test.edu",
                "password": "Password123!",
                "role": "admin",
            }),
            content_type="application/json",
        )
        self.assertEqual(bad_reg.status_code, 403)

        # 2b. Legitimate student registration & login
        good_reg = self.client.post(
            "/api/auth/register",
            data=json.dumps({
                "name": "Evelyn Harper",
                "email": "evelyn.harper@scholars.shelf",
                "password": "Password123!",
            }),
            content_type="application/json",
        )
        self.assertEqual(good_reg.status_code, 201)
        student_token = json.loads(good_reg.data)["data"]["token"]

        # 2c. Librarian login
        lib_login = self.client.post(
            "/api/auth/login",
            data=json.dumps({
                "email": "librarian@scholars.shelf",
                "password": "LibrarianPass123!",
            }),
            content_type="application/json",
        )
        self.assertEqual(lib_login.status_code, 200)
        librarian_token = json.loads(lib_login.data)["data"]["token"]

        # 2d. Strict RBAC barrier: student denied access to librarian workstations
        denied_res = self.client.get(
            "/api/analytics/overview",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        self.assertEqual(denied_res.status_code, 403)

        # 3. Catalogue Exploration & QR Generation
        cat_res = self.client.get("/api/books")
        self.assertEqual(cat_res.status_code, 200)
        books = json.loads(cat_res.data)["data"]["books"]
        self.assertGreater(len(books), 0)
        target_book = books[0]

        # Fetch QR code for book
        qr_res = self.client.get(f"/api/books/{target_book['id']}/qr")
        self.assertEqual(qr_res.status_code, 200)
        qr_data = json.loads(qr_res.data)["data"]
        self.assertIn("qrDataUrl", qr_data)

        # 4. Self-Service Circulation (Borrow, Loans, Renew, Return)
        borrow_res = self.client.post(
            "/api/loans/request",
            data=json.dumps({"bookId": target_book["id"]}),
            content_type="application/json",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        self.assertEqual(borrow_res.status_code, 201)
        loan_id = json.loads(borrow_res.data)["data"]["loan"]["id"]

        # Student views active loans
        my_loans_res = self.client.get(
            "/api/loans/my-loans",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        self.assertEqual(my_loans_res.status_code, 200)

        # Renew loan
        renew_res = self.client.post(
            f"/api/loans/{loan_id}/renew",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        self.assertEqual(renew_res.status_code, 200)

        # Return loan via circulation desk
        return_res = self.client.post(
            f"/api/loans/{loan_id}/return",
            headers={"Authorization": f"Bearer {librarian_token}"},
        )
        self.assertEqual(return_res.status_code, 200)

        # 5. BookMind AI Semantic Vector Search
        ai_search = self.client.post(
            "/api/ai/search",
            data=json.dumps({
                "query": "artificial intelligence and machine learning principles",
                "top_k": 3,
            }),
            content_type="application/json",
        )
        self.assertEqual(ai_search.status_code, 200)
        ai_data = json.loads(ai_search.data)["data"]
        self.assertGreater(len(ai_data["results"]), 0)

        # 6. BookPulse Scikit-Learn ML Demand Forecasting
        forecast_res = self.client.get(
            "/api/analytics/forecast",
            headers={"Authorization": f"Bearer {librarian_token}"},
        )
        self.assertEqual(forecast_res.status_code, 200)
        fc_data = json.loads(forecast_res.data)["data"]
        self.assertIn("evaluationMetrics", fc_data)
        self.assertIn("r2Score", fc_data["evaluationMetrics"])
        self.assertIn("procurementRecommendations", fc_data)

        # 7. Notifications, Reading Lists, Badges & AI Study Assistant
        # Notifications
        notif_res = self.client.get(
            "/api/notifications",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        self.assertEqual(notif_res.status_code, 200)

        # Save to reading list
        save_res = self.client.post(
            "/api/student/reading-list",
            data=json.dumps({"bookId": target_book["id"]}),
            content_type="application/json",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        self.assertEqual(save_res.status_code, 201)

        # Reading goals & badges
        goals_res = self.client.get(
            "/api/student/reading-goals",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        self.assertEqual(goals_res.status_code, 200)
        self.assertIn("badges", json.loads(goals_res.data)["data"])

        # Peer review submission
        rev_res = self.client.post(
            f"/api/books/{target_book['id']}/reviews",
            data=json.dumps({
                "rating": 5,
                "reviewText": "Exceptional academic reference volume for university research.",
                "isRecommended": True,
            }),
            content_type="application/json",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        self.assertEqual(rev_res.status_code, 201)

        # AI Study Assistant
        study_res = self.client.post(
            "/api/ai/study-assist",
            data=json.dumps({
                "content": target_book.get("description", "A classic text on computing."),
                "title": target_book.get("title", "Volume"),
                "mode": "all",
            }),
            content_type="application/json",
        )
        self.assertEqual(study_res.status_code, 200)
        study_data = json.loads(study_res.data)["data"]
        self.assertIn("executiveSummary", study_data)
        self.assertIn("quiz", study_data)
        self.assertIn("flashcards", study_data)


if __name__ == "__main__":
    unittest.main()

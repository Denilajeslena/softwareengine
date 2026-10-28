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


class TestPart7SmartAccessibility(unittest.TestCase):
    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()
        _seed_initial_accounts()
        _seed_initial_books()
        _seed_circulation()
        _seed_initial_notifications()
        _seed_initial_reading_data()

        # Login student
        res_student = self.client.post(
            "/api/auth/login",
            data=json.dumps({"email": "student@scholars.shelf", "password": "StudentPass123!"}),
            content_type="application/json",
        )
        self.student_token = json.loads(res_student.data)["data"]["token"]

    def test_notification_centre_flow(self):
        """Notification center returns alerts, marks read, and allows dismissal."""
        res = self.client.get(
            "/api/notifications",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)["data"]
        self.assertIn("notifications", data)
        self.assertGreater(len(data["notifications"]), 0)

        first_id = data["notifications"][0]["id"]

        # Mark single as read
        patch_res = self.client.patch(
            f"/api/notifications/{first_id}/read",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(patch_res.status_code, 200)

        # Mark all read
        mark_all_res = self.client.post(
            "/api/notifications/mark-all-read",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(mark_all_res.status_code, 200)

        # Dismiss notification
        del_res = self.client.delete(
            f"/api/notifications/{first_id}",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(del_res.status_code, 200)

    def test_reading_list_and_favourites(self):
        """Student can add, inspect, and remove volumes from their personal reading list."""
        # 1. Fetch reading list
        res = self.client.get(
            "/api/student/reading-list",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(res.status_code, 200)

        # 2. Add b-003 to list
        add_res = self.client.post(
            "/api/student/reading-list",
            data=json.dumps({"bookId": "b-003"}),
            content_type="application/json",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(add_res.status_code, 201)

        # 3. Check if saved
        check_res = self.client.get(
            "/api/student/reading-list/check/b-003",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(check_res.status_code, 200)
        self.assertTrue(json.loads(check_res.data)["data"]["isSaved"])

        # 4. Remove from list
        del_res = self.client.delete(
            "/api/student/reading-list/b-003",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(del_res.status_code, 200)

    def test_reading_goals_and_badges(self):
        """Reading goals return semester target, progress %, and dynamically calculated badges."""
        res = self.client.get(
            "/api/student/reading-goals",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)["data"]
        self.assertIn("goal", data)
        self.assertIn("badges", data)
        self.assertGreater(len(data["badges"]), 0)

        # Update goal
        update_res = self.client.post(
            "/api/student/reading-goals",
            data=json.dumps({"targetBooks": 15}),
            content_type="application/json",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(update_res.status_code, 200)
        updated_data = json.loads(update_res.data)["data"]
        self.assertEqual(updated_data["goal"]["targetBooks"], 15)

    def test_book_reviews_and_ratings(self):
        """Students can view reviews and submit ratings with validation."""
        # View reviews
        res = self.client.get("/api/books/b-001/reviews")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)["data"]
        self.assertIn("averageRating", data)
        self.assertIn("reviews", data)

        # Submit review
        post_res = self.client.post(
            "/api/books/b-001/reviews",
            data=json.dumps({
                "rating": 5,
                "reviewText": "Superb foundational volume for algorithmic computational analysis.",
                "isRecommended": True,
            }),
            content_type="application/json",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(post_res.status_code, 201)

        # Invalid rating rejected
        invalid_res = self.client.post(
            "/api/books/b-001/reviews",
            data=json.dumps({"rating": 10, "reviewText": "Invalid rating test"}),
            content_type="application/json",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(invalid_res.status_code, 400)

    def test_ai_study_assistant(self):
        """AI study assistant generates summaries, concepts, quizzes, and flashcards."""
        sample_notes = (
            "Operating systems manage hardware resources through abstraction layers. "
            "The kernel schedules processes using preemptive round-robin or priority algorithms, "
            "and manages virtual memory via paging and page replacement policies."
        )

        res = self.client.post(
            "/api/ai/study-assist",
            data=json.dumps({
                "content": sample_notes,
                "title": "Operating Systems Memory & Schedulers",
                "mode": "all",
            }),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)["data"]
        self.assertIn("executiveSummary", data)
        self.assertIn("concepts", data)
        self.assertIn("quiz", data)
        self.assertIn("flashcards", data)
        self.assertGreater(len(data["quiz"]), 0)
        self.assertGreater(len(data["flashcards"]), 0)

        # Missing content error
        empty_res = self.client.post(
            "/api/ai/study-assist",
            data=json.dumps({"content": ""}),
            content_type="application/json",
        )
        self.assertEqual(empty_res.status_code, 400)


if __name__ == "__main__":
    unittest.main()

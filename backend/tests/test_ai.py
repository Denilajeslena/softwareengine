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


class TestBookMindAI(unittest.TestCase):
    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()
        _seed_initial_accounts()
        _seed_initial_books()
        _seed_circulation()

        # Login student
        res_student = self.client.post(
            "/api/auth/login",
            data=json.dumps({"email": "student@scholars.shelf", "password": "StudentPass123!"}),
            content_type="application/json",
        )
        self.student_token = json.loads(res_student.data)["data"]["token"]

    def test_semantic_search_natural_language(self):
        """Natural language search for machine learning returns relevant AI/ML volumes with explanations."""
        res = self.client.post(
            "/api/ai/search",
            data=json.dumps({"query": "Suggest beginner-friendly machine learning and neural networks books", "top_k": 4}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        results = data["data"]["results"]
        self.assertGreater(len(results), 0)

        # Check top result has explanation and relevance score
        top = results[0]
        self.assertIn("relevanceScore", top)
        self.assertIn("matchExplanation", top)
        self.assertGreater(top["relevanceScore"], 0.0)

    def test_semantic_search_available_only(self):
        """Available-only filter strictly excludes books with 0 available copies."""
        res = self.client.post(
            "/api/ai/search",
            data=json.dumps({"query": "algorithms and data structures", "available_only": True}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        for b in data["data"]["results"]:
            self.assertGreater(b["availableCopies"], 0)

    def test_similar_books_recommendations(self):
        """Retrieves semantically similar volumes with common subject explanation."""
        res = self.client.get("/api/ai/similar/b-001")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        sims = data["data"]["similarBooks"]
        self.assertGreater(len(sims), 0)
        self.assertIn("recommendationReason", sims[0])
        # Should not recommend the book itself
        self.assertTrue(all(b["id"] != "b-001" for b in sims))

    def test_suggest_available_alternatives(self):
        """Recommends in-stock alternatives with physical shelf location."""
        # b-002 has copies borrowed
        res = self.client.get("/api/ai/alternatives/b-002")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        alts = data["data"]["alternatives"]
        self.assertGreater(len(alts), 0)
        for alt in alts:
            self.assertGreater(alt["availableCopies"], 0)
            self.assertIn("substituteReason", alt)

    def test_personalized_recommendations(self):
        """Authenticated student receives personalized recommendations based on loans."""
        res = self.client.get(
            "/api/ai/personalized",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        recs = data["data"]["recommendations"]
        self.assertGreater(len(recs), 0)
        self.assertIn("affinityReason", recs[0])


if __name__ == "__main__":
    unittest.main()

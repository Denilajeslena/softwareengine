import unittest
import json
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import create_app


class HealthTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()

    def test_health_endpoint(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIn("data", data)
        self.assertEqual(data["data"]["service"], "The Scholar's Shelf API")
        self.assertEqual(data["data"]["status"], "healthy")
        self.assertIn("database", data["data"])
        self.assertIn("features", data["data"])
        self.assertEqual(data["data"]["features"]["auth"], "Implemented in Part 2 (JWT & RBAC)")

    def test_404_handler(self):
        response = self.client.get("/api/nonexistent-endpoint")
        self.assertEqual(response.status_code, 404)

        data = response.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "ENDPOINT_NOT_FOUND")


if __name__ == "__main__":
    unittest.main()

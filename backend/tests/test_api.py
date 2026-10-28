import unittest
import json
import sys
from pathlib import Path

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import create_app


class HealthEndpointTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()

    def test_health_check_success(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["service"], "The Scholar's Shelf API")
        self.assertEqual(data["data"]["status"], "healthy")
        self.assertIn("database", data["data"])
        self.assertIn("features", data["data"])

    def test_404_not_found(self):
        response = self.client.get("/api/nonexistent-route")
        self.assertEqual(response.status_code, 404)

        data = json.loads(response.data)
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "ENDPOINT_NOT_FOUND")


if __name__ == "__main__":
    unittest.main()


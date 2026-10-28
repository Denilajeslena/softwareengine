import unittest
import json
from backend.app import create_app
from backend.app.services.user_service import _seed_initial_accounts
from backend.app.services.book_service import _seed_initial_books
from backend.app.services.circulation_service import _seed_circulation


class TestScholarShelfUpgrades(unittest.TestCase):
    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()
        _seed_initial_accounts()
        _seed_initial_books()
        _seed_circulation()

        # Admin login
        res_admin = self.client.post(
            "/api/auth/login",
            data=json.dumps({"email": "admin@scholars.shelf", "password": "AdminPass123!"}),
            content_type="application/json",
        )
        self.admin_token = json.loads(res_admin.data)["data"]["token"]

        # Librarian login
        res_librarian = self.client.post(
            "/api/auth/login",
            data=json.dumps({"email": "librarian@scholars.shelf", "password": "LibrarianPass123!"}),
            content_type="application/json",
        )
        self.librarian_token = json.loads(res_librarian.data)["data"]["token"]

        # Student login
        res_student = self.client.post(
            "/api/auth/login",
            data=json.dumps({"email": "student@scholars.shelf", "password": "StudentPass123!"}),
            content_type="application/json",
        )
        self.student_token = json.loads(res_student.data)["data"]["token"]

    def test_circulation_policy_get_and_update(self):
        """Admin can retrieve and update circulation rules."""
        # 1. GET policy
        res = self.client.get(
            "/api/admin/policy",
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIn("loan_duration_days", data["data"]["policy"])

        # 2. PUT policy with updated duration
        update_payload = {
            "loan_duration_days": 21,
            "max_active_loans": 6,
            "renewal_limit": 3,
            "renewal_duration_days": 14,
            "overdue_fine_per_day": 0.75,
            "reservation_hold_days": 5,
            "pickup_window_hours": 72,
            "max_reservations_per_student": 3,
        }
        put_res = self.client.put(
            "/api/admin/policy",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            data=json.dumps(update_payload),
            content_type="application/json",
        )
        self.assertEqual(put_res.status_code, 200)
        put_data = json.loads(put_res.data)
        self.assertEqual(put_data["data"]["policy"]["loan_duration_days"], 21)
        self.assertEqual(put_data["data"]["policy"]["overdue_fine_per_day"], 0.75)

    def test_audit_logs_and_csv_export(self):
        """Admin can view audit log events and download CSV export."""
        res = self.client.get(
            "/api/admin/audit-logs",
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIn("logs", data["data"])

        # CSV format
        csv_res = self.client.get(
            "/api/admin/audit-logs?format=csv",
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )
        self.assertEqual(csv_res.status_code, 200)
        self.assertIn("text/csv", csv_res.headers.get("Content-Type", ""))
        self.assertIn("Event ID,Timestamp,Actor", csv_res.data.decode("utf-8"))

    def test_role_permissions_management(self):
        """Admin can retrieve role permissions matrix."""
        res = self.client.get(
            "/api/admin/roles",
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIn("roles", data["data"])
        role_names = [r["role"] for r in data["data"]["roles"]]
        self.assertIn("student", role_names)
        self.assertIn("librarian", role_names)
        self.assertIn("admin", role_names)

    def test_user_provisioning_and_governance(self):
        """Admin can provision a new account and cannot delete the last active admin."""
        # 1. Provision new librarian
        payload = {
            "name": "Prof. Marcus Thorne",
            "email": "marcus.thorne@scholars.shelf",
            "password": "ThornePass123!",
            "role": "librarian",
            "department": "Rare Books & Manuscripts",
        }
        res = self.client.post(
            "/api/auth/admin/users",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        created_id = data["data"]["user"]["id"]

        # 2. Toggle status
        toggle_res = self.client.patch(
            f"/api/auth/admin/users/{created_id}/status",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            data=json.dumps({"isActive": False}),
            content_type="application/json",
        )
        self.assertEqual(toggle_res.status_code, 200)
        self.assertFalse(json.loads(toggle_res.data)["data"]["isActive"])

        # 3. Last admin protection: Attempt to delete sole admin
        del_admin_res = self.client.delete(
            "/api/auth/admin/users/USR-ADMIN-001",
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )
        self.assertEqual(del_admin_res.status_code, 400)
        self.assertIn("Governance Safeguard", json.loads(del_admin_res.data)["message"])

    def test_inventory_overview_and_reconciliation(self):
        """Librarian can view inventory stacks and execute reconciliation audits."""
        # 1. Overview
        res = self.client.get(
            "/api/inventory/overview",
            headers={"Authorization": f"Bearer {self.librarian_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIn("stacks", data["data"])
        self.assertIn("totalCapacity", data["data"])

        # 2. Audit submission with known and unknown barcodes
        audit_payload = {
            "stackId": "stack-3",
            "scannedBarcodes": [
                "SCHOLARS-COPY-b-001-01",
                "SCHOLARS-COPY-UNKNOWN-99",
            ],
            "notes": "Weekly shelf scan",
        }
        audit_res = self.client.post(
            "/api/inventory/audits",
            headers={"Authorization": f"Bearer {self.librarian_token}"},
            data=json.dumps(audit_payload),
            content_type="application/json",
        )
        self.assertEqual(audit_res.status_code, 201)
        audit_data = json.loads(audit_res.data)
        self.assertEqual(audit_data["data"]["auditReport"]["totalScanned"], 2)
        self.assertGreaterEqual(audit_data["data"]["auditReport"]["totalExpected"], 0)

    def test_librarian_student_directory(self):
        """Librarian can view student directory with live circulation stats."""
        res = self.client.get(
            "/api/librarian/students",
            headers={"Authorization": f"Bearer {self.librarian_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIsInstance(data["data"]["students"], list)
        self.assertGreaterEqual(len(data["data"]["students"]), 1)
        student_0 = data["data"]["students"][0]
        self.assertIn("activeLoans", student_0)
        self.assertIn("totalFines", student_0)

    def test_student_preferences_persistence(self):
        """Student can view and update notification and display preferences."""
        # 1. GET preferences
        res = self.client.get(
            "/api/student/preferences",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])

        # 2. PUT preferences
        new_prefs = {
            "emailDueReminders": False,
            "holdArrivalAlerts": True,
            "acquisitionsDigest": True,
            "fontSize": "large",
            "theme": "warm-gold",
        }
        put_res = self.client.put(
            "/api/student/preferences",
            headers={"Authorization": f"Bearer {self.student_token}"},
            data=json.dumps(new_prefs),
            content_type="application/json",
        )
        self.assertEqual(put_res.status_code, 200)
        put_data = json.loads(put_res.data)
        self.assertFalse(put_data["data"]["preferences"]["emailDueReminders"])
        self.assertEqual(put_data["data"]["preferences"]["fontSize"], "large")

    def test_student_digital_card_and_qr_verification(self):
        """Student receives verifiable QR digital card and librarian can verify card token."""
        # 1. Fetch digital card
        card_res = self.client.get(
            "/api/student/card",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(card_res.status_code, 200)
        card_data = json.loads(card_res.data)
        self.assertTrue(card_data["success"])
        self.assertIn("verifiableToken", card_data["data"])
        self.assertIn("qrBase64", card_data["data"])
        self.assertTrue(card_data["data"]["qrBase64"].startswith("data:image/png;base64,"))

        token = card_data["data"]["verifiableToken"]

        # 2. Librarian scans/verifies student digital card token
        verify_res = self.client.post(
            "/api/student/verify-card",
            headers={"Authorization": f"Bearer {self.librarian_token}"},
            data=json.dumps({"token": token}),
            content_type="application/json",
        )
        self.assertEqual(verify_res.status_code, 200)
        verify_data = json.loads(verify_res.data)
        self.assertTrue(verify_data["success"])
        self.assertTrue(verify_data["data"]["valid"])
        self.assertEqual(verify_data["data"]["name"], "Alexandra Vance")

    def test_ai_study_assistant_engine_transparency(self):
        """AI Study Assistant returns truthful engine metadata and handles study requests."""
        res = self.client.post(
            "/api/ai/study-assist",
            data=json.dumps({
                "content": "Asymptotic time complexity describes the limiting behavior of execution time as input size grows to infinity.",
                "mode": "all",
            }),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIn("executiveSummary", data["data"])
        self.assertIn("concepts", data["data"])
        self.assertIn("model", data["data"])
        self.assertIn("provider", data["data"])
        self.assertTrue(data["data"]["providerConfigured"])


if __name__ == "__main__":
    unittest.main()

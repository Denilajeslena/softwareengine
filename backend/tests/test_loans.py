import unittest
import json
from datetime import datetime, timedelta, timezone
from backend.app import create_app
from backend.app.services.user_service import _seed_initial_accounts
from backend.app.services.book_service import _seed_initial_books, get_book_by_id
from backend.app.services.circulation_service import _seed_circulation, _in_memory_loans, DAILY_FINE_RATE


class TestCirculationAndLoans(unittest.TestCase):
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

        # Login librarian
        res_librarian = self.client.post(
            "/api/auth/login",
            data=json.dumps({"email": "librarian@scholars.shelf", "password": "LibrarianPass123!"}),
            content_type="application/json",
        )
        self.librarian_token = json.loads(res_librarian.data)["data"]["token"]

    def test_get_my_loans(self):
        """Student can view their active loans, history, and fine calculations."""
        res = self.client.get(
            "/api/loans/my-loans",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIn("activeLoans", data["data"])
        self.assertIn("totalFines", data["data"])
        self.assertGreaterEqual(len(data["data"]["activeLoans"]), 1)

    def test_request_loan_decrements_inventory(self):
        """Borrowing a book decrements available stock and creates an active loan."""
        book_before = get_book_by_id("b-004")
        avail_before = book_before["availableCopies"]
        self.assertGreater(avail_before, 0)

        res = self.client.post(
            "/api/loans/request",
            headers={"Authorization": f"Bearer {self.student_token}"},
            data=json.dumps({"bookId": "b-004"}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["loan"]["bookId"], "b-004")
        self.assertEqual(data["data"]["loan"]["status"], "active")

        # Verify stock decremented
        book_after = get_book_by_id("b-004")
        self.assertEqual(book_after["availableCopies"], avail_before - 1)

    def test_prevent_duplicate_active_loans(self):
        """Student cannot borrow the same book twice concurrently."""
        # Book b-001 is already actively checked out in seed loans for this student
        res = self.client.post(
            "/api/loans/request",
            headers={"Authorization": f"Bearer {self.student_token}"},
            data=json.dumps({"bookId": "b-001"}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 400)
        data = json.loads(res.data)
        self.assertFalse(data["success"])
        self.assertIn("Duplicate concurrent loans", data["message"])

    def test_renew_loan_extends_due_date(self):
        """Student can renew an active loan, extending due date by 14 days."""
        # Find active loan
        res_loans = self.client.get(
            "/api/loans/my-loans",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        loans = json.loads(res_loans.data)["data"]["activeLoans"]
        active_loan = next(l for l in loans if l["id"] == "loan-001")
        old_due = active_loan["dueDate"]

        res_renew = self.client.post(
            f"/api/loans/{active_loan['id']}/renew",
            headers={"Authorization": f"Bearer {self.student_token}"},
            content_type="application/json",
        )
        self.assertEqual(res_renew.status_code, 200)
        data = json.loads(res_renew.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["loan"]["renewalsCount"], 1)
        self.assertGreater(data["data"]["loan"]["dueDate"], old_due)

    def test_librarian_return_restocks_inventory_and_computes_fines(self):
        """Librarian returning an overdue loan assesses overdue fine and restocks copy."""
        # loan-002 is overdue in seed loans
        res = self.client.post(
            "/api/loans/loan-002/return",
            headers={"Authorization": f"Bearer {self.librarian_token}"},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["loan"]["status"], "returned")
        self.assertGreater(data["data"]["loan"]["fineAmount"], 0.0)

    def test_student_forbidden_from_librarian_endpoints(self):
        """Students cannot issue books to others or access librarian loans desk."""
        res = self.client.post(
            "/api/loans/issue",
            headers={"Authorization": f"Bearer {self.student_token}"},
            data=json.dumps({"studentIdentifier": "someone@scholars.shelf", "bookId": "b-001"}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 403)

    def test_place_and_cancel_reservation(self):
        """Students can place holds and cancel reservations."""
        res_place = self.client.post(
            "/api/loans/reservations",
            headers={"Authorization": f"Bearer {self.student_token}"},
            data=json.dumps({"bookId": "b-006"}),
            content_type="application/json",
        )
        self.assertEqual(res_place.status_code, 201)
        res_data = json.loads(res_place.data)["data"]["reservation"]
        res_id = res_data["id"]

        # Cancel reservation
        res_cancel = self.client.delete(
            f"/api/loans/reservations/{res_id}",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(res_cancel.status_code, 200)
        self.assertTrue(json.loads(res_cancel.data)["success"])


if __name__ == "__main__":
    unittest.main()

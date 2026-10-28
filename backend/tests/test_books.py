import unittest
import json
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import create_app


class BooksCatalogueTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()

        # Seeded tokens
        lib_login = self.client.post("/api/auth/login", json={
            "email": "librarian@scholars.shelf",
            "password": "LibrarianPass123!",
        })
        self.librarian_token = lib_login.get_json()["data"]["token"]

        stu_login = self.client.post("/api/auth/login", json={
            "email": "student@scholars.shelf",
            "password": "StudentPass123!",
        })
        self.student_token = stu_login.get_json()["data"]["token"]

    def test_list_books_and_filters(self):
        # 1. Default list
        res = self.client.get("/api/books")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(data["data"]["count"], 12)

        # 2. Search filter
        search_res = self.client.get("/api/books?search=Algorithms")
        self.assertEqual(search_res.status_code, 200)
        books = search_res.get_json()["data"]["books"]
        self.assertTrue(any("Algorithms" in b["title"] for b in books))

        # 3. Category filter
        cat_res = self.client.get("/api/books?category=Mathematics")
        self.assertEqual(cat_res.status_code, 200)
        books = cat_res.get_json()["data"]["books"]
        self.assertTrue(all(b["category"] == "Mathematics" for b in books))

        # 4. Available only filter
        avail_res = self.client.get("/api/books?available=true")
        self.assertEqual(avail_res.status_code, 200)
        books = avail_res.get_json()["data"]["books"]
        self.assertTrue(all(b["availableCopies"] > 0 for b in books))

    def test_get_single_book(self):
        res = self.client.get("/api/books/b-001")
        self.assertEqual(res.status_code, 200)
        book = res.get_json()["data"]["book"]
        self.assertEqual(book["id"], "b-001")
        self.assertEqual(book["title"], "The C Programming Language")
        self.assertIn("copies", book)
        self.assertEqual(len(book["copies"]), book["totalCopies"])

    def test_create_book_by_librarian_and_rejection_for_student(self):
        payload = {
            "title": "Quantum Computation and Quantum Information",
            "author": "Michael A. Nielsen & Isaac L. Chuang",
            "isbn": "978-1107002173",
            "publisher": "Cambridge University Press",
            "year": 2010,
            "category": "Science",
            "shelfLocation": "Stack 1, Shelf Q-01",
            "totalCopies": 5,
            "availableCopies": 5,
            "description": "Comprehensive textbook on quantum computing, quantum circuits, and quantum algorithms.",
        }

        # 1. Student attempt should be rejected with 403 Forbidden
        stu_res = self.client.post(
            "/api/auth/register",  # Ensure student can't create
            headers={"Authorization": f"Bearer {self.student_token}"},
            json=payload,
        )
        stu_book_res = self.client.post(
            "/api/books",
            headers={"Authorization": f"Bearer {self.student_token}"},
            json=payload,
        )
        self.assertEqual(stu_book_res.status_code, 403)

        # 2. Librarian creation succeeds
        lib_res = self.client.post(
            "/api/books",
            headers={"Authorization": f"Bearer {self.librarian_token}"},
            json=payload,
        )
        self.assertEqual(lib_res.status_code, 201)
        created = lib_res.get_json()["data"]["book"]
        self.assertEqual(created["title"], payload["title"])
        self.assertEqual(created["totalCopies"], 5)
        self.assertEqual(len(created["copies"]), 5)

        # 3. Duplicate ISBN should be rejected with 409
        dup_res = self.client.post(
            "/api/books",
            headers={"Authorization": f"Bearer {self.librarian_token}"},
            json=payload,
        )
        self.assertEqual(dup_res.status_code, 409)

    def test_update_and_archive_book(self):
        # 1. Update book title and location
        update_res = self.client.put(
            "/api/books/b-005",
            headers={"Authorization": f"Bearer {self.librarian_token}"},
            json={"shelfLocation": "Stack 2, Shelf D-05 (Relocated)"},
        )
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.get_json()["data"]["book"]["shelfLocation"], "Stack 2, Shelf D-05 (Relocated)")

        # 2. Archive book
        del_res = self.client.delete(
            "/api/books/b-005",
            headers={"Authorization": f"Bearer {self.librarian_token}"},
        )
        self.assertEqual(del_res.status_code, 200)
        self.assertEqual(del_res.get_json()["data"]["book"]["status"], "archived")

        # Public list without include_archived does not return archived book
        list_res = self.client.get("/api/books")
        ids = [b["id"] for b in list_res.get_json()["data"]["books"]]
        self.assertNotIn("b-005", ids)

    def test_add_and_remove_individual_copies(self):
        # 1. Add copy to b-002
        add_res = self.client.post(
            "/api/books/b-002/copies",
            headers={"Authorization": f"Bearer {self.librarian_token}"},
            json={"copyId": "CPY-b-002-99", "shelfLocation": "Stack 3, Shelf A-04"},
        )
        self.assertEqual(add_res.status_code, 201)
        copy_data = add_res.get_json()["data"]["copy"]
        self.assertEqual(copy_data["copyId"], "CPY-b-002-99")

        # 2. Duplicate copyId rejected
        dup_copy = self.client.post(
            "/api/books/b-002/copies",
            headers={"Authorization": f"Bearer {self.librarian_token}"},
            json={"copyId": "CPY-b-002-99"},
        )
        self.assertEqual(dup_copy.status_code, 400)

        # 3. Remove copy
        rem_res = self.client.delete(
            "/api/books/b-002/copies/CPY-b-002-99",
            headers={"Authorization": f"Bearer {self.librarian_token}"},
        )
        self.assertEqual(rem_res.status_code, 200)

    def test_qr_generation_and_barcode_scanner(self):
        # 1. Generate book QR
        qr_res = self.client.get("/api/books/b-001/qr")
        self.assertEqual(qr_res.status_code, 200)
        data = qr_res.get_json()["data"]
        self.assertIn("qrDataUrl", data)
        self.assertTrue(data["qrDataUrl"].startswith("data:image/png;base64,"))

        # 2. Generate copy QR
        copy_qr = self.client.get("/api/books/copies/CPY-b-001-01/qr")
        self.assertEqual(copy_qr.status_code, 200)
        self.assertIn("qrDataUrl", copy_qr.get_json()["data"])

        # 3. Scan & identify book by barcode
        scan_res = self.client.post("/api/books/scan", json={"code": "SCHOLARS-COPY-b-001-01"})
        self.assertEqual(scan_res.status_code, 200)
        scan_data = scan_res.get_json()["data"]
        self.assertEqual(scan_data["book"]["id"], "b-001")
        self.assertEqual(scan_data["matchedCopy"]["copyId"], "CPY-b-001-01")


if __name__ == "__main__":
    unittest.main()


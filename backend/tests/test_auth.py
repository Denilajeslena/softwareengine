import unittest
import json
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import create_app


class AuthenticationTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()

    def test_student_registration_success(self):
        payload = {
            "name": "Jane Doe",
            "email": "jane.doe@student.university.edu",
            "password": "SecurePassword123!",
            "department": "School of Computer Science",
        }
        res = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res.status_code, 201)

        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("token", data["data"])
        self.assertEqual(data["data"]["user"]["role"], "student")
        self.assertEqual(data["data"]["user"]["email"], "jane.doe@student.university.edu")
        self.assertNotIn("password_hash", data["data"]["user"])

    def test_registration_validation_errors(self):
        # Name too short
        res = self.client.post("/api/auth/register", json={
            "name": "A",
            "email": "test@test.edu",
            "password": "password123",
        })
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.get_json()["error"]["code"], "VALIDATION_NAME_INVALID")

        # Invalid email
        res = self.client.post("/api/auth/register", json={
            "name": "Test User",
            "email": "not-an-email",
            "password": "password123",
        })
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.get_json()["error"]["code"], "VALIDATION_EMAIL_INVALID")

        # Password too short
        res = self.client.post("/api/auth/register", json={
            "name": "Test User",
            "email": "valid@test.edu",
            "password": "123",
        })
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.get_json()["error"]["code"], "VALIDATION_PASSWORD_TOO_SHORT")

    def test_registration_rejects_admin_creation(self):
        """Rule 7: Public registration must never allow users to create admin or librarian accounts."""
        payload = {
            "name": "Malicious Actor",
            "email": "hacker@test.edu",
            "password": "Password123!",
            "role": "admin",
        }
        res = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res.status_code, 403)
        self.assertEqual(res.get_json()["error"]["code"], "PRIVILEGED_ROLE_FORBIDDEN")

    def test_duplicate_email_registration(self):
        payload = {
            "name": "First Register",
            "email": "unique@student.edu",
            "password": "Password123!",
        }
        res1 = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res1.status_code, 201)

        # Attempt same email again
        res2 = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res2.status_code, 409)
        self.assertEqual(res2.get_json()["error"]["code"], "EMAIL_ALREADY_EXISTS")

    def test_login_success_and_failure(self):
        # 1. Login with seeded student account
        login_res = self.client.post("/api/auth/login", json={
            "email": "student@scholars.shelf",
            "password": "StudentPass123!",
        })
        self.assertEqual(login_res.status_code, 200)
        data = login_res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("token", data["data"])
        self.assertEqual(data["data"]["user"]["role"], "student")

        # 2. Login with invalid password
        bad_pass = self.client.post("/api/auth/login", json={
            "email": "student@scholars.shelf",
            "password": "WrongPassword!",
        })
        self.assertEqual(bad_pass.status_code, 401)
        self.assertEqual(bad_pass.get_json()["error"]["code"], "INVALID_CREDENTIALS")

        # 3. Login with nonexistent email
        bad_email = self.client.post("/api/auth/login", json={
            "email": "nobody@scholars.shelf",
            "password": "SomePassword123!",
        })
        self.assertEqual(bad_email.status_code, 401)

    def test_token_auth_and_me_endpoint(self):
        # Login
        login_res = self.client.post("/api/auth/login", json={
            "email": "student@scholars.shelf",
            "password": "StudentPass123!",
        })
        token = login_res.get_json()["data"]["token"]

        # Call /api/auth/me with Bearer token
        me_res = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.get_json()["data"]["user"]["email"], "student@scholars.shelf")

        # Call /api/auth/me without token -> 401
        unauth_res = self.client.get("/api/auth/me")
        self.assertEqual(unauth_res.status_code, 401)

    def test_role_enforcement_student_forbidden_from_admin(self):
        """Rule 6 & 7: Students must not access librarian/admin features."""
        # 1. Get student token
        stu_login = self.client.post("/api/auth/login", json={
            "email": "student@scholars.shelf",
            "password": "StudentPass123!",
        })
        stu_token = stu_login.get_json()["data"]["token"]

        # Student attempts to access admin endpoint -> 403 Forbidden
        admin_attempt = self.client.get(
            "/api/auth/admin/users",
            headers={"Authorization": f"Bearer {stu_token}"},
        )
        self.assertEqual(admin_attempt.status_code, 403)
        self.assertEqual(admin_attempt.get_json()["error"]["code"], "INSUFFICIENT_PERMISSIONS")

        # Student attempts to access librarian endpoint -> 403 Forbidden
        lib_attempt = self.client.get(
            "/api/auth/librarian/verify",
            headers={"Authorization": f"Bearer {stu_token}"},
        )
        self.assertEqual(lib_attempt.status_code, 403)
        self.assertEqual(lib_attempt.get_json()["error"]["code"], "INSUFFICIENT_PERMISSIONS")

    def test_librarian_and_admin_role_access(self):
        # 1. Librarian accesses librarian verification
        lib_login = self.client.post("/api/auth/login", json={
            "email": "librarian@scholars.shelf",
            "password": "LibrarianPass123!",
        })
        lib_token = lib_login.get_json()["data"]["token"]
        lib_access = self.client.get(
            "/api/auth/librarian/verify",
            headers={"Authorization": f"Bearer {lib_token}"},
        )
        self.assertEqual(lib_access.status_code, 200)

        # 2. Admin accesses admin user list
        admin_login = self.client.post("/api/auth/login", json={
            "email": "admin@scholars.shelf",
            "password": "AdminPass123!",
        })
        admin_token = admin_login.get_json()["data"]["token"]
        admin_access = self.client.get(
            "/api/auth/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(admin_access.status_code, 200)
        self.assertIn("users", admin_access.get_json()["data"])


if __name__ == "__main__":
    unittest.main()


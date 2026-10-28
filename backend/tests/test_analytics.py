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
from app.services.analytics_service import (
    get_analytics_overview,
    get_category_statistics,
    get_borrowing_trends,
    get_popular_books,
    get_low_stock_alerts,
    predict_book_demand_and_procurement,
)


class TestBookPulseAnalytics(unittest.TestCase):
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

    def test_overview_kpis_calculation(self):
        """Overview computes live real-time KPIs accurately."""
        overview = get_analytics_overview()
        self.assertIn("totalBooks", overview)
        self.assertIn("totalCopies", overview)
        self.assertIn("availableCopies", overview)
        self.assertIn("activeLoans", overview)
        self.assertIn("overdueLoans", overview)
        self.assertIn("totalReservations", overview)
        self.assertIn("utilizationRate", overview)
        self.assertGreater(overview["totalBooks"], 0)
        self.assertGreaterEqual(overview["totalCopies"], overview["availableCopies"])
        self.assertEqual(overview["dataSource"], "live_database")

    def test_category_statistics(self):
        """Category statistics return collection volumes, loan counts, and utilization rates."""
        cat_stats = get_category_statistics()
        self.assertIsInstance(cat_stats, list)
        self.assertGreater(len(cat_stats), 0)
        for cat in cat_stats:
            self.assertIn("category", cat)
            self.assertIn("count", cat)
            self.assertIn("totalCopies", cat)
            self.assertIn("availableCopies", cat)
            self.assertIn("utilizationRate", cat)
            self.assertIn("fill", cat)

    def test_borrowing_trends(self):
        """Borrowing trends contain monthly historical loan and return counts."""
        trends = get_borrowing_trends()
        self.assertIn("trends", trends)
        self.assertGreater(len(trends["trends"]), 0)
        first_month = trends["trends"][0]
        self.assertIn("month", first_month)
        self.assertIn("loans", first_month)
        self.assertIn("returns", first_month)

    def test_popular_books_and_low_stock(self):
        """Popular books return top items and low stock flags low availability titles."""
        popular = get_popular_books(top_k=3)
        self.assertLessEqual(len(popular), 3)
        if len(popular) > 0:
            self.assertIn("title", popular[0])
            self.assertIn("turnoverRate", popular[0])

        low_stock = get_low_stock_alerts()
        self.assertIsInstance(low_stock, list)

    def test_ml_demand_prediction_and_evaluation_metrics(self):
        """Pandas & Scikit-learn Ridge model produces demand projection, MAE/RMSE/R² metrics, and procurement recommendations."""
        forecast_result = predict_book_demand_and_procurement()
        self.assertIn("modelName", forecast_result)
        self.assertTrue(forecast_result["dataSufficient"])
        
        metrics = forecast_result["evaluationMetrics"]
        self.assertIn("mae", metrics)
        self.assertIn("rmse", metrics)
        self.assertIn("r2Score", metrics)
        self.assertIn("confidenceScore", metrics)
        self.assertGreaterEqual(metrics["mae"], 0.0)
        self.assertGreaterEqual(metrics["rmse"], 0.0)
        self.assertGreaterEqual(metrics["r2Score"], 0.0)

        series = forecast_result["forecastSeries"]
        self.assertGreater(len(series), 0)
        historical_points = [p for p in series if p["type"] == "historical"]
        projected_points = [p for p in series if p["type"] == "forecast"]
        self.assertGreater(len(historical_points), 0)
        self.assertGreater(len(projected_points), 0)

        # Procurement recommendations
        recs = forecast_result["procurementRecommendations"]
        self.assertIsInstance(recs, list)
        for r in recs:
            self.assertIn("bookTitle", r)
            self.assertIn("demandPressure", r)
            self.assertIn("recommendedCopiesToAdd", r)
            self.assertIn("priority", r)
            self.assertIn("rationale", r)

    def test_role_enforcement_student_denied_librarian_allowed(self):
        """Students are strictly forbidden (403) from analytics endpoints; librarians are allowed (200)."""
        # Student attempting to access overview
        res_stu = self.client.get(
            "/api/analytics/overview",
            headers={"Authorization": f"Bearer {self.student_token}"},
        )
        self.assertEqual(res_stu.status_code, 403)

        # Librarian accessing overview
        res_lib = self.client.get(
            "/api/analytics/overview",
            headers={"Authorization": f"Bearer {self.librarian_token}"},
        )
        self.assertEqual(res_lib.status_code, 200)
        data = json.loads(res_lib.data)
        self.assertTrue(data["success"])
        self.assertIn("totalBooks", data["data"])

        # Librarian accessing forecast
        res_forecast = self.client.get(
            "/api/analytics/forecast",
            headers={"Authorization": f"Bearer {self.librarian_token}"},
        )
        self.assertEqual(res_forecast.status_code, 200)
        forecast_data = json.loads(res_forecast.data)
        self.assertTrue(forecast_data["success"])
        self.assertIn("evaluationMetrics", forecast_data["data"])


if __name__ == "__main__":
    unittest.main()


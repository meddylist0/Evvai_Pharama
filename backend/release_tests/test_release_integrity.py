"""
Release Gate: Database Integrity — FK constraints, no orphan records
"""
import sys
import os
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
TEST_DB_PATH = BACKEND_DIR / "pharmalink_test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from app.core.database import SessionLocal, sync_db_schema
from app.seeds.seed_data import seed_database
from app.models.order import Order, OrderItem
from app.models.user import User
from app.models.product import Product, Category

sync_db_schema()
seed_database()


class TestReleaseIntegrity(unittest.TestCase):
    """Gate [15–16]: Database integrity — no orphan records, FK constraints hold."""

    def test_01_no_orphan_order_items(self):
        """Every OrderItem must reference an existing Order."""
        db = SessionLocal()
        try:
            order_ids = {r[0] for r in db.query(Order.id).all()}
            orphans = db.query(OrderItem).filter(~OrderItem.order_id.in_(order_ids)).count()
            self.assertEqual(orphans, 0, f"{orphans} orphan OrderItem(s) found")
        finally:
            db.close()

    def test_02_no_orphan_orders(self):
        """Every Order must reference an existing User."""
        db = SessionLocal()
        try:
            user_ids = {r[0] for r in db.query(User.id).all()}
            orphan_orders = db.query(Order).filter(~Order.user_id.in_(user_ids)).count()
            self.assertEqual(orphan_orders, 0, f"{orphan_orders} orphan Order(s) found")
        finally:
            db.close()

    def test_03_all_products_have_valid_categories(self):
        """All products with a category_id must reference an existing Category."""
        db = SessionLocal()
        try:
            cat_ids = {r[0] for r in db.query(Category.id).all()}
            invalid = (
                db.query(Product)
                .filter(Product.category_id.isnot(None))
                .filter(~Product.category_id.in_(cat_ids))
                .count()
            )
            self.assertEqual(invalid, 0, f"{invalid} product(s) reference non-existent categories")
        finally:
            db.close()

    def test_04_seeded_users_exist(self):
        """All required seed users must exist in the database."""
        db = SessionLocal()
        try:
            required_emails = [
                "admin@pharmalink.com",
                "customer@gmail.com",
                "distributor@medplus.com"
            ]
            for email in required_emails:
                user = db.query(User).filter(User.email == email).first()
                self.assertIsNotNone(user, f"Seed user {email} missing from database")
        finally:
            db.close()

    def test_05_seeded_products_exist(self):
        """At least 5 active products must exist (EVVAI portfolio — tests may soft-disable one)."""
        db = SessionLocal()
        try:
            count = db.query(Product).filter(Product.status == "active").count()
            self.assertGreaterEqual(count, 5, f"Only {count} active products found, expected >= 5")
        finally:
            db.close()


    def test_06_no_negative_stock(self):
        """No product must have negative stock or reserved_stock."""
        db = SessionLocal()
        try:
            neg_stock = db.query(Product).filter(Product.stock < 0).count()
            neg_reserved = db.query(Product).filter(Product.reserved_stock < 0).count()
            self.assertEqual(neg_stock, 0, f"{neg_stock} product(s) with negative stock")
            self.assertEqual(neg_reserved, 0, f"{neg_reserved} product(s) with negative reserved_stock")
        finally:
            db.close()

    def test_07_order_amounts_are_positive(self):
        """All orders must have positive total_amount."""
        db = SessionLocal()
        try:
            invalid = db.query(Order).filter(Order.total_amount <= 0).count()
            self.assertEqual(invalid, 0, f"{invalid} order(s) with zero or negative total_amount")
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()

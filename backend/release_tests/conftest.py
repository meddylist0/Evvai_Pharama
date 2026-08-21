"""
Release Tests — Shared Fixtures & Setup
All release tests share this bootstrap: isolated test DB, seeded once.
"""
import sys
import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

TEST_DB_PATH = BACKEND_DIR / "pharmalink_test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from app.core.database import sync_db_schema
from app.seeds.seed_data import seed_database

sync_db_schema()
seed_database()

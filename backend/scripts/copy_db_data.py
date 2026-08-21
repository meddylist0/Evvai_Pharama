import sqlite3
import os
import sys

# Setup paths
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
test_db_path = os.path.join(backend_dir, "pharmalink_test.db")
main_db_path = os.path.join(backend_dir, "pharmalink.db")

# Add backend to path and sync schema
sys.path.insert(0, backend_dir)
os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path.replace(chr(92), '/')}"

from app.core.database import sync_db_schema
print("Syncing test database schema...")
sync_db_schema()

print(f"Connecting to {test_db_path}...")
conn = sqlite3.connect(test_db_path)
cursor = conn.cursor()

try:
    cursor.execute(f"ATTACH DATABASE '{main_db_path}' AS main_db")
    
    # We want to copy core reference and auth data
    # (Leaving out orders/transactions to keep test db clean for tests)
    tables = [
        "users",
        "categories",
        "products",
        "customer_profiles",
        "distributor_profiles"
    ]
    
    for table in tables:
        # Clear existing data in test db to avoid unique constraint violations
        cursor.execute(f"DELETE FROM {table}")
        
        # Insert from main_db
        cursor.execute(f"INSERT INTO {table} SELECT * FROM main_db.{table}")
        print(f"Successfully copied data for table: {table}")

    conn.commit()
    print("Database data copied successfully!")

except Exception as e:
    print(f"Error copying database: {e}")
    conn.rollback()
finally:
    conn.close()

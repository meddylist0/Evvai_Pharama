import sqlite3
import os

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
live_db_path = os.path.join(backend_dir, "pharmalink.db")
test_db_path = os.path.join(backend_dir, "pharmalink_test.db")

conn1 = sqlite3.connect(live_db_path)
conn2 = sqlite3.connect(test_db_path)

cur1 = conn1.cursor()
cur2 = conn2.cursor()

cat_cols = [c[1] for c in cur1.execute('PRAGMA table_info(categories)').fetchall()]
prod_cols = [c[1] for c in cur1.execute('PRAGMA table_info(products)').fetchall()]

categories = cur1.execute('SELECT * FROM categories').fetchall()
products = cur1.execute('SELECT * FROM products').fetchall()

cat_sql = f"INSERT OR REPLACE INTO categories ({','.join(cat_cols)}) VALUES ({','.join(['?']*len(cat_cols))})"
prod_sql = f"INSERT OR REPLACE INTO products ({','.join(prod_cols)}) VALUES ({','.join(['?']*len(prod_cols))})"

cur2.executemany(cat_sql, categories)
cur2.executemany(prod_sql, products)

conn2.commit()
conn1.close()
conn2.close()

print(f"[v] Synced {len(categories)} categories and {len(products)} products to test database cleanly!")

import sqlite3

conn = sqlite3.connect("pharmalink.db")
cursor = conn.cursor()
cursor.execute("SELECT id, email, role, is_active FROM users")
rows = cursor.fetchall()
with open("users_out.txt", "w") as f:
    for r in rows:
        f.write(f"{r}\n")
print(f"Total users: {len(rows)}")

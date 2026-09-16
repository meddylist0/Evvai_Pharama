import sqlite3

conn = sqlite3.connect('backend/pharmalink.db')
c = conn.cursor()

# Find category name map
c.execute("SELECT id, name FROM categories")
cats = dict(c.fetchall())

# Fetch all products
c.execute("SELECT id, name, category_id, image FROM products")
rows = c.fetchall()

def get_fallback(cat_name):
    cat = (cat_name or "").lower()
    if any(x in cat for x in ["syrup", "liquid", "suspension", "solution", "drop"]):
        return "/uploads/products/zene_melatonin_spray.png"
    if any(x in cat for x in ["inject", "vial", "ampoule"]):
        return "/uploads/products/nxtnerve_b12_injection.png"
    if any(x in cat for x in ["topical", "ointment", "cream", "gel", "derma"]):
        return "/uploads/products/nxtlife-foaming.jpg"
    if any(x in cat for x in ["capsule"]):
        return "/uploads/products/evglip-met.jpg"
    if any(x in cat for x in ["nutra", "supplement", "vitamin"]):
        return "/uploads/products/ev-d3.jpg"
    return "/uploads/products/accelerant-300.jpg"

updated = 0
for pid, name, cat_id, img in rows:
    cat_name = cats.get(cat_id, "")
    if not img or "unsplash" in img or img == "":
        new_img = get_fallback(cat_name)
        c.execute("UPDATE products SET image = ? WHERE id = ?", (new_img, pid))
        updated += 1
        print(f"Updated product {pid} ('{name}') -> {new_img}")

conn.commit()
print(f"Total updated: {updated}")
conn.close()

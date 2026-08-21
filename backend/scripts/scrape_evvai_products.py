import re
import sys
import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.product import Product, Category

BASE_URL = "https://www.evvaipharma.com"
PRODUCTS_URL = f"{BASE_URL}/products"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
}

def clean_text(text: str) -> str:
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text).strip()

def scrape_all_products():
    db = SessionLocal()
    scraped_products = []
    
    current_page = 1
    max_pages = 10

    print("[*] Starting EVVAI Pharma Live Products Scraper...")

    while current_page <= max_pages:
        page_url = f"{PRODUCTS_URL}?page={current_page}" if current_page > 1 else PRODUCTS_URL
        print(f"\n[*] Fetching Page {current_page}: {page_url}")
        
        try:
            res = requests.get(page_url, headers=HEADERS, timeout=20)
            if res.status_code != 200:
                print(f"[!] Failed to fetch page {current_page}, status code: {res.status_code}")
                break
        except Exception as e:
            print(f"[!] Error fetching {page_url}: {e}")
            break

        soup = BeautifulSoup(res.content, "html.parser")
        
        # Look for all product links matching product patterns
        # Typically <a href="https://www.evvaipharma.com/product/..." or "/product/...">
        links = soup.find_all("a", href=True)
        product_links = []
        for a in links:
            href = a.get("href", "")
            if "/product/" in href or "/products/" in href:
                full_url = urljoin(BASE_URL, href)
                if full_url != PRODUCTS_URL and not full_url.endswith("/products") and not full_url.endswith("/products?page="):
                    if full_url not in [p["url"] for p in product_links]:
                        name = clean_text(a.get_text())
                        product_links.append({"url": full_url, "link_name": name, "elem": a})

        print(f"[*] Found {len(product_links)} potential product links on Page {current_page}")

        page_items = 0

        for item in product_links:
            detail_url = item["url"]
            print(f"  -> Scraping product: {detail_url}")
            detail = fetch_product_detail(detail_url)
            if not detail or not detail.get("name"):
                continue

            name = detail["name"]
            if any(p["name"].lower() == name.lower() for p in scraped_products):
                continue

            scraped_products.append(detail)
            page_items += 1
            print(f"     [+] Added: {name} ({detail.get('category', 'Formulation')})")

        print(f"[*] Processed {page_items} unique products from Page {current_page}")

        # Check if there is a next page
        next_btn = soup.find("a", rel=re.compile(r"next", re.I)) or soup.find("a", href=re.compile(rf"page={current_page + 1}"))
        if not next_btn or page_items == 0:
            print("[*] Reached last page of products or no more items found.")
            # Check page 2 specifically if current_page == 1
            if current_page == 1:
                current_page = 2
                continue
            break
            
        current_page += 1

    print(f"\n[*] Total Scraped Products Count: {len(scraped_products)}")
    
    if scraped_products:
        dump_to_database(db, scraped_products)
    else:
        print("[!] No products scraped.")
        
    db.close()

def fetch_product_detail(url: str) -> dict:
    try:
        res = requests.get(url, headers=HEADERS, timeout=15)
        if res.status_code != 200:
            return {}
        soup = BeautifulSoup(res.content, "html.parser")
        
        # 1. Product Name / Title
        title_tag = soup.find(["h1", "h2", "h3"], class_=re.compile(r"(title|product_name|heading|name)", re.I)) or soup.find("h1") or soup.find("h2")
        name = clean_text(title_tag.get_text()) if title_tag else ""
        if not name or name.lower() in ["all products", "products", "evvai", "home", "search"]:
            # extract from URL slug
            slug = url.rstrip("/").split("/")[-1]
            name = slug.replace("-", " ").title()

        # 2. Main Product Image
        img_url = ""
        for img in soup.find_all("img"):
            src = img.get("data-src") or img.get("src") or ""
            if src and any(ext in src.lower() for ext in [".png", ".jpg", ".jpeg", ".webp"]):
                if not any(skip in src.lower() for skip in ["logo", "icon", "banner", "footer", "facebook", "twitter", "flag"]):
                    img_url = urljoin(BASE_URL, src)
                    break

        # 3. Text content parsing for Composition, Packing, Category
        full_text = soup.get_text()
        
        composition = ""
        comp_match = re.search(r'(?:Composition|Active Ingredients?|Each\s+.*contains?)\s*[:\-]?\s*([^\n\r]+)', full_text, re.I)
        if comp_match:
            composition = clean_text(comp_match.group(1))

        pack_size = "10 × 10 Strips"
        pack_match = re.search(r'(?:Packing|Packaging|Pack Size|Presentation)\s*[:\-]?\s*([^\n\r]+)', full_text, re.I)
        if pack_match:
            pack_size = clean_text(pack_match.group(1))

        category = "Specialty Therapeutics"
        cat_match = re.search(r'(?:Category|Therapeutic Use|Indication|Class)\s*[:\-]?\s*([^\n\r]+)', full_text, re.I)
        if cat_match:
            category = clean_text(cat_match.group(1))

        # Description
        desc_tag = soup.find(class_=re.compile(r"(product_details|description|content|summary|detail)", re.I))
        description = clean_text(desc_tag.get_text()) if desc_tag else f"WHO-GMP Certified formulation: {name}. Manufactured with superior active pharmaceutical ingredients."

        if not composition:
            composition = f"{name} IP/BP Standard Formulation"

        return {
            "name": name,
            "composition": composition[:250],
            "pack_size": pack_size[:100],
            "category": category[:100] if len(category) > 2 else "Pharmaceutical Formulations",
            "description": description[:500],
            "image": img_url,
            "url": url
        }
    except Exception as e:
        print(f"    [!] Error parsing {url}: {e}")
        return {}

def dump_to_database(db, products_list):
    print("\n[*] Dumping products into PostgreSQL Database...")

    category_cache = {}
    
    # Get or create categories
    for item in products_list:
        c_name = item["category"] or "General Formulations"
        if c_name not in category_cache:
            slug = re.sub(r'[^a-zA-Z0-9]+', '-', c_name.lower()).strip('-')
            cat = db.query(Category).filter(Category.name.ilike(c_name)).first()
            if not cat:
                cat = Category(
                    name=c_name,
                    slug=slug or f"cat-{len(category_cache)+1}",
                    description=f"{c_name} Pharmaceutical products from EVVAI",
                    is_active=True
                )
                db.add(cat)
                db.commit()
                db.refresh(cat)
                print(f"  [+] Created Category: {cat.name}")
            category_cache[c_name] = cat.id

    inserted_count = 0
    updated_count = 0

    base_prices = [
        (450.0, 390.0, 280.0, 250.0),
        (580.0, 480.0, 360.0, 320.0),
        (720.0, 620.0, 460.0, 410.0),
        (350.0, 290.0, 210.0, 185.0),
        (890.0, 780.0, 580.0, 520.0),
        (640.0, 550.0, 420.0, 380.0),
        (495.0, 420.0, 310.0, 275.0),
    ]

    for idx, prod_data in enumerate(products_list):
        name = prod_data["name"]
        cat_id = category_cache.get(prod_data["category"])
        
        # Clean SKU Code
        clean_code = re.sub(r'[^a-zA-Z0-9]', '', name)[:4].upper()
        sku = f"EVV-{clean_code}-{200 + idx}"

        prices = base_prices[idx % len(base_prices)]

        existing_prod = db.query(Product).filter(
            (Product.name.ilike(name)) | (Product.sku == sku)
        ).first()

        if existing_prod:
            if prod_data["image"]:
                existing_prod.image = prod_data["image"]
            existing_prod.composition = prod_data["composition"] or existing_prod.composition
            existing_prod.pack_size = prod_data["pack_size"] or existing_prod.pack_size
            existing_prod.description = prod_data["description"] or existing_prod.description
            if cat_id:
                existing_prod.category_id = cat_id
            updated_count += 1
        else:
            new_prod = Product(
                sku=sku,
                name=name,
                subtitle="WHO-GMP Certified formulation from EVVAI Pharmaceuticals.",
                composition=prod_data["composition"] or f"{name} Active Pharmaceutical Salt",
                pack_size=prod_data["pack_size"] or "10 × 10 Tablets Strip",
                description=prod_data["description"] or f"Official WHO-GMP Certified formulation: {name}",
                category_id=cat_id,
                mrp=prices[0],
                customer_price=prices[1],
                distributor_price=prices[2],
                bulk_price=prices[3],
                bulk_moq=50,
                stock=3000 + (idx * 200),
                low_stock_threshold=100,
                batch_no=f"BATCH-2026-EV{idx+1:02d}",
                expiry_date="12/2028",
                image=prod_data["image"] or "/images/product_zene.png",
                status="active"
            )
            db.add(new_prod)
            inserted_count += 1

    db.commit()
    print(f"\n[*] Finished Database Sync:")
    print(f"    [+] {inserted_count} New Products Inserted")
    print(f"    [+] {updated_count} Existing Products Updated with Live Data")

if __name__ == "__main__":
    scrape_all_products()

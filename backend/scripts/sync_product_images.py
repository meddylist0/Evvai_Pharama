import sys
import os
import re
import requests

# Add backend path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.product import Product

# Local storage directories
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_UPLOADS_DIR = os.path.join(ROOT_DIR, "pharmachain-app", "public", "uploads", "products")
BACKEND_UPLOADS_DIR = os.path.join(ROOT_DIR, "backend", "uploads", "products")

os.makedirs(FRONTEND_UPLOADS_DIR, exist_ok=True)
os.makedirs(BACKEND_UPLOADS_DIR, exist_ok=True)

IMAGE_MAP = {
    "accelerant": "https://www.evvaipharma.com/assets/front/img/product/featured/accelerant-300.jpg",
    "evvai-mf": "https://www.evvaipharma.com/assets/front/img/product/featured/evvai-mf.jpg",
    "fervon": "https://www.evvaipharma.com/assets/front/img/product/featured/fervon-xt.jpg",
    "ev-d3": "https://www.evvaipharma.com/assets/front/img/product/featured/ev-d3.jpg",
    "evglip": "https://www.evvaipharma.com/assets/front/img/product/featured/evglip-met.jpg",
    "erase-gas": "https://www.evvaipharma.com/assets/front/img/product/featured/erase-gas.jpg",
    "gestogen": "https://www.evvaipharma.com/assets/front/img/product/featured/gestogen-pro.jpg",
    "hepramax": "https://www.evvaipharma.com/assets/front/img/product/featured/hepramax.jpg",
    "evi-ova": "https://www.evvaipharma.com/assets/front/img/product/featured/evi-ova.jpg",
    "bilevia": "https://www.evvaipharma.com/assets/front/img/product/featured/bilevia-300.jpg",
    "rabevo": "https://www.evvaipharma.com/assets/front/img/product/featured/rabevo-d.jpg",
    "evizole": "https://www.evvaipharma.com/assets/front/img/product/featured/evizole-ls.jpg",
    "evasure": "https://www.evvaipharma.com/assets/front/img/product/featured/evasure-sn.jpg",
    "nxtnerve": "https://www.evvaipharma.com/assets/front/img/product/featured/nxtnerve_b12_injection.png",
    "nxtlife-600": "https://www.evvaipharma.com/assets/front/img/product/featured/nxtlife-600.jpg",
    "nxtlife 600": "https://www.evvaipharma.com/assets/front/img/product/featured/nxtlife-600.jpg",
    "evizone": "https://www.evvaipharma.com/assets/front/img/product/featured/evizone-s-1.5.jpg",
    "zene": "https://www.evvaipharma.com/assets/front/img/product/featured/zene_melatonin_spray.png",
    "evvasure": "https://www.evvaipharma.com/assets/front/img/product/featured/evvasure.jpg",
    "evi-q10": "https://www.evvaipharma.com/assets/front/img/product/featured/evi-q10.jpg",
    "evi q10": "https://www.evvaipharma.com/assets/front/img/product/featured/evi-q10.jpg",
    "evvai-czs": "https://www.evvaipharma.com/assets/front/img/product/featured/evvai-czs.jpg",
    "evvai czs": "https://www.evvaipharma.com/assets/front/img/product/featured/evvai-czs.jpg",
    "nxtlife-foaming": "https://www.evvaipharma.com/assets/front/img/product/featured/nxtlife-foaming.jpg",
    "nxtlife foaming": "https://www.evvaipharma.com/assets/front/img/product/featured/nxtlife-foaming.jpg",
    "evi-heme": "https://www.evvaipharma.com/assets/front/img/product/featured/hepramax.jpg",
    "evi heme": "https://www.evvaipharma.com/assets/front/img/product/featured/hepramax.jpg",
    "telmishield": "https://www.evvaipharma.com/assets/front/img/product/featured/evglip-met.jpg",
    "montair": "https://www.evvaipharma.com/assets/front/img/product/featured/evasure-sn.jpg",
    "azithro": "https://www.evvaipharma.com/assets/front/img/product/featured/accelerant-300.jpg",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

def download_and_save_image(remote_url: str, filename: str) -> str:
    """Download image from remote URL and save to local uploads folders."""
    front_path = os.path.join(FRONTEND_UPLOADS_DIR, filename)
    back_path = os.path.join(BACKEND_UPLOADS_DIR, filename)
    
    # Check if already downloaded
    if not (os.path.exists(front_path) and os.path.getsize(front_path) > 1000):
        try:
            res = requests.get(remote_url, headers=HEADERS, timeout=15)
            if res.status_code == 200 and len(res.content) > 500:
                with open(front_path, "wb") as f:
                    f.write(res.content)
                with open(back_path, "wb") as f:
                    f.write(res.content)
                print(f"  [v] Downloaded: {filename} ({len(res.content)} bytes)")
            else:
                print(f"  [!] Failed downloading {remote_url} (HTTP {res.status_code})")
        except Exception as e:
            print(f"  [!] Error downloading {remote_url}: {e}")
    else:
        # ensure synced to backend as well
        if not os.path.exists(back_path):
            with open(front_path, "rb") as f_in, open(back_path, "wb") as f_out:
                f_out.write(f_in.read())

    # Return standard local path relative to web root
    return f"/uploads/products/{filename}"

def sync_images_locally():
    db = SessionLocal()
    products = db.query(Product).all()
    print(f"[*] Downloading and syncing local product images for {len(products)} products...")

    updated_count = 0
    for p in products:
        p_name_lower = p.name.lower()
        matched_url = None
        matched_key = None
        
        for key, img_url in IMAGE_MAP.items():
            if key in p_name_lower:
                matched_url = img_url
                matched_key = key
                break

        if not matched_url:
            matched_url = "https://www.evvaipharma.com/assets/front/img/product/featured/accelerant-300.jpg"

        # Determine clean filename
        raw_filename = matched_url.split('/')[-1]
        local_path = download_and_save_image(matched_url, raw_filename)
        
        p.image = local_path
        updated_count += 1
        print(f"  [+] {p.id}: {p.name} -> {local_path}")

    db.commit()
    db.close()
    print(f"\n[*] Finished! Stored {updated_count} local images in '/uploads/products/' and updated database.")

if __name__ == "__main__":
    sync_images_locally()

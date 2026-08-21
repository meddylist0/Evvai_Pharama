import requests
from bs4 import BeautifulSoup
import re

url = "https://www.evvaipharma.com/product/accelerant-300"
headers = {"User-Agent": "Mozilla/5.0"}
res = requests.get(url, headers=headers)
soup = BeautifulSoup(res.content, "html.parser")

print("--- ALL IMAGES ON PRODUCT DETAIL PAGE ---")
for img in soup.find_all("img"):
    print("img:", img.get("src") or img.get("data-src"), "class:", img.get("class"), "alt:", img.get("alt"))

print("\n--- ALL IMAGES ON LISTING PAGE ---")
res2 = requests.get("https://www.evvaipharma.com/products", headers=headers)
soup2 = BeautifulSoup(res2.content, "html.parser")
for img in soup2.find_all("img"):
    print("listing img:", img.get("src") or img.get("data-src"), "class:", img.get("class"), "alt:", img.get("alt"))

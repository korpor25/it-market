from __future__ import annotations

import asyncio
import math
import os
import re
import statistics
import time
from contextlib import closing
from dataclasses import dataclass
from datetime import UTC, date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any
from urllib.parse import urlencode, urlsplit

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, RedirectResponse, Response

# โครงสร้างไฟล์: Python ทำ API/ประมวลผลข้อมูล ส่วนหน้าตาอยู่ใน dist/index.html, styles.css และ app.js
PROJECT_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_DIR = PROJECT_ROOT / "dist"
# ตั้งค่าคีย์ในเครื่อง: คัดลอก .env.example เป็น .env ที่โฟลเดอร์หลัก
# เปิด .env แล้วแทนค่า replace_with_your_serpapi_key หลัง SERPAPI_KEY= ด้วยคีย์จาก serpapi.com/manage-api-key
# บรรทัดถัดไปโหลด .env ตอนเริ่มแอป; os.getenv ที่ live_prices จะอ่านค่านี้อีกครั้งเมื่อมีคำขอ
# บน Vercel ใส่ SERPAPI_KEY ใน Project Settings > Environment Variables แล้ว Redeploy
# คีย์จริงต้องอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น ห้ามใส่ใน main.py, dist/app.js, Git หรือรายงาน
load_dotenv(PROJECT_ROOT / ".env")

# แก้คำค้นที่ส่งไป Google Shopping: เปลี่ยนข้อความด้านขวาของชื่อหมวดใน CATEGORY_QUERIES
# เพิ่ม/ลบหมวดที่นี่ได้ แต่จำนวนคำขอ SerpApi ต่อรอบจะเปลี่ยน และต้องตรวจตัวกรองฝั่งเว็บ
CATEGORY_QUERIES = {
    "GPU": "การ์ดจอ",
    "CPU": "ซีพียู",
    "RAM": "RAM DDR5 32GB",
    "SSD": "SSD NVMe 1TB",
    "Notebook": "Notebook gaming laptop",
    "Monitor": "Monitor จอคอม 27 นิ้ว",
}

# เพิ่ม/แก้แบรนด์ใน KNOWN_BRANDS; detect_brand จะคืนชื่อแรกที่พบในชื่อสินค้า มิฉะนั้นคืน Other
KNOWN_BRANDS = (
    "NVIDIA",
    "AMD",
    "Intel",
    "ASUS",
    "MSI",
    "Gigabyte",
    "Zotac",
    "Kingston",
    "Corsair",
    "TeamGroup",
    "Samsung",
    "WD",
    "Western Digital",
    "Lenovo",
    "Acer",
    "HP",
    "Dell",
    "Apple",
    "LG",
    "AOC",
    "ViewSonic",
)

# แก้ข้อความแจ้งข้อผิดพลาดที่นี่ โดยคงรหัสด้านซ้ายให้ตรงกับ classify_serpapi_error และหน้าเว็บ
# ใช้ข้อความกลางแทนข้อความดิบจาก SerpApi เพื่อไม่ให้รายละเอียดหรือคีย์หลุดไปใน JSON
ERROR_MESSAGES = {
    "SERPAPI_INVALID_KEY": "SerpApi rejected the API key. Check the SERPAPI_KEY environment variable.",
    "SERPAPI_LIMIT_REACHED": "SerpApi search limit reached. Check account usage.",
    "SERPAPI_BAD_REQUEST": "SerpApi rejected the search parameters.",
    "SERPAPI_TIMEOUT": "SerpApi did not respond in time.",
    "SERPAPI_UNREACHABLE": "Could not connect to SerpApi.",
    "SERPAPI_INVALID_RESPONSE": "SerpApi returned an unreadable response.",
    "SERPAPI_UPSTREAM_ERROR": "SerpApi could not complete the search.",
    "NO_PRODUCTS": "No priced shopping results were returned.",
}

# USED_PRODUCT_PATTERN: คำที่ใช้ตัดสินค้ามือสอง; เพิ่มคำไทย/อังกฤษได้ใน regex บรรทัดถัดไป
# GPU_PATTERN/CPU_PATTERN: ชื่อรุ่นที่ยอมรับ; NON_CPU_PATTERN: คำที่บอกว่าเป็นเครื่องทั้งชุดหรืออุปกรณ์อื่น
# กฎเหล่านี้ถูกใช้กับ CPU/GPU เท่านั้น; หลังแก้ให้ตรวจ tests/test_api.py และผลค้นหาจริง
USED_PRODUCT_PATTERN = re.compile(
    r"มือ\s*(?:สอง|2)|second[\s-]?hand|\bused\b|\brefurbished\b|สภาพดี",
    re.IGNORECASE,
)
GPU_PATTERN = re.compile(
    r"\b(?:RTX|GTX)\s*\d{3,4}\b|\bRX\s*\d{3,4}\b|\b(?:GeForce|Radeon)\b|\bArc\s*[AB]\d{3}\b",
    re.IGNORECASE,
)
NON_CPU_PATTERN = re.compile(
    r"คอมพิวเตอร์|คอมประกอบ|คอมเล่นเกม|คอมเซ็ต|ชุดคอม|โน้ตบุ๊ก|โน๊ตบุ๊ค|"
    r"\b(?:notebook|laptop|gaming pc|desktop pc|mainboard|motherboard|RAM|SSD|HDD)\b|"
    r"เมนบอร์ด|แรม",
    re.IGNORECASE,
)
CPU_PATTERN = re.compile(
    r"\b(?:Intel\s*(?:Core\s*)?(?:i[3579]|Ultra\s*[3579])|Core\s*i[3579]|"
    r"AMD\s*Ryzen|Ryzen\s*[3579]|Athlon|Pentium|Celeron|Xeon)\b",
    re.IGNORECASE,
)

# แคตตาล็อกสินค้า (หน้าแรกของเว็บ): แต่ละรายการคือ "รุ่น" หนึ่งรุ่น ค้นแยกกัน แล้วรวมราคาจากหลายร้าน
# เพิ่ม/ลบรุ่นที่ TRACKED_PRODUCTS; ทุกรุ่นใช้โควตา SerpApi 1 ครั้งต่อการโหลดแคตตาล็อกที่ไม่โดนแคช
# match: regex ที่ชื่อสินค้าต้องพบครบทุกตัว; exclude: regex ที่ถ้าพบให้ตัดทิ้ง (เช่นความจุอื่นหรือของพ่วง)
# id ใช้ใน URL หน้าเว็บ (#/product/<id>) และ /api/go จึงควรเป็นตัวพิมพ์เล็กคั่นด้วย -
@dataclass(frozen=True)
class TrackedProduct:
    id: str
    name: str
    category: str
    query: str
    match: tuple[str, ...]
    exclude: str | None = None

TRACKED_PRODUCTS = (
    TrackedProduct("rtx-5060", "NVIDIA GeForce RTX 5060 8GB", "GPU", "การ์ดจอ RTX 5060 8GB", (r"RTX\s*5060(?!\s*Ti)",)),
    TrackedProduct("rtx-5070", "NVIDIA GeForce RTX 5070 12GB", "GPU", "การ์ดจอ RTX 5070 12GB", (r"RTX\s*5070(?!\s*Ti)",)),
    TrackedProduct("rx-9070-xt", "AMD Radeon RX 9070 XT 16GB", "GPU", "การ์ดจอ RX 9070 XT", (r"RX\s*9070\s*XT",)),
    TrackedProduct("ryzen-7-9800x3d", "AMD Ryzen 7 9800X3D", "CPU", "ซีพียู AMD Ryzen 7 9800X3D", (r"9800\s*X3D",)),
    TrackedProduct("ryzen-7-9700x", "AMD Ryzen 7 9700X", "CPU", "ซีพียู AMD Ryzen 7 9700X", (r"9700\s*X(?!3D)",)),
    TrackedProduct("core-i5-14400f", "Intel Core i5-14400F", "CPU", "ซีพียู Intel Core i5-14400F", (r"i5[\s-]*14400\s*F",)),
    TrackedProduct("ryzen-5-9600x", "AMD Ryzen 5 9600X", "CPU", "ซีพียู AMD Ryzen 5 9600X", (r"9600\s*X(?!3D)",)),
    TrackedProduct(
        "kingston-fury-beast-ddr5-32gb", "Kingston FURY Beast DDR5 32GB", "RAM", "Kingston Fury Beast DDR5 32GB",
        (r"Fury\s*Beast", r"DDR5", r"32\s*GB"), r"64\s*GB|DDR4",
    ),
    TrackedProduct(
        "samsung-990-pro-1tb", "Samsung 990 PRO 1TB", "SSD", "Samsung 990 PRO 1TB NVMe",
        (r"990\s*PRO", r"\b1\s*TB"), r"\b[248]\s*TB",
    ),
    TrackedProduct(
        "wd-black-sn770-1tb", "WD Black SN770 1TB", "SSD", "WD Black SN770 1TB",
        (r"SN770", r"\b1\s*TB"), r"\b[248]\s*TB|\b(?:250|500)\s*GB",
    ),
)
# ตัดเครื่องทั้งชุด/โน้ตบุ๊ก/ประกาศหลายรุ่นออกจากทุกรุ่นในแคตตาล็อก; CPU ตัดชุดพ่วงเมนบอร์ดเพิ่ม
CATALOG_EXCLUDE_PATTERN = re.compile(
    r"คอมพิวเตอร์|คอมประกอบ|คอมเล่นเกม|คอมเซ็[ตท]|ชุดคอม|โน้ตบุ๊ก|โน๊ตบุ๊ค|มินิพีซี|เดสก์ท็อป|หลายรุ่น|เลือกรุ่น|"
    r"มือ\s*1\s*-\s*2|\b(?:notebook|laptop|gaming pc|desktop pc|mini\s*pc|computer\s*set|pc\s*set)\b",
    re.IGNORECASE,
)
# CPU ที่ขายพ่วงเมนบอร์ด/การ์ดจอ/แรม/SSD ถือเป็นชุดพ่วง ไม่ใช่ราคา CPU เดี่ยว
CPU_BUNDLE_PATTERN = re.compile(
    r"\b(?:mainboard|motherboard)\b|เมนบอร์ด|\+|RAM\s*\d|\bSSD\b|\b(?:RTX|GTX)\s*\d|\bRX\s*\d{3,4}",
    re.IGNORECASE,
)
# ชื่อรุ่น CPU ในชื่อสินค้า; ถ้าพบหลายรุ่นต่างกัน (เช่น "i5 12400f, i5 14400f") ถือเป็นประกาศรวมหลายรุ่นและตัดทิ้ง
CPU_MODEL_PATTERN = re.compile(r"(?:i[3579]|Ryzen\s*[3579]|\bR[3579])[\s-]*(\d{4,5}\s*(?:X3D|[A-Z]{0,2}))", re.IGNORECASE)
# ร้านนำเข้าข้ามประเทศ ราคาสูงกว่าตลาดไทยมากและส่งช้า จึงไม่นำมาเทียบ; เพิ่มชื่อร้านคั่นด้วย |
EXCLUDED_SHOP_PATTERN = re.compile(r"ubuy|desertcart|microless|ebay", re.IGNORECASE)
# แสดงไม่เกินกี่ร้านต่อรุ่น (เลือกร้านที่ถูกที่สุด) และช่วงราคาที่ถือว่าผิดปกติเมื่อเทียบค่ากลาง
MAX_OFFERS_PER_PRODUCT = 15
OUTLIER_LOW_RATIO = 0.5
OUTLIER_HIGH_RATIO = 2.5

# ข้อยกเว้นเฉพาะงานตลาด: เก็บรหัสผิดพลาดให้ route จัดการต่อ โดยไม่ส่ง traceback ให้ผู้ใช้
class MarketDataError(Exception):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code

# จุดตั้งค่า FastAPI: แก้ชื่อบริการ/คำอธิบาย และเส้นทางเอกสาร API ที่ docs_url/openapi_url
app = FastAPI(
    title="IT Market Intelligence",
    description="Thailand IT hardware market prices from Google Shopping via SerpApi.",
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)
# เครื่องมือสร้างรหัสสินค้า: ใช้ค่าจาก product_id/link เพื่อให้สินค้ารายเดิมมี id คงที่

# base36 แปลงเลข hash เป็นข้อความสั้น; เปลี่ยนวิธีสร้าง id ต้องตรวจข้อมูลเปรียบเทียบที่เก็บในเว็บ
def base36(value: int) -> str:
    alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
    if value == 0:
        return "0"
    output = ""
    while value:
        value, remainder = divmod(value, 36)
        output = alphabet[remainder] + output
    return output

# text_hash ใช้ FNV-1a แบบเดียวกับ API JavaScript เดิม; เปลี่ยนสูตรแล้ว id สินค้าจะเปลี่ยน
def text_hash(value: str) -> str:
    """Return the same unsigned FNV-1a hash used by the previous JS API."""
    hash_value = 2166136261
    encoded = value.encode("utf-16-le")
    for index in range(0, len(encoded), 2):
        code_unit = encoded[index] | (encoded[index + 1] << 8)
        hash_value ^= code_unit
        hash_value = (hash_value * 16777619) & 0xFFFFFFFF
    return base36(hash_value)

# ตัวช่วยแปลงตัวเลขจาก SerpApi; ผลลัพธ์ใช้กับราคา คะแนนรีวิว และจำนวนรีวิว
# number_from ตัดสัญลักษณ์สกุลเงิน/คอมมาออก แล้วคืน None เมื่อแปลงไม่ได้หรือไม่ใช่เลข finite
def number_from(value: Any) -> float | int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return value if math.isfinite(value) else None
    if not isinstance(value, str):
        return None
    normalized = re.sub(r"[^0-9.]", "", value)
    if not normalized:
        return None
    try:
        parsed = float(normalized)
    except ValueError:
        return None
    return parsed if math.isfinite(parsed) else None

# การตรวจแบรนด์อาศัยการพบคำใน title ไม่ได้ตรวจข้อมูลแบรนด์ที่ยืนยันจากร้านค้า
# ต้องพบเป็นคำเต็ม (ไม่ติดตัวอักษร/ตัวเลขอังกฤษ) เพื่อไม่ให้ Intel ตรงกับ Intelligent หรือ HP ตรงกับ HPE
# อยากเปลี่ยนกฎจับแบรนด์ ให้แก้ detect_brand และรายการ KNOWN_BRANDS ด้านบน
BRAND_PATTERNS = tuple(
    (brand, re.compile(rf"(?<![a-z0-9]){re.escape(brand)}(?![a-z0-9])", re.IGNORECASE))
    for brand in KNOWN_BRANDS
)

def detect_brand(title: str) -> str:
    return next((brand for brand, pattern in BRAND_PATTERNS if pattern.search(title)), "Other")

# SerpApi อาจวางผลสินค้าไว้ในหลายฟิลด์; ฟังก์ชันนี้รวมฟิลด์ที่รองรับเป็น list เดียว
# หากโครง JSON ของผู้ให้บริการเปลี่ยน ให้เพิ่มชื่อฟิลด์ใน collect_shopping_results
def collect_shopping_results(payload: dict[str, Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for key in ("shopping_results", "inline_shopping_results"):
        value = payload.get(key)
        if isinstance(value, list):
            items.extend(item for item in value if isinstance(item, dict))
    groups = payload.get("categorized_shopping_results")
    if isinstance(groups, list):
        for group in groups:
            if not isinstance(group, dict):
                continue
            results = group.get("shopping_results")
            if isinstance(results, list):
                items.extend(item for item in results if isinstance(item, dict))
    return items

# กรองชื่อสินค้าเฉพาะหมวด CPU/GPU; หมวดอื่นผ่านกฎนี้และยังอาจมีผลค้นหาที่ไม่ตรงหมวด
# GPU ต้องพบชื่อรุ่นที่ GPU_PATTERN รู้จัก; CPU ต้องไม่ใช่เครื่องทั้งชุดและต้องพบ CPU_PATTERN
def matches_hardware_category(title: str, category: str) -> bool:
    if category not in {"CPU", "GPU"}:
        return True
    if USED_PRODUCT_PATTERN.search(title):
        return False
    if category == "GPU":
        return bool(GPU_PATTERN.search(title))
    if NON_CPU_PATTERN.search(title):
        return False
    return bool(CPU_PATTERN.search(title))

# ขั้นตอนแปลงผลค้นหาหนึ่งรายการให้เป็นสินค้าแบบที่ dist/app.js ใช้แสดงผล
# ตัดรายการที่ไม่มีชื่อ/ราคาเป็นบวกหรือไม่ตรงหมวด; เลือกราคาเดิม ร้านค้า และลิงก์จากฟิลด์สำรอง
# อยากเพิ่ม/เปลี่ยนฟิลด์หน้าเว็บ ให้แก้ dict ที่ return และตรวจจุดอ่านฟิลด์ใน dist/app.js
def normalize_product(item: dict[str, Any], category: str) -> dict[str, Any] | None:
    title = str(item.get("title") or "").strip()
    price = number_from(item.get("extracted_price", item.get("price")))
    if not title or price is None or price <= 0 or not matches_hardware_category(title, category):
        return None
    # ราคาเดิมใช้ extracted_old_price ก่อน; ถ้าไม่มีใช้ old_price/original_price หรือราคาปัจจุบัน
    original_price = number_from(
        item.get("extracted_old_price", item.get("old_price", item.get("original_price")))
    )
    original_price = original_price or price
    shop = str(item.get("source") or item.get("merchant") or "Google Shopping").strip()
    stable_key = str(item.get("product_id") or item.get("link") or f"{category}|{title}|{shop}")
    delivery = item.get("delivery") or "ตรวจสอบที่ร้าน"
    rating = number_from(item.get("rating"))
    # Google Shopping ไม่บอกสต็อกจริง จึงส่ง stock=None (ไม่ทราบ) และให้หน้าเว็บแสดง stock_label แทน
    return {
        "id": f"LIVE-{text_hash(stable_key)}",
        "category": category,
        "brand": detect_brand(title),
        "model": title,
        "name": title,
        "shop": shop,
        "price": round(price),
        "original": max(round(original_price), round(price)),
        "stock": None,
        "stock_label": delivery,
        "source_url": item.get("link") or item.get("product_link"),
        "image_url": item.get("thumbnail") or item.get("serpapi_thumbnail"),
        "rating": rating,
        "reviews": number_from(item.get("reviews")),
        "specs": {
            "แหล่งข้อมูล": shop,
            "การจัดส่ง": delivery,
            "คะแนนรีวิว": f"{rating:g}/5" if rating else "ไม่มีข้อมูล",
        },
    }

# การแปลงข้อผิดพลาด SerpApi: 401/403=คีย์, 429=โควตา, 400=พารามิเตอร์, อื่น ๆ=บริการต้นทาง
# หากผู้ให้บริการเปลี่ยนรูปแบบ error ให้ปรับเงื่อนไขนี้ โดยยังคงรหัสใน ERROR_MESSAGES
def classify_serpapi_error(status: int, message: Any) -> str:
    detail = message.lower() if isinstance(message, str) else ""
    if status == 200 and re.search(r"hasn.t returned any results|no results|fully empty", detail):
        return "NO_PRODUCTS"
    if status in {401, 403} or re.search(r"invalid api key|api key.*invalid", detail):
        return "SERPAPI_INVALID_KEY"
    if status == 429 or re.search(r"run out of searches|rate limit|quota|searches remaining", detail):
        return "SERPAPI_LIMIT_REACHED"
    if status == 400:
        return "SERPAPI_BAD_REQUEST"
    return "SERPAPI_UPSTREAM_ERROR"
# ตัวดึง API จริงอยู่ใน fetch_category: รับหมวด คำค้น คีย์ และ HTTP client จาก live_prices

# serpapi_get ส่งหนึ่งคำขอไป SerpApi แล้วคืน JSON object; ข้อผิดพลาดทุกแบบกลายเป็น MarketDataError
# ใช้ร่วมกันทั้ง fetch_category (หน้าภาพรวม), fetch_tracked_product (แคตตาล็อก) และ resolve_store_link (ปุ่มไปที่ร้าน)
async def serpapi_get(params: dict[str, str], client: httpx.AsyncClient) -> dict[str, Any]:
    endpoint = "https://serpapi.com/search.json?" + urlencode(params)
    try:
        # client.get คือจุดส่ง HTTPS GET จริง; client ถูกตั้ง timeout 20 วินาทีใน route ที่เรียก
        response = await client.get(endpoint, headers={"accept": "application/json"})
    except httpx.TimeoutException as error:
        raise MarketDataError("SERPAPI_TIMEOUT") from error
    except httpx.HTTPError as error:
        raise MarketDataError("SERPAPI_UNREACHABLE") from error
    # SerpApi ต้องส่ง JSON object; คำตอบที่อ่านไม่ได้หรือมี error จะกลายเป็น MarketDataError
    try:
        payload = response.json()
    except ValueError as error:
        raise MarketDataError("SERPAPI_INVALID_RESPONSE") from error
    if not isinstance(payload, dict):
        raise MarketDataError("SERPAPI_INVALID_RESPONSE")
    if not response.is_success or payload.get("error"):
        raise MarketDataError(classify_serpapi_error(response.status_code, payload.get("error")))
    return payload

# urlencode สร้าง query string อย่างถูกต้อง; engine=google_shopping และ q=query เลือกผลค้นหา
# gl/hl/location กำหนดบริบทไทย; api_key มาจาก SERPAPI_KEY ฝั่งเซิร์ฟเวอร์
# no_cache=true บังคับให้ SerpApi ค้นใหม่ (นับโควตาทุกครั้ง); ใช้เฉพาะตอนกดปุ่มอัปเดตราคา
def shopping_params(query: str, api_key: str, *, no_cache: bool = False) -> dict[str, str]:
    params = {
        "engine": "google_shopping",
        "q": query,
        "gl": "th",
        "hl": "th",
        "location": "Thailand",
        "api_key": api_key,
    }
    if no_cache:
        params["no_cache"] = "true"
    return params

# ฟังก์ชันนี้ส่งหนึ่งคำขอต่อหมวด ตรวจคำตอบ และคืนสินค้าไม่เกิน 8 รายการ
# เปลี่ยน endpoint/engine/ประเทศใน shopping_params; เปลี่ยนจำนวนหมวดที่ CATEGORY_QUERIES
async def fetch_category(
    category: str,
    query: str,
    api_key: str,
    client: httpx.AsyncClient,
    *,
    no_cache: bool = False,
) -> list[dict[str, Any]]:
    payload = await serpapi_get(shopping_params(query, api_key, no_cache=no_cache), client)
    # เก็บ id ที่เคยพบเพื่อกันผลซ้ำ; normalize_product ตัดรายการราคาไม่ถูกต้อง/ผิดหมวด
    products: list[dict[str, Any]] = []
    seen: set[str] = set()
    # คืนสูงสุด 8 รายการต่อหมวด; อยากเพิ่มจำนวนให้แก้เลข 8 ในเงื่อนไขด้านล่าง
    for item in collect_shopping_results(payload):
        product = normalize_product(item, category)
        if not product or product["id"] in seen:
            continue
        seen.add(product["id"])
        products.append(product)
        if len(products) == 8:
            break
    if not products:
        raise MarketDataError("NO_PRODUCTS")
    return products

# ===== แคตตาล็อกสินค้า: รวมราคารุ่นเดียวกันจากหลายร้าน =====
TRACKED_BY_ID = {product.id: product for product in TRACKED_PRODUCTS}
# แคชในหน่วยความจำของเซิร์ฟเวอร์ ลดการเรียก SerpApi ซ้ำ (บน Vercel แต่ละ instance มีแคชของตัวเอง)
CATALOG_CACHE_SECONDS = 3600
STORE_LINK_CACHE_SECONDS = 6 * 3600
CATALOG_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
STORE_LINK_CACHE: dict[tuple[str, str], tuple[float, str]] = {}

def cache_get(cache: dict[Any, tuple[float, Any]], key: Any, max_age: float) -> Any:
    entry = cache.get(key)
    if entry is None or time.monotonic() - entry[0] > max_age:
        return None
    return entry[1]

def cache_put(cache: dict[Any, tuple[float, Any]], key: Any, value: Any) -> None:
    # กันหน่วยความจำโตไม่จำกัด: ถ้าเกิน 1000 รายการให้ล้างทั้งหมดแล้วเริ่มใหม่
    if len(cache) >= 1000:
        cache.clear()
    cache[key] = (time.monotonic(), value)

def safe_http_url(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    parts = urlsplit(value)
    return value if parts.scheme in {"http", "https"} and parts.netloc else None

# ตัดสินว่าชื่อสินค้าจากผลค้นหาเป็นรุ่นที่ติดตามจริงหรือไม่ (ต้องตรง match ทุกตัวและไม่โดน exclude)
def accepts_offer(product: TrackedProduct, title: str) -> bool:
    if USED_PRODUCT_PATTERN.search(title) or CATALOG_EXCLUDE_PATTERN.search(title):
        return False
    if product.category == "CPU":
        models = {re.sub(r"\s+", "", model).upper() for model in CPU_MODEL_PATTERN.findall(title)}
        if CPU_BUNDLE_PATTERN.search(title) or len(models) > 1:
            return False
    if product.exclude and re.search(product.exclude, title, re.IGNORECASE):
        return False
    return all(re.search(pattern, title, re.IGNORECASE) for pattern in product.match)

# แปลงผลค้นหาหนึ่งรายการเป็นข้อเสนอของร้าน; ฟิลด์ที่ขึ้นต้นด้วย _ ใช้ในเซิร์ฟเวอร์เท่านั้น ไม่ส่งให้หน้าเว็บ
# buy_url ชี้มาที่ /api/go ของเราเอง ซึ่งจะหาลิงก์หน้าร้านจริงตอนผู้ใช้กดปุ่ม
def normalize_offer(item: dict[str, Any], product: TrackedProduct) -> dict[str, Any] | None:
    title = str(item.get("title") or "").strip()
    price = number_from(item.get("extracted_price", item.get("price")))
    shop = str(item.get("source") or item.get("merchant") or "").strip()
    if not title or not shop or price is None or price <= 0 or not accepts_offer(product, title):
        return None
    if EXCLUDED_SHOP_PATTERN.search(shop):
        return None
    return {
        "shop": shop,
        "title": title,
        "price": round(price),
        "image_url": item.get("thumbnail") or item.get("serpapi_thumbnail"),
        "shop_icon": safe_http_url(item.get("source_icon")),
        "delivery": item.get("delivery"),
        "rating": number_from(item.get("rating")),
        "reviews": number_from(item.get("reviews")),
        "buy_url": "/api/go?" + urlencode({"product": product.id, "shop": shop}),
        "_token": item.get("immersive_product_page_token"),
        "_google_link": safe_http_url(item.get("product_link") or item.get("link")),
    }

# เลือกราคาถูกสุดของแต่ละร้าน ตัดราคาที่ต่ำ/สูงผิดปกติเมื่อเทียบค่ากลาง (มักเป็นของปลอม/อุปกรณ์เสริม/ชุดพ่วง)
# แล้วเรียงจากถูกไปแพง เหลือไม่เกิน MAX_OFFERS_PER_PRODUCT ร้าน
def select_offers(offers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cheapest: dict[str, dict[str, Any]] = {}
    for offer in offers:
        key = offer["shop"].casefold()
        if key not in cheapest or offer["price"] < cheapest[key]["price"]:
            cheapest[key] = offer
    if not cheapest:
        return []
    median = statistics.median(offer["price"] for offer in cheapest.values())
    kept = [
        offer
        for offer in cheapest.values()
        if OUTLIER_LOW_RATIO * median <= offer["price"] <= OUTLIER_HIGH_RATIO * median
    ]
    return sorted(kept, key=lambda offer: offer["price"])[:MAX_OFFERS_PER_PRODUCT]

# ค้นหนึ่งรุ่น (1 คำขอ SerpApi) แล้วสรุปเป็นรายการแคตตาล็อกพร้อมรายชื่อร้าน
async def fetch_tracked_product(
    product: TrackedProduct,
    api_key: str,
    client: httpx.AsyncClient,
    *,
    no_cache: bool = False,
) -> dict[str, Any]:
    payload = await serpapi_get(shopping_params(product.query, api_key, no_cache=no_cache), client)
    candidates = [normalize_offer(item, product) for item in collect_shopping_results(payload)]
    offers = select_offers([offer for offer in candidates if offer])
    if not offers:
        raise MarketDataError("NO_PRODUCTS")
    prices = [offer["price"] for offer in offers]
    return {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "image_url": next((offer["image_url"] for offer in offers if offer["image_url"]), None),
        "lowest_price": prices[0],
        "highest_price": prices[-1],
        "median_price": round(statistics.median(prices)),
        "shop_count": len(offers),
        "offers": offers,
    }

# ใช้แคชในหน่วยความจำก่อน; refresh=True ข้ามแคชและบังคับ SerpApi ค้นใหม่
async def load_tracked_product(
    product: TrackedProduct,
    api_key: str,
    client: httpx.AsyncClient,
    *,
    refresh: bool = False,
) -> dict[str, Any]:
    if not refresh:
        cached = cache_get(CATALOG_CACHE, product.id, CATALOG_CACHE_SECONDS)
        if cached is not None:
            return cached
    result = await fetch_tracked_product(product, api_key, client, no_cache=refresh)
    cache_put(CATALOG_CACHE, product.id, result)
    return result

def public_catalog_item(item: dict[str, Any]) -> dict[str, Any]:
    offers = [{k: v for k, v in offer.items() if not k.startswith("_")} for offer in item["offers"]]
    return {**item, "offers": offers}

# หาลิงก์หน้าร้านจริงของข้อเสนอหนึ่งรายการผ่าน Google Immersive Product API (1 คำขอ SerpApi ต่อครั้งที่ไม่โดนแคช)
# เลือกร้านที่ชื่อตรงกับ shop ก่อน ถ้าไม่พบใช้ร้านแรกที่มีลิงก์
async def resolve_store_link(token: str, shop: str, api_key: str, client: httpx.AsyncClient) -> str | None:
    payload = await serpapi_get(
        {"engine": "google_immersive_product", "page_token": token, "gl": "th", "hl": "th", "api_key": api_key},
        client,
    )
    results = payload.get("product_results")
    stores = results.get("stores") if isinstance(results, dict) else None
    if not isinstance(stores, list):
        return None
    linked = [store for store in stores if isinstance(store, dict) and safe_http_url(store.get("link"))]
    wanted = shop.casefold()
    chosen = next((store for store in linked if str(store.get("name") or "").casefold() == wanted), None)
    chosen = chosen or (linked[0] if linked else None)
    return chosen["link"] if chosen else None
# ตัวช่วยตอบ JSON พร้อม cache header; ใช้ทั้ง API สุขภาพและ API ราคา

# cache_seconds=None → no-store; มีค่า → ตั้ง Vercel CDN cache ตามจำนวนวินาที
# ผลครบใช้ 3600 วินาที ผลบางหมวดใช้ 900 วินาที; refresh=1 ส่งแบบ no-store
def json_response(
    content: dict[str, Any],
    status_code: int = 200,
    *,
    cache_seconds: int | None = None,
) -> JSONResponse:
    headers = {"Cache-Control": "no-store"}
    if cache_seconds is not None:
        headers = {
            "Cache-Control": "public, max-age=0, must-revalidate",
            "Vercel-CDN-Cache-Control": (
                f"public, s-maxage={cache_seconds}, stale-while-revalidate=300"
            ),
        }
    return JSONResponse(content=content, status_code=status_code, headers=headers)
# GET /api/health ใช้ตรวจบริการและว่าตั้งชื่อ SERPAPI_KEY แล้วหรือยัง

# live_data_configured=True ไม่ได้ยืนยันว่าคีย์ใช้ได้ ต้องลอง GET /api/prices อีกครั้ง
@app.get("/api/health")
async def health() -> JSONResponse:
    return json_response(
        {
            "ok": True,
            "service": "IT Market Intelligence",
            "runtime": "Python / FastAPI",
            "live_data_configured": bool(os.getenv("SERPAPI_KEY")),
        }
    )
# GET /api/prices เป็นเส้นทางที่ dist/app.js เรียกเพื่อขอสินค้า

# เปลี่ยน URL API ต้องแก้ decorator ด้านล่างและ fetch ใน dist/app.js ให้ตรงกัน
# ผลลัพธ์เป็น JSON; ถ้าคีย์หายตอบ 503 ถ้าทุกหมวดล้มตอบ 502 ถ้าบางหมวดสำเร็จตอบ 200
@app.get("/api/prices")
async def live_prices(request: Request) -> JSONResponse:
    # อ่านคีย์จาก environment เมื่อรับคำขอ; ห้ามใส่ค่าคีย์จริงลงใน source code
    api_key = os.getenv("SERPAPI_KEY")
    if not api_key:
        return json_response({"ok": False, "error": "SERPAPI_KEY is not configured"}, 503)
    # คำขอ refresh=1 มาจากปุ่มอัปเดตหน้าเว็บ ใช้ข้ามทั้ง cache ของ CDN และ cache ของ SerpApi
    # ทุกครั้งที่กดจะใช้โควตา SerpApi เท่ากับจำนวนหมวดใน CATEGORY_QUERIES
    refresh_requested = request.query_params.get("refresh") == "1"
    queries = list(CATEGORY_QUERIES.items())
    async with httpx.AsyncClient(timeout=httpx.Timeout(20.0)) as client:
        # asyncio.gather ส่งคำขอทุกหมวดพร้อมกัน; return_exceptions=True เก็บความล้มเหลวรายหมวด
        settled = await asyncio.gather(
            *(
                fetch_category(category, query, api_key, client, no_cache=refresh_requested)
                for category, query in queries
            ),
            return_exceptions=True,
        )
    # แยกผลสำเร็จ/ผิดพลาด เพื่อให้ส่งผลสำเร็จบางหมวดได้โดยไม่ทิ้งข้อมูลทั้งหมด
    # failed_category_reasons เก็บรหัสมาตรฐาน ไม่ใส่ข้อความดิบหรือคีย์ในคำตอบ
    category_results: dict[str, list[dict[str, Any]]] = {}
    failed_categories: list[str] = []
    failed_category_reasons: dict[str, str] = {}
    for (category, _), result in zip(queries, settled, strict=True):
        if isinstance(result, BaseException):
            code = result.code if isinstance(result, MarketDataError) else "SERPAPI_UPSTREAM_ERROR"
            code = code if code in ERROR_MESSAGES else "SERPAPI_UPSTREAM_ERROR"
            failed_categories.append(category)
            failed_category_reasons[category] = code
        else:
            category_results[category] = result
    # รวมสินค้าเรียงตามลำดับ CATEGORY_QUERIES; หากไม่เหลือสินค้าเลยจะตอบ 502
    products = [
        product
        for category, _ in queries
        for product in category_results.get(category, [])
    ]
    if not products:
        first_code = next(iter(failed_category_reasons.values()), "NO_PRODUCTS")
        return json_response(
            {"ok": False, "code": first_code, "error": ERROR_MESSAGES[first_code]},
            502,
        )
    # สร้าง payload ที่ dist/app.js อ่าน; cached=False คือคำตอบจาก origin ก่อนเบราว์เซอร์ตรวจ CDN header
    payload: dict[str, Any] = {
        "ok": True,
        "provider": "SerpApi / Google Shopping Thailand",
        "generated_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "cached": False,
        "refresh_window_minutes": 15 if failed_categories else 60,
        "products": products,
        "categories": [
            {"name": category, "count": len(category_results.get(category, []))}
            for category, _ in queries
        ],
    }
    if failed_categories:
        payload.update(
            {
                "warning": "Some categories could not be updated.",
                "failed_categories": failed_categories,
                "failed_category_reasons": failed_category_reasons,
            }
        )

    # 900=15 นาทีเมื่อบางหมวดล้ม; 3600=60 นาทีเมื่อครบ; เปลี่ยนตัวเลขนี้เพื่อปรับ CDN cache
    cache_seconds = None if refresh_requested else (900 if failed_categories else 3600)
    return json_response(payload, cache_seconds=cache_seconds)

# GET /api/catalog คือข้อมูลหน้าแรก: ทุกรุ่นใน TRACKED_PRODUCTS พร้อมรายชื่อร้านและราคาของแต่ละร้าน
# รหัสสถานะเหมือน /api/prices: ไม่มีคีย์ 503, ทุกรุ่นล้ม 502, บางรุ่นสำเร็จ 200 พร้อม failed_products
@app.get("/api/catalog")
async def catalog(request: Request) -> JSONResponse:
    api_key = os.getenv("SERPAPI_KEY")
    if not api_key:
        return json_response({"ok": False, "error": "SERPAPI_KEY is not configured"}, 503)
    refresh_requested = request.query_params.get("refresh") == "1"
    # timeout 30 วินาที เพราะบางคำค้นรุ่นเฉพาะใช้เวลานานกว่า; ยังอยู่ใน maxDuration 60 วินาทีของ vercel.json
    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
        settled = await asyncio.gather(
            *(
                load_tracked_product(product, api_key, client, refresh=refresh_requested)
                for product in TRACKED_PRODUCTS
            ),
            return_exceptions=True,
        )
    items: list[dict[str, Any]] = []
    failed_reasons: dict[str, str] = {}
    for product, result in zip(TRACKED_PRODUCTS, settled, strict=True):
        if isinstance(result, BaseException):
            code = result.code if isinstance(result, MarketDataError) else "SERPAPI_UPSTREAM_ERROR"
            failed_reasons[product.id] = code if code in ERROR_MESSAGES else "SERPAPI_UPSTREAM_ERROR"
        else:
            items.append(public_catalog_item(result))
    if not items:
        first_code = next(iter(failed_reasons.values()), "NO_PRODUCTS")
        return json_response(
            {"ok": False, "code": first_code, "error": ERROR_MESSAGES[first_code]},
            502,
        )
    payload: dict[str, Any] = {
        "ok": True,
        "provider": "SerpApi / Google Shopping Thailand",
        "generated_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "products": items,
    }
    if failed_reasons:
        payload.update({"failed_products": list(failed_reasons), "failed_product_reasons": failed_reasons})
    cache_seconds = None if refresh_requested else (900 if failed_reasons else 3600)
    return json_response(payload, cache_seconds=cache_seconds)

# GET /api/go?product=<id>&shop=<ชื่อร้าน> คือปุ่ม "ไปที่ร้าน": หาลิงก์หน้าร้านจริงแล้ว redirect ไป
# รับเฉพาะรุ่นใน TRACKED_PRODUCTS และร้านที่อยู่ในผลค้นหาของรุ่นนั้น จึงใช้ยิงโควตาแบบสุ่มไม่ได้
# ถ้าหาลิงก์ร้านไม่ได้ จะส่งไปหน้า Google Shopping ของสินค้านั้นแทน
@app.get("/api/go")
async def go_to_shop(product: str = "", shop: str = "") -> Response:
    tracked = TRACKED_BY_ID.get(product)
    if tracked is None or not shop:
        return json_response({"ok": False, "error": "Unknown product or shop"}, 404)
    api_key = os.getenv("SERPAPI_KEY")
    if not api_key:
        return json_response({"ok": False, "error": "SERPAPI_KEY is not configured"}, 503)
    async with httpx.AsyncClient(timeout=httpx.Timeout(20.0)) as client:
        try:
            item = await load_tracked_product(tracked, api_key, client)
        except MarketDataError as error:
            return json_response({"ok": False, "code": error.code, "error": ERROR_MESSAGES[error.code]}, 502)
        offer = next((offer for offer in item["offers"] if offer["shop"] == shop), None)
        if offer is None:
            return json_response({"ok": False, "error": "This shop no longer lists the product"}, 404)
        link: str | None = None
        token = offer.get("_token")
        if token:
            # เก็บ "" เมื่อหาไม่พบ เพื่อไม่ต้องเรียก SerpApi ซ้ำสำหรับร้านเดิม
            cached = cache_get(STORE_LINK_CACHE, (token, shop), STORE_LINK_CACHE_SECONDS)
            if cached is not None:
                link = cached or None
            else:
                try:
                    link = await resolve_store_link(token, shop, api_key, client)
                except MarketDataError:
                    link = None
                else:
                    cache_put(STORE_LINK_CACHE, (token, shop), link or "")
    target = link or offer.get("_google_link")
    if not target:
        return json_response({"ok": False, "error": "Store link unavailable"}, 502)
    return RedirectResponse(target, status_code=302, headers={"Cache-Control": "no-store"})

# ===== หน้า "ทองและค่าเงิน": อ่านจากฐานข้อมูล EquipmentPriceDB (SQL Server) ที่สร้างจาก EquipmentPriceDB.sql =====
# ข้อมูลในฐานนี้เป็นข้อมูลจำลอง หน้าเว็บจึงติดป้ายบอกผู้ใช้ทุกครั้ง
# ตั้งค่าการเชื่อมต่อด้วย EQUIPMENT_DB_CONNECTION (ODBC connection string) ใน .env; ถ้าไม่ตั้ง API จะตอบ 503
# ใช้ pyodbc แบบ import ตอนเรียกใช้ เพื่อให้แอปส่วนอื่นยังทำงานได้บนเครื่องที่ไม่มี ODBC driver (เช่น Vercel)
EQUIPMENT_DB_ERRORS = {
    "DB_NOT_CONFIGURED": "EQUIPMENT_DB_CONNECTION is not configured.",
    "DB_DRIVER_MISSING": "pyodbc or the SQL Server ODBC driver is not installed.",
    "DB_UNAVAILABLE": "Could not read from EquipmentPriceDB.",
    "NOT_FOUND": "Unknown equipment code.",
}

class EquipmentDbError(Exception):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code

def equipment_connect() -> Any:
    connection_string = os.getenv("EQUIPMENT_DB_CONNECTION")
    if not connection_string:
        raise EquipmentDbError("DB_NOT_CONFIGURED")
    try:
        import pyodbc
    except ImportError as error:
        raise EquipmentDbError("DB_DRIVER_MISSING") from error
    try:
        return pyodbc.connect(connection_string, timeout=5, readonly=True)
    except pyodbc.Error as error:
        raise EquipmentDbError("DB_UNAVAILABLE") from error

# แปลงค่าจาก SQL Server ให้เป็น JSON ได้: DECIMAL → float, DATE → "YYYY-MM-DD"
def db_value(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, date):
        return value.isoformat()
    return value

def db_rows(connection: Any, sql: str, *params: Any) -> list[dict[str, Any]]:
    cursor = connection.cursor()
    cursor.execute(sql, *params)
    columns = [column[0] for column in cursor.description]
    return [{name: db_value(value) for name, value in zip(columns, row, strict=True)} for row in cursor.fetchall()]

def equipment_error(code: str) -> JSONResponse:
    status = 404 if code == "NOT_FOUND" else 503
    return json_response({"ok": False, "code": code, "error": EQUIPMENT_DB_ERRORS[code]}, status)

# รายการอุปกรณ์ + ราคาล่าสุดเทียบวันฐาน + ค่าสหสัมพันธ์กับทอง/ค่าเงิน (จาก vw_PriceSummaryLatest และ vw_PriceCorrelation)
EQUIPMENT_SUMMARY_SQL = """
SELECT s.EquipmentCode AS code, s.EquipmentName AS name, s.CategoryName AS category,
       s.SupplierName AS supplier, s.BaseCurrency AS currency, s.GoldWeight AS gold_weight,
       s.BaseDate AS base_date, s.BasePriceTHB AS base_price, s.LatestDate AS latest_date,
       s.LatestPriceTHB AS latest_price, s.DiffTHB AS diff, s.PctChange AS pct_change,
       s.MinPrice AS min_price, s.MaxPrice AS max_price,
       c.CorrWithGold AS corr_gold, c.CorrWithFx AS corr_fx
FROM dbo.vw_PriceSummaryLatest s
JOIN dbo.vw_PriceCorrelation c ON c.EquipmentCode = s.EquipmentCode
"""

# GET /api/equipment/overview: ราคาทอง/ค่าเงินล่าสุด, กราฟราคาทองทั้งช่วง และตารางอุปกรณ์ทั้งหมด
# ใช้ def ธรรมดา (ไม่ใช่ async) เพราะ pyodbc เป็นแบบ blocking; FastAPI จะรันใน thread pool ให้เอง
@app.get("/api/equipment/overview")
def equipment_overview() -> JSONResponse:
    try:
        with closing(equipment_connect()) as connection:
            market = db_rows(
                connection,
                "SELECT PriceDate AS date, GoldBarBuyTHB AS gold_buy, GoldBarSellTHB AS gold_sell,"
                " USD, EUR, JPY, CNY FROM dbo.vw_MarketDaily ORDER BY PriceDate",
            )
            equipment = db_rows(connection, EQUIPMENT_SUMMARY_SQL + " ORDER BY s.PctChange DESC")
    except EquipmentDbError as error:
        return equipment_error(error.code)
    except Exception:
        return equipment_error("DB_UNAVAILABLE")
    if not market:
        return equipment_error("DB_UNAVAILABLE")
    first, previous, latest = market[0], market[-2] if len(market) > 1 else market[0], market[-1]
    currencies = ("USD", "EUR", "JPY", "CNY")
    return json_response(
        {
            "ok": True,
            "source": "EquipmentPriceDB",
            "is_mock_data": True,
            "start_date": first["date"],
            "latest_date": latest["date"],
            "gold": {
                "buy": latest["gold_buy"],
                "sell": latest["gold_sell"],
                "change_day": latest["gold_sell"] - previous["gold_sell"],
                "change_period": latest["gold_sell"] - first["gold_sell"],
                "change_period_pct": (latest["gold_sell"] - first["gold_sell"]) * 100 / first["gold_sell"],
            },
            "fx": {
                code: {
                    "rate": latest[code],
                    "change_period_pct": (latest[code] - first[code]) * 100 / first[code],
                }
                for code in currencies
            },
            "gold_series": [{"date": row["date"], "value": row["gold_sell"]} for row in market],
            "equipment": equipment,
        }
    )

# GET /api/equipment/{code}: ข้อมูลอุปกรณ์หนึ่งรายการ + ดัชนีราคา/ทอง/ค่าเงินรายวัน (วันฐาน = 100) + สรุปรายเดือน
@app.get("/api/equipment/{code}")
def equipment_detail(code: str) -> JSONResponse:
    try:
        with closing(equipment_connect()) as connection:
            info = db_rows(connection, EQUIPMENT_SUMMARY_SQL + " WHERE s.EquipmentCode = ?", code)
            if not info:
                raise EquipmentDbError("NOT_FOUND")
            series = db_rows(
                connection,
                """
                SELECT h.PriceDate AS date, h.SellPriceTHB AS price,
                       CAST(h.SellPriceTHB * 100.0 / b.SellPriceTHB AS DECIMAL(10,2)) AS price_index,
                       CAST(h.GoldIndex * 100 AS DECIMAL(10,2)) AS gold_index,
                       CAST(h.FxIndex * 100 AS DECIMAL(10,2)) AS fx_index
                FROM dbo.EquipmentPriceHistory h
                JOIN dbo.Equipment e ON e.EquipmentID = h.EquipmentID
                JOIN dbo.EquipmentPriceHistory b ON b.EquipmentID = e.EquipmentID AND b.PriceDate = e.BaseDate
                WHERE e.EquipmentCode = ?
                ORDER BY h.PriceDate
                """,
                code,
            )
            monthly = db_rows(
                connection,
                "SELECT MonthStart AS month, AvgSellTHB AS avg_price, MinSellTHB AS min_price,"
                " MaxSellTHB AS max_price, AvgGoldSellTHB AS avg_gold FROM dbo.vw_MonthlyPrice"
                " WHERE EquipmentCode = ? ORDER BY MonthStart",
                code,
            )
    except EquipmentDbError as error:
        return equipment_error(error.code)
    except Exception:
        return equipment_error("DB_UNAVAILABLE")
    return json_response({"ok": True, "is_mock_data": True, **info[0], "series": series, "monthly": monthly})
# ส่วน static frontend: ก่อนเสิร์ฟเว็บต้องมีโฟลเดอร์ dist มิฉะนั้นแอปเริ่มไม่ได้
# app.frontend ให้ FastAPI เสิร์ฟหน้าเว็บที่ / ขณะที่ /api/* ยังเป็น API routes
# แก้ข้อความ/เมนูเว็บใน dist/index.html โดยค้น page-title, main-nav และ refresh-live
# แก้สี/ขนาดใน dist/styles.css โดยค้น :root, --bg, .sidebar และ .card
# แก้ตาราง/กราฟ/ปุ่มใน dist/app.js โดยค้น renderDashboard, productTable, loadLiveData
# main.py ใช้แก้ข้อมูลและ API; หากแก้หน้าตาอย่างเดียวไม่ต้องเปลี่ยน Python
if not FRONTEND_DIR.is_dir():
    raise RuntimeError(f"Frontend directory not found: {FRONTEND_DIR}")

# ให้ Vercel CDN จัดการไฟล์ dist ส่วน FastAPI ยังรับเส้นทาง /api/*
app.frontend("/", directory="dist")

# แผนที่แก้ไข main.py: อ้างด้วยชื่อแทนเลขบรรทัด เพื่อไม่ให้คลาดเมื่อโค้ดเลื่อน (ใช้ Ctrl+F ค้นชื่อ)
# เปลี่ยนคีย์ → แก้ SERPAPI_KEY ในไฟล์ .env โดยแทน replace_with_your_serpapi_key ไม่แก้คีย์ใน Python
# จุดโหลด/อ่านคีย์ → ค้น load_dotenv และ os.getenv("SERPAPI_KEY"); Vercel ใช้ SERPAPI_KEY ใน Environment Variables
# เปลี่ยนหมวด/คำค้น → ค้น CATEGORY_QUERIES; เพิ่มหมวดแล้วตรวจโควตา API
# เพิ่มแบรนด์ → ค้น KNOWN_BRANDS; detect_brand ใช้รายการนี้ผ่าน BRAND_PATTERNS
# เปลี่ยนคำกรอง CPU/GPU/มือสอง → ค้น USED_PRODUCT_PATTERN, GPU_PATTERN, CPU_PATTERN และ matches_hardware_category
# เปลี่ยนฟิลด์สินค้า → ค้น normalize_product โดยเฉพาะ dict ที่ return
# ฟิลด์ที่แก้ต้องตรงกับ dist/app.js ที่ใช้ name, price, shop, category, stock_label และ source_url
# เปลี่ยน API ต้นทาง/พารามิเตอร์ → ค้น fetch_category แล้วแก้ params
# จุดส่งคำขอจริงคือ client.get ใน fetch_category; ไม่ต้องแก้ dist/app.js เพื่อเปลี่ยน SerpApi query
# เปลี่ยนจำนวนผลต่อหมวด → ค้น len(products) == 8 แล้วตรวจผลบนหน้าเว็บ
# เปลี่ยน URL API ของเว็บ → ค้น @app.get("/api/prices") และ fetch(`/api/prices ใน dist/app.js ให้ใช้เส้นทางเดียวกัน
# เปลี่ยนเวลาแคช → ค้น cache_seconds แก้ 900/3600 วินาที; refresh=1 จะไม่แคช CDN
# เปลี่ยนชื่อเมนู/หัวหน้าเว็บ → dist/index.html ค้น brand-name, data-view, page-title
# เปลี่ยนสี/รูปแบบ → dist/styles.css ค้น :root, .sidebar, .filters, .card
# เปลี่ยนตาราง/กราฟ/สูตร → dist/app.js ค้น renderDashboard, analyze; โหลด API/รีเฟรช → ค้น loadLiveData

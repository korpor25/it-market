from __future__ import annotations

import asyncio
import math
import os
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


PROJECT_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_DIR = PROJECT_ROOT / "dist"
load_dotenv(PROJECT_ROOT / ".env")

CATEGORY_QUERIES = {
    "GPU": "การ์ดจอ",
    "CPU": "ซีพียู",
    "RAM": "RAM DDR5 32GB",
    "SSD": "SSD NVMe 1TB",
    "Notebook": "Notebook gaming laptop",
    "Monitor": "Monitor จอคอม 27 นิ้ว",
}

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


class MarketDataError(Exception):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


app = FastAPI(
    title="IT Market Intelligence",
    description="Thailand IT hardware market prices from Google Shopping via SerpApi.",
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)


def base36(value: int) -> str:
    alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
    if value == 0:
        return "0"
    output = ""
    while value:
        value, remainder = divmod(value, 36)
        output = alphabet[remainder] + output
    return output


def text_hash(value: str) -> str:
    """Return the same unsigned FNV-1a hash used by the previous JS API."""
    hash_value = 2166136261
    encoded = value.encode("utf-16-le")
    for index in range(0, len(encoded), 2):
        code_unit = encoded[index] | (encoded[index + 1] << 8)
        hash_value ^= code_unit
        hash_value = (hash_value * 16777619) & 0xFFFFFFFF
    return base36(hash_value)


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


def detect_brand(title: str) -> str:
    lowered = title.lower()
    return next((brand for brand in KNOWN_BRANDS if brand.lower() in lowered), "Other")


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


def normalize_product(item: dict[str, Any], category: str) -> dict[str, Any] | None:
    title = str(item.get("title") or "").strip()
    price = number_from(item.get("extracted_price", item.get("price")))
    if not title or price is None or price <= 0 or not matches_hardware_category(title, category):
        return None

    original_price = number_from(
        item.get("extracted_old_price", item.get("old_price", item.get("original_price")))
    )
    original_price = original_price or price
    shop = str(item.get("source") or item.get("merchant") or "Google Shopping").strip()
    stable_key = str(item.get("product_id") or item.get("link") or f"{category}|{title}|{shop}")
    delivery = item.get("delivery") or "ตรวจสอบที่ร้าน"
    rating = number_from(item.get("rating"))

    return {
        "id": f"LIVE-{text_hash(stable_key)}",
        "category": category,
        "brand": detect_brand(title),
        "model": title,
        "name": title,
        "shop": shop,
        "price": round(price),
        "original": max(round(original_price), round(price)),
        "stock": True,
        "stock_label": delivery,
        "source_url": item.get("link") or item.get("product_link"),
        "image_url": item.get("thumbnail") or item.get("serpapi_thumbnail"),
        "rating": rating,
        "reviews": number_from(item.get("reviews")),
        "specs": {
            "แหล่งข้อมูล": shop,
            "การจัดส่ง": delivery,
            "คะแนนรีวิว": f"{item['rating']}/5" if item.get("rating") else "ไม่มีข้อมูล",
        },
    }


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


async def fetch_category(
    category: str,
    query: str,
    api_key: str,
    client: httpx.AsyncClient,
) -> list[dict[str, Any]]:
    endpoint = "https://serpapi.com/search.json?" + urlencode(
        {
            "engine": "google_shopping",
            "q": query,
            "gl": "th",
            "hl": "th",
            "location": "Thailand",
            "api_key": api_key,
        }
    )
    try:
        response = await client.get(endpoint, headers={"accept": "application/json"})
    except httpx.TimeoutException as error:
        raise MarketDataError("SERPAPI_TIMEOUT") from error
    except httpx.HTTPError as error:
        raise MarketDataError("SERPAPI_UNREACHABLE") from error

    try:
        payload = response.json()
    except ValueError as error:
        raise MarketDataError("SERPAPI_INVALID_RESPONSE") from error
    if not isinstance(payload, dict):
        raise MarketDataError("SERPAPI_INVALID_RESPONSE")
    if not response.is_success or payload.get("error"):
        raise MarketDataError(classify_serpapi_error(response.status_code, payload.get("error")))

    products: list[dict[str, Any]] = []
    seen: set[str] = set()
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


@app.get("/api/prices")
async def live_prices(request: Request) -> JSONResponse:
    api_key = os.getenv("SERPAPI_KEY")
    if not api_key:
        return json_response({"ok": False, "error": "SERPAPI_KEY is not configured"}, 503)

    refresh_requested = request.query_params.get("refresh") == "1"
    queries = list(CATEGORY_QUERIES.items())
    async with httpx.AsyncClient(timeout=httpx.Timeout(20.0)) as client:
        settled = await asyncio.gather(
            *(fetch_category(category, query, api_key, client) for category, query in queries),
            return_exceptions=True,
        )

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

    cache_seconds = None if refresh_requested else (900 if failed_categories else 3600)
    return json_response(payload, cache_seconds=cache_seconds)


if not FRONTEND_DIR.is_dir():
    raise RuntimeError(f"Frontend directory not found: {FRONTEND_DIR}")

# Vercel promotes this frontend directory to its CDN while API routes keep priority.
app.frontend("/", directory="dist")

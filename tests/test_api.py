from __future__ import annotations

from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient

import app.main as main


client = TestClient(main.app)


@pytest.fixture(autouse=True)
def clear_catalog_caches() -> None:
    main.CATALOG_CACHE.clear()
    main.STORE_LINK_CACHE.clear()


def product_title(query: str) -> str:
    if query == "ซีพียู":
        return "Intel Core i5-14400F CPU"
    if query == "การ์ดจอ":
        return "Zotac GeForce RTX 5060 8GB"
    return f"{query} Test Product"


def test_health_reports_python_runtime(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("SERPAPI_KEY", raising=False)
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "ok": True,
        "service": "IT Market Intelligence",
        "runtime": "Python / FastAPI",
        "live_data_configured": False,
    }
    assert response.headers["cache-control"] == "no-store"


def test_prices_reports_missing_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("SERPAPI_KEY", raising=False)
    response = client.get("/api/prices")

    assert response.status_code == 503
    assert response.json() == {
        "ok": False,
        "error": "SERPAPI_KEY is not configured",
    }
    assert response.headers["cache-control"] == "no-store"


@pytest.mark.asyncio
async def test_fetch_category_normalizes_serpapi_results() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.host == "serpapi.com"
        assert request.url.params["api_key"] == "test-key"
        return httpx.Response(
            200,
            json={
                "shopping_results": [
                    {
                        "product_id": "gpu-1",
                        "title": "Zotac GeForce RTX 5060 8GB",
                        "extracted_price": "฿16,400",
                        "source": "Test Shop",
                        "rating": 4.8,
                    }
                ]
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as mock_client:
        products = await main.fetch_category("GPU", "การ์ดจอ", "test-key", mock_client)

    assert len(products) == 1
    assert products[0]["category"] == "GPU"
    assert products[0]["brand"] == "Zotac"
    assert products[0]["price"] == 16400
    assert products[0]["stock"] is None
    assert products[0]["specs"]["คะแนนรีวิว"] == "4.8/5"


@pytest.mark.asyncio
async def test_fetch_category_sends_no_cache_only_when_requested() -> None:
    seen: list[str | None] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request.url.params.get("no_cache"))
        return httpx.Response(
            200,
            json={"shopping_results": [{"title": "Zotac GeForce RTX 5060", "extracted_price": 9900}]},
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as mock_client:
        await main.fetch_category("GPU", "การ์ดจอ", "test-key", mock_client)
        await main.fetch_category("GPU", "การ์ดจอ", "test-key", mock_client, no_cache=True)

    assert seen == [None, "true"]


def test_detect_brand_matches_whole_words_only() -> None:
    assert main.detect_brand("Intel Core i5-14400F") == "Intel"
    assert main.detect_brand("ASUS ROG Strix") == "ASUS"
    assert main.detect_brand("จอ LG 27 นิ้ว") == "LG"
    assert main.detect_brand("Intelligent Power Supply") == "Other"
    assert main.detect_brand("HPE ProLiant server") == "Other"


def test_prices_returns_partial_results(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SERPAPI_KEY", "test-key")

    async def fake_fetch_category(
        category: str,
        query: str,
        api_key: str,
        _client: httpx.AsyncClient,
        *,
        no_cache: bool = False,
    ) -> list[dict[str, Any]]:
        assert api_key == "test-key"
        assert no_cache is False
        if category == "CPU":
            raise main.MarketDataError("SERPAPI_UPSTREAM_ERROR")
        return [{"id": f"LIVE-{category}", "category": category, "name": product_title(query)}]

    monkeypatch.setattr(main, "fetch_category", fake_fetch_category)
    response = client.get("/api/prices")
    payload = response.json()

    assert response.status_code == 200
    assert len(payload["products"]) == 5
    assert payload["failed_categories"] == ["CPU"]
    assert payload["failed_category_reasons"] == {"CPU": "SERPAPI_UPSTREAM_ERROR"}
    assert payload["refresh_window_minutes"] == 15
    assert response.headers["vercel-cdn-cache-control"].startswith("public, s-maxage=900")


def test_refresh_bypasses_vercel_cache(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SERPAPI_KEY", "test-key")

    async def fake_fetch_category(
        category: str,
        _query: str,
        _api_key: str,
        _client: httpx.AsyncClient,
        *,
        no_cache: bool = False,
    ) -> list[dict[str, Any]]:
        assert no_cache is True
        return [{"id": f"LIVE-{category}", "category": category}]

    monkeypatch.setattr(main, "fetch_category", fake_fetch_category)
    response = client.get("/api/prices?refresh=1")

    assert response.status_code == 200
    assert response.json()["cached"] is False
    assert response.headers["cache-control"] == "no-store"
    assert "vercel-cdn-cache-control" not in response.headers


def test_all_failures_are_sanitized(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SERPAPI_KEY", "private-key")

    async def rejected(*_args: Any, **_kwargs: Any) -> list[dict[str, Any]]:
        raise main.MarketDataError("SERPAPI_INVALID_KEY")

    monkeypatch.setattr(main, "fetch_category", rejected)
    response = client.get("/api/prices")
    serialized = response.text

    assert response.status_code == 502
    assert response.json()["code"] == "SERPAPI_INVALID_KEY"
    assert "private-key" not in serialized


def test_filters_unrelated_and_used_hardware() -> None:
    assert not main.matches_hardware_category("ขนมถั่วอบกรอบ", "CPU")
    assert not main.matches_hardware_category("คอมประกอบ Intel Core i7 RAM 8GB", "CPU")
    assert not main.matches_hardware_category("GeForce GTX 1650 มือสอง", "GPU")
    assert main.matches_hardware_category("Intel Core i5-14400F CPU BOX", "CPU")
    assert main.matches_hardware_category("Zotac GeForce RTX 5060 8GB", "GPU")


RTX_5070 = main.TRACKED_BY_ID["rtx-5070"]
RYZEN_9700X = main.TRACKED_BY_ID["ryzen-7-9700x"]
SN770 = main.TRACKED_BY_ID["wd-black-sn770-1tb"]


def test_catalog_filters_wrong_models_and_listings() -> None:
    assert main.accepts_offer(RTX_5070, "MSI GeForce RTX 5070 12G VENTUS 2X OC")
    assert not main.accepts_offer(RTX_5070, "MSI GeForce RTX 5070 Ti 16G")
    assert not main.accepts_offer(RTX_5070, "คอมประกอบ RTX 5070 Ryzen 7")
    assert not main.accepts_offer(RTX_5070, "VGA RTX5070 12GB (มือ 1-2)")
    assert main.accepts_offer(RYZEN_9700X, "CPU AMD AM5 RYZEN 7 9700X (NEXT)")
    assert not main.accepts_offer(RYZEN_9700X, "AMD R5 9600X R7 9700X R9 9900X หลวมชิ้น")
    assert not main.accepts_offer(RYZEN_9700X, "Ryzen 7 9700X + Mainboard B650")
    i5 = main.TRACKED_BY_ID["core-i5-14400f"]
    assert not main.accepts_offer(i5, "คอมเซ็ทเดสก์ท็อป i5-14400F เลือกการ์ดจอ GTX1650-RTX5070 RAM 16-32GB")
    assert not main.accepts_offer(i5, "Computer Set - E-QUIP (i5-14400F | RAM32GB | SSD 1TB | RX 9060 XT)")
    assert main.accepts_offer(i5, "Intel Core i5-14400F 2.5GHz 10C 16T (ไม่มีการ์ดจอในตัว)")
    assert main.accepts_offer(SN770, "WD Black SN770 1TB NVMe")
    assert not main.accepts_offer(SN770, "WD Black SN770 2TB NVMe")


def offer(shop: str, price: int) -> dict[str, Any]:
    return {"shop": shop, "price": price, "title": f"{shop} item", "image_url": None}


def test_select_offers_keeps_cheapest_per_shop_and_drops_outliers() -> None:
    offers = [
        offer("JIB", 21000),
        offer("JIB", 20500),
        offer("Advice", 22000),
        offer("Banana", 23000),
        offer("Scam", 3000),
        offer("Import", 90000),
    ]

    selected = main.select_offers(offers)

    assert [(o["shop"], o["price"]) for o in selected] == [
        ("JIB", 20500),
        ("Advice", 22000),
        ("Banana", 23000),
    ]


@pytest.mark.asyncio
async def test_fetch_tracked_product_groups_shops() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["q"] == RTX_5070.query
        return httpx.Response(
            200,
            json={
                "shopping_results": [
                    {
                        "title": "Galax RTX 5070 EX Gamer 12GB",
                        "extracted_price": 28400,
                        "source": "Advice Online",
                        "immersive_product_page_token": "tok-advice",
                    },
                    {"title": "MSI RTX 5070 Ventus", "extracted_price": 27900, "source": "JIB"},
                    {"title": "RTX 5070 Ti Prime", "extracted_price": 39900, "source": "Banana"},
                    {"title": "RTX 5070", "extracted_price": 30000, "source": "ubuy.co.th"},
                ]
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as mock_client:
        item = await main.fetch_tracked_product(RTX_5070, "test-key", mock_client)

    assert item["shop_count"] == 2
    assert item["lowest_price"] == 27900
    assert [o["shop"] for o in item["offers"]] == ["JIB", "Advice Online"]
    assert item["offers"][1]["buy_url"] == "/api/go?product=rtx-5070&shop=Advice+Online"


def fake_catalog_item(product: main.TrackedProduct) -> dict[str, Any]:
    return {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "image_url": None,
        "lowest_price": 1000,
        "highest_price": 1200,
        "median_price": 1100,
        "shop_count": 1,
        "offers": [
            {
                "shop": "Test Shop",
                "title": product.name,
                "price": 1000,
                "buy_url": f"/api/go?product={product.id}&shop=Test+Shop",
                "_token": "secret-token",
                "_google_link": "https://www.google.com/search?ibp=oshop",
            }
        ],
    }


def test_catalog_returns_partial_results_without_private_fields(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SERPAPI_KEY", "test-key")

    async def fake_fetch(product: main.TrackedProduct, *_args: Any, **_kwargs: Any) -> dict[str, Any]:
        if product.id == "rtx-5060":
            raise main.MarketDataError("SERPAPI_TIMEOUT")
        return fake_catalog_item(product)

    monkeypatch.setattr(main, "fetch_tracked_product", fake_fetch)
    response = client.get("/api/catalog")
    payload = response.json()

    assert response.status_code == 200
    assert len(payload["products"]) == len(main.TRACKED_PRODUCTS) - 1
    assert payload["failed_product_reasons"] == {"rtx-5060": "SERPAPI_TIMEOUT"}
    assert "secret-token" not in response.text
    assert response.headers["vercel-cdn-cache-control"].startswith("public, s-maxage=900")


def test_go_redirects_to_store_link(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SERPAPI_KEY", "test-key")
    calls: list[str] = []

    async def fake_fetch(product: main.TrackedProduct, *_args: Any, **_kwargs: Any) -> dict[str, Any]:
        return fake_catalog_item(product)

    async def fake_resolve(token: str, shop: str, *_args: Any) -> str:
        calls.append(token)
        assert shop == "Test Shop"
        return "https://shop.example/rtx-5070"

    monkeypatch.setattr(main, "fetch_tracked_product", fake_fetch)
    monkeypatch.setattr(main, "resolve_store_link", fake_resolve)

    for _ in range(2):
        response = client.get("/api/go?product=rtx-5070&shop=Test+Shop", follow_redirects=False)
        assert response.status_code == 302
        assert response.headers["location"] == "https://shop.example/rtx-5070"
    assert calls == ["secret-token"]


def test_go_falls_back_to_google_and_rejects_unknown(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SERPAPI_KEY", "test-key")

    async def fake_fetch(product: main.TrackedProduct, *_args: Any, **_kwargs: Any) -> dict[str, Any]:
        return fake_catalog_item(product)

    async def failing_resolve(*_args: Any) -> str:
        raise main.MarketDataError("SERPAPI_LIMIT_REACHED")

    monkeypatch.setattr(main, "fetch_tracked_product", fake_fetch)
    monkeypatch.setattr(main, "resolve_store_link", failing_resolve)

    response = client.get("/api/go?product=rtx-5070&shop=Test+Shop", follow_redirects=False)
    assert response.status_code == 302
    assert response.headers["location"].startswith("https://www.google.com/")

    assert client.get("/api/go?product=unknown&shop=Test+Shop").status_code == 404
    assert client.get("/api/go?product=rtx-5070&shop=Other+Shop").status_code == 404


def test_equipment_reports_missing_connection(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("EQUIPMENT_DB_CONNECTION", raising=False)

    response = client.get("/api/equipment/overview")

    assert response.status_code == 503
    assert response.json()["code"] == "DB_NOT_CONFIGURED"
    assert response.headers["cache-control"] == "no-store"


def test_db_value_converts_sql_types() -> None:
    from datetime import date
    from decimal import Decimal

    assert main.db_value(Decimal("79000.00")) == 79000.0
    assert main.db_value(date(2026, 10, 14)) == "2026-10-14"
    assert main.db_value(None) is None


def equipment_db_available() -> bool:
    try:
        main.equipment_connect().close()
    except main.EquipmentDbError:
        return False
    return True


@pytest.mark.skipif(not equipment_db_available(), reason="EquipmentPriceDB is not reachable")
def test_equipment_api_reads_local_database() -> None:
    overview = client.get("/api/equipment/overview").json()
    assert overview["ok"] and overview["is_mock_data"]
    assert len(overview["gold_series"]) == 287
    assert {item["code"] for item in overview["equipment"]} >= {"EQ-001", "EQ-010"}

    detail = client.get("/api/equipment/EQ-004").json()
    assert detail["series"][0]["price_index"] == 100.0
    assert len(detail["monthly"]) == 10

    assert client.get("/api/equipment/EQ-999").status_code == 404

from __future__ import annotations

from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient

import app.main as main


client = TestClient(main.app)


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


def test_prices_returns_partial_results(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SERPAPI_KEY", "test-key")

    async def fake_fetch_category(
        category: str,
        query: str,
        api_key: str,
        _client: httpx.AsyncClient,
    ) -> list[dict[str, Any]]:
        assert api_key == "test-key"
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
    ) -> list[dict[str, Any]]:
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

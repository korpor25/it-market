from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_dashboard_is_served() -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert "IT Market Intelligence" in response.text
    assert 'lang="th"' in response.text


def test_frontend_assets_are_served() -> None:
    stylesheet = client.get("/styles.css")
    script = client.get("/app.js")

    assert stylesheet.status_code == 200
    assert "--bg: #f5f7fb" in stylesheet.text
    assert script.status_code == 200
    assert "x-vercel-cache" in script.text

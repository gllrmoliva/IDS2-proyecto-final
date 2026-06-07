import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest_asyncio.fixture
async def client():
    # ASGITransport invoca tu app directamente en memoria sin usar red real
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

@pytest_asyncio.fixture
async def get_auth_headers(client):
    async def _get_headers(username, password):
        login_data = {
            "username": username,
            "password": password
        }
        
        response = await client.post("/api/auth/token", data=login_data)
        assert response.status_code == 200, f"Error en login de prueba: {response.text}"
        
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
        
    return _get_headers

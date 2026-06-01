import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def get_auth_headers(client):
    def _get_headers(username, password):
        login_data = {
            "username": username,
            "password": password
        }
        
        response = client.post("api/auth/token", data=login_data)
        assert response.status_code == 200, f"Error en login de prueba: {response.text}"
        
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
        
    return _get_headers

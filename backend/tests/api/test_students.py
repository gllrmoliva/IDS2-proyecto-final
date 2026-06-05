# test_students_cases.py
import pytest

COORD_EMAIL = "ana.silva@colegio.cl"
PROD_EMAIL = "carlos.insp@colegio.cl"
PJ_EMAIL = "maria.prof@colegio.cl"

PASSWORD_COORD = "testpassword"
PASSWORD_PROD = "testpassword1"
PASSWORD_PJ = "testpassword3"

ESTUDIANTE_PROPIO_ID = "1000000-1"  # Estudiante del curso de PJ_EMAIL con casos
ESTUDIANTE_OTRO_ID = "2000001-1"   # Estudiante de OTRO curso
ESTUDIANTE_SIN_CASOS_ID = "1000010-0" # Estudiante real pero sin historial
ESTUDIANTE_FALSO_ID = "9999999999-9"   # Estudiante que no existe en DB


@pytest.mark.asyncio
async def test_get_cases_pj_own_student(client, get_auth_headers):
    """
    Test 1: Profesor Jefe consulta estudiante de su curso.
    Espera: 200 OK y una lista con elementos.
    """
    auth_headers = await get_auth_headers(PJ_EMAIL, PASSWORD_PJ)
    response = await client.get(
        f"/api/students/{ESTUDIANTE_PROPIO_ID}/cases",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


@pytest.mark.asyncio
async def test_get_cases_coordinador(client, get_auth_headers):
    """
    Test 2: Coordinador consulta cualquier estudiante.
    Espera: 200 OK y una lista con elementos.
    """
    auth_headers = await get_auth_headers(COORD_EMAIL, PASSWORD_COORD)
    response = await client.get(
        f"/api/students/{ESTUDIANTE_PROPIO_ID}/cases",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_cases_productor_forbidden(client, get_auth_headers):
    """
    Test 3: Productor intenta consultar casos.
    Espera: 403 Forbidden (Bloqueado por RoleChecker).
    """
    auth_headers = await get_auth_headers(PROD_EMAIL, PASSWORD_PROD)
    response = await client.get(
        f"/api/students/{ESTUDIANTE_PROPIO_ID}/cases",
        headers=auth_headers
    )
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_cases_pj_other_student_forbidden(client, get_auth_headers):
    """
    Test 4: Profesor Jefe consulta estudiante que NO es de su curso.
    Espera: 403 Forbidden.
    """
    auth_headers = await get_auth_headers(PJ_EMAIL, PASSWORD_PJ)
    response = await client.get(
        f"/api/students/{ESTUDIANTE_OTRO_ID}/cases",
        headers=auth_headers
    )
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_cases_unauthorized(client):
    """
    Test 5: Petición sin token de autenticación.
    Espera: 401 Unauthorized.
    """
    response = await client.get(f"/api/students/{ESTUDIANTE_PROPIO_ID}/cases")
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_cases_student_no_history(client, get_auth_headers):
    """
    Test 6: Estudiante existe, pero no tiene casos.
    Espera: 200 OK y una lista vacía.
    """
    auth_headers = await get_auth_headers(COORD_EMAIL, PASSWORD_COORD)
    response = await client.get(
        f"/api/students/{ESTUDIANTE_SIN_CASOS_ID}/cases",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_cases_student_not_found(client, get_auth_headers):
    """
    Test 7: Estudiante no existe en la base de datos.
    Espera: 404 Not Found.
    """
    auth_headers = await get_auth_headers(COORD_EMAIL, PASSWORD_COORD)
    response = await client.get(
        f"/api/students/{ESTUDIANTE_FALSO_ID}/cases",
        headers=auth_headers
    )
    
    assert response.status_code == 404

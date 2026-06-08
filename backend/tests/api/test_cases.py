import json
import pytest


@pytest.mark.asyncio
async def test_incidents_read(client, get_auth_headers):

    auth_headers = await get_auth_headers("carlos.insp@colegio.cl", "testpassword1")

    response = await client.get("/api/operate/incidents/read",
                          headers=auth_headers)

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_create_incident(client, get_auth_headers):
    auth_headers = await get_auth_headers("carlos.insp@colegio.cl", "testpassword1")
    form_data = {
            "gravedad": "leve",
            "desc": "test",
            "fecha": "1999-02-04",
            "estado": "pendiente",
            "categoria": "violencia_fisica",
            "estudiantes_json": json.dumps([
                {
                    "id_estudiante": "1000000-1",
                    "rol": "afectado_victima"
                    }
                ])
            }

    response = await client.post("/api/operate/incidents/create",
                           data=form_data,
                           headers=auth_headers)

    assert response.status_code == 201


@pytest.mark.asyncio
async def test_cases_read(client, get_auth_headers):
    auth_headers = await get_auth_headers("ana.silva@colegio.cl", "testpassword")
    response = await client.get("/api/operate/cases/read",
                          headers=auth_headers)

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_incidents_read_no_auth(client, get_auth_headers):

    response = await client.get("/api/operate/incidents/read")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_incident_no_auth(client, get_auth_headers):
    form_data = {
            "gravedad": "leve",
            "desc": "test",
            "fecha": "1999-02-04",
            "estado": "pendiente",
            "categoria": "violencia_fisica",
            "estudiantes_json": json.dumps([
                {
                    "id_estudiante": "1000000-1",
                    "rol": "afectado_victima"
                    }
                ])
            }

    response = await client.post("/api/operate/incidents/create",
                           data=form_data)

    assert response.status_code == 401



@pytest.mark.asyncio
async def test_cases_read_no_auth(client, get_auth_headers):
    response = await client.get("/api/operate/cases/read")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_all_students(client, get_auth_headers):
    auth_headers = await get_auth_headers("ana.silva@colegio.cl", "testpassword")
    response = await client.get("/api/students/get_all",
                          headers=auth_headers)

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_all_courses(client, get_auth_headers):
    auth_headers = await get_auth_headers("ana.silva@colegio.cl", "testpassword")
    response = await client.get("/api/students/courses/get_all",
                          headers=auth_headers)

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_all_students_no_auth(client, get_auth_headers):
    response = await client.get("/api/students/get_all")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_all_courses_no_auth(client, get_auth_headers):
    response = await client.get("/api/students/courses/get_all")

    assert response.status_code == 401


# CREACIÓN DE HITOS
# importante que para este test, este cargada la base de datos test
@pytest.mark.asyncio
async def test_create_hito(client, get_auth_headers):
    auth_headers = await get_auth_headers("ana.silva@colegio.cl", "testpassword")

    form_data = {
            "tipo": "tramite",
            "desc": "esto es una descripción",
            "fecha": "2003-06-07",
            "estudiantes_ids_json": "[\"1000000-1\"]",
            "categoria_tramite": "comunicacion_citaciones",
            "subtipo_tramite": "citacion_apoderado"

            }

    response = await client.post("/api/operate/cases/1/create/hito",
                           data=form_data,
                           headers=auth_headers)

    assert response.status_code == 201


@pytest.mark.asyncio
async def test_create_hito_medida_success(client, get_auth_headers):
    auth_headers = await get_auth_headers("ana.silva@colegio.cl", "testpassword")

    form_data = {
        "tipo": "medida",
        "desc": "Aplicación de medida disciplinaria",
        "fecha": "2023-10-05",
        "estudiantes_ids_json": "[\"1000000-1\"]",
        "nivel_medida": "cautelar"
    }

    response = await client.post(
        "/api/operate/cases/1/create/hito",
        data=form_data,
        headers=auth_headers
    )

    assert response.status_code == 201
    data = response.json()
    assert data["tipo"] == "medida"
    assert data["desc"] == "Aplicación de medida disciplinaria"


@pytest.mark.asyncio
async def test_create_hito_medida_without_nivel_fails(client, get_auth_headers):
    auth_headers = await get_auth_headers("ana.silva@colegio.cl", "testpassword")

    form_data = {
        "tipo": "medida",
        "desc": "Medida inválida sin nivel",
        "fecha": "2023-10-07"
    }

    response = await client.post(
        "/api/operate/cases/1/create/hito",
        data=form_data,
        headers=auth_headers
    )

    assert response.status_code == 400
    assert "requieren especificar un 'nivel_medida'" in response.json()["detail"]


@pytest.mark.asyncio
async def test_create_hito_tramite_with_nivel_fails(client, get_auth_headers):
    auth_headers = await get_auth_headers("ana.silva@colegio.cl", "testpassword")

    form_data = {
        "tipo": "tramite",
        "desc": "Trámite inválido con nivel",
        "fecha": "2023-10-07",
        "nivel_medida": "cautelar"
    }

    response = await client.post(
        "/api/operate/cases/1/create/hito",
        data=form_data,
        headers=auth_headers
    )

    assert response.status_code == 400
    assert "no pueden tener un 'nivel_medida'" in response.json()["detail"]


@pytest.mark.asyncio
async def test_create_hito_caso_not_found(client, get_auth_headers):
    auth_headers = await get_auth_headers("ana.silva@colegio.cl", "testpassword")

    form_data = {
        "tipo": "tramite",
        "desc": "Este caso no existe en la base de datos"
    }

    response = await client.post(
        "/api/operate/cases/99999/create/hito",
        data=form_data,
        headers=auth_headers
    )

    assert response.status_code == 404
    assert "no existe" in response.json()["detail"]


@pytest.mark.asyncio
async def test_create_hito_estudiantes_not_found(client, get_auth_headers):
    auth_headers = await get_auth_headers("ana.silva@colegio.cl", "testpassword")

    form_data = {
        "tipo": "tramite",
        "desc": "Vinculando estudiante fantasma",
        "estudiantes_ids_json": "[\"id-estudiante-falso-99\"]"
    }

    response = await client.post(
        "/api/operate/cases/1/create/hito",
        data=form_data,
        headers=auth_headers
    )

    assert response.status_code == 404
    assert "Uno o más IDs de estudiantes proporcionados no existen" in response.json()["detail"]

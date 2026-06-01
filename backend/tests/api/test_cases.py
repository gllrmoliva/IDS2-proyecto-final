import json


def test_incidents_read(client, get_auth_headers):

    auth_headers = get_auth_headers("carlos.insp@colegio.cl", "testpassword1")

    response = client.get("/api/operate/incidents/read",
                          headers=auth_headers)

    assert response.status_code == 200


def test_create_incident(client, get_auth_headers):
    auth_headers = get_auth_headers("carlos.insp@colegio.cl", "testpassword1")
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

    response = client.post("/api/operate/incidents/create",
                           data=form_data,
                           headers=auth_headers)

    assert response.status_code == 201


def test_cases_read(client, get_auth_headers):
    auth_headers = get_auth_headers("ana.silva@colegio.cl", "testpassword")
    response = client.get("/api/operate/cases/read",
                          headers=auth_headers)

    assert response.status_code == 200


def test_incidents_read_no_auth(client, get_auth_headers):

    response = client.get("/api/operate/incidents/read")

    assert response.status_code == 401


def test_create_incident_no_auth(client, get_auth_headers):
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

    response = client.post("/api/operate/incidents/create",
                           data=form_data)

    assert response.status_code == 401


def test_cases_read_no_auth(client, get_auth_headers):
    response = client.get("/api/operate/cases/read")

    assert response.status_code == 401


def test_get_all_students(client, get_auth_headers):
    auth_headers = get_auth_headers("ana.silva@colegio.cl", "testpassword")
    response = client.get("/api/students/get_all",
                          headers=auth_headers)

    assert response.status_code == 200


def test_get_all_courses(client, get_auth_headers):
    auth_headers = get_auth_headers("ana.silva@colegio.cl", "testpassword")
    response = client.get("/api/students/courses/get_all",
                          headers=auth_headers)

    assert response.status_code == 200


def test_get_all_students_no_auth(client, get_auth_headers):
    response = client.get("/api/students/get_all")

    assert response.status_code == 401


def test_get_all_courses_no_auth(client, get_auth_headers):
    response = client.get("/api/students/courses/get_all")

    assert response.status_code == 401


def test_test_xd(client):
    response = client.post("/cases/test/", json={"input": "hola_mundo"})
    
    assert response.status_code == 200
    assert response.json() == {"response": "hola_mundo"}

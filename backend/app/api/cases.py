from fastapi import APIRouter
from app.schemas.test import TestInput

router = APIRouter(prefix="/operate", tags=["Controlador de casos de convivencia"])


@router.post("/test/")
async def test(data: TestInput):
    return {"response": data.input}

################################
# INCIDENTES
################################


@router.post("/incidents/")
async def create_incident():
    """
    Registra un evento inmediato u observación previa por parte de un Productor
    o Profesor Jefe.
    """
    return "create_incident"


@router.post("/incidents/")
async def get_incidents():
    """
    Permite al Coordinador visualizar y monitorear incidentes no resueltos
    """
    return "get_incidents"


################################
# HITOS
################################


################################
# CASOS
################################


@router.post("/cases/")
async def create_case():
    """
    Permite al Coordinador crear un caso sin necesidad de incidentes o hitos previos.
    """
    return "create_case"


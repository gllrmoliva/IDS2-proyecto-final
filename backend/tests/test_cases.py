import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import date
from fastapi import HTTPException

# Ajusta estos imports según la estructura de tu proyecto
from app.schemas.cases import CasoUpdate
from app.database.models import EstadoCaso, Caso
from app.crud.cases import update_caso
from app.api.cases import update_case
from app.core.exceptions import EntityNotFoundError, BusinessLogicError # O donde estén tus errores

# --- CONFIGURACIÓN DE PYTEST ASYNCIO ---
pytestmark = pytest.mark.asyncio


# ==========================================
# PRUEBAS DEL CRUD (update_caso)
# ==========================================

async def test_update_caso_not_found():
    """Prueba que lance error 404 si el caso no existe en la BD."""
    mock_db = AsyncMock()
    # Simulamos que la query no encuentra nada (retorna None)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result

    payload = CasoUpdate(desc="Nueva descripción")

    with pytest.raises(EntityNotFoundError) as exc_info:
        await update_caso(db=mock_db, id_caso=999, payload=payload)
    
    assert "Caso no encontrado" in str(exc_info.value)


async def test_update_caso_cerrar_sin_fecha_error():
    """Prueba la regla de negocio: No se puede cerrar sin fecha de cierre."""
    mock_db = AsyncMock()
    
    # Caso mockeado existente (abierto, sin fecha)
    caso_existente = Caso(id_caso=1, estado=EstadoCaso.abierto, fecha_cierre=None)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = caso_existente
    mock_db.execute.return_value = mock_result

    # Payload que intenta cerrar sin enviar fecha
    payload = CasoUpdate(estado=EstadoCaso.cerrado, fecha_cierre=None)

    with pytest.raises(BusinessLogicError) as exc_info:
        await update_caso(db=mock_db, id_caso=1, payload=payload)
    
    assert "requiere fecha_cierre" in str(exc_info.value)


async def test_update_caso_reabrir_limpia_fecha():
    """Prueba que al reabrir un caso cerrado, la fecha de cierre vuelva a None."""
    mock_db = AsyncMock()
    
    # Caso mockeado existente (cerrado, con fecha)
    caso_existente = Caso(
        id_caso=1, 
        estado=EstadoCaso.cerrado, 
        fecha_cierre=date(2026, 4, 15)
    )
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = caso_existente
    mock_db.execute.return_value = mock_result

    # Payload que reabre el caso
    payload = CasoUpdate(estado=EstadoCaso.abierto)

    caso_actualizado = await update_caso(db=mock_db, id_caso=1, payload=payload)

    assert caso_actualizado.estado == EstadoCaso.abierto
    assert caso_actualizado.fecha_cierre is None
    mock_db.commit.assert_awaited_once() # Verifica que se llamó a db.commit()


# ==========================================
# PRUEBAS DEL ENDPOINT (update_case)
# ==========================================

@patch("app.api.cases.update_caso") # Ajusta esta ruta al archivo donde está tu router
async def test_endpoint_update_case_success(mock_update_caso_func):
    """Prueba que el endpoint devuelva 200 (retornando el objeto) si todo sale bien."""
    mock_db = AsyncMock()
    payload = CasoUpdate(desc="Test OK")
    
    # Simulamos que el CRUD responde correctamente
    mock_update_caso_func.return_value = {"id_caso": 1, "desc": "Test OK"}

    respuesta = await update_case(
        id_caso=1, 
        payload=payload, 
        current_user={"id": "coord1"}, 
        db=mock_db
    )

    assert respuesta["desc"] == "Test OK"
    mock_update_caso_func.assert_awaited_once_with(db=mock_db, id_caso=1, payload=payload)


@patch("app.api.cases.update_caso")
async def test_endpoint_update_case_409_conflict(mock_update_caso_func):
    """Prueba que el endpoint atrape BusinessLogicError y devuelva HTTP 409."""
    mock_db = AsyncMock()
    payload = CasoUpdate(estado=EstadoCaso.cerrado)
    
    # Simulamos que el CRUD lanza un error de negocio
    mock_update_caso_func.side_effect = BusinessLogicError("Error de lógica")

    with pytest.raises(HTTPException) as exc_info:
        await update_case(
            id_caso=1, 
            payload=payload, 
            current_user={"id": "coord1"}, 
            db=mock_db
        )
    
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "Error de lógica"
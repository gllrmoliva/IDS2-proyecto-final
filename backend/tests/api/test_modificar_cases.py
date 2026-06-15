import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import date
from fastapi import HTTPException

# Ajusta estos imports según la estructura de tu proyecto
from app.schemas.cases import CasoUpdate
from app.database.models import EstadoCaso, EstadoIncidente, Caso, Hito, Incidente
from app.crud.cases import update_caso
from app.api.cases import update_case
from app.exceptions import EntityNotFoundError, BusinessLogicError

# --- CONFIGURACIÓN DE PYTEST ASYNCIO ---
pytestmark = pytest.mark.asyncio


# --- FUNCIÓN AUXILIAR PARA TESTS ---
def crear_mock_result(valor_retorno):
    """Crea un mock del resultado de db.execute()."""
    mock_result = MagicMock()
    # Para la carga inicial o búsquedas donde usamos scalar_one_or_none()
    mock_result.scalar_one_or_none.return_value = valor_retorno
    # Para el refresco final donde usamos scalar_one()
    mock_result.scalar_one.return_value = valor_retorno
    return mock_result


# --- TESTS DEL CRUD ---

async def test_update_caso_not_found():
    """Prueba que lance error 404 si el caso no existe en la BD."""
    mock_db = AsyncMock()
    mock_db.execute.return_value = crear_mock_result(None)

    payload = CasoUpdate(desc="Nueva descripción")

    with pytest.raises(EntityNotFoundError) as exc_info:
        await update_caso(db=mock_db, id_caso=999, payload=payload)
    
    assert "Caso no encontrado" in str(exc_info.value)


async def test_update_caso_cerrar_sin_fecha_error():
    """Prueba la regla de negocio: No se puede cerrar sin fecha de cierre."""
    mock_db = AsyncMock()
    caso_existente = Caso(id_caso=1, estado=EstadoCaso.abierto, fecha_cierre=None)
    mock_db.execute.return_value = crear_mock_result(caso_existente)

    payload = CasoUpdate(estado=EstadoCaso.cerrado, fecha_cierre=None)

    with pytest.raises(BusinessLogicError) as exc_info:
        await update_caso(db=mock_db, id_caso=1, payload=payload)
    
    assert "requiere fecha_cierre" in str(exc_info.value)


async def test_update_caso_reabrir_limpia_fecha():
    """Prueba que al reabrir un caso cerrado, la fecha de cierre vuelva a None."""
    mock_db = AsyncMock()
    caso_existente = Caso(id_caso=1, estado=EstadoCaso.cerrado, fecha_cierre=date(2026, 4, 15))
    
    # execute() se llamará 2 veces: carga inicial y refresh final
    mock_db.execute.return_value = crear_mock_result(caso_existente)

    payload = CasoUpdate(estado=EstadoCaso.abierto)
    caso_actualizado = await update_caso(db=mock_db, id_caso=1, payload=payload)

    assert caso_actualizado.estado == EstadoCaso.abierto
    assert caso_actualizado.fecha_cierre is None
    mock_db.commit.assert_awaited_once()


async def test_update_caso_eliminar_hitos_success():
    """Prueba la eliminación de hitos asociados al caso."""
    mock_db = AsyncMock()
    caso_existente = Caso(id_caso=1, estado=EstadoCaso.abierto)
    hito_existente = Hito(id_hito=10, id_caso=1)

    # Definimos la secuencia exacta de respuestas de la BD:
    # 1. Carga del Caso -> 2. Búsqueda del Hito -> 3. Refresh del Caso
    mock_db.execute.side_effect = [
        crear_mock_result(caso_existente),
        crear_mock_result(hito_existente),
        crear_mock_result(caso_existente)
    ]

    payload = CasoUpdate(hitos_a_eliminar=[10])
    await update_caso(db=mock_db, id_caso=1, payload=payload)

    # Verificamos que se llamó a db.delete de forma síncrona
    mock_db.delete.assert_called_once_with(hito_existente)
    mock_db.commit.assert_awaited_once()


async def test_update_caso_desvincular_incidentes_success():
    """Prueba la desvinculación de incidentes para preservar el historial."""
    mock_db = AsyncMock()
    caso_existente = Caso(id_caso=1, estado=EstadoCaso.abierto)
    incidente_existente = Incidente(id_incidente=5, id_caso=1, estado=EstadoIncidente.aceptado)

    # Secuencia: 1. Carga del Caso -> 2. Búsqueda del Incidente -> 3. Refresh del Caso
    mock_db.execute.side_effect = [
        crear_mock_result(caso_existente),
        crear_mock_result(incidente_existente),
        crear_mock_result(caso_existente)
    ]

    payload = CasoUpdate(incidentes_a_eliminar=[5])
    await update_caso(db=mock_db, id_caso=1, payload=payload)

    # Verificamos la mutación en memoria del objeto incidente
    assert incidente_existente.id_caso is None
    assert incidente_existente.estado == EstadoIncidente.pendiente
    mock_db.commit.assert_awaited_once()


async def test_update_caso_entidad_no_encontrada_en_listas():
    """Prueba que lance 404 si intenta borrar un hito que no pertenece al caso."""
    mock_db = AsyncMock()
    caso_existente = Caso(id_caso=1, estado=EstadoCaso.abierto)
    
    # Secuencia: 1. Carga del Caso -> 2. Búsqueda del Hito (devuelve None)
    mock_db.execute.side_effect = [
        crear_mock_result(caso_existente),
        crear_mock_result(None) 
    ]

    payload = CasoUpdate(hitos_a_eliminar=[99])
    
    with pytest.raises(EntityNotFoundError) as exc_info:
        await update_caso(db=mock_db, id_caso=1, payload=payload)
        
    assert "Hito 99 no encontrado" in str(exc_info.value)


# --- TESTS DEL ENDPOINT ---

@patch("app.api.cases.update_caso") 
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
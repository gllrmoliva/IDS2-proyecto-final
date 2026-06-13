
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.cases import get_caso_by_id
from app.exceptions import EntityNotFoundError
from app.database.models import (
    Caso, Hito, Incidente, Estudiante, Curso,
    EstudianteCaso, EstudianteIncidente, EstadoCaso,
    Gravedad, CategoriaConvivencia, EstadoIncidente
)


# HELPERS / FACTORIES

def make_user(tipo: str, id_usuario: str = "user-1"):
    u = MagicMock()
    u.tipo_usuario = tipo
    u.id_usuario = id_usuario
    return u


def make_curso(id_pj: str = "pj-1") -> Curso:
    c = MagicMock(spec=Curso)
    c.id_pj = id_pj
    c.nombre_curso = "3° Medio A"
    return c


def make_estudiante(id: str = "est-1", id_pj: str = "pj-1") -> Estudiante:
    e = MagicMock(spec=Estudiante)
    e.id_estudiante = id
    e.nombre = "Juan Pérez"
    e.curso = make_curso(id_pj)
    return e


def make_estudiante_caso(id_estudiante: str = "est-1", id_pj: str = "pj-1") -> EstudianteCaso:
    ec = MagicMock(spec=EstudianteCaso)
    ec.id_estudiante = id_estudiante
    ec.estudiante = make_estudiante(id_estudiante, id_pj)
    return ec


def make_incidente(id: int = 1, id_productor: str = "prod-1") -> Incidente:
    inc = MagicMock(spec=Incidente)
    inc.id_incidente = id
    inc.id_productor = id_productor
    inc.desc = "Pelea en el patio"
    inc.gravedad = Gravedad.grave
    inc.estado = EstadoIncidente.aceptado
    inc.categoria = CategoriaConvivencia.violencia_fisica
    inc.documentos = []
    inc.estudiantes = []
    inc.productor = MagicMock()
    return inc


def make_hito(id: int = 1) -> Hito:
    h = MagicMock(spec=Hito)
    h.id_hito = id
    h.desc = "Citación apoderado"
    h.documentos = []
    h.estudiantes = []
    return h


def make_caso(
    id_caso: int = 1,
    id_productor: str = "prod-1",
    id_pj: str = "pj-1"
) -> Caso:
    caso = MagicMock(spec=Caso)
    caso.id_caso = id_caso
    caso.desc = "Caso de violencia reiterada"
    caso.estado = EstadoCaso.abierto
    caso.gravedad = Gravedad.grave
    caso.categoria = CategoriaConvivencia.violencia_fisica
    caso.estudiantes = [make_estudiante_caso(id_pj=id_pj)]
    caso.hitos = [make_hito()]
    caso.incidentes = [make_incidente(id_productor=id_productor)]
    return caso


def make_db(caso_retornado) -> AsyncSession:
    db = AsyncMock(spec=AsyncSession)
    result_mock = MagicMock()
    # Cadena real que usa tu crud: scalars().unique().one_or_none()
    result_mock.scalars.return_value.unique.return_value.one_or_none.return_value = caso_retornado
    db.execute.return_value = result_mock
    return db


# TESTS

class TestGetCasoById:

    #  Coordinador 

    @pytest.mark.asyncio
    async def test_coordinador_obtiene_caso(self):
        caso = make_caso()
        db = make_db(caso)
        user = make_user("coordinador", "coord-1")

        result = await get_caso_by_id(db, id_caso=1, user=user)

        assert result is caso

    @pytest.mark.asyncio
    async def test_coordinador_caso_retorna_informacion_correcta(self):
        caso = make_caso(id_caso=42)
        db = make_db(caso)
        user = make_user("coordinador")

        result = await get_caso_by_id(db, id_caso=42, user=user)

        assert result.id_caso == 42
        assert result.desc == "Caso de violencia reiterada"
        assert result.estado == EstadoCaso.abierto
        assert result.gravedad == Gravedad.grave
        assert len(result.hitos) == 1
        assert result.hitos[0].desc == "Citación apoderado"
        assert len(result.incidentes) == 1
        assert result.incidentes[0].desc == "Pelea en el patio"
        assert len(result.estudiantes) == 1
        assert result.estudiantes[0].estudiante.nombre == "Juan Pérez"

    #  Profesor Jefe 

    @pytest.mark.asyncio
    async def test_profesor_jefe_con_acceso_obtiene_caso(self):
        caso = make_caso(id_pj="pj-99")
        db = make_db(caso)
        user = make_user("profesor_jefe", "pj-99")

        result = await get_caso_by_id(db, id_caso=1, user=user)

        assert result is caso

    @pytest.mark.asyncio
    async def test_profesor_jefe_sin_acceso_lanza_error(self):
        """La DB no retorna el caso porque el WHERE de rol filtra al profesor."""
        db = make_db(None)  # simula que el query no encontró nada
        user = make_user("profesor_jefe", "pj-otro")

        with pytest.raises(EntityNotFoundError):
            await get_caso_by_id(db, id_caso=1, user=user)

    #  Productor 

    @pytest.mark.asyncio
    async def test_productor_con_acceso_obtiene_caso(self):
        caso = make_caso(id_productor="prod-1")
        db = make_db(caso)
        user = make_user("productor", "prod-1")

        result = await get_caso_by_id(db, id_caso=1, user=user)

        assert result is caso

    @pytest.mark.asyncio
    async def test_productor_sin_acceso_lanza_error(self):
        """La DB no retorna el caso porque el WHERE de rol filtra al productor."""
        db = make_db(None)
        user = make_user("productor", "prod-otro")

        with pytest.raises(EntityNotFoundError):
            await get_caso_by_id(db, id_caso=1, user=user)

    # Caso inexistente 

    @pytest.mark.asyncio
    async def test_caso_inexistente_lanza_error(self):
        db = make_db(None)
        user = make_user("coordinador")

        with pytest.raises(EntityNotFoundError):
            await get_caso_by_id(db, id_caso=9999, user=user)

    @pytest.mark.asyncio
    async def test_caso_inexistente_mensaje_contiene_id(self):
        db = make_db(None)
        user = make_user("coordinador")

        with pytest.raises(EntityNotFoundError, match="9999"):
            await get_caso_by_id(db, id_caso=9999, user=user)
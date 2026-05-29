from fastapi import APIRouter, Depends, HTTPException, status

from typing import List, Annotated

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.cases import (get_incidents_for_user, get_cases_for_user,
                            create_incident)

from app.database.database import get_db
from app.database.models import Caso, Coordinador

from app.schemas.cases import (
    CasoCreate,
    CasoResponse,
    IncidentResponse,
    ElevacionIncidenteRequest,
    IncidentCreate,
)

from app.exceptions import EntityNotFoundError, BusinessLogicError
from app.api.deps import RoleChecker

router = APIRouter(prefix="/operate", tags=["Controlador de casos de convivencia"])


################################
# INCIDENTES
################################

@router.get("/incidents/read", response_model=List[IncidentResponse])
async def read_incidents(
    current_user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["coordinador", "productor", "profesor_jefe"]))
    ],
    db: AsyncSession = Depends(get_db)
):
    """
    Función para leer incidentes, se encarga de permisos (en este caso todos tienen acceso a este endpoint)
    a través de una dependencia en RoleChecker. Lógica de data-scoping se delega a CRUD; ver función
    respectiva.
    """
    # Data scoping (qué usuario ve qué) es trabajo de lógica CRUD
    return await get_incidents_for_user(db, current_user)


@router.post("/incidents/{id_incidente}/elevar", response_model=IncidentResponse)
async def elevar_incidente_endpoint(
    id_incidente: int,
    payload: ElevacionIncidenteRequest,
    current_user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["coordinador"]))
    ],
    db: AsyncSession = Depends(get_db)
):
    """
    Eleva un Incidente pendiente. 
    Solo permitido para el rol 'coordinador'.
    Gatilla la creación de un Nuevo Caso (Evento Originario) o lo anexa a uno existente (Acumulación).
    """
    try:
        # Extraer id_usuario dependiendo si current_user es un dict o un modelo Pydantic/SQLAlchemy
        id_coordinador = current_user.get("id_usuario") if isinstance(current_user, dict) else current_user.id_usuario
        
        incidente_actualizado = await elevar_incidente(
            db=db, 
            id_incidente=id_incidente, 
            id_coordinador=id_coordinador, 
            payload=payload
        )
        return incidente_actualizado

    except EntityNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        
    except BusinessLogicError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/incidents/create",
             status_code=status.HTTP_201_CREATED)
async def create_incident_endpoint(
    incident_in: IncidentCreate,
    current_user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["coordinador", "productor", "profesor_jefe"]))
    ],
    db: AsyncSession = Depends(get_db)
):
    """
    Crea un nuevo incidente asociado al productor autenticado.
    """
    try:
        # La lógica de creación y vinculación de estudiantes se delega al CRUD
        incident_db = await create_incident(db, user=current_user, incident_in=incident_in)
        return incident_db
    except ValueError as e:
        # no existen estudiantes
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # constrains de la base de datos
        await db.rollback()
        raise HTTPException(status_code=422, detail=f"Error de integridad en base de datos: {str(e)}")


################################
# HITOS
################################


################################
# CASOS
################################

@router.get("/cases/read", response_model=List[CasoResponse])
async def read_cases(current_user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["coordinador", "profesor_jefe"]))],
        db: AsyncSession = Depends(get_db)):
    """
    Función para leer casos, se encarga de permisos (en este caso solo coordinador tiene acceso a este endpoint)
    a través de una dependencia en RoleChecker. 
    """
    return await get_cases_for_user(db, current_user) 


@router.post("/cases/", response_model=CasoResponse)
async def create_case(
    caso: CasoCreate,
    current_user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["coordinador"]))
    ],
    db: AsyncSession = Depends(get_db)
):
    """Permite al Coordinador crear un caso."""
    result = await db.execute(
        select(Coordinador).where(Coordinador.id_usuario == caso.id_coordinador)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Coordinador no encontrado")

    nuevo_caso = Caso(
        id_coordinador=caso.id_coordinador,
        estado=caso.estado,
        fecha_inicio=caso.fecha_inicio,
        fecha_cierre=caso.fecha_cierre,
        desc=caso.desc,
        gravedad=caso.gravedad
    )
    db.add(nuevo_caso)
    await db.commit()

    result = await db.execute(
        select(Caso)
        .options(
            selectinload(Caso.estudiantes),
            selectinload(Caso.hitos)
        )
        .where(Caso.id_caso == nuevo_caso.id_caso)
    )
    return result.scalar_one()



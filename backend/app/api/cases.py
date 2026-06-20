from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Annotated

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import (
        form_to_case_schema,
        form_to_hito_schema,
        form_to_incident_schema
)
 
from app.crud.cases import (
        get_incidents_for_user,
        get_cases_for_user,
        create_incidente_completo,
        create_caso_completo,
        elevar_incidente,
        update_incidente_estado,
        update_caso,
        create_hito_completo
)

from app.database.minio_client import get_minio_client

from app.database.database import get_db

from app.database.models import (
        Incidente,
        EstudianteIncidente,
        Estudiante,
        Caso,
        EstudianteCaso,
        Hito
)

from app.schemas.cases import (
    CasoCreate,
    CasoResponse,
    CasoUpdate,
    IncidentResponse,
    ElevacionIncidenteRequest,
    IncidentCreate,
    IncidentUpdateEstado,
    HitoCreate,
    HitoResponse
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
    try:
        return await get_incidents_for_user(db, current_user)
    except Exception as e:
        raise HTTPException(
                status_code=500,
                detail=f"Error interno del servidor: {str(e)}"
                )


@router.patch("/incidents/{id_incidente}/estado", response_model=IncidentResponse)
async def actualizar_estado_incidente(
    id_incidente: int,
    payload: IncidentUpdateEstado,
    current_user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["coordinador"]))
    ],
    db: AsyncSession = Depends(get_db)
):
    """
    Permite a un coordinador cambiar el estado de un incidente (aceptado, rechazado, pendiente).
    """
    
    try:
        incidente = await update_incidente_estado(db=db, id_incidente=id_incidente, payload=payload)
        return incidente
    except EntityNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except BusinessLogicError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error interno: {str(e)}")       


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
        # Extraer id_usuario dependiendo si current_user es un dict o un mid_coordinador = current_user.get("id_usuario") if isinstance(current_user, dict) else current_user.id_usuarioodelo Pydantic/SQLAlchemy
        id_coordinador = current_user.get("id_usuario") if isinstance(current_user, dict) else current_user.id_usuario
        if not id_coordinador:
            raise ValueError("El id_usuario del coordinador no puede ser nulo.")

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
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/incidents/create", status_code=status.HTTP_201_CREATED, response_model=IncidentCreate)
async def crear_nuevo_incidente(
    incident_in: IncidentCreate = Depends(form_to_incident_schema),
    archivos: List[UploadFile] = File(default=[]),
    db: AsyncSession = Depends(get_db),
    # Quitamos minio_client de aquí
    current_user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["coordinador", "productor", "profesor_jefe"]))
    ] = None
):
    # Instanciar MinIO
    try:
        minio_client = get_minio_client(usuario=current_user.tipo_usuario)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        nuevo_incidente = await create_incidente_completo(
                db=db,
                id_productor=current_user.id_usuario,
                desc=incident_in.desc,
                gravedad=incident_in.gravedad.value,
                categoria=incident_in.categoria.value,
                fecha=incident_in.fecha,
                estado=incident_in.estado.value,
                estudiantes_in=incident_in.estudiantes,
                archivos=archivos,
                minio_client=minio_client
                )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno al crear el incidente: {str(e)}")

    # Eager Loading
    stmt = select(Incidente).options(
            selectinload(Incidente.productor),
            selectinload(Incidente.documentos),
            selectinload(Incidente.estudiantes)
            .selectinload(EstudianteIncidente.estudiante)
            .selectinload(Estudiante.curso)
            ).where(Incidente.id_incidente == nuevo_incidente.id_incidente)

    result = await db.execute(stmt)
    incidente_cargado = result.scalar_one_or_none()

    if not incidente_cargado:
        raise HTTPException(status_code=404, detail="Error al recuperar el incidente creado.")

    return incidente_cargado

################################
# HITOS
###############################


@router.post("/cases/{id_caso}/create/hito", status_code=status.HTTP_201_CREATED, response_model=HitoResponse)
async def crear_hito_en_caso(
    id_caso: int,
    hito_in: HitoCreate = Depends(form_to_hito_schema),
    archivos: List[UploadFile] = File(default=[]),
    db: AsyncSession = Depends(get_db),
    current_user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["coordinador"]))
    ] = None
):
    """
    Crea un nuevo Hito (trámite o medida) para un caso existente, permitiendo adjuntar evidencia 
    y vincular estudiantes específicos (targets de la medida/trámite).
    """
    
    try:
        minio_client = get_minio_client(usuario=current_user.tipo_usuario)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        nuevo_hito = await create_hito_completo(
            db=db,
            id_caso=id_caso,
            hito_in=hito_in,
            archivos=archivos,
            minio_client=minio_client
        )
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except BusinessLogicError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno al crear el hito: {str(e)}")

    # Fetch final con Eager Loading para armar el HitoResponse adecuadamente
    stmt = select(Hito).options(
        selectinload(Hito.estudiantes),
        selectinload(Hito.documentos)
    ).where(Hito.id_hito == nuevo_hito.id_hito)
    
    result = await db.execute(stmt)
    hito_cargado = result.scalar_one_or_none()
    
    if not hito_cargado:
        raise HTTPException(status_code=404, detail="Error al recuperar el hito creado.")
        
    return hito_cargado


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


@router.post("/cases/", status_code=status.HTTP_201_CREATED, response_model=CasoResponse)
async def create_case(
    caso_in: CasoCreate = Depends(form_to_case_schema),
    archivos: List[UploadFile] = File(default=[]),
    db: AsyncSession = Depends(get_db),
    current_user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["coordinador"]))
    ] = None
):
    """Permite al Coordinador crear un caso con evidencia inicial y estudiantes involucrados."""
    
    try:
        minio_client = get_minio_client(usuario=current_user.tipo_usuario)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        nuevo_caso = await create_caso_completo(
            db=db,
            id_coordinador=current_user.id_usuario,
            caso_in=caso_in,
            archivos=archivos,
            minio_client=minio_client
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno al crear el caso: {str(e)}")

    # 3. Fetch final con Eager Loading para armar el CasoResponse
    stmt = select(Caso).options(
        selectinload(Caso.estudiantes)
        .selectinload(EstudianteCaso.estudiante)
        .selectinload(Estudiante.curso),
        selectinload(Caso.hitos).options(
            selectinload(Hito.documentos),
            selectinload(Hito.estudiantes)
        )
    ).where(Caso.id_caso == nuevo_caso.id_caso)
    
    result = await db.execute(stmt)
    caso_cargado = result.scalar_one_or_none()
    
    if not caso_cargado:
        raise HTTPException(status_code=404, detail="Error al recuperar el caso creado.")
        
    return caso_cargado
  

@router.patch("/cases/{id_caso}", response_model=CasoResponse)
async def update_case(
    id_caso: int,
    payload: CasoUpdate,  
    current_user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["coordinador"]))
    ],
    db: AsyncSession = Depends(get_db)
):
    """Permite al Coordinador modificar un caso existente."""
    try:
        await update_caso(
            db=db,
            id_caso=id_caso,
            payload=payload
        )
        stmt = select(Caso).options(
            selectinload(Caso.estudiantes)
                .selectinload(EstudianteCaso.estudiante)
                .selectinload(Estudiante.curso),
            selectinload(Caso.hitos).options(
                selectinload(Hito.documentos),
                selectinload(Hito.estudiantes)
            )
        ).where(Caso.id_caso == id_caso)

        result = await db.execute(stmt)
        caso_actualizado = result.scalar_one_or_none()

        if not caso_actualizado:
            raise HTTPException(status_code=404, detail="Caso no encontrado tras actualización.")

        
        return caso_actualizado
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except BusinessLogicError as e:
        raise HTTPException(status_code=409, detail=str(e))
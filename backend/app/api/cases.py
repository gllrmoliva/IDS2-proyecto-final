from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File
from pydantic import ValidationError
from typing import List, Annotated
import json

from datetime import date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.cases import (get_incidents_for_user, get_cases_for_user,
                            create_incidente_completo, create_caso_completo)

from app.database.minio_client import get_minio_client

from app.database.database import get_db
from app.database.models import (
    Incidente, CategoriaConvivencia, Gravedad, EstadoIncidente,
    EstudianteIncidente, Estudiante, Coordinador, EstadoCaso
)

from app.schemas.cases import (
    CasoCreate,
    CasoResponse,
    IncidentResponse,
    ElevacionIncidenteRequest,
    EstudianteRolCreate,
    IncidentCreate

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
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


# TODO: Si esto es una dependencia, debería ir en deps.py
def form_to_incident_schema(
    gravedad: Gravedad = Form(...),
    desc: str = Form(...),
    fecha: date = Form(default_factory=date.today),
    categoria: CategoriaConvivencia = Form(...),
    estudiantes_json: str = Form(
        ..., 
        description="""Lista JSON. Ej: [{"id_estudiante": "123", "rol": "autor_agresor"}]"""
    )
) -> IncidentCreate:
    
    # 1. Procesamos el JSON de estudiantes
    try:
        estudiantes_data = json.loads(estudiantes_json)
        if not isinstance(estudiantes_data, list):
            raise ValueError("El campo estudiantes_json debe ser una lista.")
        
        estudiantes_in = [EstudianteRolCreate(**est) for est in estudiantes_data]
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Formato JSON inválido en estudiantes_json.")
    except (ValueError, ValidationError) as e:
        raise HTTPException(status_code=400, detail=f"Error validando estudiantes: {str(e)}")

    # 2. Retornamos tu esquema Pydantic listo y validado
    try:
        return IncidentCreate(
            gravedad=gravedad,
            desc=desc,
            fecha=fecha,
            categoria=categoria,
            estudiantes=estudiantes_in
            # 'estado' tomará tu default (EstadoIncidente.pendiente)
            # 'documentos' tomará tu default_factory (lista vacía)
        )
    except ValidationError as e:
        # Esto atrapará si, por ejemplo, min_length=1 falla porque la lista está vacía
        raise HTTPException(status_code=400, detail=f"Error en los datos del formulario: {str(e)}")


def form_to_case_schema(
    desc: str = Form(...),
    fecha_inicio: date = Form(...),
    gravedad: Gravedad = Form(...),
    categoria: CategoriaConvivencia = Form(...),
    estado: EstadoCaso = Form(default=EstadoCaso.abierto),
    estudiantes_json: str = Form(
        ..., 
        description="""Lista JSON. Ej: [{"id_estudiante": "123", "rol": "autor_agresor"}]"""
    )
) -> CasoCreate:
    
    # Procesar JSON
    try:
        estudiantes_data = json.loads(estudiantes_json)
        if not isinstance(estudiantes_data, list):
            raise ValueError("El campo estudiantes_json debe ser una lista.")
        estudiantes_in = [EstudianteRolCreate(**est) for est in estudiantes_data]
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Formato JSON inválido en estudiantes_json.")
    except (ValueError, ValidationError) as e:
        raise HTTPException(status_code=400, detail=f"Error validando estudiantes: {str(e)}")

    # Retornar Pydantic Schema
    try:
        return CasoCreate(
            desc=desc,
            fecha_inicio=fecha_inicio,
            gravedad=gravedad,
            categoria=categoria,
            estado=estado,
            estudiantes=estudiantes_in
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=f"Error en los datos del formulario: {str(e)}")




@router.post("/incidents/create", status_code=status.HTTP_201_CREATED, response_model=IncidentCreate)
async def crear_nuevo_incidente(
    incident_in: IncidentCreate = Depends(form_to_incident_schema),
    archivos: List[UploadFile] = File(default=[]),
    db: AsyncSession = Depends(get_db),
    # Quitamos minio_client de aquí
    current_user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["productor", "profesor_jefe"]))
    ] = None
):
    # Instanciamos el cliente MinIO manualmente usando el rol del usuario
    try:
        minio_client = get_minio_client(usuario=current_user.tipo_usuario)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        # Pasamos los datos del esquema a tu función creadora
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
            minio_client=minio_client # Le pasamos la instancia que acabamos de crear
        )
    # ... resto de tu código ...
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno al crear el incidente: {str(e)}")

    # 3. Fetch final con Eager Loading para armar la respuesta
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


# ---------------------------------------------------------
# REEMPLAZA TU ENDPOINT @router.post("/cases/") POR ESTE:
# ---------------------------------------------------------
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
    
    # Autenticación en MinIO
    try:
        minio_client = get_minio_client(usuario=current_user.tipo_usuario)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Delegación al CRUD
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


from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status

from typing import List, Annotated
import io
import uuid
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError

from app.database.database import get_db

from app.database.models import Usuario, Caso, Hito, Incidente, Documento, Estudiante, EstadoIncidente, Coordinador
from app.schemas.cases import CasoResponse, IncidentResponse, CasoCreate, IncidenteCreate
from app.schemas.cases import (
    CasoCreate, 
    CasoResponse, 
    IncidentResponse, 
    ElevacionIncidenteRequest
)
from app.exceptions import EntityNotFoundError, BusinessLogicError
from app.api.deps import RoleChecker, get_current_active_user
from app.crud.cases import get_incidents_for_user, get_cases_for_user, elevar_incidente
from app.database.minio_client import get_minio_client
from minio.error import S3Error

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


################################
# DOCUMENTOS / EVIDENCIAS
################################

EXTENSIONES_PERMITIDAS = {"jpg", "jpeg", "png", "gif", "mp4", "mov", "pdf", "docx", "xlsx"}
TAMANO_MAXIMO_MB = 100
TAMANO_MAXIMO_BYTES = TAMANO_MAXIMO_MB * 1024 * 1024

@router.post("/documentos/subir")
async def subir_documento(
    id_hito: int = Form(...),
    id_incidente: int | None = Form(None),
    descripcion: str = Form(...),
    archivo: UploadFile = File(...),
    current_user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["coordinador", "productor", "profesor_jefe"]))
    ] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Sube un archivo a MinIO y registra el documento en la base de datos.
    El archivo va a 'evidencias' si es imagen/video, a 'documentos' si es formal.
    """
    # Validar extensión
    extension = archivo.filename.split(".")[-1].lower() if "." in archivo.filename else ""
    if extension not in EXTENSIONES_PERMITIDAS:
        raise HTTPException(status_code=400, detail=f"Extensión no permitida. Permitidas: {EXTENSIONES_PERMITIDAS}")

    # Verificar que el hito existe
    result_hito = await db.execute(select(Hito).where(Hito.id_hito == id_hito))
    if not result_hito.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Hito no encontrado")

    # Verificar que el incidente existe (si se proporcionó)
    if id_incidente:
        result_inc = await db.execute(select(Incidente).where(Incidente.id_incidente == id_incidente))
        if not result_inc.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Incidente no encontrado")

    # Determinar bucket según mime_type
    mime_type = archivo.content_type or "application/octet-stream"
    if mime_type.startswith("image/") or mime_type.startswith("video/"):
        bucket = "evidencias"
    else:
        bucket = "documentos"

    # Generar object_key único
    object_key = f"{id_hito}/{uuid.uuid4()}.{extension}" if extension else f"{id_hito}/{uuid.uuid4()}"

    # Leer contenido y validar tamaño
    contenido = await archivo.read()
    size_bytes = len(contenido)
    if size_bytes > TAMANO_MAXIMO_BYTES:
        raise HTTPException(status_code=400, detail=f"Archivo demasiado grande. Máximo {TAMANO_MAXIMO_MB}MB")

    # usuario_tipo desde el token, no del cliente
    usuario_tipo = current_user.tipo_usuario

    # Subir a MinIO
    try:
        client = get_minio_client(usuario_tipo)
        client.put_object(
            bucket_name=bucket,
            object_name=object_key,
            data=io.BytesIO(contenido),
            length=size_bytes,
            content_type=mime_type,
        )
    except S3Error as e:
        raise HTTPException(status_code=403, detail=f"Error al subir archivo a MinIO: {str(e)}")

    # Registrar en PostgreSQL
    doc = Documento(
        bucket_name=bucket,
        object_key=object_key,
        nombre_original=archivo.filename,
        mime_type=mime_type,
        size_bytes=size_bytes,
        descripcion=descripcion,
        id_hito=id_hito,
        id_incidente=id_incidente,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    return {
        "id_doc": doc.id_doc,
        "bucket_name": bucket,
        "object_key": object_key,
        "nombre_original": archivo.filename,
        "mime_type": mime_type,
        "size_bytes": size_bytes,
    }


@router.get("/documentos/hito/{id_hito}")
async def obtener_documentos_hito(
    id_hito: int,
    current_user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["coordinador", "productor", "profesor_jefe"]))
    ],
    db: AsyncSession = Depends(get_db)
):
    """Lista todos los documentos asociados a un hito."""
    result = await db.execute(select(Documento).where(Documento.id_hito == id_hito))
    return result.scalars().all()


@router.get("/documentos/incidente/{id_incidente}")
async def obtener_documentos_incidente(
    id_incidente: int,
    current_user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["coordinador", "productor", "profesor_jefe"]))
    ],
    db: AsyncSession = Depends(get_db)
):
    """Lista todos los documentos asociados a un incidente."""
    result = await db.execute(
        select(Documento).where(Documento.id_incidente == id_incidente)
    )
    return result.scalars().all()


@router.get("/documentos/{id_doc}/url")
async def obtener_url_documento(
    id_doc: int,
    current_user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["coordinador", "productor", "profesor_jefe"]))
    ],
    db: AsyncSession = Depends(get_db)
):
    """Retorna una URL firmada temporal (1 hora) para acceder al archivo en MinIO."""
    result = await db.execute(select(Documento).where(Documento.id_doc == id_doc))
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    # usuario_tipo desde el token, no del cliente
    usuario_tipo = current_user.tipo_usuario

    try:
        client = get_minio_client(usuario_tipo)
        url = client.presigned_get_object(
            bucket_name=doc.bucket_name,
            object_name=doc.object_key,
            expires=timedelta(hours=1),
        )
    except S3Error as e:
        raise HTTPException(status_code=403, detail=f"Error al generar URL: {str(e)}")

    return {
        "id_doc": doc.id_doc,
        "nombre_original": doc.nombre_original,
        "url": url,
        "expira_en": "1 hora",
    }

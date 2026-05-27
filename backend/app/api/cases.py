from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form

from typing import List, Annotated

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.database import get_db
from app.database.models import Usuario, Caso, Hito, Incidente, Documento, Estudiante
from app.schemas.cases import CasoResponse, IncidentResponse
from app.api.deps import RoleChecker, get_current_active_user
from app.crud.cases import get_incidents_for_user, get_cases_for_user

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

@router.post("/cases/create")
async def create_case():
    """
    Permite al Coordinador crear un caso sin necesidad de incidentes o hitos previos.
    """
    return "create_case"


################################
# DOCUMENTOS / EVIDENCIAS
################################


@router.post("/documentos/subir")
async def subir_documento(
    id_hito: int = Form(...),
    id_incidente: int | None = Form(None),
    descripcion: str = Form(...),
    usuario_tipo: str = Form(
        ...
    ),  # 'coordinador', 'productor', 'profesor', 'profesor_jefe'
    archivo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Sube un archivo a MinIO y registra el documento en la base de datos.
    El archivo va a 'documentos' si es formal, a 'evidencias' si es imagen/video.
    """
    # Determinar bucket según mime_type
    mime_type = archivo.content_type or "application/octet-stream"
    if mime_type.startswith("image/") or mime_type.startswith("video/"):
        bucket = "evidencias"
    else:
        bucket = "documentos"

    # Generar object_key único
    extension = archivo.filename.split(".")[-1] if "." in archivo.filename else ""
    object_key = (
        f"{id_hito}/{uuid.uuid4()}.{extension}"
        if extension
        else f"{id_hito}/{uuid.uuid4()}"
    )

    # Leer contenido
    contenido = await archivo.read()
    size_bytes = len(contenido)

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
        raise HTTPException(
            status_code=403, detail=f"Error al subir archivo a MinIO: {str(e)}"
        )

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
async def obtener_documentos_hito(id_hito: int, db: AsyncSession = Depends(get_db)):
    """
    Lista todos los documentos asociados a un hito.
    """
    result = await db.execute(select(Documento).where(Documento.id_hito == id_hito))
    documentos = result.scalars().all()
    return documentos


@router.get("/documentos/incidente/{id_incidente}")
async def obtener_documentos_incidente(
    id_incidente: int, db: AsyncSession = Depends(get_db)
):
    """
    Lista todos los documentos asociados a un incidente.
    """
    result = await db.execute(
        select(Documento).where(Documento.id_incidente == id_incidente)
    )
    documentos = result.scalars().all()
    return documentos


@router.get("/documentos/{id_doc}/url")
async def obtener_url_documento(
    id_doc: int, usuario_tipo: str, db: AsyncSession = Depends(get_db)
):
    """
    Retorna una URL firmada temporal (1 hora) para acceder al archivo en MinIO.
    """
    from datetime import timedelta

    result = await db.execute(select(Documento).where(Documento.id_doc == id_doc))
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

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

import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import Annotated
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db

from app.database.models import Hito, Incidente, Documento
from app.api.deps import RoleChecker
from app.database.minio_client import get_minio_client
from app.core.config import settings

from minio.error import S3Error

from app.crud.documents import upload_file_minio, create_document

router = APIRouter(prefix="/documents", tags=["Controlador de subida de archivos"])


@router.post("/upload")
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
    # 1. Validar extensión
    filename = archivo.filename or ""
    extension = filename.split(".")[-1].lower() if "." in filename else ""
    if extension not in settings.EXTENSIONES_PERMITIDAS:
        raise HTTPException(status_code=400, detail=f"Extensión no permitida. Permitidas: {settings.EXTENSIONES_PERMITIDAS}")

    # 2. Verificar que el hito existe
    result_hito = await db.execute(select(Hito).where(Hito.id_hito == id_hito))
    if not result_hito.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Hito no encontrado")

    # 3. Verificar que el incidente existe (si se proporcionó)
    if id_incidente:
        result_inc = await db.execute(select(Incidente).where(Incidente.id_incidente == id_incidente))
        if not result_inc.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Incidente no encontrado")

    # 4. Determinar bucket según mime_type
    mime_type = archivo.content_type or "application/octet-stream"
    if mime_type.startswith("image/") or mime_type.startswith("video/"):
        bucket = "evidencias"
    else:
        bucket = "documentos"

    # 5. Generar object_key único
    object_key = f"{id_hito}/{uuid.uuid4()}.{extension}" if extension else f"{id_hito}/{uuid.uuid4()}"

    # 6. Leer contenido y validar tamaño
    contenido = await archivo.read()
    size_bytes = len(contenido)
    if size_bytes > settings.TAMANO_MAXIMO_BYTES:
        raise HTTPException(status_code=400, detail=f"Archivo demasiado grande. Máximo {settings.TAMANO_MAXIMO_MB}MB")

    # 7. Subir a MinIO usando el servicio de storage
    usuario_tipo = current_user.tipo_usuario
    client = get_minio_client(usuario_tipo)
    
    upload_file_minio(
        client=client,
        bucket=bucket,
        object_key=object_key,
        contenido=contenido,
        size_bytes=size_bytes,
        mime_type=mime_type
    )

    # 8. Registrar en PostgreSQL usando el CRUD
    doc = await create_document(
        db=db,
        bucket_name=bucket,
        object_key=object_key,
        nombre_original=archivo.filename,
        mime_type=mime_type,
        size_bytes=size_bytes,
        descripcion=descripcion,
        id_hito=id_hito,
        id_incidente=id_incidente
    )

    # 9. Retornar respuesta
    return {
        "id_doc": doc.id_doc,
        "bucket_name": doc.bucket_name,
        "object_key": doc.object_key,
        "nombre_original": doc.nombre_original,
        "mime_type": doc.mime_type,
        "size_bytes": doc.size_bytes,
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
        response = client.get_object(doc.bucket_name, doc.object_key)
        data = response.read()
        response.close()
    except S3Error as e:
        raise HTTPException(status_code=403, detail=f"Error al obtener archivo: {str(e)}")

    return StreamingResponse(
        io.BytesIO(data),
        media_type=doc.mime_type or "application/octet-stream",
        headers={"Content-Disposition": f'inline; filename="{doc.nombre_original}"'},
    )

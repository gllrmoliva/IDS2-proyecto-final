import io
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import Documento
from minio.error import S3Error
from fastapi import HTTPException


async def create_document(
    db: AsyncSession,
    bucket_name: str,
    object_key: str,
    nombre_original: str,
    mime_type: str,
    size_bytes: int,
    descripcion: str,
    id_hito: int | None = None,
    id_incidente: int | None = None,
    id_caso: int | None = None
):
    """
    Crea un nuevo registro de documento en la base de datos.
    """
    nuevo_doc = Documento(
        bucket_name=bucket_name,
        object_key=object_key,
        nombre_original=nombre_original,
        mime_type=mime_type,
        size_bytes=size_bytes,
        descripcion=descripcion,
        id_hito=id_hito,
        id_incidente=id_incidente,
        id_caso=id_caso
    )
    
    db.add(nuevo_doc)
    await db.commit()
    await db.refresh(nuevo_doc)
    
    return nuevo_doc


def upload_file_minio(
    client,
    bucket: str,
    object_key: str,
    contenido: bytes,
    size_bytes: int,
    mime_type: str
):
    """
    Sube un archivo a un bucket de MinIO.
    """
    try:
        client.put_object(
            bucket_name=bucket,
            object_name=object_key,
            data=io.BytesIO(contenido),
            length=size_bytes,
            content_type=mime_type,
        )
    except S3Error as e:
        raise HTTPException(status_code=403, detail=f"Error al subir archivo a MinIO: {str(e)}")

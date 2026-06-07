from minio import Minio
from app.core.config import settings
import logging

logging.basicConfig(level=logging.DEBUG)


def get_minio_client(usuario: str) -> Minio:
    
    #Retorna un cliente MinIO con las credenciales del usuario indicado.
    credenciales = {
        "coordinador": (settings.MINIO_COORDINADOR_ACCESS_KEY, settings.MINIO_COORDINADOR_SECRET_KEY),
        "productor":   (settings.MINIO_PRODUCTOR_ACCESS_KEY,   settings.MINIO_PRODUCTOR_SECRET_KEY),
        "profesor":    (settings.MINIO_PROFESOR_ACCESS_KEY,    settings.MINIO_PROFESOR_SECRET_KEY),
        "profesor_jefe": (settings.MINIO_PROFESOR_JEFE_ACCESS_KEY, settings.MINIO_PROFESOR_JEFE_SECRET_KEY),
    }

    if usuario not in credenciales:
        raise ValueError(f"Usuario MinIO no válido: {usuario}")

    access_key, secret_key = credenciales[usuario]

    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=access_key,
        secret_key=secret_key,
        secure=False,
        region="us-east-1"
    )

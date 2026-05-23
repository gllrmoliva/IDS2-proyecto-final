import logging
import io
import pytest
from minio import Minio
from minio.error import S3Error

logging.basicConfig(level=logging.DEBUG)

MINIO_ENDPOINT = "localhost:9000"

USUARIOS = {
    "coordinador": {
        "access_key": "panoptes-coord-key",
        "secret_key": "panoptes-coord-secret"
    },
    "productor": {
        "access_key": "panoptes-prod-key",
        "secret_key": "panoptes-prod-secret"
    },
    "profesor": {
        "access_key": "panoptes-prof-key",
        "secret_key": "panoptes-prof-secret"
    },
    "profesor_jefe": {
        "access_key": "panoptes-jefe-key",
        "secret_key": "panoptes-jefe-secret"
    }
}

def get_client(usuario: str) -> Minio:
    creds = USUARIOS[usuario]
    return Minio(
        MINIO_ENDPOINT,
        access_key=creds["access_key"],
        secret_key=creds["secret_key"],
        secure=False,
        region="us-east-1"
    )

def puede_subir(client: Minio, bucket: str) -> bool:
    try:
        data = b"test"
        client.put_object(bucket, "test_permiso.txt", io.BytesIO(data), length=len(data))
        return True
    except S3Error:
        return False

def puede_listar(client: Minio, bucket: str) -> bool:
    try:
        list(client.list_objects(bucket))
        return True
    except S3Error:
        return False

# ─── COORDINADOR ───────────────────────────────────────────

def test_coordinador_puede_subir_evidencias():
    assert puede_subir(get_client("coordinador"), "evidencias")

def test_coordinador_puede_subir_documentos():
    assert puede_subir(get_client("coordinador"), "documentos")

def test_coordinador_puede_listar_evidencias():
    assert puede_listar(get_client("coordinador"), "evidencias")

def test_coordinador_puede_listar_documentos():
    assert puede_listar(get_client("coordinador"), "documentos")

# ─── PRODUCTOR ─────────────────────────────────────────────

def test_productor_puede_subir_evidencias():
    assert puede_subir(get_client("productor"), "evidencias")

def test_productor_no_puede_subir_documentos():
    assert not puede_subir(get_client("productor"), "documentos")

def test_productor_no_puede_listar_evidencias():
    assert not puede_listar(get_client("productor"), "evidencias")

# ─── PROFESOR ──────────────────────────────────────────────

def test_profesor_puede_subir_evidencias():
    assert puede_subir(get_client("profesor"), "evidencias")

def test_profesor_no_puede_subir_documentos():
    assert not puede_subir(get_client("profesor"), "documentos")

def test_profesor_no_puede_listar_evidencias():
    assert not puede_listar(get_client("profesor"), "evidencias")

# ─── PROFESOR JEFE ─────────────────────────────────────────

def test_profesor_jefe_puede_listar_evidencias():
    assert puede_listar(get_client("profesor_jefe"), "evidencias")

def test_profesor_jefe_puede_listar_documentos():
    assert puede_listar(get_client("profesor_jefe"), "documentos")

def test_profesor_jefe_no_puede_subir_documentos():
    assert not puede_subir(get_client("profesor_jefe"), "documentos")

def test_profesor_jefe_puede_subir_evidencias():
    assert puede_subir(get_client("profesor_jefe"), "evidencias")
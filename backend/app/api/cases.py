from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status

from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError

from app.database.database import get_db
from app.database.models import Usuario, Caso, Hito, Incidente, Documento, Estudiante, EstadoIncidente
from app.schemas.cases import CasoResponse, IncidentResponse, IncidenteCreate

router = APIRouter(prefix="/operate", tags=["Controlador de casos de convivencia"])


@router.get("/test")
async def test(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario))
    usuarios = result.scalars().all()
    return usuarios


@router.get("/cases/get_all", response_model=List[CasoResponse])
async def get_all_cases(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
            select(Caso).options(selectinload(Caso.estudiantes),
                                 selectinload(Caso.hitos).selectinload(Hito.documentos)
                                 )
            )

    cases = result.scalars().all()

    return cases


################################
# INCIDENTES
################################

@router.get("/incidents/get_all", response_model=List[IncidentResponse])
async def get_all_incidents(db: AsyncSession = Depends(get_db)):
    try:
        stmt = (
            select(Incidente, Usuario, Caso)
            .outerjoin(Usuario, Incidente.id_productor == Usuario.id_usuario)
            .outerjoin(Caso, Incidente.id_caso == Caso.id_caso)
            .options(
                selectinload(Incidente.estudiantes).selectinload(Estudiante.curso)
            )
        )
        
        result = await db.execute(stmt)
        rows = result.all()

        stmt_docs = select(Documento).where(Documento.id_incidente.isnot(None))
        docs_result = await db.execute(stmt_docs)
        documentos_bd = docs_result.scalars().all()
        
        docs_por_incidente = {}
        for doc in documentos_bd:
            docs_por_incidente.setdefault(doc.id_incidente, []).append(doc)

        incidentes_respuesta = []
        for incidente, usuario, caso in rows:
            
            estudiantes_formateados = []
            for est in incidente.estudiantes:
                estudiantes_formateados.append({
                    "id_estudiante": est.id_estudiante,
                    "nombre": est.nombre,
                    "id_curso": est.id_curso,
                    "nombre_curso": est.curso.nombre_curso if est.curso else None
                })

            # Construir el diccionario de respuesta
            incidente_data = {
                "id_incidente": incidente.id_incidente,
                "fecha": incidente.fecha,
                "desc": incidente.desc,
                "gravedad": incidente.gravedad,
                "id_productor": incidente.id_productor,
                "id_caso": incidente.id_caso,
                "id_hito": incidente.id_hito,
                "estado": incidente.estado,
                "motivo_rechazo": incidente.motivo_rechazo,
                
                "productor": usuario,
                "estado_caso": caso.estado if caso else None,
                "estudiantes": estudiantes_formateados,
                "documentos": docs_por_incidente.get(incidente.id_incidente, [])
            }
            
            incidentes_respuesta.append(incidente_data)

        return incidentes_respuesta

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de servidor: {str(e)}")

################################
# HITOS
################################


################################
# CASOS
################################


@router.post("/cases/")
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
    usuario_tipo: str = Form(...),  # 'coordinador', 'productor', 'profesor', 'profesor_jefe'
    archivo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
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
    object_key = f"{id_hito}/{uuid.uuid4()}.{extension}" if extension else f"{id_hito}/{uuid.uuid4()}"

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
            content_type=mime_type
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
        id_incidente=id_incidente
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
        "size_bytes": size_bytes
    }



@router.get("/documentos/hito/{id_hito}")
async def obtener_documentos_hito(
    id_hito: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Lista todos los documentos asociados a un hito.
    """
    result = await db.execute(
        select(Documento).where(Documento.id_hito == id_hito)
    )
    documentos = result.scalars().all()
    return documentos


@router.get("/documentos/incidente/{id_incidente}")
async def obtener_documentos_incidente(
    id_incidente: int,
    db: AsyncSession = Depends(get_db)
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
    id_doc: int,
    usuario_tipo: str,
    db: AsyncSession = Depends(get_db)
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
            expires=timedelta(hours=1)
        )
    except S3Error as e:
        raise HTTPException(status_code=403, detail=f"Error al generar URL: {str(e)}")

    return {
        "id_doc": doc.id_doc,
        "nombre_original": doc.nombre_original,
        "url": url,
        "expira_en": "1 hora"
    }


@router.post("/create_incident", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def crear_incidente(
    incidente_data: IncidenteCreate,
    db: AsyncSession = Depends(get_db),
    # TODO: esto debería añadirse con las sesiones implementadas
    # current_productor = Depends(get_current_productor)
):
    
    # buscar estudiantes
    stmt = select(Estudiante).filter(
        Estudiante.id_estudiante.in_(incidente_data.estudiantes_ruts)
    )
    result = await db.execute(stmt)
    estudiantes_db = list(result.scalars().all())

    if len(estudiantes_db) != len(incidente_data.estudiantes_ruts):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uno o más estudiantes indicados no fueron encontrados en el sistema."
        )

    # crear instancia del incidente
    nuevo_incidente = Incidente(
            id_productor="22222222-2",   # TODO: esto se debería cambiar cuando se implementen sesiones
        desc=incidente_data.desc,
        fecha=incidente_data.fecha,
        estado=EstadoIncidente.pendiente,
        estudiantes=estudiantes_db
    )

    # 4. Procesar y asociar los documentos
    for doc_data in incidente_data.documentos:
        nuevo_doc = Documento(
            bucket_name=doc_data.bucket_name,
            object_key=doc_data.object_key,
            nombre_original=doc_data.nombre_original,
            mime_type=doc_data.mime_type,
            size_bytes=doc_data.size_bytes,
            descripcion=doc_data.descripcion,
            id_hito=0      # TODO: esto debería ser opcional en el modelo Documento (DB)
        )
        nuevo_incidente.documentos.append(nuevo_doc)

    # guardar todo
    try:
        db.add(nuevo_incidente)
        await db.commit()
        await db.refresh(nuevo_incidente)
        
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Error de integridad en la base de datos: {str(e.orig)}"
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al crear el incidente: {str(e)}"
        )

    return nuevo_incidente

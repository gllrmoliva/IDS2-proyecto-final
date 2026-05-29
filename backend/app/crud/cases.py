from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database.models import (
    Incidente,
    Estudiante,
    Curso,
    Caso,
    Hito,
    EstadoIncidente,
    EstadoCaso,
    EstudianteCaso,
    EstudianteIncidente,
    Documento# Importación requerida para enrutar el ORM
)
from app.schemas.cases import ElevacionIncidenteRequest, IncidentCreate, EstudianteRolCreate
from app.exceptions import EntityNotFoundError, BusinessLogicError
import uuid
from datetime import datetime
from fastapi import UploadFile, HTTPException
from app.crud.documents import upload_file_minio
from typing import List


async def get_incidents_for_user(db: AsyncSession, user):
    # Eager loading: la ruta es Incidente -> EstudianteIncidente -> Estudiante -> Curso
    stmt = select(Incidente).options(
        selectinload(Incidente.productor),
        selectinload(Incidente.caso_origen),
        selectinload(Incidente.caso_acumulado),
        selectinload(Incidente.documentos),
        selectinload(Incidente.estudiantes)
        .selectinload(EstudianteIncidente.estudiante)
        .selectinload(Estudiante.curso),
    )

    if user.tipo_usuario == "coordinador":
        pass
    elif user.tipo_usuario == "productor":
        stmt = stmt.where(Incidente.id_productor == user.id_usuario)
    elif user.tipo_usuario == "profesor_jefe":
        # Los JOINs también deben respetar el grafo del Association Object
        stmt = stmt.outerjoin(Incidente.estudiantes).outerjoin(EstudianteIncidente.estudiante).outerjoin(Estudiante.curso)
        stmt = stmt.where(
            or_(
                Incidente.id_productor == user.id_usuario,
                Curso.id_pj == user.id_usuario,
            )
        )

    result = await db.execute(stmt)

    return result.scalars().unique().all()


async def get_cases_for_user(db: AsyncSession, user):
    # Eager loading
    stmt = select(Caso).options(
        # Cargar estudiantes del Caso
        selectinload(Caso.estudiantes)
        .selectinload(EstudianteCaso.estudiante)
        .selectinload(Estudiante.curso),
        
        # Cargar hitos del Caso, y dentro de los hitos, cargar documentos Y ESTUDIANTES
        selectinload(Caso.hitos).options(
            selectinload(Hito.documentos),
            selectinload(Hito.estudiantes)
        ),
    )

    if user.tipo_usuario == "coordinador":
        pass
    elif user.tipo_usuario == "profesor_jefe":
        stmt = stmt.join(Caso.estudiantes).join(EstudianteCaso.estudiante).join(Estudiante.curso)
        stmt = stmt.where(Curso.id_pj == user.id_usuario)

    result = await db.execute(stmt)

    return result.scalars().unique().all()


async def elevar_incidente(
    db: AsyncSession, 
    id_incidente: int, 
    id_coordinador: str, 
    payload: ElevacionIncidenteRequest
) -> Incidente:
    
    # Obtener incidente usando la relación .estudiantes (ya no estudiantes_asociados)
    stmt_incidente = select(Incidente).options(
        selectinload(Incidente.estudiantes)
    ).where(Incidente.id_incidente == id_incidente)
    
    result_inc = await db.execute(stmt_incidente)
    incidente = result_inc.scalar_one_or_none()
    
    if not incidente:
        raise EntityNotFoundError("Incidente no encontrado.")
    
    if incidente.id_caso is not None or incidente.id_caso_acumulado is not None:
        raise BusinessLogicError("El incidente ya ha sido procesado (elevado o acumulado).")

    # Vía A: Elevación como Evento Originario (Nuevo Caso)
    if payload.tipo_elevacion == "nuevo_caso":
        if not payload.nuevo_caso:
            raise BusinessLogicError("Faltan los datos (nuevo_caso) para crear la investigación.")
        
        db_caso = Caso(
            id_coordinador=id_coordinador,
            estado=EstadoCaso.abierto,
            fecha_inicio=payload.nuevo_caso.fecha_inicio,
            desc=payload.nuevo_caso.desc,
            gravedad=payload.nuevo_caso.gravedad,
            categoria=payload.nuevo_caso.categoria
        )
        db.add(db_caso)
        await db.flush() 
        
        # Heredar roles al nuevo caso iterando sobre la propiedad sin sufijo
        for est_inc in incidente.estudiantes:
            nuevo_est_caso = EstudianteCaso(
                id_estudiante=est_inc.id_estudiante,
                id_caso=db_caso.id_caso,
                rol=est_inc.rol
            )
            db.add(nuevo_est_caso)
        
        incidente.id_caso = db_caso.id_caso
        incidente.estado = EstadoIncidente.aceptado

    # Vía B: Elevación por Reincidencia (Acumulación)
    elif payload.tipo_elevacion == "acumulacion":
        if not payload.id_caso_acumulado:
            raise BusinessLogicError("Debe especificar el id_caso_acumulado.")
        
        stmt_caso = select(Caso).where(Caso.id_caso == payload.id_caso_acumulado)
        result_caso = await db.execute(stmt_caso)
        caso_destino = result_caso.scalar_one_or_none()
        
        if not caso_destino:
            raise EntityNotFoundError("Caso destino no encontrado.")
        
        if caso_destino.estado != EstadoCaso.abierto:
            raise BusinessLogicError("No se puede anexar incidentes a un caso cerrado.")
            
        incidente.id_caso_acumulado = caso_destino.id_caso
        incidente.estado = EstadoIncidente.aceptado

    # 4. Confirmar Transacción
    await db.commit()
    await db.refresh(incidente)
    
    return incidente

async def create_incidente_completo(
    db: AsyncSession,
    id_productor: str,
    desc: str,
    gravedad: str,
    categoria: str,
    fecha: datetime.date,
    estado: str,
    estudiantes_in: List[EstudianteRolCreate],
    archivos: List[UploadFile],
    minio_client
):
    # 1. Crear el incidente base
    nuevo_incidente = Incidente(
        id_productor=id_productor,
        gravedad=gravedad,
        desc=desc,
        fecha=fecha,
        categoria=categoria,
        estado=estado
    )
    db.add(nuevo_incidente)
    await db.flush() # Genera el id_incidente preliminar

    # 2. Asociar los estudiantes con sus roles
    for est_data in estudiantes_in:
        nueva_asociacion = EstudianteIncidente(
            id_estudiante=est_data.id_estudiante,
            id_incidente=nuevo_incidente.id_incidente,
            rol=est_data.rol
        )
        db.add(nueva_asociacion)

    # 3. Procesar y subir archivos adjuntos (si existen)
    for file in archivos:
        contenido = await file.read()
        size_bytes = len(contenido)
        if size_bytes == 0:
            continue

        # Generar object_key único
        ahora = datetime.now()
        ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
        object_key = f"{ahora.year}/{ahora.month:02d}/{uuid.uuid4()}.{ext}"
        bucket_name = "evidencias"

        # Subir a MinIO (Tu función síncrona provista)
        upload_file_minio(
            client=minio_client,
            bucket=bucket_name,
            object_key=object_key,
            contenido=contenido,
            size_bytes=size_bytes,
            mime_type=file.content_type
        )

        # Registrar en la tabla Documento
        nuevo_doc = Documento(
            bucket_name=bucket_name,
            object_key=object_key,
            nombre_original=file.filename,
            mime_type=file.content_type,
            size_bytes=size_bytes,
            descripcion=f"Evidencia adjunta al incidente #{nuevo_incidente.id_incidente}",
            id_hito=None,
            id_incidente=nuevo_incidente.id_incidente # Vinculación explícita
        )
        db.add(nuevo_doc)

    # 4. Confirmar toda la operación en la base de datos
    await db.commit()
    await db.refresh(nuevo_incidente)
    return nuevo_incidente

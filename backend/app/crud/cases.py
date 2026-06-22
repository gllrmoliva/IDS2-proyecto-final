import uuid
from datetime import datetime, date
from fastapi import UploadFile
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
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
    Documento,
    TipoHito
)

from app.schemas.cases import (
        ElevacionIncidenteRequest,
        EstudianteRolCreate,
        CasoCreate,
        IncidentUpdateEstado,
        HitoCreate,
        CasoUpdate,
        IncidentCreate
)
from app.exceptions import EntityNotFoundError, BusinessLogicError
import uuid
from datetime import datetime
from fastapi import UploadFile, HTTPException
from app.crud.documents import upload_file_minio
from typing import List, Optional


async def get_incidents_for_user(db: AsyncSession, user):
    # Eager loading: la ruta es Incidente -> EstudianteIncidente -> Estudiante -> Curso
    stmt = select(Incidente).options(
        selectinload(Incidente.productor),
        selectinload(Incidente.caso),
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


async def get_cases_for_user(db: AsyncSession, user, id_estudiante: Optional[str] = None):
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

    if id_estudiante:
        stmt = stmt.where(Caso.estudiantes.any(EstudianteCaso.id_estudiante == id_estudiante))

    if user.tipo_usuario == "coordinador":
        pass
    elif user.tipo_usuario == "profesor_jefe":
        stmt = stmt.join(Caso.estudiantes).join(EstudianteCaso.estudiante).join(Estudiante.curso)
        stmt = stmt.where(Curso.id_pj == user.id_usuario)

    result = await db.execute(stmt)

    return result.scalars().unique().all()


async def create_incidente_completo(
    db: AsyncSession,
    id_productor: str,
    desc: str,
    gravedad: str,
    categoria: str,
    fecha: date,
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
        filename = file.filename or ""
        ext = filename.split(".")[-1] if "." in filename else "bin"
        object_key = f"{ahora.year}/{ahora.month:02d}/{uuid.uuid4()}.{ext}"
        bucket_name = "evidencias"

        mime = file.content_type or "application/octet-stream"
        # Subir a MinIO (Tu función síncrona provista)
        upload_file_minio(
            client=minio_client,
            bucket=bucket_name,
            object_key=object_key,
            contenido=contenido,
            size_bytes=size_bytes,
            mime_type=mime
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
    return nuevo_incidente


async def elevar_incidente(
    db: AsyncSession,
    id_incidente: int,
    id_coordinador: str,
    payload: ElevacionIncidenteRequest
) -> Incidente:
    stmt_incidente = select(Incidente).options(
        selectinload(Incidente.productor),
        selectinload(Incidente.documentos),
        selectinload(Incidente.estudiantes)
            .selectinload(EstudianteIncidente.estudiante)
            .selectinload(Estudiante.curso)
    ).where(Incidente.id_incidente == id_incidente)
    
    result_inc = await db.execute(stmt_incidente)
    incidente = result_inc.scalar_one_or_none()
    
    if not incidente:
        raise EntityNotFoundError("Incidente no encontrado.")
    
    if incidente.id_caso is not None:
        raise BusinessLogicError("El incidente ya ha sido procesado e ingresado a un caso.")

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
        
        for est_inc in incidente.estudiantes:
            nuevo_est_caso = EstudianteCaso(
                id_estudiante=est_inc.id_estudiante,
                id_caso=db_caso.id_caso,
                rol=est_inc.rol
            )
            db.add(nuevo_est_caso)
        
        # Asignación de puntero unificado
        incidente.id_caso = db_caso.id_caso

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
            
        # Asignación de puntero unificado
        incidente.id_caso = caso_destino.id_caso

    # En ambos escenarios el estado cambia a aceptado
    incidente.estado = EstadoIncidente.aceptado

    await db.commit()
    return incidente


async def create_caso_completo(
    db: AsyncSession,
    id_coordinador: str,
    caso_in: CasoCreate,
    archivos: List[UploadFile],
    minio_client
) -> Caso:
    
    # Crear el Caso base
    nuevo_caso = Caso(
        id_coordinador=id_coordinador,
        estado=caso_in.estado.value if hasattr(caso_in.estado, 'value') else caso_in.estado,
        fecha_inicio=caso_in.fecha_inicio,
        desc=caso_in.desc,
        gravedad=caso_in.gravedad.value if hasattr(caso_in.gravedad, 'value') else caso_in.gravedad,
        categoria=caso_in.categoria.value if hasattr(caso_in.categoria, 'value') else caso_in.categoria
    )
    db.add(nuevo_caso)
    await db.flush() # Obtener id_caso preliminar

    # Crear el Incidente Originario
    # Al ser el primero que se inserta, la base de datos le asignará el ID más bajo de este caso (TODO)
    # lo que lo convierte automáticamente en el "originario" temporalmente hablando.
    incidente_originario = Incidente(
        id_productor=id_coordinador, 
        gravedad=caso_in.gravedad.value if hasattr(caso_in.gravedad, 'value') else caso_in.gravedad,
        desc=caso_in.desc,
        fecha=caso_in.fecha_inicio,
        categoria=caso_in.categoria.value if hasattr(caso_in.categoria, 'value') else caso_in.categoria,
        estado=EstadoIncidente.aceptado.value if hasattr(EstadoIncidente, 'aceptado') else "aceptado",
        id_caso=nuevo_caso.id_caso # Relación N:1 estándar
    )
    db.add(incidente_originario)
    await db.flush() # Obtener id_incidente preliminar

    # Propagar Asociación de Estudiantes (Doble Inserción)
    for est_data in caso_in.estudiantes:
        # rol_val = est_data.rol.value if hasattr(est_data.rol, 'value') else est_data.rol
        rol_val = getattr(est_data.rol, 'value', est_data.rol)
        
        # Asociación a largo plazo (Caso)
        nueva_asociacion_caso = EstudianteCaso(
            id_estudiante=est_data.id_estudiante,
            id_caso=nuevo_caso.id_caso,
            rol=rol_val
        )
        db.add(nueva_asociacion_caso)

        # Asociación del suceso específico (Incidente originario)
        nueva_asociacion_incidente = EstudianteIncidente(
            id_estudiante=est_data.id_estudiante,
            id_incidente=incidente_originario.id_incidente,
            rol=rol_val
        )
        db.add(nueva_asociacion_incidente)

    # Procesar Archivos y Vincular al Incidente Originario
    if archivos:
        has_bytes = False
        for f in archivos:
            if len(await f.read()) > 0:
                has_bytes = True
            await f.seek(0)

        if has_bytes:
            for file in archivos:
                contenido = await file.read()
                size_bytes = len(contenido)
                if size_bytes == 0:
                    continue

                # Generar object_key único
                ahora = datetime.now()

                filename = file.filename or ""
                ext = filename.split(".")[-1] if "." in filename else "bin"
                object_key = f"{ahora.year}/{ahora.month:02d}/{uuid.uuid4()}.{ext}"
                bucket_name = "evidencias"

                # Subir a MinIO
                mime = file.content_type or "application/octet-stream"

                upload_file_minio(
                    client=minio_client,
                    bucket=bucket_name,
                    object_key=object_key,
                    contenido=contenido,
                    size_bytes=size_bytes,
                    mime_type=mime
                )

                # Registrar Documento vinculándolo estrictamente al Incidente base
                nuevo_doc = Documento(
                    bucket_name=bucket_name,
                    object_key=object_key,
                    nombre_original=file.filename,
                    mime_type=file.content_type,
                    size_bytes=size_bytes,
                    descripcion=f"Evidencia originaria del Caso #{nuevo_caso.id_caso}",
                    id_hito=None,
                    id_incidente=incidente_originario.id_incidente, # <-- Vinculación Factual
                    id_caso=None # <-- Nulo explícito para asegurar cumplimiento de XOR Check Constraint
                )
                db.add(nuevo_doc)

    # Confirmar Operación Atómica
    await db.commit()
    return nuevo_caso


async def update_incidente_estado(
    db: AsyncSession,
    id_incidente: int,
    payload: IncidentUpdateEstado
) -> Incidente:
    
    # Eager loading necesario para que FastAPI pueda serializar el IncidentResponse
    stmt = select(Incidente).options(
        selectinload(Incidente.productor),
        selectinload(Incidente.documentos),
        selectinload(Incidente.estudiantes)
            .selectinload(EstudianteIncidente.estudiante)
            .selectinload(Estudiante.curso)
    ).where(Incidente.id_incidente == id_incidente)
    
    result = await db.execute(stmt)
    incidente = result.scalar_one_or_none()
    
    if not incidente:
        raise EntityNotFoundError("Incidente no encontrado.")
        
    # Regla de Negocio: Un incidente cristalizado dentro de un caso no puede rechazarse o dejarse pendiente 
    if incidente.id_caso is not None and payload.estado != EstadoIncidente.aceptado:
        raise BusinessLogicError("No se puede alterar el estado de un incidente que ya fue elevado y vinculado a un caso activo.")

    # Mutación de estado
    incidente.estado = payload.estado
    
    # Limpieza de seguridad para cumplir estrictamente con los CHECK constraints
    if payload.estado == EstadoIncidente.rechazado:
        if not payload.motivo_rechazo:
            raise BusinessLogicError("Se requiere un motivo de rechazo explícito.")
        incidente.motivo_rechazo = payload.motivo_rechazo
    else:
        incidente.motivo_rechazo = None

    await db.commit()
    return incidente


# Funcion de actualizacion de caso
async def update_caso(
    db: AsyncSession,
    id_caso: int,
    payload: CasoUpdate
) -> Caso:
    
   # Eager Loading para satisfacer a Pydantic (gemini me dijo que lo agregara)
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
    caso = result.scalar_one_or_none()
    
    if not caso:
        raise EntityNotFoundError("Caso no encontrado.")
    
    # Calcular estado final para validación
    estado_final = payload.estado if payload.estado is not None else caso.estado
    
    # Validar cierre de caso
    if estado_final == EstadoCaso.cerrado:
        fecha_cierre_final = payload.fecha_cierre if payload.fecha_cierre is not None else caso.fecha_cierre
        if not fecha_cierre_final:
            raise BusinessLogicError("Se requiere fecha_cierre para cerrar un caso.")
    
    # Eliminar hitos
    if payload.hitos_a_eliminar:
        for id_hito in payload.hitos_a_eliminar:
            stmt_hito = select(Hito).options(
            selectinload(Hito.documentos)  
        ).where(
                (Hito.id_hito == id_hito) & (Hito.id_caso == id_caso)
            )
            result_hito = await db.execute(stmt_hito)
            hito = result_hito.scalar_one_or_none()
            
            if hito:
                await db.delete(hito)  # Con await
            else:
                raise EntityNotFoundError(f"Hito {id_hito} no encontrado en este caso.")
    
    # Desvincular incidentes (no lo elimina, solo lo libera del caso y lo deja pendiente)
    if payload.incidentes_a_eliminar:
        for id_incidente in payload.incidentes_a_eliminar:
            stmt_inc = select(Incidente).where(
                (Incidente.id_incidente == id_incidente) & (Incidente.id_caso == id_caso)
            )
            result_inc = await db.execute(stmt_inc)
            incidente = result_inc.scalar_one_or_none()
            
            if incidente:
                incidente.id_caso = None
                incidente.estado = EstadoIncidente.pendiente
            else:
                raise EntityNotFoundError(f"Incidente {id_incidente} no encontrado en este caso.")
    
    # Actualizar campos del caso
    if payload.desc is not None:
        caso.desc = payload.desc
    
    if payload.gravedad is not None:
        caso.gravedad = payload.gravedad
    
    if payload.categoria is not None:
        caso.categoria = payload.categoria
    
    if payload.estado is not None:
        caso.estado = payload.estado
        if payload.estado == EstadoCaso.abierto:
            caso.fecha_cierre = None
        elif payload.estado == EstadoCaso.cerrado:
            caso.fecha_cierre = payload.fecha_cierre
    
    await db.commit()
    return caso
  

async def create_hito_completo(
    db: AsyncSession,
    id_caso: int,
    hito_in: HitoCreate,
    archivos: List[UploadFile],
    minio_client
) -> Hito:

    # verificar exitencia de caso
    stmt_caso = select(Caso).where(Caso.id_caso == id_caso)
    result_caso = await db.execute(stmt_caso)
    if not result_caso.scalar_one_or_none():
        raise EntityNotFoundError(f"El caso con ID {id_caso} no existe.")

    # ver si tiene tipo (solo si es medida)
    if hito_in.tipo == TipoHito.medida and not hito_in.nivel_medida:
        raise BusinessLogicError("Los hitos de tipo 'medida' requieren especificar un 'nivel_medida'.")

    if hito_in.tipo == TipoHito.tramite and hito_in.nivel_medida:
        raise BusinessLogicError("Los hitos de tipo 'tramite' no pueden tener un 'nivel_medida'.")

    # crea el hito en la base de datos
    nuevo_hito = Hito(
        id_caso=id_caso,
        tipo=hito_in.tipo.value if hasattr(hito_in.tipo, 'value') else hito_in.tipo,
        nivel_medida=hito_in.nivel_medida.value if hasattr(hito_in.nivel_medida, 'value') and hito_in.nivel_medida else hito_in.nivel_medida,
        desc=hito_in.desc,
        fecha=hito_in.fecha,
        categoria_tramite=hito_in.categoria_tramite,
        subtipo_tramite=hito_in.subtipo_tramite
    )
    db.add(nuevo_hito)

    # vincular estudiantes al hito
    if hito_in.estudiantes_ids:
        stmt_estudiantes = select(Estudiante).where(Estudiante.id_estudiante.in_(hito_in.estudiantes_ids))
        result_ests = await db.execute(stmt_estudiantes)
        estudiantes_db = result_ests.scalars().all()
        
        if len(estudiantes_db) != len(hito_in.estudiantes_ids):
            raise EntityNotFoundError("Uno o más IDs de estudiantes proporcionados no existen.")
            
        nuevo_hito.estudiantes = list(estudiantes_db)

    await db.flush()

    # procesar archivos y subir a MinIO
    if archivos:
        has_bytes = False
        for f in archivos:
            if len(await f.read()) > 0:
                has_bytes = True
            await f.seek(0)

        if has_bytes:
            for file in archivos:
                contenido = await file.read()
                size_bytes = len(contenido)
                if size_bytes == 0:
                    continue

                # object_key único
                ahora = datetime.now()
                filename = file.filename or ""
                ext = filename.split(".")[-1] if "." in filename else "bin"
                object_key = f"{ahora.year}/{ahora.month:02d}/{uuid.uuid4()}.{ext}"
                bucket_name = "documentos"

                # subir a MinIO
                mime = file.content_type or "application/octet-stream"
                upload_file_minio(
                    client=minio_client,
                    bucket=bucket_name,
                    object_key=object_key,
                    contenido=contenido,
                    size_bytes=size_bytes,
                    mime_type=mime
                )

                # registrar documento en base de datos
                nuevo_doc = Documento(
                    bucket_name=bucket_name,
                    object_key=object_key,
                    nombre_original=file.filename,
                    mime_type=file.content_type,
                    size_bytes=size_bytes,
                    descripcion=f"Documento anexo al Hito #{nuevo_hito.id_hito}",
                    id_hito=nuevo_hito.id_hito,  # vincular al hito
                    id_incidente=None,
                    id_caso=None
                )
                db.add(nuevo_doc)

    await db.commit()

    stmt_reload = (
        select(Hito)
        .where(Hito.id_hito == nuevo_hito.id_hito)
        .options(
            selectinload(Hito.estudiantes),
        )
    )

    result_reload = await db.execute(stmt_reload)

    hito_completo = result_reload.scalar_one()
    return hito_completo

async def get_caso_by_id(
    db: AsyncSession, id_caso: int, user) -> Caso:
    stmt = select(Caso).options(
        
        # Estudiantes del caso con su curso
        selectinload(Caso.estudiantes)
            .selectinload(EstudianteCaso.estudiante)
            .selectinload(Estudiante.curso),

        # Hitos con sus documentos y estudiantes vinculados
        selectinload(Caso.hitos).options(
            selectinload(Hito.documentos),
            selectinload(Hito.estudiantes)
        ),

        # Incidentes del caso con productor, documentos y estudiantes
        selectinload(Caso.incidentes).options(
            selectinload(Incidente.productor),
            selectinload(Incidente.documentos),
            selectinload(Incidente.estudiantes)
                .selectinload(EstudianteIncidente.estudiante)
                .selectinload(Estudiante.curso)
        ),
    ).where(Caso.id_caso == id_caso)

    # Restricciones por rol
    if user.tipo_usuario == "profesor_jefe":
        stmt = stmt.where(
            Caso.estudiantes.any(
                EstudianteCaso.estudiante.has(
                    Estudiante.curso.has(Curso.id_pj == user.id_usuario)
                )
            )
        )
    elif user.tipo_usuario == "productor":
        stmt = stmt.where(
            Caso.incidentes.any(Incidente.id_productor == user.id_usuario)
        )

    result = await db.execute(stmt)
    caso = result.scalars().unique().one_or_none()

    if not caso:
        raise EntityNotFoundError(f"Caso con ID {id_caso} no encontrado.")

    return caso

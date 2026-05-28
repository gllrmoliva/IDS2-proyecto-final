from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database.models import (Incidente, Estudiante, Curso,
                                 ProfesorJefe, Caso, Hito, Documento)
from app.schemas.cases import IncidentCreate


async def get_incidents_for_user(db: AsyncSession, user):
    # Eager loading, cargamos todas las tablas necesarias
    stmt = select(Incidente).options(
        selectinload(Incidente.productor),
        selectinload(Incidente.caso),
        selectinload(Incidente.documentos),
        selectinload(Incidente.estudiantes).selectinload(Estudiante.curso)
    )

    # Data scoping: desde aquí son reglas de negocio:
    # - Coordinadores ven todo
    # - Productores ven lo que han producido
    # - Profesores jefe ven solo incidentes que involucran a estudiantes de su curso
    if user.tipo_usuario == "coordinador":
        pass
    elif user.tipo_usuario == "productor":
        stmt = stmt.where(Incidente.id_productor == user.id_usuario)
    elif user.tipo_usuario == "profesor_jefe":
        stmt = stmt.outerjoin(Incidente.estudiantes).outerjoin(Estudiante.curso)
        stmt = stmt.where(
            or_(
                Incidente.id_productor == user.id_usuario,
                Curso.id_pj == user.id_usuario
            )
        )

    result = await db.execute(stmt)

    return result.scalars().unique().all()


async def get_cases_for_user(db: AsyncSession, user):
    # Eager loading para evitar N+1 queries
    stmt = select(Caso).options(
        selectinload(Caso.estudiantes),
        selectinload(Caso.hitos).selectinload(Hito.documentos)
    )

    # Data scoping:
    # - Coordinadores ven todos los casos
    # - Profesores jefe ven solo casos que involucran a estudiantes de su curso
    # - Productores NO tienen acceso a esta capa (bloqueados en router)
    if user.tipo_usuario == "coordinador":
        pass
    elif user.tipo_usuario == "profesor_jefe":
        # Usamos INNER JOIN porque si el caso no tiene estudiantes de este curso,
        # el Profesor Jefe no debe verlo bajo ninguna circunstancia.
        stmt = stmt.join(Caso.estudiantes).join(Estudiante.curso)
        stmt = stmt.where(Curso.id_pj == user.id_usuario)

    result = await db.execute(stmt)
    
    return result.scalars().unique().all()


async def create_incident(db: AsyncSession, user, incident_in: IncidentCreate):

    # obtener datos
    stmt_estudiantes = select(Estudiante).where(
        Estudiante.id_estudiante.in_(incident_in.estudiantes_ids)
    )
    result = await db.execute(stmt_estudiantes)
    estudiantes_db = result.scalars().all()

    if not estudiantes_db:
        raise ValueError("No se encontraron estudiantes.")
    
    # crear objetos para documentos
    documentos_db = [
        Documento(
            bucket_name=doc.bucket_name,
            object_key=doc.object_key,
            nombre_original=doc.nombre_original,
            mime_type=doc.mime_type,
            size_bytes=doc.size_bytes,
            descripcion=doc.descripcion
        )
        for doc in incident_in.documentos
    ]
    
    # crear el incidente como tal
    nuevo_incidente = Incidente(
        id_productor=user.id_usuario,
        gravedad=incident_in.gravedad,
        desc=incident_in.desc,
        fecha=incident_in.fecha,
        estado=incident_in.estado,
        id_caso=None,
        id_hito=None,
        motivo_rechazo=None,
        estudiantes=list(estudiantes_db),
        documentos=documentos_db
    )
    
    # añadir y obtener scope nuevamente (tema con conexión asíncrona)
    db.add(nuevo_incidente)
    await db.commit()
    
    stmt = (
        select(Incidente)
        .where(Incidente.id_incidente == nuevo_incidente.id_incidente)
        .options(
            selectinload(Incidente.estudiantes),
            selectinload(Incidente.documentos)
        )
    )

    result_final = await db.execute(stmt)
    incidente_completo = result_final.scalar_one()
    
    return incidente_completo

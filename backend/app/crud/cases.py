from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from app.database.models import Incidente, Estudiante, Curso, ProfesorJefe, Caso, Hito

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

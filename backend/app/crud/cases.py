from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from app.database.models import Incidente, Estudiante, Curso, ProfesorJefe

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
    # - Profesores jefe ven lo que han producido y lo que concierne a sus cursos
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

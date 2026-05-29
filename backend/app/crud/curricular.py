from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from app.database.models import Estudiante, Curso


async def get_students(db: AsyncSession, user):
    if user.tipo_usuario in ["coordinador", "productor", "profesor_jefe"]:
        stmt = select(Estudiante).options(joinedload(Estudiante.curso))

        result = await db.execute(stmt)

        return result.scalars().all()


async def get_courses(db: AsyncSession, user):
    if user.tipo_usuario in ["coordinador", "productor", "profesor_jefe"]:
        stmt = select(Curso)

        result = await db.execute(stmt)

        return result.scalars().all()

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from app.database.models import Estudiante, Curso


async def get_students(db: AsyncSession, user):
    if user.tipo_usuario in ["coordinador", "productor", "profesor_jefe"]: # Innecesario?
        stmt = select(Estudiante).options(joinedload(Estudiante.curso))

        result = await db.execute(stmt)

        return result.scalars().all()


async def get_courses(db: AsyncSession, user):
    if user.tipo_usuario in ["coordinador", "productor", "profesor_jefe"]:
        stmt = select(Curso)

        result = await db.execute(stmt)

        return result.scalars().all()


async def get_student_by_id(db: AsyncSession, user, id_estudiante):
    if user.tipo_usuario in ["coordinador", "productor", "profesor_jefe"]:
        stmt = select(Estudiante).where(Estudiante.id_estudiante == id_estudiante)

        result = await db.execute(stmt)

        return result.scalar_one_or_none()

async def get_courses_by_teacher(db: AsyncSession, user, id_profesor):
    if user.tipo_usuario in ["coordinador", "productor", "profesor_jefe"]:
        print(user.id_usuario)
        stmt = select(Curso).where(Curso.id_pj == id_profesor)
        result = await db.execute(stmt)
        return result.scalars().all() # Podrían ser varios

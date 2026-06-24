from typing import Annotated
from app.crud.cases import get_cases_for_user
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.models import Curso 
from app.crud.curricular import get_courses_by_teacher, get_student_by_id, get_students, get_courses, get_courses_by_teacher
from app.database.database import get_db
from app.api.deps import RoleChecker


router = APIRouter(prefix="/students", tags=["Controlador de estudiantes"])


@router.get("/get_all")
async def get_all_students(
    user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["coordinador", "productor", "profesor_jefe"]))
    ],
    db: AsyncSession = Depends(get_db)
):
    return await get_students(db, user)


@router.get("/courses/get_all")
async def get_all_courses(
    user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["coordinador", "productor", "profesor_jefe"]))
    ],
    db: AsyncSession = Depends(get_db)
):
    return await get_courses(db, user)


@router.get("/{id_estudiante}/cases")
async def get_cases_for_student(
    id_estudiante: str,
    user: Annotated[dict, Depends(RoleChecker(allowed_roles=["coordinador", "profesor_jefe"]))],
    db: AsyncSession = Depends(get_db)
):
    # Verificar existencia global 
    estudiante = await get_student_by_id(db, user, id_estudiante)
    if not estudiante:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    # Validación estricta de jurisdicción 
    if user.tipo_usuario == "profesor_jefe":
        # Verificamos si el curso del estudiante tiene a este usuario como Profesor Jefe
        stmt = select(Curso).where(
            Curso.id_curso == estudiante.id_curso, 
            Curso.id_pj == user.id_usuario
        )
        curso_asignado = (await db.execute(stmt)).scalar_one_or_none()
        
        # Si el curso no coincide con su jefatura, bloqueamos el acceso
        if not curso_asignado:
            raise HTTPException(
                status_code=403, 
                detail="No tienes autorización para ver el historial disciplinario de estudiantes fuera de tu jefatura."
            )

    # Obtener casos (El CRUD ya no necesita validar el id_pj)
    return await get_cases_for_user(db, user, id_estudiante)



@router.get("/courses/me")
async def get_current_curso(
    user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["profesor_jefe"]))
    ],
    db: AsyncSession = Depends(get_db)
):
    return await get_courses_by_teacher(db, user, user.id_usuario)

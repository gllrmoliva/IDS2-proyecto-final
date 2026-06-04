from typing import Annotated
from app.crud.cases import get_cases_for_user
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.curricular import get_student_by_id, get_students, get_courses
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


@router.get("/students/{id_estudiante}/cases")
async def get_cases_for_student(
    id_estudiante: str,
    user: Annotated[
        dict, Depends(RoleChecker(allowed_roles=["coordinador", "profesor_jefe"]))
    ],
    db: AsyncSession = Depends(get_db)
):
    estudiante = await get_student_by_id(db, user, id_estudiante)
    if not estudiante:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    return await get_cases_for_user(db, user, id_estudiante)

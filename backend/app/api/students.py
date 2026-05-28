from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.user import get_students
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

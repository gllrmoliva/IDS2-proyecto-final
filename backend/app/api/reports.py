from fastapi import APIRouter, Response, Depends, HTTPException
from weasyprint import HTML
from jinja2 import Environment, FileSystemLoader
from app.database.database import get_db
from app.api.deps import RoleChecker
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Annotated
from app.exceptions import EntityNotFoundError
from app.database.models import Estudiante, Curso

from app.crud.cases import (
        get_cases_for_user_report,
        get_caso_by_id_report
)


router = APIRouter(prefix="/reports", tags=["Controlador de reportes"])

env = Environment(loader=FileSystemLoader("templates"))



@router.get("/case/{id_caso}")
async def create_report_case(
        id_caso: int,
        current_user: Annotated[
            dict, Depends(RoleChecker(allowed_roles=["profesor_jefe", "coordinador", ]))
            ],
        db: AsyncSession = Depends(get_db)):

    try:
        datos = await get_caso_by_id_report(db=db, id_caso=id_caso, user=current_user)
    except EntityNotFoundError:
        # En una arquitectura segura (Zero Trust), si el recurso existe pero no tienes acceso,
        # devolver 404 previene el escaneo de IDs (Insecure Direct Object Reference).
        raise HTTPException(
            status_code=404, 
            detail="El caso no existe o no tienes los permisos necesarios para acceder a él."
        )

    template = env.get_template("reporte_caso.html")
    html_renderizado = template.render(caso=datos)
    
    pdf_bytes = HTML(string=html_renderizado).write_pdf()
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=reporte_caso.pdf"}
    )


@router.get("/student/{id_estudiante}")
async def create_report_student(
        id_estudiante: str,
        current_user: Annotated[
            dict, Depends(RoleChecker(allowed_roles=["profesor_jefe", "coordinador", ]))
            ],
        db: AsyncSession = Depends(get_db)):

    # 1. VERIFICACIÓN EXPLÍCITA DE JURISDICCIÓN PARA PROFESOR JEFE
    if current_user.tipo_usuario == "profesor_jefe":
        stmt_auth = select(Estudiante).join(Curso).where(
            Estudiante.id_estudiante == id_estudiante,
            Curso.id_pj == current_user.id_usuario
        )
        result_auth = await db.execute(stmt_auth)
        if not result_auth.scalar_one_or_none():
            # El estudiante no pertenece al curso de este profesor jefe
            raise HTTPException(
                status_code=403,
                detail="Acceso denegado: El estudiante solicitado no pertenece a tu jefatura."
            )

    # 2. Obtención de datos (El CRUD ya es seguro, pero ahora sabemos que el estudiante es válido)
    try:
        cases = await get_cases_for_user_report(
            db=db,
            user=current_user,
            id_estudiante=id_estudiante
        )
    except Exception as e:
        raise HTTPException(
                status_code=500,
                detail=f"Error interno del servidor al compilar el historial: {str(e)}"
                )

    # Si el CRUD devuelve genéricos porque no hubo casos, forzamos los datos base.
    if cases["nombre_alumno"] == "Sin nombre registrado":
        # Buscamos el nombre real para no generar un PDF vacío
        stmt_est = select(Estudiante).options(selectinload(Estudiante.curso)).where(Estudiante.id_estudiante == id_estudiante)
        estudiante_db = (await db.execute(stmt_est)).scalar_one_or_none()
        
        if not estudiante_db:
             raise HTTPException(status_code=404, detail="Estudiante no encontrado en el sistema.")
             
        cases["nombre_alumno"] = estudiante_db.nombre
        cases["curso_alumno"] = estudiante_db.curso.nombre_curso if estudiante_db.curso else "Sin curso registrado"

    template = env.get_template("reporte_estudiante.html")
    html_renderizado = template.render(
            datos_alumno=cases,
            id_estudiante=id_estudiante
            )

    pdf_bytes = HTML(string=html_renderizado).write_pdf()
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=reporte_estudiante.pdf"}
    )

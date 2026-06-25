from fastapi import APIRouter, Response, Depends, HTTPException
from weasyprint import HTML
from jinja2 import Environment, FileSystemLoader
from app.database.database import get_db
from app.api.deps import RoleChecker
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

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
            dict, Depends(RoleChecker(allowed_roles=["coordinador", ]))
            ],
        db: AsyncSession = Depends(get_db)):

    datos = await get_caso_by_id_report(db=db, id_caso=id_caso, user = current_user)

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
            dict, Depends(RoleChecker(allowed_roles=["coordinador", ]))
            ],
        db: AsyncSession = Depends(get_db)):


    try:
        cases = await get_cases_for_user_report(db=db,
                              user=current_user,
                              id_estudiante=id_estudiante)
    except Exception as e:
        raise HTTPException(
                status_code=500,
                detail=f"Error interno del servidor: {str(e)}"
                )

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


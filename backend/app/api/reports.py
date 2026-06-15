from fastapi import APIRouter, Response, Depends, HTTPException
from weasyprint import HTML
from jinja2 import Environment, FileSystemLoader
from app.database.database import get_db
from app.api.deps import RoleChecker
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.crud.cases import (
        get_cases_for_user
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
    datos_prueba = {
        "id_caso": 1,
        "id_coordinador": "11111111-1",
        "estado": "abierto",
        "fecha_inicio": "2026-05-10",
        "fecha_cierre": None,
        "desc": "Problemas reiterados de convivencia en sala.",
        "gravedad": "grave",
        "categoria": "disrupcion_desacato",
        "estudiantes": [
            {"rol": "autor_agresor", "estudiante": {"id_estudiante": "1000000-1", "nombre": "Juan Pérez", "id_curso": 1, "nombre_curso": "1 Medio A"}},
            {"rol": "complice", "estudiante": {"id_estudiante": "1000001-2", "nombre": "Pedro Gómez", "id_curso": 2, "nombre_curso": "1 Medio B"}},
            {"rol": "testigo_espectador", "estudiante": {"id_estudiante": "1000003-3", "nombre": "Diego López", "id_curso": 1, "nombre_curso": "1 Medio A"}}
        ],
        "hitos": [
            {"id_hito": 1, "id_caso": 1, "tipo": "tramite", "nivel_medida": None, "categoria_tramite": "comunicacion_citaciones", "subtipo_tramite": "entrevista_apoderado", "desc": "Entrevista inicial con apoderados de Juanito.", "fecha": "2026-05-12", "estudiantes": [{"id_estudiante": "1000000-1", "nombre": "Juan Pérez", "id_curso": 1, "nombre_curso": "1 Medio A"}], "documentos": [{"nombre_original": "acta_entrevista.pdf"}]},
            {"id_hito": 12, "id_caso": 1, "tipo": "medida", "nivel_medida": "cautelar", "categoria_tramite": None, "subtipo_tramite": None, "desc": "Aplicación de medida disciplinaria", "fecha": "2026-06-05", "estudiantes": [{"id_estudiante": "1000000-1", "nombre": "Juan Pérez"}], "documentos": []}
        ]
    }

    template = env.get_template("reporte_caso.html")
    html_renderizado = template.render(caso=datos_prueba)
    
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
        cases = await get_cases_for_user(db=db,
                              user=current_user,
                              id_estudiante=id_estudiante)
    except Exception as e:
        raise HTTPException(
                status_code=500,
                detail=f"Error interno del servidor: {str(e)}"
                )

    template = env.get_template("reporte_estudiante.html")
    html_renderizado = template.render(casos=cases,
                                       id_estudiante=id_estudiante)
    
    pdf_bytes = HTML(string=html_renderizado).write_pdf()
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=reporte_estudiante.pdf"}
    )
    #return cases


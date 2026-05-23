from fastapi import APIRouter, Depends, HTTPException

from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.database import get_db
from app.database.models import Usuario, Caso, Hito, Incidente, Documento, Estudiante
from app.schemas.cases import CasoResponse, IncidentResponse

router = APIRouter(prefix="/operate", tags=["Controlador de casos de convivencia"])


@router.get("/test")
async def test(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario))
    usuarios = result.scalars().all()
    return usuarios


@router.get("/cases/get_all", response_model=List[CasoResponse])
async def get_all_cases(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
            select(Caso).options(selectinload(Caso.estudiantes),
                                 selectinload(Caso.hitos).selectinload(Hito.documentos)
                                 )
            )

    cases = result.scalars().all()

    return cases


################################
# INCIDENTES
################################

@router.get("/incidents/get_all", response_model=List[IncidentResponse])
async def get_all_incidents(db: AsyncSession = Depends(get_db)):
    try:
        stmt = (
            select(Incidente, Usuario, Caso)
            .outerjoin(Usuario, Incidente.id_productor == Usuario.id_usuario)
            .outerjoin(Caso, Incidente.id_caso == Caso.id_caso)
            .options(
                selectinload(Incidente.estudiantes).selectinload(Estudiante.curso)
            )
        )
        
        result = await db.execute(stmt)
        rows = result.all()

        stmt_docs = select(Documento).where(Documento.id_incidente.isnot(None))
        docs_result = await db.execute(stmt_docs)
        documentos_bd = docs_result.scalars().all()
        
        docs_por_incidente = {}
        for doc in documentos_bd:
            docs_por_incidente.setdefault(doc.id_incidente, []).append(doc)

        incidentes_respuesta = []
        for incidente, usuario, caso in rows:
            
            estudiantes_formateados = []
            for est in incidente.estudiantes:
                estudiantes_formateados.append({
                    "id_estudiante": est.id_estudiante,
                    "nombre": est.nombre,
                    "id_curso": est.id_curso,
                    "nombre_curso": est.curso.nombre_curso if est.curso else None
                })

            # Construir el diccionario de respuesta
            incidente_data = {
                "id_incidente": incidente.id_incidente,
                "fecha": incidente.fecha,
                "desc": incidente.desc,
                "gravedad": incidente.gravedad,
                "id_productor": incidente.id_productor,
                "id_caso": incidente.id_caso,
                "id_hito": incidente.id_hito,
                
                "productor": usuario,
                "estado_caso": caso.estado if caso else None,
                "estudiantes": estudiantes_formateados,
                "documentos": docs_por_incidente.get(incidente.id_incidente, [])
            }
            
            incidentes_respuesta.append(incidente_data)

        return incidentes_respuesta

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de servidor: {str(e)}")

################################
# HITOS
################################


################################
# CASOS
################################


@router.post("/cases/")
async def create_case():
    """
    Permite al Coordinador crear un caso sin necesidad de incidentes o hitos previos.
    """
    return "create_case"


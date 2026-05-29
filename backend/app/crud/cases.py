from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from app.database.models import (
    Incidente,
    Estudiante,
    Curso,
    Caso,
    Hito,
    EstadoIncidente,
    EstadoCaso,
    EstudianteCaso,
    EstudianteIncidente, # Importación requerida para enrutar el ORM
)
from app.schemas.cases import ElevacionIncidenteRequest
from app.exceptions import EntityNotFoundError, BusinessLogicError


async def get_incidents_for_user(db: AsyncSession, user):
    # Eager loading: la ruta es Incidente -> EstudianteIncidente -> Estudiante -> Curso
    stmt = select(Incidente).options(
        selectinload(Incidente.productor),
        selectinload(Incidente.caso_origen),
        selectinload(Incidente.caso_acumulado),
        selectinload(Incidente.documentos),
        selectinload(Incidente.estudiantes)
        .selectinload(EstudianteIncidente.estudiante)
        .selectinload(Estudiante.curso),
    )

    if user.tipo_usuario == "coordinador":
        pass
    elif user.tipo_usuario == "productor":
        stmt = stmt.where(Incidente.id_productor == user.id_usuario)
    elif user.tipo_usuario == "profesor_jefe":
        # Los JOINs también deben respetar el grafo del Association Object
        stmt = stmt.outerjoin(Incidente.estudiantes).outerjoin(EstudianteIncidente.estudiante).outerjoin(Estudiante.curso)
        stmt = stmt.where(
            or_(
                Incidente.id_productor == user.id_usuario,
                Curso.id_pj == user.id_usuario,
            )
        )

    result = await db.execute(stmt)

    return result.scalars().unique().all()


async def get_cases_for_user(db: AsyncSession, user):
    # Eager loading 
    stmt = select(Caso).options(
        # Cargar estudiantes del Caso
        selectinload(Caso.estudiantes)
        .selectinload(EstudianteCaso.estudiante)
        .selectinload(Estudiante.curso),
        
        # Cargar hitos del Caso, y dentro de los hitos, cargar documentos Y ESTUDIANTES
        selectinload(Caso.hitos).options(
            selectinload(Hito.documentos),
            selectinload(Hito.estudiantes) # <--- ESTA LÍNEA FALTABA
        ),
    )

    if user.tipo_usuario == "coordinador":
        pass
    elif user.tipo_usuario == "profesor_jefe":
        stmt = stmt.join(Caso.estudiantes).join(EstudianteCaso.estudiante).join(Estudiante.curso)
        stmt = stmt.where(Curso.id_pj == user.id_usuario)

    result = await db.execute(stmt)

    return result.scalars().unique().all()


async def elevar_incidente(
    db: AsyncSession, 
    id_incidente: int, 
    id_coordinador: str, 
    payload: ElevacionIncidenteRequest
) -> Incidente:
    
    # Obtener incidente usando la relación .estudiantes (ya no estudiantes_asociados)
    stmt_incidente = select(Incidente).options(
        selectinload(Incidente.estudiantes)
    ).where(Incidente.id_incidente == id_incidente)
    
    result_inc = await db.execute(stmt_incidente)
    incidente = result_inc.scalar_one_or_none()
    
    if not incidente:
        raise EntityNotFoundError("Incidente no encontrado.")
    
    if incidente.id_caso is not None or incidente.id_caso_acumulado is not None:
        raise BusinessLogicError("El incidente ya ha sido procesado (elevado o acumulado).")

    # Vía A: Elevación como Evento Originario (Nuevo Caso)
    if payload.tipo_elevacion == "nuevo_caso":
        if not payload.nuevo_caso:
            raise BusinessLogicError("Faltan los datos (nuevo_caso) para crear la investigación.")
        
        db_caso = Caso(
            id_coordinador=id_coordinador,
            estado=EstadoCaso.abierto,
            fecha_inicio=payload.nuevo_caso.fecha_inicio,
            desc=payload.nuevo_caso.desc,
            gravedad=payload.nuevo_caso.gravedad,
            categoria=payload.nuevo_caso.categoria
        )
        db.add(db_caso)
        await db.flush() 
        
        # Heredar roles al nuevo caso iterando sobre la propiedad sin sufijo
        for est_inc in incidente.estudiantes:
            nuevo_est_caso = EstudianteCaso(
                id_estudiante=est_inc.id_estudiante,
                id_caso=db_caso.id_caso,
                rol=est_inc.rol
            )
            db.add(nuevo_est_caso)
        
        incidente.id_caso = db_caso.id_caso
        incidente.estado = EstadoIncidente.aceptado

    # Vía B: Elevación por Reincidencia (Acumulación)
    elif payload.tipo_elevacion == "acumulacion":
        if not payload.id_caso_acumulado:
            raise BusinessLogicError("Debe especificar el id_caso_acumulado.")
        
        stmt_caso = select(Caso).where(Caso.id_caso == payload.id_caso_acumulado)
        result_caso = await db.execute(stmt_caso)
        caso_destino = result_caso.scalar_one_or_none()
        
        if not caso_destino:
            raise EntityNotFoundError("Caso destino no encontrado.")
        
        if caso_destino.estado != EstadoCaso.abierto:
            raise BusinessLogicError("No se puede anexar incidentes a un caso cerrado.")
            
        incidente.id_caso_acumulado = caso_destino.id_caso
        incidente.estado = EstadoIncidente.aceptado

    # 4. Confirmar Transacción
    await db.commit()
    await db.refresh(incidente)
    
    return incidente

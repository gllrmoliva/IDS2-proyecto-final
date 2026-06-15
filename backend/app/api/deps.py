import json
import jwt
from datetime import date
from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import SECRET_KEY, ALGORITHM
from app.schemas.user import UsuarioResponse
from app.schemas.token import TokenData
from app.crud.user import get_user_by_email

from app.database.database import get_db
from app.database.models import (Gravedad,
                                 CategoriaConvivencia,
                                 EstadoCaso,
                                 TipoHito,
                                 NivelMedida,
                                 CategoriaTramite,
                                 SubtipoTramite)

from app.schemas.cases import CasoCreate, EstudianteRolCreate, HitoCreate, IncidentCreate
from pydantic import ValidationError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        raw_email = payload.get("sub")
        if not raw_email:
            raise credentials_exception
        email: str = raw_email

        token_data = TokenData(username=email)
    except InvalidTokenError:
        raise credentials_exception
    
    user = await get_user_by_email(db, email=token_data.username)

    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: Annotated[UsuarioResponse, Depends(get_current_user)],
):
    # Si no se chequeara esto, un usuario que fue desactivado pero con Token válido podría seguir
    # accediendo a la API.
    if not current_user.es_activo:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


class RoleChecker:
    """
    Dependencia para revisión de roles, inyectar en endpoints con allowed_roles específicos.

    Nota: en teoría, se podría extender para que UsuarioBase considere una lista de roles, pero
    el modelo de negocio no sustenta esa decisión.
    """

    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: UsuarioResponse = Depends(get_current_active_user)):
        if user.tipo_usuario in self.allowed_roles:
            return user
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted"
        )

###############
# FORMULARIOS
###############

def form_to_case_schema(
    desc: str = Form(...),
    fecha_inicio: date = Form(...),
    gravedad: Gravedad = Form(...),
    categoria: CategoriaConvivencia = Form(...),
    estado: EstadoCaso = Form(default=EstadoCaso.abierto),
    estudiantes_json: str = Form(
        ..., 
        description="""Lista JSON. Ej: [{"id_estudiante": "123", "rol": "autor_agresor"}]"""
    )
) -> CasoCreate:
    
    # Procesar JSON
    try:
        estudiantes_data = json.loads(estudiantes_json)
        if not isinstance(estudiantes_data, list):
            raise ValueError("El campo estudiantes_json debe ser una lista.")
        estudiantes_in = [EstudianteRolCreate(**est) for est in estudiantes_data]
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Formato JSON inválido en estudiantes_json.")
    except (ValueError, ValidationError) as e:
        raise HTTPException(status_code=400, detail=f"Error validando estudiantes: {str(e)}")

    # Retornar Pydantic Schema
    try:
        return CasoCreate(
            desc=desc,
            fecha_inicio=fecha_inicio,
            gravedad=gravedad,
            categoria=categoria,
            estado=estado,
            estudiantes=estudiantes_in
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=f"Error en los datos del formulario: {str(e)}")


def form_to_hito_schema(
    tipo: TipoHito = Form(...),
    nivel_medida: Optional[NivelMedida] = Form(None),
    categoria_tramite: Optional[CategoriaTramite] = Form(None),
    subtipo_tramite: Optional[SubtipoTramite] = Form(None),
    desc: str = Form(...),
    fecha: date = Form(default_factory=date.today),
    estudiantes_ids_json: str = Form(
        "[]", 
        description="""Lista JSON con IDs de estudiantes. Ej: ["rut-1", "rut-2"]"""
    )
) -> HitoCreate:
    
    # Procesar JSON de IDs
    try:
        estudiantes_ids = estudiantes_ids_json.split(",")
        estudiantes_ids = json.loads(estudiantes_ids_json)
        if not isinstance(estudiantes_ids, list):
            raise ValueError("El campo estudiantes_ids_json debe ser una lista.")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Retornar Pydantic Schema
    try:
        return HitoCreate(
            tipo=tipo,
            nivel_medida=nivel_medida,
            desc=desc,
            fecha=fecha,
            estudiantes_ids=estudiantes_ids,
            categoria_tramite=categoria_tramite,
            subtipo_tramite=subtipo_tramite
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=f"Error en los datos del formulario: {str(e)}")


def form_to_incident_schema(
        gravedad: Gravedad = Form(...),
        desc: str = Form(...),
        fecha: date = Form(default_factory=date.today),
        categoria: CategoriaConvivencia = Form(...),
        estudiantes_json: str = Form(
            ...,
            description="""Lista JSON. Ej: [{"id_estudiante": "123", "rol": "autor_agresor"}]"""
            )
        ) -> IncidentCreate:

    # 1. Procesamos el JSON de estudiantes
    try:
        estudiantes_data = json.loads(estudiantes_json)
        if not isinstance(estudiantes_data, list):
            raise ValueError("El campo estudiantes_json debe ser una lista.")

        estudiantes_in = [EstudianteRolCreate(**est) for est in estudiantes_data]

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Formato JSON inválido en estudiantes_json.")
    except (ValueError, ValidationError) as e:
        raise HTTPException(status_code=400, detail=f"Error validando estudiantes: {str(e)}")

    # 2. Retornamos tu esquema Pydantic listo y validado
    try:
        return IncidentCreate(
                gravedad=gravedad,
                desc=desc,
                fecha=fecha,
                categoria=categoria,
                estudiantes=estudiantes_in
                # 'estado' tomará tu default (EstadoIncidente.pendiente)
                # 'documentos' tomará tu default_factory (lista vacía)
                )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=f"Error en los datos del formulario: {str(e)}")

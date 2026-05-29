from datetime import date
from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict
from app.database.models import (
    EstadoCaso, 
    Gravedad, 
    EstadoIncidente, 
    CategoriaConvivencia,
    TipoHito,
    NivelMedida,
    RolInvolucrado
)


class DocumentoResponse(BaseModel):
    id_doc: int
    bucket_name: str
    object_key: str
    nombre_original: str
    mime_type: str
    size_bytes: int
    descripcion: str
    id_hito: int
    id_incidente: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class EstudianteResponse(BaseModel):
    id_estudiante: str
    nombre: str
    id_curso: Optional[int] = None
    nombre_curso: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Modelo intermedio para desempaquetar el Association Object
class EstudianteAsociadoResponse(BaseModel):
    rol: Optional[RolInvolucrado] = None
    estudiante: EstudianteResponse
    
    model_config = ConfigDict(from_attributes=True)


class HitoResponse(BaseModel):
    id_hito: int
    id_caso: int
    tipo: TipoHito
    nivel_medida: Optional[NivelMedida] = None
    desc: str
    fecha: date
    # Estudiantes asociados al Hito (Targets de medidas)
    estudiantes: List[EstudianteResponse] = []
    documentos: List[DocumentoResponse] = []

    model_config = ConfigDict(from_attributes=True)


class CasoResponse(BaseModel):
    id_caso: int
    id_coordinador: str
    estado: EstadoCaso
    fecha_inicio: date
    fecha_cierre: Optional[date] = None
    desc: str
    gravedad: Gravedad
    categoria: CategoriaConvivencia
    
    estudiantes_asociados: List[EstudianteAsociadoResponse] = []
    hitos: List[HitoResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ProductorResponse(BaseModel):
    id_usuario: str
    nombre: str
    tipo_usuario: str

    model_config = ConfigDict(from_attributes=True)


class IncidentResponse(BaseModel):
    id_incidente: int
    fecha: date
    desc: str
    
    gravedad: Gravedad
    categoria: CategoriaConvivencia
    
    id_productor: str
    id_caso: Optional[int] = None
    id_caso_acumulado: Optional[int] = None

    estado: EstadoIncidente
    motivo_rechazo: Optional[str] = None

    productor: Optional[ProductorResponse] = None
    estudiantes_asociados: List[EstudianteAsociadoResponse] = []
    documentos: List[DocumentoResponse] = []

    model_config = ConfigDict(from_attributes=True)


class DocumentoCreate(BaseModel):
    bucket_name: str
    object_key: str
    nombre_original: str
    mime_type: str
    size_bytes: int
    descripcion: str
    
# Payload estructural para asignar el rol durante la creación
class EstudianteRolCreate(BaseModel):
    id_estudiante: str
    rol: Optional[RolInvolucrado] = None

class IncidentCreate(BaseModel):
    gravedad: Gravedad
    desc: str
    fecha: date = Field(default_factory=date.today)
    estado: EstadoIncidente = Field(default=EstadoIncidente.pendiente)
    estudiantes_ids: List[str] = Field(..., min_length=1)   # estos son los RUT
    categoria: CategoriaConvivencia
    documentos: List[DocumentoCreate] = Field(default_factory=list)


class CasoCreate(BaseModel):
    id_coordinador: str
    estado: EstadoCaso = EstadoCaso.abierto  
    fecha_inicio: date
    fecha_cierre: Optional[date] = None
    desc: str
    gravedad: Gravedad
    categoria: CategoriaConvivencia


class CasoDesdeIncidenteCreate(BaseModel):
    """Payload reducido: El estado y el coordinador se infieren en el backend"""
    fecha_inicio: date
    desc: str
    gravedad: Gravedad
    categoria: CategoriaConvivencia

class ElevacionIncidenteRequest(BaseModel):
    tipo_elevacion: Literal["nuevo_caso", "acumulacion"]
    
    # Requerido si tipo_elevacion == "nuevo_caso"
    nuevo_caso: Optional[CasoDesdeIncidenteCreate] = None
    
    # Requerido si tipo_elevacion == "acumulacion"
    id_caso_acumulado: Optional[int] = None

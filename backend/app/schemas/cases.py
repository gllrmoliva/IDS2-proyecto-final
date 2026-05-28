from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.database.models import EstadoCaso, Gravedad, EstadoIncidente


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


class HitoResponse(BaseModel):
    id_hito: int
    id_caso: int
    desc: str
    fecha: date
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
    
    estudiantes: List[EstudianteResponse] = []
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
    
    id_productor: str
    id_caso: Optional[int] = None
    id_hito: Optional[int] = None

    estado: EstadoIncidente
    motivo_rechazo: Optional[str] = None

    productor: Optional[ProductorResponse] = None
    estado_caso: Optional[EstadoCaso] = None
    estudiantes: List[EstudianteResponse] = []
    documentos: List[DocumentoResponse] = []

    model_config = ConfigDict(from_attributes=True)


class DocumentoCreate(BaseModel):
    bucket_name: str
    object_key: str
    nombre_original: str
    mime_type: str
    size_bytes: int
    descripcion: str


class IncidentCreate(BaseModel):
    gravedad: Gravedad
    desc: str
    fecha: date = Field(default_factory=date.today)
    estado: EstadoIncidente = Field(default=EstadoIncidente.pendiente)
    estudiantes_ids: List[str] = Field(..., min_length=1)   # estos son los RUT
    
    documentos: List[DocumentoCreate] = Field(default_factory=list)


class CasoCreate(BaseModel):
    id_coordinador: str
    estado: EstadoCaso = EstadoCaso.abierto  
    fecha_inicio: date
    fecha_cierre: Optional[date] = None
    desc: str
    gravedad: Gravedad

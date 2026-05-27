from pydantic import BaseModel, ConfigDict
import enum

class TipoUsuario(str, enum.Enum):
    coordinador = "coordinador"
    productor = "productor"
    profesor_jefe = "profesor_jefe"

class UsuarioBase(BaseModel):
    id_usuario: str
    nombre: str
    email: str
    tipo_usuario: TipoUsuario
    es_activo: bool = True

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioResponse(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)

class UsuarioInDB(UsuarioBase):
    hashed_password: str

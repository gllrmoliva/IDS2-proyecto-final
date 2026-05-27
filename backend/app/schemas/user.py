from pydantic import BaseModel, ConfigDict

class UsuarioBase(BaseModel):
    id_usuario: str
    nombre: str
    email: str
    tipo_usuario: str
    es_activo: bool = True

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioResponse(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)

class UsuarioInDB(UsuarioBase):
    hashed_password: str

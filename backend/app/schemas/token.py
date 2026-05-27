from pydantic import BaseModel

# Esquema de respuesta para endpoint de /token
class Token(BaseModel):
    access_token: str
    token_type: str

# Esquema interno para dependencia get_current_user
class TokenData(BaseModel):
    username: str | None = None

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.models import Usuario
from app.schemas.user import UsuarioCreate
from app.core.security import verify_password, get_password_hash


async def get_user_by_id(db: AsyncSession, id_usuario: str):
    """Recupera usuario por ID institucional."""
    stmt = select(Usuario).where(Usuario.id_usuario == id_usuario)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str):
    """Recupera usuario activo por email index"""
    stmt = select(Usuario).where(Usuario.email == email, Usuario.es_activo == True)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user: UsuarioCreate):
    """Crea nuevo usuario."""
    db_user = Usuario(
        id_usuario=user.id_usuario,
        nombre=user.nombre,
        email=user.email,
        tipo_usuario=user.tipo_usuario,
        es_activo=user.es_activo,
        hashed_password=get_password_hash(user.password),
    )
    db.add(db_user)  # db.add is synchronous as it only modifies the local session state
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def authenticate_user(db: AsyncSession, email: str, password: str):
    """Validamos credenciales de usuario con index de correo."""
    user = await get_user_by_email(db, email=email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

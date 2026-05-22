import os
from app.core.config import settings
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,)
# 1. Crear el Engine Asíncrono
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,  # imprime consultas en consola (false en producción jejej)
    future=True,
)

# genera sesiones de base de datos individuales para cada petición web
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# 3. Dependencia para FastAPI (Inyección de dependencias)
# Esta función se usa en tus endpoints (en la carpeta `api/`) para obtener la sesión
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Genera una sesión de base de datos para una petición (request) 
    y la cierra automáticamente cuando la petición termina.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

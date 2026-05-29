from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    model_config = SettingsConfigDict(env_file='.env',
                                      env_file_encoding='utf-8',
                                      extra='ignore')
    PROJECT_NAME: str
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    MINIO_ENDPOINT: str
    MINIO_ROOT_USER: str
    MINIO_ROOT_PASSWORD: str

    EXTENSIONES_PERMITIDAS: set = {"jpg", "jpeg", "png", "gif", "mp4", "mov", "pdf", "docx", "xlsx"}
    TAMANO_MAXIMO_MB: int = 100

    # 2. Usamos un computed_field para que se calcule SIEMPRE en base al valor real de MB
    # (incluso si se sobreescribe desde el archivo .env)
    @computed_field
    @property
    def TAMANO_MAXIMO_BYTES(self) -> int:
        return self.TAMANO_MAXIMO_MB * 1024 * 1024

    # Antonio: voy a comentar esto hasta que me deje de dar error
    # Joaquin añade al .env las claves del readme y el error debería desaparecer
    #MINIO_COORDINADOR_ACCESS_KEY: str
    #MINIO_COORDINADOR_SECRET_KEY: str
    #MINIO_PRODUCTOR_ACCESS_KEY: str
    #MINIO_PRODUCTOR_SECRET_KEY: str
    #MINIO_PROFESOR_ACCESS_KEY: str
    #MINIO_PROFESOR_SECRET_KEY: str
    #MINIO_PROFESOR_JEFE_ACCESS_KEY: str
    #MINIO_PROFESOR_JEFE_SECRET_KEY: str


settings = Settings()

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
    MINIO_COORDINADOR_ACCESS_KEY: str
    MINIO_COORDINADOR_SECRET_KEY: str
    MINIO_PRODUCTOR_ACCESS_KEY: str
    MINIO_PRODUCTOR_SECRET_KEY: str
    MINIO_PROFESOR_ACCESS_KEY: str
    MINIO_PROFESOR_SECRET_KEY: str
    MINIO_PROFESOR_JEFE_ACCESS_KEY: str
    MINIO_PROFESOR_JEFE_SECRET_KEY: str


settings = Settings()

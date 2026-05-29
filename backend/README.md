## Prerrequisitos
1. **Instalación de dependencias**
El proyecto utiliza [uv](https://docs.astral.sh/uv/) como gestor de paquetes. Para instalar las dependencias, asegúrate de estar posicionado dentro de la carpeta `backend` y ejecuta el siguiente comando:
```
uv sync
```

2. **Configuración de variables de entorno**
Es necesario contar con un archivo `.env` en la raíz del proyecto. A continuación se muestra un ejemplo:
```
PROJECT_NAME="PANOPTES"

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgresnosGustaMucho
POSTGRES_DB=casos_db
DATABASE_URL=postgresql+asyncpg://postgres:postgresnosGustaMucho@db:5432/casos_db

SECRET_KEY="6917cb1b7e5116b2c0055e5a4461c035b16a80e16428a83cde1e1325c169a9f7"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60
## es necesario que esas sean las keys
MINIO_COORDINADOR_ACCESS_KEY=panoptes-coord-key
MINIO_COORDINADOR_SECRET_KEY=panoptes-coord-secret
MINIO_PRODUCTOR_ACCESS_KEY=panoptes-prod-key
MINIO_PRODUCTOR_SECRET_KEY=panoptes-prod-secret
MINIO_PROFESOR_ACCESS_KEY=panoptes-prof-key
MINIO_PROFESOR_SECRET_KEY=panoptes-prof-secret
MINIO_PROFESOR_JEFE_ACCESS_KEY=panoptes-jefe-key
MINIO_PROFESOR_JEFE_SECRET_KE=panoptes-jefe-secret

MINIO_ENDPOINT=minio:9000
MINIO_ROOT_USER=Panoptes
MINIO_ROOT_PASSWORD=3AtVHp0%^n1l
```

### Ejecución con Docker (recomendado)
Para levantar todos los servicios (backend, base de datos y almacenamiento de evidencias) desde la raíz del proyecto:
```
docker compose up -d
```

Para detener todos los servicios:
```
docker compose down
```

Los servicios estarán disponibles en:
- **Backend API:** http://localhost:8000
- **Frontend:** http://localhost:5173
- **MinIO consola:** http://localhost:9001



### Ejecución
Para iniciar el servidor backend en modo desarrollador (localhost),asegúrate de tener Docker corriendo para la base de datos y MinIO, luego cambia `MINIO_ENDPOINT` y `DATABASE_URL` en el `.env` a `localhost`:
```
MINIO_ENDPOINT=localhost:9000
DATABASE_URL=postgresql://postgres:postgresnosGustaMucho@localhost:5432/casos_db
```

Luego ejecuta:
```
uv run fastapi dev
```

Para ejecutar tests, utiliza el siguiente comando:
```
uv run pytest
```

para el test MinIO usa el siguiente comando:
```
uv run pytest backend/MinIO/test_usuarios.py -v
```


## Estructura del Proyecto
A continuación se detalla la arquitectura de carpetas del proyecto y la responsabilidad de cada archivo y directorio:
```
backend/
├── app/
│   ├── main.py
│   ├── api/                     # Controladores (Rutas de la API)
│   │   ├── access.py            # Controlador de acceso
│   │   ├── cases.py             # Controlador de gestión de casos
│   │   ├── students.py          # Controlador de búsqueda de estudiantes
│   │   ├── reports.py           # Controlador de reportes
│   │   └── notifications.py     # Controlador de notificaciones automáticas
│   │
│   ├── core/                    # Configuraciones y componentes de uso general
│   │   ├── config.py            # Carga de variables de entorno
│   │   └── security.py          # Componente de seguridad (Tokens, Autenticación)
│   │
│   ├── crud/                    # Lógica de operaciones CRUD con la BBDD
│   │   └── ...
│   │
│   ├── services/                # Lógica de negocio y componentes de la aplicación
│   │   ├── audit.py             # Componente de auditoría
│   │   ├── email.py             # Componente de envío de correos electrónicos
│   │   └── resources.py         # Componente de gestión de recursos para MinIO
│   │
│   ├── adapters/                # Adaptadores para sistemas externos
│   │   └── curricular_sys.py    # Adaptador de integración con el sistema curricular
│   │
│   ├── schemas/                 # Modelos de Pydantic (validación de datos de entrada/salida)
│   │   ├── cases.py
│   │   └── ...                  # Nota: Considerar reestructurar según la clase de modelos
│   │
│   └── database/                # Conexiones a bases de datos y almacenamiento
│       ├── db.py                # Configuración y conexión a PostgreSQL
│       └── minio_client.py      # Configuración y conexión a MinIO para manejo de evidencias
│
├── .env                         # Variables de entorno locales (no debe subirse al repositorio)
└── ...
```

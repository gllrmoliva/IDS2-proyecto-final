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
    DATABASE_URL=postgresql://postgres:postgresnosGustaMucho@db:5432/casos_db

    SECRET_KEY="CAROLINCACAOLEOLAO"
    ALGORITHM="HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### Ejecución
Para iniciar el servidor backend en modo desarrollador (localhost), utiliza el siguiente comando:
```
uv run fastapi dev
```

Para ejecutar tests, utiliza el siguiente comando:
```
uv run pytest
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

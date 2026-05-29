from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.api.cases import router as cases_router
from app.api.auth import router as auth_router
from app.api.notifications import router as notifications_router
from app.api.reports import router as reports_router
from app.api.students import router as students_router
from app.api.dev import router as dev_router
from app.api.documents import router as documents_router

from app.core.config import settings

prefix = "/api"
app = FastAPI(title=settings.PROJECT_NAME)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("\n" + "="*50)
    print("DEBUG 422 VALIDATION ERROR")
    print(f"Ruta: {request.url}")
    print(f"Método: {request.method}")
    print(f"Errores: {exc.errors()}")
    print(f"Body recibido (Raw): {exc.body}")
    print("="*50 + "\n")
    
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# Añadir routers
app.include_router(cases_router, prefix=prefix)
app.include_router(auth_router, prefix=prefix)
app.include_router(notifications_router, prefix=prefix)
app.include_router(reports_router, prefix=prefix)
app.include_router(students_router, prefix=prefix)
app.include_router(documents_router, prefix=prefix)
app.include_router(dev_router)

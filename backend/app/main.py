from fastapi import FastAPI
from app.api.cases import router as cases_router
from app.api.auth import router as auth_router
from app.api.notifications import router as notifications_router
from app.api.reports import router as reports_router
from app.api.students import router as students_router
from app.api.dev import router as dev_router

from app.core.config import settings

prefix = "/api"
app = FastAPI(title=settings.PROJECT_NAME)

# Añadir routers
app.include_router(cases_router, prefix=prefix)
app.include_router(auth_router, prefix=prefix)
app.include_router(notifications_router, prefix=prefix)
app.include_router(reports_router, prefix=prefix)
app.include_router(students_router, prefix=prefix)
app.include_router(dev_router)

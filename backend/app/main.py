from fastapi import FastAPI
from app.api.cases import router as cases_router
from app.api.access import router as access_router
from app.api.notifications import router as notifications_router
from app.api.reports import router as reports_router
from app.api.students import router as students_router
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

# Añadir routers
app.include_router(cases_router)
app.include_router(access_router)
app.include_router(notifications_router)
app.include_router(reports_router)
app.include_router(students_router)


@app.get("/")
async def root():
    return {"mensaje": "HOLA MUNDO!!!!"}

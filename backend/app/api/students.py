from fastapi import APIRouter

router = APIRouter(prefix="/students", tags=["Controlador de estudiantes"])


@router.post("/")
async def test(text: str):
    return text

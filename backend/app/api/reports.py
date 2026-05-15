from fastapi import APIRouter

router = APIRouter(prefix="/reports", tags=["Controlador de reportes"])


@router.post("/")
async def test(text: str):
    return text

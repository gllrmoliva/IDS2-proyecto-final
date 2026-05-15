from fastapi import APIRouter

router = APIRouter(prefix="/notifications", tags=["Controlador de notificaciones"])


@router.post("/")
async def test(text: str):
    return text

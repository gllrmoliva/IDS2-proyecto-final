from fastapi import APIRouter

router = APIRouter(prefix="/access", tags=["Controlador de acceso"])


@router.get("/")
async def test():
    return {"message": "Hola mundo!"}

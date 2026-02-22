from fastapi import APIRouter, Depends
from ..services.rbac import get_current_user
from ..database.connection import db

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "full_name": current_user.get("name") or current_user.get("full_name"),
        "role": current_user["role"],
        "department": current_user.get("department")
    }

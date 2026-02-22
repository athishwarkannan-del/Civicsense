from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
from .auth_utils import decode_access_token
from ..database.connection import db

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = await db.users.find_one({"id": payload.get("sub")})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    user.pop("_id", None)
    user.pop("password_hash", None)
    return user


def role_required(roles: List[str]):
    async def dependency(
        credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    ) -> dict:
        token = credentials.credentials
        payload = decode_access_token(token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        user = await db.users.find_one({"id": payload.get("sub")})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        if user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {roles}",
            )

        user.pop("_id", None)
        user.pop("password_hash", None)
        return user

    return dependency


async def verify_department_access(current_user: dict, grievance: dict):
    """
    Ensure admin can only act on grievances in their department.
    super_admin bypasses this check.
    """
    if current_user["role"] == "super_admin":
        return  # unrestricted

    if current_user["role"] == "admin":
        user_dept = current_user.get("department")
        grievance_dept = grievance.get("department_confirmed") or grievance.get("department_suggested")
        if user_dept and grievance_dept and user_dept.lower() != grievance_dept.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this department's grievances",
            )

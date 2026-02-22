import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from ..models.schemas import UserCreate, LoginRequest
from ..services.auth_utils import get_password_hash, verify_password, create_access_token
from ..services.rbac import get_current_user
from ..database.connection import db

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _serialize_user(user: dict) -> dict:
    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "full_name": user.get("name") or user.get("full_name"),
        "role": user.get("role"),
        "department": user.get("department"),
        "phone": user.get("phone") or user.get("mobile") or "",
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
    print(f"DEBUG: Registering user: {user_in.email}")
    existing = await db.users.find_one({"email": user_in.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    data = user_in.model_dump()
    password = data.pop("password")
    data["name"] = data.get("full_name") or data.get("name") or "New User"
    data["password_hash"] = get_password_hash(password)
    data["id"] = str(uuid.uuid4())
    now = datetime.utcnow()
    data["created_at"] = now
    data["updated_at"] = now
    data["role"] = data.get("role") or "user"

    await db.users.insert_one(data)
    print(f"DEBUG: User {user_in.email} inserted into DB")

    token = create_access_token({
        "sub": data["id"],
        "email": data["email"],
        "role": data["role"],
        "department": data.get("department"),
    })
    return {"access_token": token, "token_type": "bearer", "user": _serialize_user(data)}


@router.post("/login")
async def login(body: LoginRequest):
    print(f"DEBUG: Login attempt for: {body.email}")
    user = await db.users.find_one({"email": body.email})
    if not user:
        print(f"DEBUG: User {body.email} not found in DB")
    elif not verify_password(body.password, user.get("password_hash", "")):
        print(f"DEBUG: Password mismatch for {body.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "department": user.get("department"),
    })
    return {"access_token": token, "token_type": "bearer", "user": _serialize_user(user)}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return _serialize_user(current_user)


@router.get("/debug")
async def debug_auth():
    from ..database.connection import check_connection
    import bcrypt
    db_status = await check_connection()
    return {
        "database_connected": db_status,
        "bcrypt_version": bcrypt.__version__,
        "environment": "production" if os.getenv("MONGO_URL") else "development"
    }

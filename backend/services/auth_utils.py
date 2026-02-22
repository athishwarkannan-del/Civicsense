import os
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production-32chars!!")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))


def get_password_hash(password: str) -> str:
    try:
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
        print(f"DEBUG: Generated hash for password (len={len(password)})")
        return hashed
    except Exception as e:
        print(f"DEBUG ERROR in get_password_hash: {e}")
        raise


def verify_password(plain: str, hashed: str) -> bool:
    try:
        result = bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
        print(f"DEBUG: Password verification result: {result}")
        return result
    except Exception as e:
        print(f"DEBUG ERROR in verify_password: {e}")
        return False


def create_access_token(data: dict, expires_delta: Optional[int] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        minutes=expires_delta or ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

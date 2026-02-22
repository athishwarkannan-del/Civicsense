import asyncio
import os
import uuid
import bcrypt
from datetime import datetime
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

def get_direct_password_hash(password: str):
    # Direct bcrypt hashing to avoid passlib bugs in Python 3.13
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

async def seed_root_admin():
    load_dotenv()
    
    MONGODB_URL = os.getenv("MONGODB_URL") or os.getenv("MONGO_URL")
    DATABASE_NAME = "civic_sense"
    
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    users_collection = db["users"]

    admin_email = "root@gov.in"
    admin_password = "root@123"
    
    # Check if already exists
    existing = await users_collection.find_one({"email": admin_email})
    if existing:
        # Delete and recreate to ensure update
        await users_collection.delete_one({"email": admin_email})
        print(f"Removed existing {admin_email} to refresh.")

    now = datetime.utcnow()
    root_user = {
        "id": str(uuid.uuid4()),
        "email": admin_email,
        "name": "Goverment Root Admin",
        "password_hash": get_direct_password_hash(admin_password),
        "role": "super_admin",
        "department": None,
        "created_at": now,
        "updated_at": now
    }

    await users_collection.insert_one(root_user)
    print(f"✅ Government Root admin created successfully!")
    print(f"Email: {admin_email}")
    print(f"Password: {admin_password}")
    print(f"Role: super_admin")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_root_admin())

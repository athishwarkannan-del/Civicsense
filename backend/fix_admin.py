import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from services.auth_utils import get_password_hash

async def fix_admin():
    load_dotenv()
    url = os.getenv("MONGO_URL") or os.getenv("MONGODB_URL")
    client = AsyncIOMotorClient(url)
    db = client["civic_sense"]
    
    email = "root@gmail.com"
    password = "root@123"
    hashed_password = get_password_hash(password)
    
    # Check if user exists
    user = await db.users.find_one({"email": email})
    if user:
        await db.users.update_one(
            {"email": email},
            {"$set": {"password_hash": hashed_password}}
        )
        print(f"✅ Password for {email} reset to 'root@123' using app-standard hashing.")
    else:
        # Create it if missing
        new_admin = {
            "id": "admin-root",
            "name": "Super Admin",
            "email": email,
            "password_hash": hashed_password,
            "role": "super_admin",
            "department": "all"
        }
        await db.users.insert_one(new_admin)
        print(f"✅ Super Admin {email} created with password 'root@123'.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_admin())

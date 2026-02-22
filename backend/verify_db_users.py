import asyncio
import os
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def verify_users():
    load_dotenv()
    url = os.getenv("MONGODB_URL") or os.getenv("MONGO_URL")
    client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=5000)
    db = client["civic_sense"]
    
    print("--- User List ---")
    cursor = db.users.find()
    users = await cursor.to_list(100)
    for u in users:
        print(f"Email: {u['email']}, Role: {u['role']}, Name: {u.get('name') or u.get('full_name')}")
    
    print("\n--- Credential Test (root@gov.in) ---")
    admin = await db.users.find_one({"email": "root@gov.in"})
    if admin:
        pw = "root@123"
        match = bcrypt.checkpw(pw.encode('utf-8'), admin['password_hash'].encode('utf-8'))
        print(f"Password 'root@123' match: {match}")
    else:
        print("Admin user root@gov.in not found!")

    client.close()

if __name__ == "__main__":
    asyncio.run(verify_users())

import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

_MONGO_URL = os.getenv("MONGO_URL") or os.getenv("MONGODB_URL", "mongodb://127.0.0.1:27017")
_DATABASE_NAME = os.getenv("DB_NAME", "civic_sense")

client = AsyncIOMotorClient(_MONGO_URL, serverSelectionTimeoutMS=5000)
db = client[_DATABASE_NAME]


async def check_connection() -> bool:
    try:
        await client.admin.command("ping")
        return True
    except Exception as e:
        print(f"DB connection failed: {e}")
        return False

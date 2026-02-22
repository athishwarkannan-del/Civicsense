import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def test_conn():
    load_dotenv()
    url = os.getenv("MONGODB_URL") or os.getenv("MONGO_URL")
    print(f"Testing connection to: {url[:30]}...")
    client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=5000)
    try:
        await client.admin.command('ping')
        print("Ping successful!")
    except Exception as e:
        print(f"Ping failed: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_conn())

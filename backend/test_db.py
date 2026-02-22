import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def test_connection():
    load_dotenv()
    mongo_url = os.getenv("MONGO_URL")
    print(f"Attempting to connect to: {mongo_url[:30]}...")
    
    try:
        client = AsyncIOMotorClient(mongo_url)
        # The ping command is cheap and does not require auth.
        await client.admin.command('ping')
        print("✅ MongoDB Connection Successful!")
        
        db = client.get_database("civic_sense")
        collections = await db.list_collection_names()
        print(f"Collections in 'civic_sense': {collections}")
        
    except Exception as e:
        print(f"❌ MongoDB Connection Failed: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_connection())

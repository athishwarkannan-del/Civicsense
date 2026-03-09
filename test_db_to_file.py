import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

_MONGO_URL = os.getenv("MONGO_URL") or os.getenv("MONGODB_URL")

async def test_conn():
    # Use explicit encoding to avoid Windows default encoding issues
    with open("db_test_result.txt", "w", encoding="utf-8") as f:
        f.write(f"CWD: {os.getcwd()}\n")
        f.write(f"MONGO_URL found: {bool(_MONGO_URL)}\n")
        
        if not _MONGO_URL:
            f.write("ERROR: MONGO_URL not found\n")
            return

        # Simple timeout for quick testing
        client = AsyncIOMotorClient(_MONGO_URL, serverSelectionTimeoutMS=10000)
        try:
            # The ping command is a standard way to test connection
            print("Pinging...")
            await client.admin.command("ping")
            f.write("SUCCESS: MongoDB connection verified!\n")
            print("Success!")
        except Exception as e:
            f.write(f"FAILURE: MongoDB connection failed: {str(e)}\n")
            print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())

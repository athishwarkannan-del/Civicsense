import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import certifi

load_dotenv()

_MONGO_URL = os.getenv("MONGO_URL") or os.getenv("MONGODB_URL")

async def test_conn():
    with open("db_test_result.txt", "w", encoding="utf-8") as f:
        if not _MONGO_URL:
            f.write("ERROR: MONGO_URL not found\n")
            return

        # Test 1: With certifi
        f.write("Test 1: Connecting with certifi CA bundle...\n")
        client = AsyncIOMotorClient(_MONGO_URL, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where())
        try:
            await client.admin.command("ping")
            f.write("SUCCESS: Connection worked with certifi!\n")
            return
        except Exception as e:
            f.write(f"FAILURE with certifi: {e}\n")

        # Test 2: Bypass SSL (for debugging only)
        f.write("\nTest 2: Connecting with tlsAllowInvalidCertificates=True...\n")
        client_bypass = AsyncIOMotorClient(_MONGO_URL, serverSelectionTimeoutMS=5000, tlsAllowInvalidCertificates=True)
        try:
            await client_bypass.admin.command("ping")
            f.write("SUCCESS: Connection worked with SSL bypass!\n")
        except Exception as e:
            f.write(f"FAILURE even with SSL bypass: {e}\n")
            f.write("\nSUGGESTION: This strongly indicates an IP Whitelist issue on MongoDB Atlas.\n")

if __name__ == "__main__":
    asyncio.run(test_conn())

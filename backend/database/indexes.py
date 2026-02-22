from pymongo import ASCENDING, DESCENDING
from .connection import db


async def create_indexes():
    # Grievances
    await db.grievances.create_index("id", unique=True)
    await db.grievances.create_index("department_suggested")
    await db.grievances.create_index("department_confirmed")
    await db.grievances.create_index([("priority_score", DESCENDING)])
    await db.grievances.create_index("assignment_status")
    await db.grievances.create_index("status")
    await db.grievances.create_index("user_id")
    await db.grievances.create_index("user_email")
    await db.grievances.create_index([
        ("priority_score", DESCENDING),
        ("created_at", ASCENDING)
    ])

    # Users
    await db.users.create_index("email", unique=True)
    await db.users.create_index("department")
    await db.users.create_index("role")

    print("✅ Database indexes created.")

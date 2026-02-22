from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timedelta
from ..services.rbac import role_required
from ..database.connection import db

router = APIRouter(prefix="/admin/analytics", tags=["Admin Analytics"])

ADMIN_ROLES = ["admin", "super_admin"]


@router.get("/overview")
async def analytics_overview(
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(role_required(ADMIN_ROLES)),
):
    since = datetime.utcnow() - timedelta(days=days)
    match: dict = {"created_at": {"$gte": since}}

    if current_user["role"] == "admin" and current_user.get("department"):
        dept = current_user["department"]
        match["$or"] = [
            {"department_suggested": dept},
            {"department_confirmed": dept},
        ]

    # Trend: complaints per day
    trend_cursor = db.grievances.aggregate([
        {"$match": match},
        {"$group": {
            "_id": {
                "year": {"$year": "$created_at"},
                "month": {"$month": "$created_at"},
                "day": {"$dayOfMonth": "$created_at"},
            },
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1, "_id.day": 1}},
    ])
    trend = []
    async for t in trend_cursor:
        d = t["_id"]
        trend.append({
            "date": f"{d['year']}-{d['month']:02d}-{d['day']:02d}",
            "count": t["count"],
        })

    # By priority
    pri_cursor = db.grievances.aggregate([
        {"$match": match},
        {"$group": {"_id": "$priority", "count": {"$sum": 1}}},
    ])
    by_priority = {p["_id"]: p["count"] async for p in pri_cursor if p.get("_id")}

    # By department
    dept_cursor = db.grievances.aggregate([
        {"$match": match},
        {"$group": {"_id": "$department_suggested", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ])
    by_dept = [{"department": d["_id"], "count": d["count"]} async for d in dept_cursor if d.get("_id")]

    # By status
    status_cursor = db.grievances.aggregate([
        {"$match": match},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ])
    by_status = {s["_id"]: s["count"] async for s in status_cursor if s.get("_id")}

    # Pending AI confirmations
    pending_confirm = await db.grievances.count_documents(
        {**match, "assignment_status": "pending_confirmation"}
    )

    return {
        "period_days": days,
        "trend": trend,
        "by_priority": by_priority,
        "by_department": by_dept,
        "by_status": by_status,
        "pending_ai_confirmation": pending_confirm,
    }

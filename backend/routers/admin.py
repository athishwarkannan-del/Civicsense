from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from pymongo import ASCENDING, DESCENDING
from ..models.schemas import (
    ConfirmAssignmentRequest,
    ModifyAssignmentRequest,
    UpdatePriorityRequest,
    UpdateStatusRequest,
    GrievancePriority,
    AssignmentStatus,
)
from ..services.rbac import get_current_user, role_required, verify_department_access
from ..database.connection import db

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

ADMIN_ROLES = ["admin", "super_admin"]


def _clean(doc: dict) -> dict:
    doc.pop("_id", None)
    if doc.get("status") == "submitted":
        doc["status"] = "pending"
    for entry in doc.get("timeline", []):
        if hasattr(entry.get("timestamp"), "isoformat"):
            entry["timestamp"] = entry["timestamp"].isoformat()
    if hasattr(doc.get("created_at"), "isoformat"):
        doc["created_at"] = doc["created_at"].isoformat()
    if hasattr(doc.get("updated_at"), "isoformat"):
        doc["updated_at"] = doc["updated_at"].isoformat()

    # Expose a unified 'department' field for the frontend
    # Use confirmed department if available, otherwise fall back to suggested
    if "department" not in doc:
        doc["department"] = doc.get("department_confirmed") or doc.get("department_suggested") or ""

    # Ensure assignment_status is always present
    if "assignment_status" not in doc:
        # Old grievances already progressed past submission should be treated as assigned
        if doc.get("status") in ("assigned", "in_progress", "resolved", "rejected", "escalated"):
            doc["assignment_status"] = "assigned"
        else:
            doc["assignment_status"] = "pending_confirmation"

    return doc



def _timeline_entry(status: str, updated_by: str, remarks: Optional[str] = None) -> dict:
    return {
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
        "remarks": remarks,
        "updated_by": updated_by,
    }


# ─────────────────────────────────────────────────────────
# GET /admin/complaints
# Sorted: priority_score DESC → created_at ASC
# ─────────────────────────────────────────────────────────
@router.get("/complaints")
async def list_complaints(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    assignment_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    sort: Optional[str] = Query(None, description="Override sort: 'newest' | 'oldest' | 'priority'"),
    current_user: dict = Depends(role_required(ADMIN_ROLES)),
):
    query: dict = {}

    # Department-level RBAC
    if current_user["role"] == "admin" and current_user.get("department"):
        dept = current_user["department"]
        # Admin sees complaints for their department (suggested OR confirmed)
        query["$or"] = [
            {"department_suggested": dept},
            {"department_confirmed": dept},
        ]

    if status and status != "all":
        backend_status = "submitted" if status == "pending" else status
        query["status"] = backend_status
    if priority:
        query["priority"] = priority
    if department and current_user["role"] == "super_admin":
        query["$or"] = [
            {"department_suggested": department},
            {"department_confirmed": department},
        ]
    if assignment_status:
        query["assignment_status"] = assignment_status
    if search:
        query["$text"] = {"$search": search}

    total = await db.grievances.count_documents(query)
    skip = (page - 1) * limit

    # Default sort: priority_score DESC, then created_at ASC
    if sort == "newest":
        sort_spec = [("created_at", DESCENDING)]
    elif sort == "oldest":
        sort_spec = [("created_at", ASCENDING)]
    else:
        sort_spec = [("priority_score", DESCENDING), ("created_at", ASCENDING)]

    cursor = db.grievances.find(query).sort(sort_spec).skip(skip).limit(limit)
    complaints = await cursor.to_list(length=limit)

    return {"complaints": [_clean(c) for c in complaints], "total": total, "page": page}


# ─────────────────────────────────────────────────────────
# GET /admin/complaints/{id}
# ─────────────────────────────────────────────────────────
@router.get("/complaints/{grievance_id}")
async def get_complaint(
    grievance_id: str,
    current_user: dict = Depends(role_required(ADMIN_ROLES)),
):
    doc = await db.grievances.find_one({"id": grievance_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Grievance not found")
    await verify_department_access(current_user, doc)
    return _clean(doc)


# ─────────────────────────────────────────────────────────
# PUT /admin/complaints/{id}/confirm-assignment
# Confirms AI-suggested department and officer
# ─────────────────────────────────────────────────────────
@router.put("/complaints/{grievance_id}/confirm-assignment")
async def confirm_assignment(
    grievance_id: str,
    body: ConfirmAssignmentRequest,
    current_user: dict = Depends(role_required(ADMIN_ROLES)),
):
    doc = await db.grievances.find_one({"id": grievance_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Grievance not found")
    await verify_department_access(current_user, doc)

    now = datetime.utcnow()
    admin_name = current_user.get("name") or current_user.get("email")
    entry = _timeline_entry(
        "assignment_confirmed",
        admin_name,
        body.remarks or f"AI assignment confirmed by {admin_name}",
    )

    await db.grievances.update_one(
        {"id": grievance_id},
        {
            "$set": {
                "department_confirmed": doc.get("department_suggested"),
                "officer_confirmed": doc.get("officer_suggested"),
                "assignment_status": AssignmentStatus.assigned,
                "status": "assigned",
                "updated_at": now,
            },
            "$push": {"timeline": entry},
        },
    )
    updated = await db.grievances.find_one({"id": grievance_id})
    return _clean(updated)


# ─────────────────────────────────────────────────────────
# PUT /admin/complaints/{id}/modify-assignment
# Manual override of department + officer
# ─────────────────────────────────────────────────────────
@router.put("/complaints/{grievance_id}/modify-assignment")
async def modify_assignment(
    grievance_id: str,
    body: ModifyAssignmentRequest,
    current_user: dict = Depends(role_required(ADMIN_ROLES)),
):
    doc = await db.grievances.find_one({"id": grievance_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Grievance not found")
    await verify_department_access(current_user, doc)

    now = datetime.utcnow()
    admin_name = current_user.get("name") or current_user.get("email")
    entry = _timeline_entry(
        "assignment_modified",
        admin_name,
        body.remarks or f"Assignment manually modified by {admin_name}. "
                        f"Department: {body.department}, Officer: {body.officer}",
    )

    await db.grievances.update_one(
        {"id": grievance_id},
        {
            "$set": {
                "department_confirmed": body.department,
                "officer_confirmed": body.officer,
                "assignment_status": AssignmentStatus.assigned,
                "status": "assigned",
                "updated_at": now,
            },
            "$push": {"timeline": entry},
        },
    )
    updated = await db.grievances.find_one({"id": grievance_id})
    return _clean(updated)


# ─────────────────────────────────────────────────────────
# PUT /admin/complaints/{id}/priority
# Change priority and priority_score
# ─────────────────────────────────────────────────────────
@router.put("/complaints/{grievance_id}/priority")
async def update_priority(
    grievance_id: str,
    body: UpdatePriorityRequest,
    current_user: dict = Depends(role_required(ADMIN_ROLES)),
):
    doc = await db.grievances.find_one({"id": grievance_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Grievance not found")
    await verify_department_access(current_user, doc)

    # Map priority label to default score if not provided
    default_scores = {"high": 8.0, "medium": 5.0, "low": 2.0}
    new_score = body.priority_score or default_scores[body.priority]

    now = datetime.utcnow()
    admin_name = current_user.get("name") or current_user.get("email")
    entry = _timeline_entry(
        "priority_updated",
        admin_name,
        body.remarks or f"Priority changed to {body.priority.upper()} (score: {new_score}) by {admin_name}",
    )

    await db.grievances.update_one(
        {"id": grievance_id},
        {
            "$set": {
                "priority": body.priority,
                "priority_score": new_score,
                "updated_at": now,
            },
            "$push": {"timeline": entry},
        },
    )
    updated = await db.grievances.find_one({"id": grievance_id})
    return _clean(updated)


# ─────────────────────────────────────────────────────────
# PUT /admin/complaints/{id}   (general status update)
# ─────────────────────────────────────────────────────────
@router.put("/complaints/{grievance_id}")
async def update_complaint(
    grievance_id: str,
    body: UpdateStatusRequest,
    current_user: dict = Depends(role_required(ADMIN_ROLES)),
):
    doc = await db.grievances.find_one({"id": grievance_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Grievance not found")
    await verify_department_access(current_user, doc)

    now = datetime.utcnow()
    admin_name = current_user.get("name") or current_user.get("email")
    entry = _timeline_entry(
        body.status,
        admin_name,
        body.remarks or f"Status updated to {body.status} by {admin_name}",
    )

    update_fields: dict = {
        "status": body.status,
        "updated_at": now,
    }
    if body.assigned_officer:
        update_fields["officer_confirmed"] = body.assigned_officer

    await db.grievances.update_one(
        {"id": grievance_id},
        {"$set": update_fields, "$push": {"timeline": entry}},
    )
    updated = await db.grievances.find_one({"id": grievance_id})
    return _clean(updated)


# ─────────────────────────────────────────────────────────
# GET /admin/stats
# ─────────────────────────────────────────────────────────
@router.get("/stats")
async def get_stats(current_user: dict = Depends(role_required(ADMIN_ROLES))):
    match: dict = {}
    if current_user["role"] == "admin" and current_user.get("department"):
        dept = current_user["department"]
        match["$or"] = [
            {"department_suggested": dept},
            {"department_confirmed": dept},
        ]

    total = await db.grievances.count_documents(match)
    pending = await db.grievances.count_documents(
        {**match, "status": {"$in": ["submitted", "pending"]}}
    )
    in_progress = await db.grievances.count_documents(
        {**match, "status": {"$in": ["assigned", "in_progress"]}}
    )
    resolved = await db.grievances.count_documents({**match, "status": "resolved"})
    rejected = await db.grievances.count_documents({**match, "status": "rejected"})
    pending_confirm = await db.grievances.count_documents(
        {**match, "assignment_status": "pending_confirmation"}
    )

    # Department breakdown
    dept_cursor = db.grievances.aggregate([
        {"$match": match},
        {"$group": {"_id": "$department_suggested", "count": {"$sum": 1}}},
    ])
    dept_wise = {d["_id"]: d["count"] async for d in dept_cursor if d.get("_id")}

    # Priority breakdown
    pri_cursor = db.grievances.aggregate([
        {"$match": match},
        {"$group": {"_id": "$priority", "count": {"$sum": 1}}},
    ])
    prio_dist = {p["_id"]: p["count"] async for p in pri_cursor if p.get("_id")}

    return {
        "total_grievances": total,
        "pending": pending,
        "pending_confirmation": pending_confirm,
        "in_progress": in_progress,
        "resolved": resolved,
        "rejected": rejected,
        "avg_resolution_time": 0,
        "department_wise": dept_wise,
        "priority_distribution": prio_dist,
        "monthly_trend": [],
    }


# ─────────────────────────────────────────────────────────
# GET /admin/analytics (alias)
# ─────────────────────────────────────────────────────────
@router.get("/analytics")
async def get_analytics(current_user: dict = Depends(role_required(ADMIN_ROLES))):
    return await get_stats(current_user)


# ─────────────────────────────────────────────────────────
# GET /admin/users
# ─────────────────────────────────────────────────────────
@router.get("/users")
async def list_users(
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(role_required(["super_admin"])),
):
    query: dict = {}
    if role:
        query["role"] = role
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
        ]

    total = await db.users.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.users.find(query).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)

    formatted = []
    for u in users:
        u.pop("_id", None)
        u.pop("password_hash", None)
        formatted.append({
            "id": u.get("id"),
            "email": u.get("email"),
            "full_name": u.get("name") or u.get("full_name"),
            "role": u.get("role"),
            "department": u.get("department"),
            "created_at": str(u.get("created_at", "")),
            "grievance_count": 0,
        })
    return {"users": formatted, "total": total}

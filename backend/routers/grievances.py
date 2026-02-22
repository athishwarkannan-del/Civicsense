import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from typing import Optional
from ..models.schemas import GrievanceCreate, AssignmentStatus, GrievanceStatus
from ..services.rbac import get_current_user
from ..services.ai_classifier import classify_grievance
from ..services.duplicate_checker import check_duplicate
from ..database.connection import db

router = APIRouter(prefix="/grievances", tags=["Grievances"])


def _clean(doc: dict) -> dict:
    doc.pop("_id", None)
    # Map internal 'submitted' → 'pending' for frontend display
    if doc.get("status") == "submitted":
        doc["status"] = "pending"
    # Serialize datetime objects in timeline
    for entry in doc.get("timeline", []):
        if hasattr(entry.get("timestamp"), "isoformat"):
            entry["timestamp"] = entry["timestamp"].isoformat()
    if hasattr(doc.get("created_at"), "isoformat"):
        doc["created_at"] = doc["created_at"].isoformat()
    if hasattr(doc.get("updated_at"), "isoformat"):
        doc["updated_at"] = doc["updated_at"].isoformat()

    # Expose a unified 'department' field for the frontend
    if "department" not in doc:
        doc["department"] = doc.get("department_confirmed") or doc.get("department_suggested") or ""

    # Ensure assignment_status is always present
    if "assignment_status" not in doc:
        if doc.get("status") in ("assigned", "in_progress", "resolved", "rejected", "escalated"):
            doc["assignment_status"] = "assigned"
        else:
            doc["assignment_status"] = "pending_confirmation"

    return doc


@router.post("/classify")
async def api_classify(payload: dict = Body(...)):
    results = await classify_grievance(payload.get("description", ""))
    return {
        "detected_category": results["category"],
        "department": results["department"],
        "officer_suggested": results["officer"],
        "priority": results["priority"],
        "priority_score": results["priority_score"],
        "importance_pct": results["importance_pct"],
        "importance_dimensions": results["importance_dimensions"],
        "keywords_found": results["keywords_found"],
        "explanation": results["explanation"],
        "domains": results["domains"],
        "all_categories": results.get("all_categories", []),
        "all_departments": results.get("all_departments", []),
    }


@router.post("/check-duplicate")
async def api_check_duplicate(payload: dict = Body(...)):
    is_dup, similar_id, score = await check_duplicate(payload.get("description", ""))
    if is_dup:
        return [{"id": similar_id, "description": "Existing similar complaint", "similarity": score}]
    return []


@router.post("/submit", status_code=status.HTTP_201_CREATED)
async def submit_grievance(
    grievance_in: GrievanceCreate,
    current_user: dict = Depends(get_current_user),
):
    results = await classify_grievance(grievance_in.description)

    is_dup, similar_id, dup_score = await check_duplicate(grievance_in.description)

    grievance_id = f"CSP-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.utcnow()

    timeline_entry = {
        "status": "submitted",
        "timestamp": now.isoformat(),
        "remarks": "Complaint submitted by citizen. Awaiting admin assignment confirmation.",
        "updated_by": current_user.get("name") or current_user.get("email"),
    }

    doc = {
        "id": grievance_id,
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "title": grievance_in.title,
        "category": results["category"],
        "description": grievance_in.description,
        "location": grievance_in.location,
        "address": grievance_in.address,
        "media_urls": grievance_in.media_urls,

        # AI suggestion fields
        "department_suggested": results["department"],
        "officer_suggested": results["officer"],

        # Multi-domain support
        "all_suggested_categories": results.get("all_categories", []),
        "all_suggested_departments": results.get("all_departments", []),
        "suggested_domains": results.get("domains", []),

        # Confirmed (blank until admin approves)
        "department_confirmed": None,
        "officer_confirmed": None,

        # Assignment workflow
        "assignment_status": AssignmentStatus.pending_confirmation,

        # Priority
        "priority": results["priority"],
        "priority_score": results["priority_score"],

        # Status
        "status": GrievanceStatus.submitted,

        # AI metadata
        "ai_explanation": results["explanation"],
        "keywords_found": results["keywords_found"],
        "importance_pct": results["importance_pct"],
        "importance_dimensions": results["importance_dimensions"],

        # Duplicate info
        "is_duplicate": is_dup,
        "similar_to": similar_id,
        "duplicate_score": dup_score,

        "timeline": [timeline_entry],
        "created_at": now,
        "updated_at": now,
    }

    await db.grievances.insert_one(doc)
    doc.pop("_id", None)
    doc["status"] = "pending"
    if hasattr(doc.get("created_at"), "isoformat"):
        doc["created_at"] = doc["created_at"].isoformat()
    if hasattr(doc.get("updated_at"), "isoformat"):
        doc["updated_at"] = doc["updated_at"].isoformat()

    return doc


@router.get("/user/{user_email}")
async def get_user_complaints(
    user_email: str,
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    query: dict = {"user_id": current_user["id"]}
    if status and status != "all":
        backend_status = "submitted" if status == "pending" else status
        query["status"] = backend_status

    total = await db.grievances.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.grievances.find(query).sort("created_at", -1).skip(skip).limit(limit)
    results = await cursor.to_list(length=limit)
    return {"grievances": [_clean(r) for r in results], "total": total}


@router.get("/track/{grievance_id}")
async def track_grievance(grievance_id: str):
    doc = await db.grievances.find_one({"id": grievance_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Grievance not found")
    return _clean(doc)


@router.get("/{grievance_id}")
async def get_grievance(grievance_id: str):
    doc = await db.grievances.find_one({"id": grievance_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Grievance not found")
    return _clean(doc)

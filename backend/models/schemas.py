from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class RoleEnum(str, Enum):
    user = "user"
    admin = "admin"
    super_admin = "super_admin"


class GrievanceStatus(str, Enum):
    submitted = "submitted"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"
    rejected = "rejected"


class GrievancePriority(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class AssignmentStatus(str, Enum):
    pending_confirmation = "pending_confirmation"
    assigned = "assigned"


# ─── Auth ─────────────────────────────────────────────────

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    full_name: Optional[str] = None
    role: RoleEnum = RoleEnum.user
    department: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserInDB(UserBase):
    id: str
    password_hash: str
    created_at: datetime
    updated_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: str
    email: str
    role: str
    department: Optional[str] = None


# ─── Grievances ───────────────────────────────────────────

class LocationData(BaseModel):
    lat: float
    lng: float


class GrievanceCreate(BaseModel):
    title: str
    description: str
    category: str
    location: Dict[str, float]   # {lat, lng}
    address: str
    media_urls: List[str] = []


class TimelineEntry(BaseModel):
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    remarks: Optional[str] = None
    updated_by: Optional[str] = None


class ConfirmAssignmentRequest(BaseModel):
    remarks: Optional[str] = None


class ModifyAssignmentRequest(BaseModel):
    department: str
    officer: str
    remarks: Optional[str] = None


class UpdatePriorityRequest(BaseModel):
    priority: GrievancePriority
    priority_score: Optional[float] = None
    remarks: Optional[str] = None


class UpdateStatusRequest(BaseModel):
    status: GrievanceStatus
    remarks: Optional[str] = None
    assigned_officer: Optional[str] = None


# ─── Admin ────────────────────────────────────────────────

class AdminStats(BaseModel):
    total_grievances: int
    pending: int
    in_progress: int
    resolved: int
    rejected: int
    avg_resolution_time: float
    department_wise: Dict[str, int]
    priority_distribution: Dict[str, int]
    monthly_trend: List[Dict[str, Any]] = []

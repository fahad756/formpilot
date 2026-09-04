"""
Job Application tracking models.

Each autofill event logged by the extension creates one JobApplication record.
The status field uses a constrained string rather than an Enum so that future
status values can be added without a migration or code change.
"""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import AnyHttpUrl, BaseModel

# Valid status transitions: applied → interviewing → offer → rejected / withdrawn
ApplicationStatus = Literal["applied", "interviewing", "offer", "rejected", "withdrawn"]


class JobApplication(BaseModel):
    """Full application record."""
    id: UUID
    user_id: UUID
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    job_url: str
    status: ApplicationStatus = "applied"
    resume_id: Optional[UUID] = None
    applied_at: Optional[datetime] = None
    notes: Optional[str] = None


class JobApplicationCreate(BaseModel):
    """Payload sent by the extension when an autofill completes."""
    job_url: str
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    resume_id: Optional[UUID] = None
    notes: Optional[str] = None


class JobApplicationUpdate(BaseModel):
    """Partial update for status changes or notes edits from the dashboard."""
    status: Optional[ApplicationStatus] = None
    notes: Optional[str] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None

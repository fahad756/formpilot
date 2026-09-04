"""
Resume document models.

A user can upload multiple resumes. Exactly one may have is_primary=True at a
time — this invariant is enforced in the service layer (not here) so that the
constraint is expressed once and tested independently of serialization.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class Resume(BaseModel):
    """Full resume record as stored in the database."""
    id: UUID
    user_id: UUID
    name: str
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    is_primary: bool = False
    created_at: Optional[datetime] = None


class ResumeCreate(BaseModel):
    """Data required to register a new resume after upload."""
    name: str
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None


class ResumeListItem(BaseModel):
    """Trimmed resume representation for list endpoints (no file_path exposed)."""
    id: UUID
    name: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    is_primary: bool = False
    created_at: Optional[datetime] = None
    download_url: Optional[str] = None

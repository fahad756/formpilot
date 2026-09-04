"""
Job Application tracking routes.

POST  /applications            — log a new application (called by extension on autofill)
GET   /applications            — paginated list for dashboard
PATCH /applications/{id}       — update status or notes
DELETE /applications/{id}      — remove a log entry
"""

from typing import Annotated, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_supabase_client
from app.middleware import require_auth
from app.models.application import JobApplication, JobApplicationCreate, JobApplicationUpdate
from app.services.auth_service import TokenPayload

router = APIRouter(prefix="/applications")


@router.post("", response_model=JobApplication, status_code=status.HTTP_201_CREATED)
async def log_application(
    body: JobApplicationCreate,
    auth: Annotated[TokenPayload, Depends(require_auth)],
):
    """
    Log a job application event.

    Called automatically by the extension after a successful autofill.
    The job_url is required; company_name and job_title are parsed from the
    page by the extension's content script and included when available.
    """
    admin = get_supabase_client()
    row = (
        admin.table("applications")
        .insert({**body.model_dump(exclude_none=True), "user_id": auth.sub})
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to log application.")
    return JobApplication(**row.data[0])


@router.get("", response_model=List[JobApplication])
async def list_applications(
    auth: Annotated[TokenPayload, Depends(require_auth)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status_filter: Optional[str] = Query(default=None, alias="status"),
):
    """Return paginated applications for the dashboard."""
    admin = get_supabase_client()
    offset = (page - 1) * page_size
    query = (
        admin.table("applications")
        .select("*")
        .eq("user_id", auth.sub)
        .order("applied_at", desc=True)
        .range(offset, offset + page_size - 1)
    )
    if status_filter:
        query = query.eq("status", status_filter)
    rows = query.execute()
    return [JobApplication(**r) for r in rows.data]


@router.patch("/{application_id}", response_model=JobApplication)
async def update_application(
    application_id: UUID,
    body: JobApplicationUpdate,
    auth: Annotated[TokenPayload, Depends(require_auth)],
):
    """Update application status or notes."""
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No fields to update.")
    admin = get_supabase_client()
    row = (
        admin.table("applications")
        .update(update_data)
        .eq("id", str(application_id))
        .eq("user_id", auth.sub)
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
    return JobApplication(**row.data[0])


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: UUID,
    auth: Annotated[TokenPayload, Depends(require_auth)],
):
    """Remove an application log entry."""
    admin = get_supabase_client()
    admin.table("applications").delete().eq("id", str(application_id)).eq("user_id", auth.sub).execute()

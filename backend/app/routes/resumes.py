"""
Resume management routes.

GET    /resumes              — list all resumes with signed URLs
POST   /resumes              — upload a new resume
DELETE /resumes/{id}         — delete a resume (storage + DB)
POST   /resumes/{id}/primary — set a resume as primary (clears others)
"""

from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.config import get_settings
from app.middleware import require_auth
from app.models.resume import ResumeListItem
from app.services.auth_service import TokenPayload
from app.services.resume_service import ResumeService
from app.utils.validators import (
    sanitise_filename,
    validate_resume_extension,
    validate_resume_mime,
    validate_resume_size,
)
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

router = APIRouter(prefix="/resumes")
_bearer = HTTPBearer(auto_error=True)


def _get_service(
    auth: Annotated[TokenPayload, Depends(require_auth)],
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> ResumeService:
    return ResumeService(user_id=auth.sub, access_token=credentials.credentials)


@router.get("", response_model=List[ResumeListItem])
async def list_resumes(service: Annotated[ResumeService, Depends(_get_service)]):
    """Return all resumes for the current user, newest first."""
    return service.list_resumes()


@router.post("", response_model=ResumeListItem, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: Annotated[UploadFile, File(description="PDF, DOC, or DOCX resume file")],
    set_as_primary: Annotated[bool, Form()] = False,
    service: Annotated[ResumeService, Depends(_get_service)] = None,
):
    """
    Upload a resume file. Validates type and size before storing.
    Optionally set the new upload as the primary resume.
    """
    settings = get_settings()
    content = await file.read()
    filename = sanitise_filename(file.filename or "resume")

    if not validate_resume_extension(filename):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF, DOC, and DOCX files are accepted.",
        )
    if not validate_resume_mime(file.content_type or ""):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported content type: {file.content_type}",
        )
    if not validate_resume_size(len(content), settings.max_resume_size_bytes):
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.max_resume_size_mb} MB limit.",
        )

    resume = service.upload_and_register(
        filename=filename,
        content=content,
        mime_type=file.content_type or "application/octet-stream",
        set_as_primary=set_as_primary,
    )
    # Convert to list item (no file_path in response)
    from app.services.storage_service import StorageService
    signed_url = StorageService().get_signed_url(resume.file_path)
    return ResumeListItem(
        id=resume.id,
        name=resume.name,
        file_size=resume.file_size,
        mime_type=resume.mime_type,
        is_primary=resume.is_primary,
        created_at=resume.created_at,
        download_url=signed_url,
    )


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: UUID,
    service: Annotated[ResumeService, Depends(_get_service)],
):
    """Delete a resume from storage and the database."""
    deleted = service.delete_resume(resume_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")


@router.post("/{resume_id}/primary", status_code=status.HTTP_200_OK)
async def set_primary_resume(
    resume_id: UUID,
    service: Annotated[ResumeService, Depends(_get_service)],
):
    """Mark a resume as primary (deselects all others for this user)."""
    ok = service.set_primary(resume_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")
    return {"message": "Primary resume updated."}

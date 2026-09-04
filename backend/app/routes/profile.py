"""
Profile routes — read and update the authenticated user's profile.

GET  /profile     — return the full profile record
PATCH /profile    — partial update (only provided fields are changed)
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_user_supabase_client
from app.middleware import require_auth
from app.models.user import Profile, ProfileUpdate
from app.services.auth_service import TokenPayload

router = APIRouter(prefix="/profile")


@router.get("", response_model=Profile, response_model_exclude_none=True)
async def get_profile(auth: Annotated[TokenPayload, Depends(require_auth)]):
    """Return the current user's profile."""
    db = get_user_supabase_client(auth.sub)  # token not available here; use sub approach
    # Re-fetch via service role since we already validated the JWT
    from app.database import get_supabase_client
    admin = get_supabase_client()
    row = admin.table("profiles").select("*").eq("id", auth.sub).maybe_single().execute()
    if not row or not row.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
    return Profile(**row.data)


@router.patch("", response_model=Profile, response_model_exclude_none=True)
async def update_profile(
    body: ProfileUpdate,
    auth: Annotated[TokenPayload, Depends(require_auth)],
):
    """
    Partially update the current user's profile.

    Only fields present in the request body (non-None) are updated.
    Returns the full updated profile.
    """
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields provided to update.",
        )
    from app.database import get_supabase_client
    admin = get_supabase_client()
    import datetime
    update_data["updated_at"] = datetime.datetime.utcnow().isoformat()
    row = (
        admin.table("profiles")
        .update(update_data)
        .eq("id", auth.sub)
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
    return Profile(**row.data[0])

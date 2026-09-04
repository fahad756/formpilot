"""
Auth routes.

These endpoints do NOT issue tokens — that is Supabase's job. This module
provides backend-side helpers:
  - GET /auth/me  — resolve the caller's identity from their Supabase token
  - POST /auth/verify — lightweight token validity check for the extension
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.middleware import require_auth
from app.models.user import UserInfo
from app.services.auth_service import AuthService, TokenPayload
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

router = APIRouter(prefix="/auth")
_bearer = HTTPBearer(auto_error=True)


@router.get("/me", response_model=UserInfo)
async def get_current_user(
    auth: Annotated[TokenPayload, Depends(require_auth)],
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
):
    """
    Return the authenticated user's basic info.

    Calls the Supabase Admin API to fetch up-to-date metadata (avatar, full
    name) that may not be baked into the JWT. Suitable for session bootstrap.
    """
    user_data = AuthService.get_user_from_token(credentials.credentials)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not retrieve user from token.",
        )
    return UserInfo(**user_data)


@router.post("/verify", status_code=status.HTTP_200_OK)
async def verify_token(auth: Annotated[TokenPayload, Depends(require_auth)]):
    """
    Lightweight token validation used by the extension on startup.

    Returns 200 + user_id on valid token, 401 automatically on invalid token
    (handled by the require_auth dependency). Does not hit the Supabase API.
    """
    return {"valid": True, "user_id": auth.sub}

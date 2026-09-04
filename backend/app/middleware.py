"""
Authentication middleware and dependency injection helpers.

The `require_auth` dependency validates the Supabase JWT on every protected
route. It extracts the user ID and injects it downstream — routes never parse
tokens themselves. This keeps auth logic in one place and makes routes testable
by swapping the dependency in tests.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.auth_service import AuthService, TokenPayload

# Standard Bearer token extractor — returns 401 automatically if header absent
_bearer = HTTPBearer(auto_error=True)


async def require_auth(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> TokenPayload:
    """
    FastAPI dependency that validates the caller's Supabase access token.

    Raises HTTP 401 if the token is missing, expired, or malformed.
    On success returns a TokenPayload so downstream handlers get the user_id
    without re-parsing the JWT themselves.

    Usage:
        @router.get("/me")
        async def get_me(auth: Annotated[TokenPayload, Depends(require_auth)]):
            return {"user_id": auth.sub}
    """
    token = credentials.credentials
    payload = AuthService.verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

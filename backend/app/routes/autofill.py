"""
Autofill route — called by the Chrome Extension before filling a form.

The extension sends a list of field identifiers it detected on the page.
The backend resolves them against the user's profile and returns a fill map
plus the primary resume's download URL.

POST /autofill/resolve
"""

from typing import Annotated, List

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.middleware import require_auth
from app.services.auth_service import TokenPayload
from app.services.autofill_service import AutofillService

router = APIRouter(prefix="/autofill")
_bearer = HTTPBearer(auto_error=True)


class AutofillRequest(BaseModel):
    """Payload sent by the extension's content script."""
    field_identifiers: List[str]


@router.post("/resolve")
async def resolve_autofill(
    body: AutofillRequest,
    auth: Annotated[TokenPayload, Depends(require_auth)],
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
):
    """
    Resolve form field identifiers to profile values.

    Returns:
      - fill_map: {identifier: value} pairs ready to inject into form fields
      - primary_resume: signed URL for the user's current primary resume
      - profile_completion: 0-100 score to prompt incomplete profile nudges
    """
    service = AutofillService(user_id=auth.sub, access_token=credentials.credentials)
    return service.build_payload(body.field_identifiers)

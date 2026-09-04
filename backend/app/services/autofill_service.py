"""
Autofill payload builder.

Given a user's profile and a list of field identifiers sent by the extension,
this service builds the fill map and packages it with the primary resume's
signed download URL. The extension uses this payload to populate form fields.

The field matching logic lives in utils/field_mapper.py so it can be tested
independently of auth and database concerns.
"""

from typing import Optional

from app.database import get_user_supabase_client
from app.models.resume import ResumeListItem
from app.services.storage_service import StorageService
from app.utils.field_mapper import build_autofill_map


class AutofillService:
    def __init__(self, user_id: str, access_token: str):
        self._user_id = user_id
        self._db = get_user_supabase_client(access_token)
        self._storage = StorageService()

    def get_profile(self) -> Optional[dict]:
        """Fetch the user's profile row as a plain dict."""
        row = (
            self._db.table("profiles")
            .select("*")
            .eq("id", self._user_id)
            .maybe_single()
            .execute()
        )
        return row.data if row else None

    def get_primary_resume(self) -> Optional[ResumeListItem]:
        """Return the primary resume with a signed download URL, or None."""
        row = (
            self._db.table("resumes")
            .select("*")
            .eq("user_id", self._user_id)
            .eq("is_primary", True)
            .maybe_single()
            .execute()
        )
        if not row or not row.data:
            return None
        signed_url = self._storage.get_signed_url(row.data["file_path"])
        data = {k: v for k, v in row.data.items() if k != "file_path"}
        return ResumeListItem(**data, download_url=signed_url)

    def build_payload(self, field_identifiers: list[str]) -> dict:
        """
        Build the complete autofill payload for the extension.

        Returns:
          {
            "fill_map": {"fieldName": "value", ...},
            "primary_resume": { ResumeListItem } | null,
            "profile_completion": 0-100  (% of non-null profile fields)
          }
        """
        profile = self.get_profile() or {}
        fill_map = build_autofill_map(field_identifiers, profile)
        primary_resume = self.get_primary_resume()

        # Compute profile completeness for the extension to show a nudge
        completable_keys = [
            "first_name", "last_name", "email", "phone", "linkedin_url",
            "github_url", "current_title", "years_experience", "university",
        ]
        filled = sum(1 for k in completable_keys if profile.get(k))
        completion = round((filled / len(completable_keys)) * 100)

        return {
            "fill_map": fill_map,
            "primary_resume": primary_resume.model_dump() if primary_resume else None,
            "profile_completion": completion,
        }

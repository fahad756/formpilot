"""
Resume business logic — upload pipeline, primary toggle, listing.

The "exactly one primary" invariant:
  When a resume is set as primary, this service runs two DB operations in
  sequence: clear all is_primary=True for the user, then set the target.
  Supabase/Postgres doesn't have a native "only one" constraint that also
  allows zero primaries, so we enforce it here. If the second operation fails,
  the user temporarily has no primary resume rather than two — the safer state.
"""

from typing import List, Optional
from uuid import UUID

from app.database import get_user_supabase_client
from app.models.resume import Resume, ResumeCreate, ResumeListItem
from app.services.storage_service import StorageService


class ResumeService:
    def __init__(self, user_id: str, access_token: str):
        self._user_id = user_id
        self._db = get_user_supabase_client(access_token)
        self._storage = StorageService()

    # ── Upload ───────────────────────────────────────────────────────────────
    def upload_and_register(
        self,
        filename: str,
        content: bytes,
        mime_type: str,
        set_as_primary: bool = False,
    ) -> Resume:
        """Upload file bytes, store metadata in DB, optionally set as primary."""
        file_path = self._storage.upload_resume(
            self._user_id, filename, content, mime_type
        )
        data = ResumeCreate(
            name=filename,
            file_path=file_path,
            file_size=len(content),
            mime_type=mime_type,
        )
        row = (
            self._db.table("resumes")
            .insert({**data.model_dump(), "user_id": self._user_id})
            .execute()
        )
        resume = Resume(**row.data[0])
        if set_as_primary:
            self._set_primary(resume.id)
        return resume

    # ── List ─────────────────────────────────────────────────────────────────
    def list_resumes(self) -> List[ResumeListItem]:
        """Return all resumes for the current user with signed download URLs."""
        rows = (
            self._db.table("resumes")
            .select("*")
            .eq("user_id", self._user_id)
            .order("created_at", desc=True)
            .execute()
        )
        items = []
        for row in rows.data:
            signed_url = self._storage.get_signed_url(row["file_path"])
            items.append(ResumeListItem(**{k: v for k, v in row.items() if k != "file_path"}, download_url=signed_url))
        return items

    # ── Delete ───────────────────────────────────────────────────────────────
    def delete_resume(self, resume_id: UUID) -> bool:
        """Delete resume from storage and remove its DB record."""
        row = (
            self._db.table("resumes")
            .select("file_path")
            .eq("id", str(resume_id))
            .eq("user_id", self._user_id)
            .maybe_single()
            .execute()
        )
        if not row.data:
            return False
        self._storage.delete_resume(row.data["file_path"])
        self._db.table("resumes").delete().eq("id", str(resume_id)).execute()
        return True

    # ── Primary toggle ────────────────────────────────────────────────────────
    def set_primary(self, resume_id: UUID) -> bool:
        """Ensure exactly one resume is primary. Returns False if ID not found."""
        row = (
            self._db.table("resumes")
            .select("id")
            .eq("id", str(resume_id))
            .eq("user_id", self._user_id)
            .maybe_single()
            .execute()
        )
        if not row.data:
            return False
        self._set_primary(resume_id)
        return True

    def _set_primary(self, resume_id: UUID) -> None:
        # Clear all primaries for this user first (safe even if none exist)
        self._db.table("resumes").update({"is_primary": False}).eq("user_id", self._user_id).execute()
        # Set the target
        self._db.table("resumes").update({"is_primary": True}).eq("id", str(resume_id)).execute()

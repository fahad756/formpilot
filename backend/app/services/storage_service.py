"""
Supabase Storage operations for resume file management.

All files are stored under a per-user prefix: {user_id}/{filename}.
This isolates users' files and simplifies RLS policies on the bucket.

The service-role client is used for uploads so that backend validation gates
access rather than relying on client-side enforcement of bucket policies.
"""

import uuid
from typing import Optional

from app.config import get_settings
from app.database import get_supabase_client


class StorageService:
    def __init__(self):
        self._client = get_supabase_client()
        self._bucket = get_settings().resume_bucket

    def upload_resume(
        self,
        user_id: str,
        filename: str,
        content: bytes,
        mime_type: str,
    ) -> str:
        """
        Upload resume bytes to Supabase Storage.

        Returns the storage path (not a public URL) so callers can generate
        signed URLs on demand rather than exposing permanent links.
        Raises RuntimeError if the upload fails.
        """
        safe_name = f"{user_id}/{uuid.uuid4().hex}_{filename}"
        response = self._client.storage.from_(self._bucket).upload(
            path=safe_name,
            file=content,
            file_options={"content-type": mime_type, "upsert": "false"},
        )
        # supabase-py raises on error; if it doesn't, verify path is present
        if not response:
            raise RuntimeError("Storage upload returned empty response.")
        return safe_name

    def delete_resume(self, file_path: str) -> bool:
        """
        Delete a resume from storage by its stored path.

        Returns True on success, False on failure (e.g., file not found).
        Does not raise — callers should log failures and continue so that DB
        records can still be cleaned up even if storage deletion fails.
        """
        try:
            self._client.storage.from_(self._bucket).remove([file_path])
            return True
        except Exception:
            return False

    def get_signed_url(self, file_path: str, expires_in: int = 3600) -> Optional[str]:
        """
        Generate a time-limited signed download URL for a resume file.

        expires_in: seconds until the URL expires (default: 1 hour)
        Returns None if URL generation fails.
        """
        try:
            response = self._client.storage.from_(self._bucket).create_signed_url(
                file_path, expires_in
            )
            return response.get("signedURL") or response.get("signedUrl")
        except Exception:
            return None

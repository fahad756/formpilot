"""
Input validation utilities used across route handlers.

Keep validation logic here rather than inside route functions so it can be
unit-tested without HTTP machinery and reused across multiple routes.
"""

import mimetypes
from typing import Optional

# Allowed MIME types for resume uploads
ALLOWED_RESUME_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

ALLOWED_RESUME_EXTENSIONS = {".pdf", ".doc", ".docx"}


def validate_resume_mime(content_type: str) -> bool:
    """Return True if the MIME type is an allowed resume format."""
    return content_type.lower().split(";")[0].strip() in ALLOWED_RESUME_MIME_TYPES


def validate_resume_extension(filename: str) -> bool:
    """Return True if the file extension is in the allowed set."""
    import os
    _, ext = os.path.splitext(filename.lower())
    return ext in ALLOWED_RESUME_EXTENSIONS


def validate_resume_size(size_bytes: int, max_bytes: int) -> bool:
    """Return True if the file is within the allowed size limit."""
    return 0 < size_bytes <= max_bytes


def sanitise_filename(filename: str) -> str:
    """
    Return a filesystem-safe version of the filename.

    Strips path components and replaces characters that could cause problems
    in storage paths. Does not truncate — callers should enforce length limits.
    """
    import os
    import re

    # Drop any path traversal
    basename = os.path.basename(filename)
    # Replace whitespace with underscores, remove other unsafe chars
    safe = re.sub(r"\s+", "_", basename)
    safe = re.sub(r"[^\w.\-]", "", safe)
    return safe or "resume"

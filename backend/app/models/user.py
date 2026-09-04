"""
User and Profile Pydantic models.

Profile maps 1:1 with the `profiles` Supabase table. Fields are optional in
ProfileUpdate so partial PATCH requests only update provided keys. Null fields
in the DB are omitted from API responses (response_model_exclude_none=True on
routes) to keep payloads small.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, HttpUrl, field_validator


class Profile(BaseModel):
    """Full profile as returned from the database."""
    id: UUID
    # Personal
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    # Links
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    # Professional
    current_title: Optional[str] = None
    years_experience: Optional[int] = None
    current_company: Optional[str] = None
    # Education
    degree: Optional[str] = None
    major: Optional[str] = None
    university: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[str] = None
    # Application extras
    cover_letter_template: Optional[str] = None
    salary_expectation: Optional[str] = None
    availability: Optional[str] = None
    # Metadata
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ProfileUpdate(BaseModel):
    """
    Partial update model — every field is optional so PATCH can update any
    subset of profile fields without requiring the full document.
    """
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    current_title: Optional[str] = None
    years_experience: Optional[int] = None
    current_company: Optional[str] = None
    degree: Optional[str] = None
    major: Optional[str] = None
    university: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[str] = None
    cover_letter_template: Optional[str] = None
    salary_expectation: Optional[str] = None
    availability: Optional[str] = None

    @field_validator("years_experience", "graduation_year", mode="before")
    @classmethod
    def coerce_int_fields(cls, v):
        """Accept string representations from HTML form submissions."""
        if v is None or v == "":
            return None
        return int(v)


class UserInfo(BaseModel):
    """Lightweight user info returned from the /auth/me endpoint."""
    id: UUID
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

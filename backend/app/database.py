"""
Supabase client factory.

We maintain two client instances:
  - `get_supabase_client`: service-role client for trusted server-side ops
    (bypasses RLS — use only in service layer, never expose to users directly)
  - `get_user_client`: user-scoped client using the caller's access token
    (respects RLS policies — use for all user-facing data operations)

The clients are not singletons because supabase-py is not thread-safe when
sharing a single client across multiple async tasks with different auth tokens.
"""

from supabase import Client, create_client

from app.config import get_settings


def get_supabase_client() -> Client:
    """
    Return a Supabase client authenticated as the service role.

    The service role key bypasses Row Level Security. Only use this for:
    - Verifying JWTs via admin.get_user()
    - Storage operations that require elevated access
    - Background jobs that operate outside user request scope
    """
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_user_supabase_client(access_token: str) -> Client:
    """
    Return a Supabase client scoped to the authenticated user's token.

    This client respects all Row Level Security policies defined on tables.
    Pass the Bearer token extracted from the incoming request's Authorization
    header. The token is validated by Supabase's PostgREST layer on each call.
    """
    settings = get_settings()
    client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    # Override the Authorization header so PostgREST applies RLS for this user
    client.postgrest.auth(access_token)
    return client

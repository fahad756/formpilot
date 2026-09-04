"""
Authentication service — JWT verification and user resolution.

Supabase has migrated new projects to ECC (P-256 / ES256) JWT signing.
Local HS256 verification no longer works for these projects because there
is no shared secret to decode against — only a public key pair.

Strategy used here:
  - verify_token()      → calls Supabase Admin API (auth.get_user).
                          Works with ALL signing algorithms (HS256, ES256, RS256)
                          and handles key rotation automatically.
                          One network round-trip per request — acceptable for
                          development and low-traffic production. Cache with
                          Redis + short TTL to eliminate latency at scale.
  - get_user_from_token() → same API call, returns richer metadata dict.

The JWT secret is no longer required for token verification.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class TokenPayload:
    """Decoded, validated JWT claims for downstream use."""
    sub: str          # Supabase user UUID (str, not UUID object, for speed)
    email: Optional[str] = None
    role: str = "authenticated"


class AuthService:
    @staticmethod
    def verify_token(token: str) -> Optional[TokenPayload]:
        """
        Verify a Supabase access token via the Admin API.

        Returns a TokenPayload on success, None on invalid/expired tokens.
        Supports HS256, ES256, and RS256 — algorithm-agnostic.
        """
        from app.database import get_supabase_client
        client = get_supabase_client()
        try:
            response = client.auth.get_user(token)
            if response and response.user:
                return TokenPayload(
                    sub=str(response.user.id),
                    email=response.user.email or None,
                    role="authenticated",
                )
        except Exception:
            # Covers expired, invalid, or network-error cases
            pass
        return None

    @staticmethod
    def get_user_from_token(token: str) -> Optional[dict]:
        """
        Return the full user record dict for the given token.

        Same underlying call as verify_token but returns richer metadata
        (full_name, avatar_url) for the /auth/me endpoint.
        """
        from app.database import get_supabase_client
        client = get_supabase_client()
        try:
            response = client.auth.get_user(token)
            if response and response.user:
                return {
                    "id": str(response.user.id),
                    "email": response.user.email,
                    "full_name": (response.user.user_metadata or {}).get("full_name"),
                    "avatar_url": (response.user.user_metadata or {}).get("avatar_url"),
                }
        except Exception:
            pass
        return None

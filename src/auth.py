"""Supabase JWT verification for FastAPI.

Supports both Supabase signing schemes:
- New projects sign access tokens with asymmetric keys (ES256/RS256),
  verified against the project's public JWKS endpoint.
- Legacy projects sign with a shared HS256 secret (SUPABASE_JWT_SECRET).

When SUPABASE_URL is unset, auth is disabled and the app uses a single
local user (file-based storage) for development.
"""

from __future__ import annotations

import os

import jwt
from fastapi import Header, HTTPException

ALLOWED_ALGORITHMS = {"HS256", "RS256", "ES256"}

_jwk_client: jwt.PyJWKClient | None = None


def auth_enabled() -> bool:
    has_url = bool(os.environ.get("SUPABASE_URL"))
    has_key = bool(
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")
    )
    return has_url and has_key


def _get_jwk_client() -> jwt.PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        base = os.environ["SUPABASE_URL"].rstrip("/")
        _jwk_client = jwt.PyJWKClient(
            f"{base}/auth/v1/.well-known/jwks.json", cache_keys=True
        )
    return _jwk_client


def verify_token(token: str) -> str:
    """Return user id (JWT sub) or raise."""
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
        if alg not in ALLOWED_ALGORITHMS:
            raise HTTPException(status_code=401, detail="Invalid or expired session.")

        if alg == "HS256":
            key = os.environ.get("SUPABASE_JWT_SECRET", "")
        else:
            key = _get_jwk_client().get_signing_key_from_jwt(token).key

        payload = jwt.decode(
            token,
            key,
            algorithms=[alg],
            audience="authenticated",
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired session.") from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload.")
    return str(user_id)


def get_current_user_id(authorization: str | None = Header(default=None)) -> str:
    if not auth_enabled():
        return "local"

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Sign in required.")

    return verify_token(authorization.removeprefix("Bearer ").strip())

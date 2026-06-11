"""Supabase JWT verification for FastAPI.

When SUPABASE_URL + SUPABASE_JWT_SECRET are unset, auth is disabled and the app
uses a single local user (file-based storage) for development.
"""

from __future__ import annotations

import os

import jwt
from fastapi import Header, HTTPException


def auth_enabled() -> bool:
    has_url = bool(os.environ.get("SUPABASE_URL"))
    has_jwt = bool(os.environ.get("SUPABASE_JWT_SECRET"))
    has_key = bool(
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")
    )
    return has_url and has_jwt and has_key


def verify_token(token: str) -> str:
    """Return user id (JWT sub) or raise."""
    secret = os.environ.get("SUPABASE_JWT_SECRET", "")
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
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

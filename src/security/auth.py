"""
Authentication module supporting API key and JWT token validation.

Provides FastAPI dependency injection for securing endpoints.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from config.logging_config import get_logger
from config.settings import get_settings

logger = get_logger(__name__)

# Security schemes
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)


class AuthUser:
    """Represents an authenticated user/client."""

    def __init__(self, user_id: str, auth_method: str, scopes: list[str] | None = None):
        self.user_id = user_id
        self.auth_method = auth_method  # "api_key" or "jwt"
        self.scopes = scopes or []


def validate_api_key(api_key: str) -> bool:
    """Validate an API key against the configured keys."""
    settings = get_settings()
    valid_keys = settings.api_keys_list
    return api_key in valid_keys


def create_jwt_token(user_id: str, scopes: list[str] | None = None) -> str:
    """
    Create a JWT token for a user.

    Args:
        user_id: The user identifier.
        scopes: Optional list of permission scopes.

    Returns:
        Encoded JWT token string.
    """
    settings = get_settings()
    now = datetime.now(tz=timezone.utc)

    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expiry_minutes),
        "scopes": scopes or ["query"],
    }

    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_jwt_token(token: str) -> dict:
    """
    Decode and validate a JWT token.

    Raises:
        HTTPException: If token is invalid or expired.
    """
    settings = get_settings()

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError as e:
        logger.warning("jwt_validation_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def get_current_user(
    api_key: Optional[str] = Security(api_key_header),
    bearer: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
) -> AuthUser:
    """
    FastAPI dependency that authenticates the request.

    Supports two authentication methods (checked in order):
    1. API Key via X-API-Key header
    2. JWT Bearer token via Authorization header

    In development mode, allows unauthenticated requests with a default user.
    """
    settings = get_settings()

    # Try API Key authentication
    if api_key:
        if validate_api_key(api_key):
            logger.debug("auth_success", method="api_key")
            return AuthUser(user_id=f"apikey:{api_key[:8]}...", auth_method="api_key")
        else:
            logger.warning("auth_failed", method="api_key")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key",
            )

    # Try JWT Bearer authentication
    if bearer:
        payload = decode_jwt_token(bearer.credentials)
        user_id = payload.get("sub", "unknown")
        scopes = payload.get("scopes", [])
        logger.debug("auth_success", method="jwt", user=user_id)
        return AuthUser(user_id=user_id, auth_method="jwt", scopes=scopes)

    # In development mode, allow unauthenticated access
    if not settings.is_production:
        logger.debug("auth_skipped", reason="development mode")
        return AuthUser(user_id="anonymous", auth_method="none")

    # In production, require authentication
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Provide an API key or JWT token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

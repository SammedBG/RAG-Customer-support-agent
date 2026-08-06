"""
Rate limiting using slowapi (token bucket algorithm).

Protects the API from abuse and resource exhaustion.
"""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from config.settings import get_settings


def _get_key_func(request):
    """
    Extract rate limit key from request.

    Uses API key if present, otherwise falls back to IP address.
    """
    api_key = request.headers.get("X-API-Key")
    if api_key:
        return f"apikey:{api_key[:16]}"
    return get_remote_address(request)


# Create limiter instance
limiter = Limiter(key_func=_get_key_func)


def get_rate_limit_string() -> str:
    """Get the rate limit configuration as a string for slowapi."""
    settings = get_settings()
    return f"{settings.rate_limit_per_minute}/minute"

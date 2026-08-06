"""
FastAPI middleware stack.

Chains: Correlation ID → Audit logging → Error handling.
Auth and rate limiting are handled via FastAPI dependencies.
"""

from __future__ import annotations

import time
import uuid

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from config.logging_config import get_logger, set_correlation_id

logger = get_logger(__name__)


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """
    Inject a unique correlation ID into every request.

    The ID is:
    - Generated or extracted from the X-Correlation-ID header
    - Added to the response headers
    - Available via context variable for structured logging
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Use provided correlation ID or generate a new one
        correlation_id = request.headers.get("X-Correlation-ID")
        if not correlation_id:
            correlation_id = uuid.uuid4().hex[:16]

        # Set in context for logging
        set_correlation_id(correlation_id)

        # Store on request state for route handlers
        request.state.correlation_id = correlation_id

        response = await call_next(request)

        # Add to response headers
        response.headers["X-Correlation-ID"] = correlation_id

        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Log request/response details and timing.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start_time = time.perf_counter()

        # Log request
        logger.info(
            "request_started",
            method=request.method,
            path=str(request.url.path),
            client=request.client.host if request.client else "unknown",
        )

        try:
            response = await call_next(request)
        except Exception as e:
            latency = (time.perf_counter() - start_time) * 1000
            logger.error(
                "request_failed",
                method=request.method,
                path=str(request.url.path),
                error=str(e),
                latency_ms=round(latency, 2),
            )
            raise

        latency = (time.perf_counter() - start_time) * 1000

        logger.info(
            "request_completed",
            method=request.method,
            path=str(request.url.path),
            status=response.status_code,
            latency_ms=round(latency, 2),
        )

        # Add timing header
        response.headers["X-Response-Time-Ms"] = str(round(latency, 2))

        return response

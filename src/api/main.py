"""
FastAPI application factory.

Creates and configures the application with all middleware,
routes, CORS, and exception handlers.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from config.logging_config import get_logger, setup_logging
from config.settings import get_settings
from src.api.middleware import CorrelationIdMiddleware, RequestLoggingMiddleware
from src.api.routes import router
from src.security.rate_limiter import limiter

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager."""
    settings = get_settings()

    # Startup
    setup_logging(
        log_level=settings.log_level,
        json_format=settings.is_production,
    )
    logger.info(
        "application_starting",
        env=settings.app_env,
        debug=settings.app_debug,
    )

    yield

    # Shutdown
    logger.info("application_shutting_down")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="RAG Customer Support Agent",
        description=(
            "Production-grade RAG agent that answers customer questions "
            "using company documents with source citations. "
            "Built with LangGraph, LlamaIndex, and Qdrant."
        ),
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # ── Rate limiter ─────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

    # ── CORS ─────────────────────────────────────────────────
    cors_origins = settings.cors_origins_list
    allow_all = "*" in cors_origins or settings.cors_origins.strip() == "*"

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if allow_all else cors_origins,
        allow_credentials=not allow_all,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Correlation-ID", "X-Response-Time-Ms"],
    )

    # ── Custom Middleware (order matters — outermost first) ──
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(CorrelationIdMiddleware)

    # ── Routes ───────────────────────────────────────────────
    app.include_router(router)

    # ── Root endpoint ────────────────────────────────────────
    @app.get("/", tags=["Root"])
    async def root():
        return {
            "name": "RAG Customer Support Agent",
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/api/v1/health",
        }

    # ── Global exception handler ─────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(
            "unhandled_exception",
            error=str(exc),
            path=request.url.path,
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": "An unexpected error occurred. Please try again later.",
            },
        )

    return app


# Create the app instance
app = create_app()

if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "src.api.main:app",
        host=settings.app_host,
        port=settings.effective_port,
        reload=settings.app_debug,
    )

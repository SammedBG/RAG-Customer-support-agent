"""
Structured JSON logging configuration with correlation IDs.

Every log entry includes a correlation_id for request tracing,
making it easy to follow a single request through the entire pipeline.
"""

from __future__ import annotations

import logging
import sys
import uuid
from contextvars import ContextVar
from typing import Any

import structlog

# Context variable for per-request correlation ID
correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="no-correlation-id")


def get_correlation_id() -> str:
    """Get the current correlation ID from context."""
    return correlation_id_var.get()


def set_correlation_id(cid: str | None = None) -> str:
    """Set a new correlation ID. Generates one if not provided."""
    new_id = cid or uuid.uuid4().hex[:16]
    correlation_id_var.set(new_id)
    return new_id


def add_correlation_id(
    logger: Any, method_name: str, event_dict: dict[str, Any]
) -> dict[str, Any]:
    """Structlog processor that injects correlation_id into every log entry."""
    event_dict["correlation_id"] = get_correlation_id()
    return event_dict


def setup_logging(log_level: str = "INFO", json_format: bool = True) -> None:
    """
    Configure structured logging for the entire application.

    Args:
        log_level: Minimum log level (DEBUG, INFO, WARNING, ERROR, CRITICAL).
        json_format: If True, output JSON logs (production). Otherwise, colored console.
    """
    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        add_correlation_id,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if json_format:
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    # Silence noisy third-party loggers
    for noisy_logger in ["httpx", "httpcore", "openai", "urllib3", "qdrant_client"]:
        logging.getLogger(noisy_logger).setLevel(logging.WARNING)


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a named structlog logger."""
    return structlog.get_logger(name)

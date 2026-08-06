"""
Audit trail logging for compliance and forensic analysis.

Records every query, its retrieved context, the generated response,
and metadata for full traceability.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from config.logging_config import get_logger

logger = get_logger(__name__)

# Audit log file path
AUDIT_LOG_DIR = Path("logs")
AUDIT_LOG_FILE = AUDIT_LOG_DIR / "audit.jsonl"


class AuditEntry:
    """A single audit trail entry."""

    def __init__(
        self,
        request_id: str,
        user_id: str,
        query: str,
        sanitized_query: str,
        retrieved_sources: list[str],
        response: str,
        citations: list[dict[str, Any]],
        confidence: float,
        route_decision: str,
        latency_ms: float,
        was_blocked: bool = False,
        blocked_reason: Optional[str] = None,
        error: Optional[str] = None,
    ):
        self.timestamp = datetime.now(tz=timezone.utc).isoformat()
        self.request_id = request_id
        self.user_id = user_id
        self.query = query
        self.sanitized_query = sanitized_query
        self.retrieved_sources = retrieved_sources
        self.response = response
        self.citations = citations
        self.confidence = confidence
        self.route_decision = route_decision
        self.latency_ms = latency_ms
        self.was_blocked = was_blocked
        self.blocked_reason = blocked_reason
        self.error = error

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "timestamp": self.timestamp,
            "request_id": self.request_id,
            "user_id": self.user_id,
            "query": self.query,
            "sanitized_query": self.sanitized_query,
            "retrieved_sources": self.retrieved_sources,
            "response_preview": self.response[:500] if self.response else "",
            "citations_count": len(self.citations),
            "confidence": self.confidence,
            "route_decision": self.route_decision,
            "latency_ms": round(self.latency_ms, 2),
            "was_blocked": self.was_blocked,
            "blocked_reason": self.blocked_reason,
            "error": self.error,
        }


def log_audit_entry(entry: AuditEntry) -> None:
    """
    Write an audit entry to the JSONL audit log and structured logger.

    Each entry is a single line of JSON (JSONL format) for easy parsing.
    """
    # Ensure log directory exists
    AUDIT_LOG_DIR.mkdir(parents=True, exist_ok=True)

    entry_dict = entry.to_dict()

    # Write to JSONL file
    try:
        with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry_dict) + "\n")
    except OSError as e:
        logger.error("audit_log_write_failed", error=str(e))

    # Also log to structured logger
    logger.info("audit_entry", **entry_dict)


def log_blocked_request(
    request_id: str,
    user_id: str,
    query: str,
    reason: str,
) -> None:
    """Log a blocked (rejected) request for security monitoring."""
    entry = AuditEntry(
        request_id=request_id,
        user_id=user_id,
        query=query,
        sanitized_query="",
        retrieved_sources=[],
        response="",
        citations=[],
        confidence=0.0,
        route_decision="blocked",
        latency_ms=0.0,
        was_blocked=True,
        blocked_reason=reason,
    )
    log_audit_entry(entry)

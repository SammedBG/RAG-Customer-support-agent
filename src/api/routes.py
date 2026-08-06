"""
API route handlers.

All endpoints are secured with authentication, rate limiting,
input sanitization, and audit logging.
"""

from __future__ import annotations

import json
import sqlite3
import time
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, status

from config.logging_config import get_logger
from src.agent.graph import invoke_agent
from src.api.schemas import (
    CitationResponse,
    DocumentInfo,
    DocumentListResponse,
    ErrorResponse,
    HealthResponse,
    IngestRequest,
    IngestResponse,
    QueryRequest,
    QueryResponse,
)
from src.security.audit import AuditEntry, log_audit_entry, log_blocked_request
from src.security.auth import AuthUser, get_current_user
from src.security.rate_limiter import get_rate_limit_string, limiter
from src.security.sanitizer import sanitize_input

logger = get_logger(__name__)

router = APIRouter(prefix="/api/v1", tags=["RAG Agent"])


@router.post(
    "/query",
    response_model=QueryResponse,
    responses={400: {"model": ErrorResponse}, 429: {"model": ErrorResponse}},
    summary="Query the RAG agent",
    description="Submit a customer question and receive an answer with source citations.",
)
@limiter.limit(get_rate_limit_string())
async def query_agent(
    request: Request,
    body: QueryRequest,
    user: AuthUser = Depends(get_current_user),
):
    """
    Main query endpoint for the RAG Customer Support Agent.

    Flow:
    1. Sanitize input
    2. Invoke LangGraph agent
    3. Log audit trail
    4. Return answer with citations
    """
    request_id = getattr(request.state, "correlation_id", uuid.uuid4().hex[:16])
    start_time = time.perf_counter()

    # Step 1: Sanitize input
    sanitization = sanitize_input(body.query)

    if not sanitization.is_safe:
        log_blocked_request(
            request_id=request_id,
            user_id=user.user_id,
            query=body.query,
            reason=sanitization.blocked_reason or "Input failed sanitization",
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=sanitization.blocked_reason or "Invalid input",
        )

    sanitized_query = sanitization.sanitized_text

    logger.info(
        "query_received",
        request_id=request_id,
        user=user.user_id,
        query_len=len(sanitized_query),
    )

    try:
        # Step 2: Invoke the RAG agent
        result = invoke_agent(
            query=sanitized_query,
            request_id=request_id,
        )

        # Step 3: Build response
        citations = [
            CitationResponse(
                source=c.get("source", c.get("source", "unknown")) if isinstance(c, dict) else c.source,
                chunk_text=(c.get("chunk_text", "") if isinstance(c, dict) else c.chunk_text)[:300],
                relevance_score=round(
                    c.get("relevance_score", 0.0) if isinstance(c, dict) else c.relevance_score, 3
                ),
                page=c.get("page") if isinstance(c, dict) else c.page,
            )
            for c in result.get("citations", [])
        ]

        response = QueryResponse(
            answer=result.get("generation", ""),
            citations=citations,
            confidence=round(result.get("confidence", 0.0), 3),
            request_id=request_id,
            query=sanitized_query,
        )

        # Step 4: Audit trail
        latency_ms = (time.perf_counter() - start_time) * 1000
        audit_entry = AuditEntry(
            request_id=request_id,
            user_id=user.user_id,
            query=body.query,
            sanitized_query=sanitized_query,
            retrieved_sources=[c.source for c in citations],
            response=response.answer,
            citations=[c.model_dump() for c in citations],
            confidence=response.confidence,
            route_decision=result.get("route_decision", "unknown"),
            latency_ms=latency_ms,
            error=result.get("error"),
        )
        log_audit_entry(audit_entry)

        return response

    except Exception as e:
        latency_ms = (time.perf_counter() - start_time) * 1000
        logger.error(
            "query_failed",
            request_id=request_id,
            error=str(e),
            latency_ms=round(latency_ms, 2),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your query. Please try again.",
        ) from e


@router.post(
    "/ingest",
    response_model=IngestResponse,
    summary="Ingest documents",
    description="Trigger document ingestion pipeline to index new documents.",
)
async def ingest_documents(
    request: Request,
    body: IngestRequest,
    user: AuthUser = Depends(get_current_user),
):
    """Run the document ingestion pipeline."""
    from src.ingestion.ingest_pipeline import IngestionPipeline

    logger.info(
        "ingestion_requested",
        user=user.user_id,
        data_dir=body.data_dir,
    )

    try:
        pipeline = IngestionPipeline()
        result = pipeline.run(
            data_dir=body.data_dir,
            force_reingest=body.force_reingest,
        )

        return IngestResponse(
            processed=result.get("processed", 0),
            skipped=result.get("skipped", 0),
            chunks_created=result.get("child_chunks", result.get("points_upserted", 0)),
            message=f"Successfully ingested {result.get('processed', 0)} documents",
        )

    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Data directory not found: {body.data_dir}",
        ) from e
    except Exception as e:
        logger.error("ingestion_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion failed: {str(e)}",
        ) from e


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Check system health including Qdrant connectivity.",
)
async def health_check():
    """Check overall system health."""
    from qdrant_client import QdrantClient

    from config.settings import get_settings

    settings = get_settings()

    qdrant_connected = False
    collection_exists = False
    doc_count = 0

    try:
        client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key or None,
            timeout=5,
        )

        # Check connectivity
        collections = client.get_collections()
        qdrant_connected = True

        # Check collection
        collection_names = [c.name for c in collections.collections]
        if settings.qdrant_collection_name in collection_names:
            collection_exists = True
            info = client.get_collection(settings.qdrant_collection_name)
            doc_count = info.points_count or 0

    except Exception as e:
        logger.warning("health_check_qdrant_failed", error=str(e))

    overall_status = "healthy" if qdrant_connected else "degraded"

    return HealthResponse(
        status=overall_status,
        qdrant_connected=qdrant_connected,
        collection_exists=collection_exists,
        document_count=doc_count,
    )


@router.get(
    "/documents",
    response_model=DocumentListResponse,
    summary="List ingested documents",
    description="Get a list of all ingested documents with metadata.",
)
async def list_documents(
    user: AuthUser = Depends(get_current_user),
):
    """List all documents that have been ingested."""
    metadata_db = Path("data/metadata.db")

    if not metadata_db.exists():
        return DocumentListResponse(documents=[], total=0)

    try:
        conn = sqlite3.connect(str(metadata_db))
        cursor = conn.execute(
            "SELECT source_file, source_path, ingested_at, chunk_count FROM ingested_docs ORDER BY ingested_at DESC"
        )
        rows = cursor.fetchall()
        conn.close()

        documents = [
            DocumentInfo(
                source_file=row[0],
                source_path=row[1],
                ingested_at=row[2],
                chunk_count=row[3],
            )
            for row in rows
        ]

        return DocumentListResponse(documents=documents, total=len(documents))

    except Exception as e:
        logger.error("list_documents_failed", error=str(e))
        return DocumentListResponse(documents=[], total=0)

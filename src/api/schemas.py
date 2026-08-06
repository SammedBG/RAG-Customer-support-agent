"""
Pydantic request/response schemas for the API.

Provides strict validation and automatic OpenAPI documentation.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────
# Request Schemas
# ─────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    """Request body for the query endpoint."""

    query: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="The customer's question",
        examples=["How do I return a product?"],
    )
    conversation_id: Optional[str] = Field(
        default=None,
        description="Optional conversation ID for multi-turn context",
    )


class IngestRequest(BaseModel):
    """Request body for the document ingestion endpoint."""

    data_dir: str = Field(
        default="data/sample_docs",
        description="Path to the directory containing documents to ingest",
    )
    force_reingest: bool = Field(
        default=False,
        description="If true, re-ingest all documents regardless of hash",
    )


# ─────────────────────────────────────────────────────────────
# Response Schemas
# ─────────────────────────────────────────────────────────────

class CitationResponse(BaseModel):
    """A single source citation in the response."""

    source: str = Field(description="Source filename")
    chunk_text: str = Field(description="The text chunk used as evidence")
    relevance_score: float = Field(description="Relevance score (0-1)")
    page: Optional[int] = Field(default=None, description="Page number if available")


class QueryResponse(BaseModel):
    """Response from the query endpoint."""

    answer: str = Field(description="The generated answer")
    citations: list[CitationResponse] = Field(
        default_factory=list,
        description="Source citations for the answer",
    )
    confidence: float = Field(
        description="Overall confidence score (0-1)",
        ge=0.0,
        le=1.0,
    )
    request_id: str = Field(description="Unique request identifier for tracing")
    query: str = Field(description="The original query (sanitized)")


class IngestResponse(BaseModel):
    """Response from the document ingestion endpoint."""

    processed: int = Field(description="Number of documents processed")
    skipped: int = Field(description="Number of documents skipped (already ingested)")
    chunks_created: int = Field(
        default=0,
        description="Total number of chunks created",
    )
    message: str = Field(description="Human-readable status message")


class HealthResponse(BaseModel):
    """Response from the health check endpoint."""

    status: str = Field(description="Overall system status")
    qdrant_connected: bool = Field(description="Qdrant database connectivity")
    collection_exists: bool = Field(description="Whether the vector collection exists")
    document_count: int = Field(description="Number of vectors in the collection")
    version: str = Field(default="1.0.0", description="API version")


class DocumentInfo(BaseModel):
    """Information about an ingested document."""

    source_file: str
    source_path: str
    ingested_at: str
    chunk_count: int


class DocumentListResponse(BaseModel):
    """Response from the document list endpoint."""

    documents: list[DocumentInfo]
    total: int


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str = Field(description="Error message")
    request_id: Optional[str] = Field(default=None)

"""
Qdrant hybrid search combining dense (semantic) and sparse (keyword) vectors.

Uses Reciprocal Rank Fusion (RRF) to merge results from both search modalities,
giving the best of both worlds: semantic understanding + exact keyword matching.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    FieldCondition,
    Filter,
    Fusion,
    FusionQuery,
    MatchValue,
    Prefetch,
    QueryRequest,
    SparseVector,
)

from config.logging_config import get_logger
from config.settings import get_settings
from src.ingestion.embedder import DenseEmbedder, SparseEmbedder

logger = get_logger(__name__)


@dataclass
class RetrievedChunk:
    """A single retrieved document chunk with metadata."""

    text: str
    parent_text: str
    source_file: str
    source_path: str
    score: float
    chunk_id: str
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def citation_key(self) -> str:
        """Generate a human-readable citation key."""
        return self.source_file.replace("_", " ").replace(".md", "").title()


class HybridSearcher:
    """
    Performs hybrid search on Qdrant combining dense and sparse vectors.

    The search uses Qdrant's query API with prefetch for both dense and
    sparse vectors, then applies Reciprocal Rank Fusion (RRF) to merge results.
    """

    def __init__(
        self,
        qdrant_client: Optional[QdrantClient] = None,
        dense_embedder: Optional[DenseEmbedder] = None,
        sparse_embedder: Optional[SparseEmbedder] = None,
    ):
        settings = get_settings()
        self.qdrant = qdrant_client or QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key or None,
        )
        self.collection_name = settings.qdrant_collection_name
        self.dense_embedder = dense_embedder or DenseEmbedder()
        self.sparse_embedder = sparse_embedder or SparseEmbedder()

        logger.info("hybrid_searcher_initialized", collection=self.collection_name)

    def search(
        self,
        query: str,
        top_k: Optional[int] = None,
        alpha: Optional[float] = None,
        score_threshold: Optional[float] = None,
        metadata_filter: Optional[dict[str, Any]] = None,
    ) -> list[RetrievedChunk]:
        """
        Perform hybrid search combining dense and sparse retrieval.

        Args:
            query: The search query string.
            top_k: Number of results to return.
            alpha: Weight for dense vs sparse (0=all sparse, 1=all dense).
            score_threshold: Minimum score to include a result.
            metadata_filter: Optional metadata filters for data isolation.

        Returns:
            List of RetrievedChunk objects sorted by relevance.
        """
        settings = get_settings()
        top_k = top_k or settings.top_k_retrieval
        alpha = alpha if alpha is not None else settings.hybrid_search_alpha
        score_threshold = score_threshold or settings.similarity_threshold

        logger.info(
            "hybrid_search_started",
            query_len=len(query),
            top_k=top_k,
            alpha=alpha,
        )

        # Generate both dense and sparse embeddings for the query
        dense_vector = self.dense_embedder.embed_query(query)
        sparse_vector = self.sparse_embedder.embed_query(query)

        # Build optional Qdrant filter
        qdrant_filter = None
        if metadata_filter:
            conditions = []
            for key, value in metadata_filter.items():
                conditions.append(
                    FieldCondition(key=key, match=MatchValue(value=value))
                )
            qdrant_filter = Filter(must=conditions)

        # Perform hybrid search using Qdrant's prefetch + RRF
        prefetch_dense = Prefetch(
            query=dense_vector,
            using="dense",
            limit=top_k * 2,  # Over-fetch for better fusion
            filter=qdrant_filter,
        )

        prefetch_sparse = Prefetch(
            query=SparseVector(
                indices=sparse_vector["indices"],
                values=sparse_vector["values"],
            ),
            using="sparse",
            limit=top_k * 2,
            filter=qdrant_filter,
        )

        # Use Qdrant's Reciprocal Rank Fusion
        results = self.qdrant.query_points(
            collection_name=self.collection_name,
            prefetch=[prefetch_dense, prefetch_sparse],
            query=FusionQuery(fusion=Fusion.RRF),
            limit=top_k,
            with_payload=True,
        )

        # Convert to RetrievedChunk objects
        chunks: list[RetrievedChunk] = []
        for point in results.points:
            payload = point.payload or {}
            score = point.score if point.score is not None else 0.0

            if score < score_threshold:
                continue

            text_val = str(payload.get("text") or "")
            parent_text_val = str(payload.get("parent_text") or payload.get("text") or "")
            source_file_val = str(payload.get("source_file") or "unknown")
            source_path_val = str(payload.get("source_path") or "")

            chunk = RetrievedChunk(
                text=text_val,
                parent_text=parent_text_val,
                source_file=source_file_val,
                source_path=source_path_val,
                score=score,
                chunk_id=str(point.id),
                metadata={
                    k: v
                    for k, v in payload.items()
                    if k not in ("text", "parent_text")
                },
            )
            chunks.append(chunk)

        logger.info(
            "hybrid_search_complete",
            results_count=len(chunks),
            top_score=chunks[0].score if chunks else 0.0,
        )

        return chunks

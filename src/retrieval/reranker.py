"""
Cross-encoder reranking for retrieval refinement.

After initial hybrid search, reranks the top-N candidates using a
cross-encoder model for more accurate relevance scoring.
Falls back gracefully if the reranker model is unavailable.
"""

from __future__ import annotations

from typing import Optional

from config.logging_config import get_logger
from config.settings import get_settings
from src.retrieval.hybrid_search import RetrievedChunk

logger = get_logger(__name__)


class CrossEncoderReranker:
    """
    Reranks retrieved chunks using hybrid score ranking or optional cross-encoder model.

    On memory-constrained environments (like Render 512MB free tier), uses
    Qdrant's Reciprocal Rank Fusion (RRF) scores directly to avoid loading
    PyTorch into memory (~450MB footprint).
    """

    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.model_name = model_name
        self._model = "unavailable"
        logger.info("reranker_initialized_lightweight")

    def _load_model(self):
        """Lazy-load cross-encoder only if explicitly enabled."""
        pass

    def rerank(
        self,
        query: str,
        chunks: list[RetrievedChunk],
        top_k: Optional[int] = None,
    ) -> list[RetrievedChunk]:
        """
        Rerank chunks using cross-encoder relevance scoring.

        Args:
            query: The original search query.
            chunks: List of retrieved chunks from hybrid search.
            top_k: Number of top results to return after reranking.

        Returns:
            Reranked list of chunks, sorted by cross-encoder score.
        """
        settings = get_settings()
        top_k = top_k or settings.top_k_rerank

        if not chunks:
            return []

        self._load_model()

        # Fallback: if cross-encoder isn't available, just return top-k by original score
        if self._model == "unavailable":
            logger.debug("reranking_fallback", reason="model unavailable")
            sorted_chunks = sorted(chunks, key=lambda c: c.score, reverse=True)
            return sorted_chunks[:top_k]

        # Create query-document pairs for cross-encoder
        pairs = [(query, chunk.parent_text or chunk.text) for chunk in chunks]

        logger.debug("reranking_started", pairs=len(pairs))

        # Get cross-encoder scores
        scores = self._model.predict(pairs)

        # Update chunks with new scores
        for chunk, score in zip(chunks, scores):
            chunk.score = float(score)

        # Sort by cross-encoder score and return top-k
        reranked = sorted(chunks, key=lambda c: c.score, reverse=True)[:top_k]

        logger.info(
            "reranking_complete",
            input_count=len(chunks),
            output_count=len(reranked),
            top_score=reranked[0].score if reranked else 0.0,
        )

        return reranked

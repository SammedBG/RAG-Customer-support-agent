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
    Reranks retrieved chunks using a cross-encoder model.

    Cross-encoders jointly encode the query and document, producing
    more accurate relevance scores than bi-encoders, at the cost of
    higher latency (hence used only on a small candidate set).
    """

    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.model_name = model_name
        self._model = None
        logger.info("reranker_initialized", model=model_name)

    def _load_model(self):
        """Lazy-load the cross-encoder model."""
        if self._model is None:
            try:
                from sentence_transformers import CrossEncoder

                self._model = CrossEncoder(self.model_name)
                logger.info("reranker_model_loaded", model=self.model_name)
            except ImportError:
                logger.warning(
                    "reranker_unavailable",
                    reason="sentence-transformers not installed, using score-based fallback",
                )
                self._model = "unavailable"
            except Exception as e:
                logger.warning(
                    "reranker_load_failed",
                    error=str(e),
                    reason="Falling back to score-based ranking",
                )
                self._model = "unavailable"

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

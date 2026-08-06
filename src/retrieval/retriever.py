"""
Unified retriever interface.

Chains: Hybrid Search → Reranker → Metadata enrichment.
Provides a single entry point for the agent's retrieval needs.
"""

from __future__ import annotations

from typing import Any, Optional

from config.logging_config import get_logger
from config.settings import get_settings
from src.retrieval.hybrid_search import HybridSearcher, RetrievedChunk
from src.retrieval.reranker import CrossEncoderReranker

logger = get_logger(__name__)


class Retriever:
    """
    Unified retrieval interface combining hybrid search and reranking.

    Usage:
        retriever = Retriever()
        results = retriever.retrieve("How do I return a product?")
    """

    def __init__(
        self,
        searcher: Optional[HybridSearcher] = None,
        reranker: Optional[CrossEncoderReranker] = None,
    ):
        self.searcher = searcher or HybridSearcher()
        self.reranker = reranker or CrossEncoderReranker()
        logger.info("retriever_initialized")

    def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,
        use_reranker: bool = True,
        metadata_filter: Optional[dict[str, Any]] = None,
    ) -> list[RetrievedChunk]:
        """
        Retrieve relevant document chunks for a query.

        Args:
            query: The user's question.
            top_k: Number of final results to return.
            use_reranker: Whether to apply cross-encoder reranking.
            metadata_filter: Optional filters for data access control.

        Returns:
            List of relevant RetrievedChunk objects with source info.
        """
        settings = get_settings()
        final_k = top_k or settings.top_k_rerank

        logger.info(
            "retrieval_started",
            query=query[:100],
            use_reranker=use_reranker,
        )

        # Step 1: Hybrid search (over-fetch for reranking)
        search_k = settings.top_k_retrieval if use_reranker else final_k
        candidates = self.searcher.search(
            query=query,
            top_k=search_k,
            metadata_filter=metadata_filter,
        )

        if not candidates:
            logger.warning("no_results_found", query=query[:100])
            return []

        # Step 2: Rerank (if enabled)
        if use_reranker and len(candidates) > 1:
            results = self.reranker.rerank(
                query=query,
                chunks=candidates,
                top_k=final_k,
            )
        else:
            results = candidates[:final_k]

        # Step 3: Deduplicate by source file (keep highest scoring per source)
        seen_texts: set[str] = set()
        deduplicated: list[RetrievedChunk] = []
        for chunk in results:
            # Use a text fingerprint to avoid near-duplicate chunks
            text_fingerprint = chunk.text[:200]
            if text_fingerprint not in seen_texts:
                seen_texts.add(text_fingerprint)
                deduplicated.append(chunk)

        logger.info(
            "retrieval_complete",
            candidates=len(candidates),
            reranked=len(results),
            final=len(deduplicated),
        )

        return deduplicated

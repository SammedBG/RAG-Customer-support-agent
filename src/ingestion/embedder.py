"""
Embedding generator for both dense (OpenAI) and sparse (FastEmbed BM25) vectors.

Produces dual embeddings for hybrid search:
- Dense vectors capture semantic meaning
- Sparse vectors capture exact keyword matches
"""

from __future__ import annotations

from typing import Optional

import numpy as np
from fastembed import SparseTextEmbedding, TextEmbedding
from openai import OpenAI

from config.logging_config import get_logger
from config.settings import get_settings

logger = get_logger(__name__)


class DenseEmbedder:
    """Generate dense embeddings using OpenAI's embedding API."""

    def __init__(self, model: Optional[str] = None, api_key: Optional[str] = None):
        settings = get_settings()
        self.model = model or settings.openai_embedding_model
        self.client = OpenAI(api_key=api_key or settings.openai_api_key)
        logger.info("dense_embedder_initialized", model=self.model)

    def embed_texts(self, texts: list[str], batch_size: int = 100) -> list[list[float]]:
        """
        Generate dense embeddings for a list of texts.

        Args:
            texts: List of text strings to embed.
            batch_size: Number of texts to process per API call.

        Returns:
            List of embedding vectors (each a list of floats).
        """
        all_embeddings: list[list[float]] = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            logger.debug("embedding_batch", batch_start=i, batch_size=len(batch))

            response = self.client.embeddings.create(
                input=batch,
                model=self.model,
            )

            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)

        logger.info("dense_embeddings_generated", count=len(all_embeddings))
        return all_embeddings

    def embed_query(self, query: str) -> list[float]:
        """Generate a dense embedding for a single query."""
        response = self.client.embeddings.create(
            input=[query],
            model=self.model,
        )
        return response.data[0].embedding


class SparseEmbedder:
    """Generate sparse embeddings using FastEmbed for BM25-style keyword matching."""

    def __init__(self, model_name: str = "Qdrant/bm25"):
        self.model = SparseTextEmbedding(model_name=model_name)
        logger.info("sparse_embedder_initialized", model=model_name)

    def embed_texts(self, texts: list[str]) -> list[dict]:
        """
        Generate sparse embeddings for a list of texts.

        Returns:
            List of sparse vectors as dicts with 'indices' and 'values'.
        """
        sparse_embeddings = list(self.model.embed(texts))

        results = []
        for embedding in sparse_embeddings:
            results.append(
                {
                    "indices": embedding.indices.tolist(),
                    "values": embedding.values.tolist(),
                }
            )

        logger.info("sparse_embeddings_generated", count=len(results))
        return results

    def embed_query(self, query: str) -> dict:
        """Generate a sparse embedding for a single query."""
        embeddings = list(self.model.embed([query]))
        embedding = embeddings[0]
        return {
            "indices": embedding.indices.tolist(),
            "values": embedding.values.tolist(),
        }

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

_dense_embedder_instance: Optional[DenseEmbedder] = None
_sparse_embedder_instance: Optional[SparseEmbedder] = None


def get_dense_embedder() -> DenseEmbedder:
    """Get or create singleton DenseEmbedder to avoid loading multiple ONNX models into memory."""
    global _dense_embedder_instance
    if _dense_embedder_instance is None:
        _dense_embedder_instance = DenseEmbedder()
    return _dense_embedder_instance


def get_sparse_embedder() -> SparseEmbedder:
    """Get or create singleton SparseEmbedder to avoid loading multiple BM25 models into memory."""
    global _sparse_embedder_instance
    if _sparse_embedder_instance is None:
        _sparse_embedder_instance = SparseEmbedder()
    return _sparse_embedder_instance


class DenseEmbedder:
    """Generate dense embeddings using OpenAI API or local FastEmbed model fallback."""

    def __init__(self, model: Optional[str] = None, api_key: Optional[str] = None):
        settings = get_settings()
        self.api_key = api_key or settings.openai_api_key
        self.model = model or settings.openai_embedding_model

        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
            self.local_model = None
            logger.info("dense_embedder_initialized_openai", model=self.model)
        else:
            self.client = None
            self.local_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5", threads=1)
            logger.info("dense_embedder_initialized_fastembed_fallback", model="BAAI/bge-small-en-v1.5")

    def embed_texts(self, texts: list[str], batch_size: int = 100) -> list[list[float]]:
        import gc
        if self.local_model:
            embeddings_generator = self.local_model.embed(texts)
            res = [emb.tolist() for emb in embeddings_generator]
            gc.collect()
            return res

        all_embeddings: list[list[float]] = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            response = self.client.embeddings.create(
                input=batch,
                model=self.model,
            )
            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)

        gc.collect()
        return all_embeddings

    def embed_query(self, query: str) -> list[float]:
        import gc
        if self.local_model:
            embeddings_generator = self.local_model.embed([query])
            res = next(embeddings_generator).tolist()
            gc.collect()
            return res

        response = self.client.embeddings.create(
            input=[query],
            model=self.model,
        )
        return response.data[0].embedding


class SparseEmbedder:
    """Generate sparse embeddings using FastEmbed for BM25-style keyword matching."""

    def __init__(self, model_name: str = "Qdrant/bm25"):
        self.model = SparseTextEmbedding(model_name=model_name, threads=1)
        logger.info("sparse_embedder_initialized", model=model_name)

    def embed_texts(self, texts: list[str]) -> list[dict]:
        """
        Generate sparse embeddings for a list of texts.

        Returns:
            List of sparse vectors as dicts with 'indices' and 'values'.
        """
        import gc
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
        gc.collect()
        return results

    def embed_query(self, query: str) -> dict:
        """Generate a sparse embedding for a single query."""
        import gc
        embeddings = list(self.model.embed([query]))
        embedding = embeddings[0]
        res = {
            "indices": embedding.indices.tolist(),
            "values": embedding.values.tolist(),
        }
        gc.collect()
        return res

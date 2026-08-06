"""
Hierarchical document chunker.

Implements a parent/child chunking strategy:
- Parent chunks (larger) preserve context for the LLM generation step
- Child chunks (smaller) are used for precise retrieval via embeddings

This approach embeds small chunks for accuracy but passes larger
parent context to the LLM for better answer generation.
"""

from __future__ import annotations

import uuid
from typing import Optional

from llama_index.core.schema import Document, TextNode

from config.logging_config import get_logger
from config.settings import get_settings

logger = get_logger(__name__)


def chunk_documents(
    documents: list[Document],
    parent_chunk_size: Optional[int] = None,
    child_chunk_size: Optional[int] = None,
    chunk_overlap: Optional[int] = None,
) -> tuple[list[TextNode], list[TextNode]]:
    """
    Split documents into hierarchical parent and child chunks.

    Args:
        documents: List of LlamaIndex Document objects.
        parent_chunk_size: Size of parent chunks in characters.
        child_chunk_size: Size of child chunks in characters.
        chunk_overlap: Overlap between consecutive chunks in characters.

    Returns:
        Tuple of (parent_nodes, child_nodes).
        Child nodes contain a 'parent_id' in metadata linking to their parent.
    """
    settings = get_settings()
    parent_size = parent_chunk_size or settings.chunk_size
    child_size = child_chunk_size or settings.child_chunk_size
    overlap = chunk_overlap or settings.chunk_overlap

    logger.info(
        "chunking_documents",
        doc_count=len(documents),
        parent_size=parent_size,
        child_size=child_size,
        overlap=overlap,
    )

    all_parent_nodes: list[TextNode] = []
    all_child_nodes: list[TextNode] = []

    for doc in documents:
        text = doc.text
        doc_metadata = doc.metadata.copy()

        # ── Create parent chunks ─────────────────────────────
        parent_chunks = _split_text(text, parent_size, overlap)

        for p_idx, parent_text in enumerate(parent_chunks):
            parent_id = f"{doc.doc_id}_parent_{p_idx}"

            parent_node = TextNode(
                text=parent_text,
                id_=parent_id,
                metadata={
                    **doc_metadata,
                    "node_type": "parent",
                    "chunk_index": p_idx,
                    "total_parent_chunks": len(parent_chunks),
                },
            )
            # Exclude certain metadata from embedding to save tokens
            parent_node.excluded_embed_metadata_keys = [
                "ingested_at",
                "node_type",
                "chunk_index",
                "total_parent_chunks",
                "parent_id",
            ]
            parent_node.excluded_llm_metadata_keys = [
                "doc_hash",
                "node_type",
                "chunk_index",
                "total_parent_chunks",
                "parent_id",
            ]
            all_parent_nodes.append(parent_node)

            # ── Create child chunks from this parent ─────────
            child_chunks = _split_text(parent_text, child_size, overlap)

            for c_idx, child_text in enumerate(child_chunks):
                child_id = f"{parent_id}_child_{c_idx}"

                child_node = TextNode(
                    text=child_text,
                    id_=child_id,
                    metadata={
                        **doc_metadata,
                        "node_type": "child",
                        "parent_id": parent_id,
                        "chunk_index": c_idx,
                        "parent_chunk_index": p_idx,
                    },
                )
                child_node.excluded_embed_metadata_keys = [
                    "ingested_at",
                    "node_type",
                    "chunk_index",
                    "parent_chunk_index",
                    "parent_id",
                ]
                child_node.excluded_llm_metadata_keys = [
                    "doc_hash",
                    "node_type",
                    "chunk_index",
                    "parent_chunk_index",
                    "parent_id",
                ]
                all_child_nodes.append(child_node)

    logger.info(
        "chunking_complete",
        parent_chunks=len(all_parent_nodes),
        child_chunks=len(all_child_nodes),
    )

    return all_parent_nodes, all_child_nodes


def _split_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    """
    Split text into chunks with overlap, respecting sentence boundaries.

    Tries to split at sentence boundaries (periods, newlines) to keep
    chunks semantically coherent.
    """
    if len(text) <= chunk_size:
        return [text]

    chunks: list[str] = []
    start = 0

    while start < len(text):
        end = start + chunk_size

        if end >= len(text):
            chunks.append(text[start:].strip())
            break

        # Try to find a good split point (sentence boundary)
        split_point = end
        for boundary in ["\n\n", "\n", ". ", "! ", "? ", "; ", ", "]:
            # Look backwards from the end for a boundary
            last_boundary = text.rfind(boundary, start + chunk_size // 2, end)
            if last_boundary != -1:
                split_point = last_boundary + len(boundary)
                break

        chunk = text[start:split_point].strip()
        if chunk:
            chunks.append(chunk)

        # Move start forward, accounting for overlap
        start = max(start + 1, split_point - overlap)

    return chunks

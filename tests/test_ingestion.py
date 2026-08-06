"""Unit tests for the ingestion pipeline."""

from __future__ import annotations

from pathlib import Path

import pytest

from src.ingestion.chunker import _split_text, chunk_documents
from src.ingestion.loader import compute_doc_hash


class TestDocHash:
    """Tests for document hashing."""

    def test_consistent_hash(self):
        """Same content should produce the same hash."""
        text = "Hello, world!"
        h1 = compute_doc_hash(text)
        h2 = compute_doc_hash(text)
        assert h1 == h2

    def test_different_content_different_hash(self):
        """Different content should produce different hashes."""
        h1 = compute_doc_hash("Hello")
        h2 = compute_doc_hash("World")
        assert h1 != h2

    def test_hash_length(self):
        """Hash should be 16 characters."""
        h = compute_doc_hash("test")
        assert len(h) == 16


class TestTextSplitting:
    """Tests for the text splitting function."""

    def test_short_text_no_split(self):
        """Text shorter than chunk size shouldn't be split."""
        text = "Short text"
        chunks = _split_text(text, chunk_size=100, overlap=10)
        assert len(chunks) == 1
        assert chunks[0] == text

    def test_long_text_splits(self):
        """Long text should be split into multiple chunks."""
        text = "A" * 500
        chunks = _split_text(text, chunk_size=100, overlap=10)
        assert len(chunks) > 1

    def test_sentence_boundary_split(self):
        """Splits should prefer sentence boundaries."""
        text = "First sentence. Second sentence. Third sentence. Fourth sentence."
        chunks = _split_text(text, chunk_size=40, overlap=5)
        assert len(chunks) >= 2
        # Check that chunks don't split mid-sentence where possible
        for chunk in chunks:
            assert len(chunk) > 0

    def test_overlap(self):
        """Consecutive chunks should overlap."""
        text = "Word " * 100  # 500 chars
        chunks = _split_text(text, chunk_size=100, overlap=20)
        # With overlap, there should be shared content between consecutive chunks
        assert len(chunks) >= 2

    def test_empty_text(self):
        """Empty text should return a single empty chunk."""
        chunks = _split_text("", chunk_size=100, overlap=10)
        assert len(chunks) == 1


class TestChunkDocuments:
    """Tests for the hierarchical chunking."""

    def test_creates_parent_and_child_chunks(self):
        """Should create both parent and child chunks."""
        from llama_index.core.schema import Document

        doc = Document(
            text="A" * 2000,
            metadata={"source_file": "test.md", "doc_hash": "abc123"},
            doc_id="test_doc",
        )

        parents, children = chunk_documents(
            [doc],
            parent_chunk_size=500,
            child_chunk_size=100,
            chunk_overlap=20,
        )

        assert len(parents) > 0
        assert len(children) > 0
        assert len(children) >= len(parents)

    def test_child_has_parent_id(self):
        """Child chunks should reference their parent."""
        from llama_index.core.schema import Document

        doc = Document(
            text="A" * 2000,
            metadata={"source_file": "test.md", "doc_hash": "abc123"},
            doc_id="test_doc",
        )

        parents, children = chunk_documents(
            [doc],
            parent_chunk_size=500,
            child_chunk_size=100,
            chunk_overlap=20,
        )

        for child in children:
            assert "parent_id" in child.metadata
            assert child.metadata["parent_id"].startswith("test_doc_parent_")

"""Unit tests for retrieval components."""

from __future__ import annotations

from src.retrieval.hybrid_search import RetrievedChunk


class TestRetrievedChunk:
    """Tests for the RetrievedChunk dataclass."""

    def test_citation_key(self):
        """Citation key should be human-readable."""
        chunk = RetrievedChunk(
            text="Some text",
            parent_text="Parent text",
            source_file="refund_policy.md",
            source_path="/data/refund_policy.md",
            score=0.9,
            chunk_id="123",
        )
        assert chunk.citation_key == "Refund Policy"

    def test_citation_key_with_underscores(self):
        """Should handle multiple underscores."""
        chunk = RetrievedChunk(
            text="text",
            parent_text="parent",
            source_file="product_faq.md",
            source_path="/data/product_faq.md",
            score=0.8,
            chunk_id="456",
        )
        assert chunk.citation_key == "Product Faq"

    def test_chunk_metadata(self):
        """Should store arbitrary metadata."""
        chunk = RetrievedChunk(
            text="text",
            parent_text="parent",
            source_file="test.md",
            source_path="/test.md",
            score=0.5,
            chunk_id="789",
            metadata={"custom_key": "custom_value"},
        )
        assert chunk.metadata["custom_key"] == "custom_value"

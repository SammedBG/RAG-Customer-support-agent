"""
Document loader with rich metadata extraction.

Loads documents from a directory using LlamaIndex's SimpleDirectoryReader,
then enriches each document with metadata for source tracking and citation.
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from llama_index.core import SimpleDirectoryReader
from llama_index.core.schema import Document

from config.logging_config import get_logger

logger = get_logger(__name__)


def compute_doc_hash(content: str) -> str:
    """Compute a SHA-256 hash of document content for deduplication."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()[:16]


def load_documents(
    data_dir: str | Path,
    required_exts: Optional[list[str]] = None,
) -> list[Document]:
    """
    Load documents from a directory or a single file with rich metadata.

    Args:
        data_dir: Path to the directory or file containing documents.
        required_exts: Optional list of file extensions to include (e.g., [".md", ".txt", ".pdf"]).

    Returns:
        List of LlamaIndex Document objects with enriched metadata.
    """
    data_path = Path(data_dir)
    if not data_path.exists():
        msg = f"Data path does not exist: {data_path}"
        raise FileNotFoundError(msg)

    if required_exts is None:
        required_exts = [".md", ".txt", ".pdf", ".docx"]

    logger.info(
        "loading_documents",
        data_path=str(data_path),
        is_file=data_path.is_file(),
    )

    if data_path.is_file():
        reader = SimpleDirectoryReader(
            input_files=[str(data_path)],
            filename_as_id=True,
        )
    else:
        reader = SimpleDirectoryReader(
            input_dir=str(data_path),
            required_exts=required_exts,
            recursive=True,
            filename_as_id=True,
        )

    raw_docs = reader.load_data()
    logger.info("raw_documents_loaded", count=len(raw_docs))

    # Enrich metadata
    enriched_docs: list[Document] = []
    for doc in raw_docs:
        file_path = Path(doc.metadata.get("file_path", "unknown"))
        file_name = file_path.name
        file_ext = file_path.suffix.lower()

        # Compute content hash for deduplication
        content_hash = compute_doc_hash(doc.text)

        # Get last modified time
        try:
            last_modified = datetime.fromtimestamp(
                file_path.stat().st_mtime, tz=timezone.utc
            ).isoformat()
        except (OSError, ValueError):
            last_modified = datetime.now(tz=timezone.utc).isoformat()

        # Enrich metadata
        doc.metadata.update(
            {
                "source_file": file_name,
                "source_path": str(file_path),
                "file_type": file_ext,
                "doc_hash": content_hash,
                "last_modified": last_modified,
                "ingested_at": datetime.now(tz=timezone.utc).isoformat(),
                "char_count": len(doc.text),
            }
        )

        # Set document ID to content hash for idempotent upserts
        doc.doc_id = f"{file_name}_{content_hash}"

        enriched_docs.append(doc)

        logger.debug(
            "document_enriched",
            file=file_name,
            hash=content_hash,
            chars=len(doc.text),
        )

    logger.info("documents_enriched", total=len(enriched_docs))
    return enriched_docs

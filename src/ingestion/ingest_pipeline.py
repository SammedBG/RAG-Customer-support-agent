"""
End-to-end ingestion pipeline.

Orchestrates: Load → Deduplicate → Chunk → Embed → Upsert to Qdrant.
Idempotent — skips documents that have already been ingested (by hash).
"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Optional

from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    Distance,
    NamedSparseVector,
    NamedVector,
    PointStruct,
    SparseIndexParams,
    SparseVector,
    SparseVectorParams,
    VectorParams,
)

from config.logging_config import get_logger
from config.settings import get_settings
from src.ingestion.chunker import chunk_documents
from src.ingestion.embedder import DenseEmbedder, SparseEmbedder
from src.ingestion.loader import load_documents

logger = get_logger(__name__)

# Path for the local metadata store
METADATA_DB_PATH = Path("data/metadata.db")


class IngestionPipeline:
    """
    Full ingestion pipeline from raw documents to Qdrant vectors.

    Features:
    - Idempotent: tracks ingested doc hashes in SQLite
    - Dual embeddings: dense (OpenAI) + sparse (BM25)
    - Hierarchical chunking: parent/child strategy
    """

    def __init__(
        self,
        qdrant_client: Optional[QdrantClient] = None,
        dense_embedder: Optional[DenseEmbedder] = None,
        sparse_embedder: Optional[SparseEmbedder] = None,
    ):
        settings = get_settings()

        # Initialize Qdrant client
        self.qdrant = qdrant_client or QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key or None,
        )
        self.collection_name = settings.qdrant_collection_name

        # Initialize embedders
        self.dense_embedder = dense_embedder or DenseEmbedder()
        self.sparse_embedder = sparse_embedder or SparseEmbedder()

        # Initialize metadata store
        self._init_metadata_db()

        logger.info("ingestion_pipeline_initialized", collection=self.collection_name)

    def _init_metadata_db(self) -> None:
        """Initialize SQLite metadata database for tracking ingested documents."""
        METADATA_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(METADATA_DB_PATH))
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS ingested_docs (
                doc_hash TEXT PRIMARY KEY,
                source_file TEXT NOT NULL,
                source_path TEXT NOT NULL,
                ingested_at TEXT NOT NULL,
                chunk_count INTEGER NOT NULL,
                metadata_json TEXT
            )
        """
        )
        conn.commit()
        conn.close()

    def _is_already_ingested(self, doc_hash: str) -> bool:
        """Check if a document has already been ingested."""
        conn = sqlite3.connect(str(METADATA_DB_PATH))
        cursor = conn.execute(
            "SELECT 1 FROM ingested_docs WHERE doc_hash = ?", (doc_hash,)
        )
        exists = cursor.fetchone() is not None
        conn.close()
        return exists

    def _record_ingestion(
        self,
        doc_hash: str,
        source_file: str,
        source_path: str,
        ingested_at: str,
        chunk_count: int,
        metadata: dict,
    ) -> None:
        """Record a successful ingestion in the metadata store."""
        conn = sqlite3.connect(str(METADATA_DB_PATH))
        conn.execute(
            """
            INSERT OR REPLACE INTO ingested_docs
            (doc_hash, source_file, source_path, ingested_at, chunk_count, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?)
        """,
            (
                doc_hash,
                source_file,
                source_path,
                ingested_at,
                chunk_count,
                json.dumps(metadata),
            ),
        )
        conn.commit()
        conn.close()

    def ensure_collection(self) -> None:
        """Create the Qdrant collection if it doesn't exist."""
        collections = [c.name for c in self.qdrant.get_collections().collections]

        if self.collection_name in collections:
            logger.info("collection_exists", name=self.collection_name)
            return

        # Get embedding dimension by embedding a test string
        test_embedding = self.dense_embedder.embed_query("test")
        vector_size = len(test_embedding)

        self.qdrant.create_collection(
            collection_name=self.collection_name,
            vectors_config={
                "dense": VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE,
                ),
            },
            sparse_vectors_config={
                "sparse": SparseVectorParams(
                    index=SparseIndexParams(on_disk=False),
                ),
            },
        )

        logger.info(
            "collection_created",
            name=self.collection_name,
            dense_dim=vector_size,
        )

    def run(
        self,
        data_dir: str | Path,
        force_reingest: bool = False,
    ) -> dict:
        """
        Run the full ingestion pipeline.

        Args:
            data_dir: Path to directory containing documents.
            force_reingest: If True, re-ingest all documents regardless of hash.

        Returns:
            Summary dict with counts of processed/skipped documents and chunks.
        """
        logger.info("ingestion_started", data_dir=str(data_dir))

        # Step 1: Ensure collection exists
        self.ensure_collection()

        # Step 2: Load documents
        documents = load_documents(data_dir)

        # Step 3: Deduplicate
        new_docs = []
        skipped = 0
        for doc in documents:
            doc_hash = doc.metadata.get("doc_hash", "")
            if not force_reingest and self._is_already_ingested(doc_hash):
                logger.debug("document_skipped", file=doc.metadata.get("source_file"), hash=doc_hash)
                skipped += 1
            else:
                new_docs.append(doc)

        if not new_docs:
            logger.info("no_new_documents", skipped=skipped)
            return {"processed": 0, "skipped": skipped, "chunks_created": 0}

        logger.info("new_documents_found", count=len(new_docs), skipped=skipped)

        # Step 4: Chunk documents
        parent_nodes, child_nodes = chunk_documents(new_docs)

        # Step 5: Generate embeddings for child nodes (used for retrieval)
        child_texts = [node.text for node in child_nodes]
        dense_embeddings = self.dense_embedder.embed_texts(child_texts)
        sparse_embeddings = self.sparse_embedder.embed_texts(child_texts)

        # Step 6: Upsert to Qdrant
        points: list[PointStruct] = []
        parent_map: dict[str, str] = {}  # parent_id -> parent_text

        # Build parent text lookup
        for parent_node in parent_nodes:
            parent_map[parent_node.id_] = parent_node.text

        for i, child_node in enumerate(child_nodes):
            parent_id = child_node.metadata.get("parent_id", "")
            parent_text = parent_map.get(parent_id, child_node.text)

            payload = {
                **child_node.metadata,
                "text": child_node.text,
                "parent_text": parent_text,
            }

            sparse_data = sparse_embeddings[i]

            point = PointStruct(
                id=abs(hash(child_node.id_)) % (2**63),  # Convert to positive int ID
                vector={
                    "dense": dense_embeddings[i],
                    "sparse": SparseVector(
                        indices=sparse_data["indices"],
                        values=sparse_data["values"],
                    ),
                },
                payload=payload,
            )
            points.append(point)

        # Batch upsert
        batch_size = 100
        for i in range(0, len(points), batch_size):
            batch = points[i : i + batch_size]
            self.qdrant.upsert(
                collection_name=self.collection_name,
                points=batch,
            )
            logger.debug("batch_upserted", start=i, count=len(batch))

        # Step 7: Record ingestions
        for doc in new_docs:
            self._record_ingestion(
                doc_hash=doc.metadata.get("doc_hash", ""),
                source_file=doc.metadata.get("source_file", ""),
                source_path=doc.metadata.get("source_path", ""),
                ingested_at=doc.metadata.get("ingested_at", ""),
                chunk_count=len(
                    [c for c in child_nodes if c.metadata.get("source_file") == doc.metadata.get("source_file")]
                ),
                metadata=doc.metadata,
            )

        summary = {
            "processed": len(new_docs),
            "skipped": skipped,
            "parent_chunks": len(parent_nodes),
            "child_chunks": len(child_nodes),
            "points_upserted": len(points),
        }

        logger.info("ingestion_complete", **summary)
        return summary

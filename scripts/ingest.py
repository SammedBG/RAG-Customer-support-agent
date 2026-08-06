"""
CLI script to run the document ingestion pipeline.

Usage:
    python scripts/ingest.py [--data-dir DATA_DIR] [--force]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.logging_config import setup_logging
from config.settings import get_settings


def main():
    parser = argparse.ArgumentParser(description="Ingest documents into the RAG pipeline")
    parser.add_argument(
        "--data-dir",
        type=str,
        default="data/sample_docs",
        help="Path to directory containing documents (default: data/sample_docs)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-ingestion of all documents",
    )
    args = parser.parse_args()

    # Setup
    settings = get_settings()
    setup_logging(log_level=settings.log_level, json_format=False)

    print("=" * 60)
    print("RAG Customer Support Agent — Document Ingestion")
    print("=" * 60)
    print(f"Data directory: {args.data_dir}")
    print(f"Force reingest: {args.force}")
    print(f"Qdrant URL: {settings.qdrant_url}")
    print(f"Collection: {settings.qdrant_collection_name}")
    print()

    # Run ingestion
    from src.ingestion.ingest_pipeline import IngestionPipeline

    try:
        pipeline = IngestionPipeline()
        result = pipeline.run(
            data_dir=args.data_dir,
            force_reingest=args.force,
        )

        print()
        print("=" * 60)
        print("Ingestion Complete!")
        print("=" * 60)
        print(f"  Documents processed: {result.get('processed', 0)}")
        print(f"  Documents skipped:   {result.get('skipped', 0)}")
        print(f"  Parent chunks:       {result.get('parent_chunks', 0)}")
        print(f"  Child chunks:        {result.get('child_chunks', 0)}")
        print(f"  Points upserted:     {result.get('points_upserted', 0)}")

    except FileNotFoundError as e:
        print(f"\n[ERROR] File not found: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Ingestion failed: {e}")
        raise


if __name__ == "__main__":
    main()

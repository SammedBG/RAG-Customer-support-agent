#!/bin/bash
# ──────────────────────────────────────────────────────────────
# Startup script for production deployment
# 1. Ingests sample documents into Qdrant (idempotent)
# 2. Starts the uvicorn server
# ──────────────────────────────────────────────────────────────

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  RAG Customer Support Agent — Production Startup        ║"
echo "╚══════════════════════════════════════════════════════════╝"

# ── Step 1: Ingest sample documents ───────────────────────────
echo ""
echo "📄 Running document ingestion pipeline..."
python scripts/ingest.py --data-dir data/sample_docs || {
    echo "⚠️  Ingestion failed (non-fatal), continuing with server startup..."
}

# ── Step 2: Start uvicorn ─────────────────────────────────────
echo ""
echo "🚀 Starting uvicorn on port ${PORT:-8000}..."
exec uvicorn src.api.main:app \
    --host 0.0.0.0 \
    --port "${PORT:-8000}" \
    --workers 1 \
    --log-level info

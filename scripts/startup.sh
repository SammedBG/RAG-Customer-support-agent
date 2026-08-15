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

# Export thread limits to keep ONNX runtime RAM usage < 200MB
export OMP_NUM_THREADS=1
export OPENBLAS_NUM_THREADS=1
export MKL_NUM_THREADS=1
export VECLIB_MAXIMUM_THREADS=1
export NUMEXPR_NUM_THREADS=1

# ── Step 1: Optional boot document ingestion ──────────────────
# Default is false to prevent memory spikes (>512MB) on Render free tier.
# Ingestion should be run locally or via POST /api/v1/documents once Qdrant Cloud is connected.
if [ "${RUN_INGEST_ON_BOOT}" = "true" ]; then
    echo ""
    echo "📄 Running document ingestion pipeline..."
    python scripts/ingest.py --data-dir data/sample_docs || {
        echo "⚠️ Ingestion failed (non-fatal), continuing with server startup..."
    }
else
    echo "ℹ️ Skipping boot ingestion (RUN_INGEST_ON_BOOT != true). Server launching directly."
fi

# ── Step 2: Start uvicorn ─────────────────────────────────────
echo ""
echo "🚀 Starting uvicorn on port ${PORT:-8000}..."
exec uvicorn src.api.main:app \
    --host 0.0.0.0 \
    --port "${PORT:-8000}" \
    --workers 1 \
    --log-level info

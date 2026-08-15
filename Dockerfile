# ── Stage 1: Build dependencies ───────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies needed for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency definition
COPY pyproject.toml ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# ── Stage 2: Production image ────────────────────────────────
FROM python:3.11-slim AS production

WORKDIR /app

# Install runtime system dependencies (curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application source code
COPY config/ ./config/
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY data/sample_docs/ ./data/sample_docs/

# Create directories for runtime data
RUN mkdir -p data/qdrant_storage logs

# Copy startup script and make it executable
COPY scripts/startup.sh ./scripts/startup.sh
RUN chmod +x ./scripts/startup.sh

# Default port (Render overrides via $PORT)
ENV PORT=8000
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/v1/health || exit 1

# Use the startup script as entrypoint
CMD ["./scripts/startup.sh"]

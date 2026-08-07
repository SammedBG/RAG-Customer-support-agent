<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/LangGraph-Agentic-FF6F00?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Qdrant-Hybrid_Search-DC382D?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

# Neura — RAG Customer Support Agent

A production-grade Retrieval-Augmented Generation (RAG) agent built to answer customer support questions using company documents — with **verifiable source citations**, **hallucination guardrails**, and a **security-hardened API layer**. Not a demo; engineered for production deployment.

---

## Table of Contents

- [Why This Project](#why-this-project)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Evaluation & Benchmarks](#evaluation--benchmarks)
- [Security](#security)
- [Frontend](#frontend)
- [Testing](#testing)
- [Docker Deployment](#docker-deployment)
- [License](#license)

---

## Why This Project

Most RAG tutorials stop at "put documents into a vector DB and call an LLM." This project addresses the engineering gaps that matter in production:

- **Retrieval quality** — Hybrid search (dense + sparse) with Reciprocal Rank Fusion outperforms pure semantic search on real-world queries.
- **Answer reliability** — A multi-node LangGraph state machine routes, grades, generates, and verifies every answer before returning it.
- **Traceability** — Every response includes structured citations pointing to the exact document chunks used.
- **Fail-closed design** — When the system can't produce a grounded answer, it says so rather than hallucinating.
- **Security** — Input sanitization, prompt injection detection, rate limiting, and audit logging are built-in, not bolted on.

---

## Key Features

| Category | Feature |
|----------|---------|
| **Retrieval** | Hybrid search — Dense (semantic) + Sparse (BM25) vectors fused with RRF |
| **Retrieval** | Cross-encoder reranking (`ms-marco-MiniLM-L-6-v2`) on top-N candidates |
| **Retrieval** | Parent/child chunking — small chunks for retrieval, large chunks for generation context |
| **Orchestration** | LangGraph state machine with 6 nodes: route → retrieve → grade → generate → hallucination check → fallback |
| **Ingestion** | LlamaIndex-powered document loading with hierarchical chunking pipeline |
| **Embeddings** | OpenAI `text-embedding-3-small` or local `BAAI/bge-small-en-v1.5` (automatic fallback) |
| **LLM** | Groq (`llama-3.3-70b-versatile`), OpenAI (`gpt-4o-mini`), or mock fallback |
| **Citations** | Structured source references with chunk text and relevance scores |
| **Security** | API key auth, JWT tokens, rate limiting, prompt injection detection, input sanitization, audit trail |
| **Evaluation** | RAGAS + DeepEval metrics against a 20-pair golden QA dataset |
| **Frontend** | React + TypeScript + Tailwind CSS portfolio dashboard with live chat, architecture diagrams, and evaluation views |
| **Infrastructure** | Docker Compose deployment with Qdrant, FastAPI, and Nginx |

---

## System Architecture

```
                         ┌─────────────────────────────────────────────┐
                         │              QUERY PIPELINE                 │
                         │                                             │
User Query ──▶ Auth ──▶ Rate Limit ──▶ Sanitize ──▶ Route Query       │
                                                        │              │
                                         ┌──────────────┼──────────┐   │
                                         │ "retrieve"   │ "direct" │   │
                                         ▼              ▼          │   │
                                   Hybrid Search    Direct LLM     │   │
                                   (Qdrant RRF)     Response ──▶ END  │
                                         │                         │   │
                                         ▼                         │   │
                                  Grade Relevance                  │   │
                                    │       │                      │   │
                              relevant    no docs ──▶ Fallback ──▶ END│
                                    │         ▲ (retry ≤2)         │   │
                                    ▼         │                    │   │
                                 Generate ────┘                    │   │
                                    │                              │   │
                                    ▼                              │   │
                            Hallucination Check                    │   │
                              │           │                        │   │
                          grounded    not grounded                 │   │
                              │           │                        │   │
                              ▼           ▼                        │   │
                        Response +    Fallback ──▶ END             │   │
                        Citations ──▶ END                          │   │
                         └─────────────────────────────────────────────┘

                         ┌─────────────────────────────────────────────┐
                         │           INGESTION PIPELINE                │
                         │                                             │
  Documents ──▶ LlamaIndex Loader ──▶ Hierarchical Chunker            │
       (.md, .txt, .pdf)       (parent: 1024 chars, child: 256 chars)  │
                                              │                        │
                                    ┌─────────┴─────────┐              │
                                    ▼                   ▼              │
                             Dense Embeddings    Sparse Embeddings     │
                          (OpenAI / FastEmbed)    (BM25 via FastEmbed) │
                                    │                   │              │
                                    └─────────┬─────────┘              │
                                              ▼                        │
                                     Qdrant Vector DB                  │
                                   (named vectors:                     │
                                    "dense" + "sparse")                │
                         └─────────────────────────────────────────────┘
```

### LangGraph Node Descriptions

| Node | Purpose |
|------|---------|
| `route_query` | LLM classifier — routes to hybrid retrieval or direct response for greetings/chitchat |
| `retrieve` | Executes hybrid search on Qdrant (dense + sparse prefetch → RRF fusion), then cross-encoder reranking |
| `grade_documents` | LLM-based relevance grading — filters out irrelevant chunks before generation |
| `generate` | Produces a cited answer using filtered parent-chunk context, with inline `[1]`, `[2]` references |
| `check_hallucination` | LLM verification that the generated answer is grounded in the retrieved context |
| `fallback` | Safe "I don't know" response with support contact information — fail-closed behavior |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Orchestration** | [LangGraph](https://github.com/langchain-ai/langgraph) | Stateful agent graph with conditional routing and retry loops |
| **Ingestion** | [LlamaIndex](https://github.com/run-llama/llama_index) | Document loading, parsing, and metadata extraction |
| **Vector DB** | [Qdrant](https://qdrant.tech/) | Hybrid search with named dense + sparse vectors, RRF fusion |
| **Dense Embeddings** | OpenAI `text-embedding-3-small` / `BAAI/bge-small-en-v1.5` | Semantic vector representation |
| **Sparse Embeddings** | [FastEmbed](https://github.com/qdrant/fastembed) `Qdrant/bm25` | BM25 keyword matching |
| **Reranking** | `cross-encoder/ms-marco-MiniLM-L-6-v2` | Cross-encoder relevance refinement |
| **LLM** | Groq (Llama 3.3 70B) / OpenAI (GPT-4o-mini) | Generation, routing, grading, hallucination checking |
| **API** | [FastAPI](https://fastapi.tiangolo.com/) | Async REST API with Pydantic validation |
| **Security** | `python-jose`, `slowapi`, `passlib` | JWT, rate limiting, prompt injection defense |
| **Evaluation** | [RAGAS](https://docs.ragas.io/) + [DeepEval](https://docs.confident-ai.com/) | Faithfulness, relevancy, precision, recall metrics |
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS 3 | Portfolio dashboard with live agent chat |
| **Observability** | `structlog` | Structured JSON logging with correlation IDs |

---

## Project Structure

```
.
├── config/
│   ├── settings.py              # Pydantic settings (env vars, defaults, validation)
│   └── logging_config.py        # structlog JSON logger configuration
│
├── src/
│   ├── ingestion/
│   │   ├── loader.py            # LlamaIndex document loader (MD, TXT, PDF)
│   │   ├── chunker.py           # Hierarchical parent/child chunking
│   │   ├── embedder.py          # Dense (OpenAI/FastEmbed) + Sparse (BM25) embedders
│   │   └── ingest_pipeline.py   # End-to-end ingestion orchestrator → Qdrant upsert
│   │
│   ├── retrieval/
│   │   ├── hybrid_search.py     # Qdrant hybrid search with RRF fusion
│   │   ├── reranker.py          # Cross-encoder reranking (ms-marco-MiniLM)
│   │   └── retriever.py         # Unified retriever: search → rerank → return
│   │
│   ├── agent/
│   │   ├── state.py             # AgentState TypedDict (LangGraph state schema)
│   │   ├── prompts.py           # System, router, grader, hallucination prompts
│   │   ├── nodes.py             # 6 LangGraph node implementations
│   │   └── graph.py             # LangGraph state machine definition + compilation
│   │
│   ├── security/
│   │   ├── auth.py              # API key + JWT authentication middleware
│   │   ├── rate_limiter.py      # SlowAPI rate limiter (30 req/min per key)
│   │   ├── sanitizer.py         # Input sanitization + prompt injection detection
│   │   └── audit.py             # JSONL audit trail logger
│   │
│   ├── evaluation/
│   │   ├── golden_dataset.json  # 20-pair ground truth QA test set
│   │   ├── ragas_eval.py        # RAGAS evaluation runner
│   │   ├── deepeval_tests.py    # DeepEval test cases for CI/CD
│   │   └── metrics.py           # Custom metric definitions
│   │
│   └── api/
│       ├── main.py              # FastAPI app factory (CORS, middleware, lifespan)
│       ├── routes.py            # /query, /health, /documents, /evaluations endpoints
│       ├── schemas.py           # Pydantic request/response models
│       └── middleware.py        # Request ID injection, error handling
│
├── frontend/                    # React + TypeScript + Vite + Tailwind CSS
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx         # Technical hero, metrics, feature categories
│       │   ├── Architecture.tsx # Interactive RAG pipeline flow diagram
│       │   ├── KnowledgeBase.tsx# Document management with upload & chunk preview
│       │   ├── Evaluation.tsx   # RAGAS benchmark dashboard with assertion table
│       │   └── LiveAgent.tsx    # Chat interface with citations, RAG trace, feedback
│       ├── components/
│       │   └── layout/          # Navbar, Footer
│       └── services/
│           └── api.ts           # Axios API client with proxy config
│
├── scripts/
│   ├── ingest.py                # CLI: document ingestion script
│   └── evaluate.py              # CLI: evaluation suite runner
│
├── tests/
│   ├── test_agent.py            # Agent graph and node tests
│   ├── test_api.py              # API endpoint tests
│   ├── test_ingestion.py        # Document loading and chunking tests
│   ├── test_retrieval.py        # Hybrid search and reranking tests
│   └── test_security.py         # Auth, sanitization, injection detection tests
│
├── data/
│   ├── sample_docs/             # Sample company documents (4 files)
│   └── qdrant_storage/          # Embedded Qdrant local storage (no Docker needed)
│
├── docker-compose.yml           # Qdrant + FastAPI + Frontend containers
├── pyproject.toml               # Python project config, dependencies, tool settings
└── .env                         # Environment variables (not committed)
```

---

## Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** (for the frontend)
- An API key for **one** of: [Groq](https://console.groq.com/) (free) or [OpenAI](https://platform.openai.com/)

> **Note:** Docker is **not required**. Qdrant runs in embedded local mode by default (`data/qdrant_storage/`). Use Docker only if you want a dedicated Qdrant server.

### 1. Clone & Set Up Python Environment

```bash
git clone https://github.com/sammedbg/rag-customer-support-agent.git
cd rag-customer-support-agent

# Create virtual environment
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -e ".[dev]"
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your API key:

```env
# ── LLM Provider (choose one) ──────────────────────
GROQ_API_KEY=gsk_your_key_here           # Groq (free, recommended)
GROQ_CHAT_MODEL=llama-3.3-70b-versatile

# OR
OPENAI_API_KEY=sk-your_key_here          # OpenAI
OPENAI_CHAT_MODEL=gpt-4o-mini

# ── Embeddings ──────────────────────────────────────
# Leave OPENAI_API_KEY empty to use local FastEmbed
# (BAAI/bge-small-en-v1.5) — no API key needed
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# ── Qdrant (optional — auto-falls back to local) ───
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=customer_support_docs

# ── Security ────────────────────────────────────────
API_KEYS=dev-key-change-me-in-production
JWT_SECRET=your-jwt-secret-change-me-in-production

# ── Application ─────────────────────────────────────
APP_ENV=development
LOG_LEVEL=INFO
```

### 3. Ingest Documents

```bash
python scripts/ingest.py --data-dir data/sample_docs
```

Expected output:
```
============================================================
RAG Customer Support Agent — Document Ingestion
============================================================
Loaded 4 documents
Created 31 parent chunks, 147 child chunks
Upserting 147 vectors to Qdrant...
✓ Ingestion complete — 147 vectors stored
```

### 4. Start the Backend

```bash
uvicorn src.api.main:app --reload --port 8000
```

The API is now live at **http://localhost:8000**. Interactive docs at **http://localhost:8000/docs**.

### 5. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Configuration

All configuration is managed through environment variables, loaded via Pydantic Settings. See [`config/settings.py`](config/settings.py) for the full list.

### Key Parameters

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | — | Groq API key (takes priority over OpenAI) |
| `OPENAI_API_KEY` | — | OpenAI API key (used if Groq key is absent) |
| `CHUNK_SIZE` | `1024` | Parent chunk size in characters |
| `CHILD_CHUNK_SIZE` | `256` | Child chunk size for retrieval |
| `CHUNK_OVERLAP` | `64` | Overlap between chunks |
| `TOP_K_RETRIEVAL` | `10` | Candidates from hybrid search |
| `TOP_K_RERANK` | `5` | Final results after reranking |
| `HYBRID_SEARCH_ALPHA` | `0.7` | Dense weight (0 = all sparse, 1 = all dense) |
| `SIMILARITY_THRESHOLD` | `0.3` | Minimum retrieval score |
| `RATE_LIMIT_PER_MINUTE` | `30` | API rate limit per key |

### LLM Provider Priority

The system selects an LLM in this order:

1. **Groq** — if `GROQ_API_KEY` is set
2. **OpenAI** — if `OPENAI_API_KEY` is set
3. **Mock fallback** — returns canned responses (for testing)

### Embedding Provider Priority

1. **OpenAI** — if `OPENAI_API_KEY` is set → uses `text-embedding-3-small`
2. **Local FastEmbed** — automatic fallback → uses `BAAI/bge-small-en-v1.5` (no API key needed, runs on CPU)

---

## Usage

### Query the Agent (cURL)

```bash
curl -X POST http://localhost:8000/api/v1/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key-change-me-in-production" \
  -d '{"query": "What is the return policy for TechNova products?"}'
```

### Response

```json
{
  "answer": "Eligible TechNova products can be returned within 30 days of delivery for a full refund. Items must be in their original packaging and unused condition. [1]",
  "citations": [
    {
      "source": "refund_policy.md",
      "chunk_text": "All TechNova products are eligible for return within 30 days of delivery...",
      "relevance_score": 0.89
    }
  ],
  "confidence": 0.85,
  "request_id": "req_a1b2c3d4"
}
```

### Chat via Frontend

Navigate to **http://localhost:5173/agent** and use the live chat interface. Features include:

- **Suggested questions** to get started
- **Inline citation tags** `[1]` `[2]` — click to expand source evidence
- **Source Evidence Drawer** — shows exact passage text and match scores
- **RAG Trace Inspector** — expand to see each pipeline step (route → retrieve → grade → generate → verify)
- **Conversation sidebar** for managing multiple chat sessions

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/query` | Submit a query to the RAG agent |
| `GET` | `/api/v1/health` | System health check (Qdrant status, doc count) |
| `GET` | `/api/v1/documents` | List ingested documents with metadata |
| `POST` | `/api/v1/documents/upload` | Upload and ingest a new document |
| `GET` | `/api/v1/evaluations/latest` | Get latest evaluation results |
| `GET` | `/docs` | Interactive Swagger/OpenAPI documentation |

Full request/response schemas are defined in [`src/api/schemas.py`](src/api/schemas.py).

---

## Evaluation & Benchmarks

The project includes a comprehensive evaluation framework using two complementary tools:

### RAGAS Metrics

| Metric | What It Measures |
|--------|-----------------|
| **Faithfulness** | Is the answer supported by the retrieved context? |
| **Answer Relevancy** | Does the answer address the user's question? |
| **Context Precision** | Are the retrieved chunks relevant to the question? |
| **Context Recall** | Did retrieval find all relevant information? |

### Running Evaluations

```bash
# Full RAGAS evaluation against the golden dataset (20 QA pairs)
python scripts/evaluate.py

# DeepEval test runner (for CI/CD integration)
deepeval test run src/evaluation/deepeval_tests.py

# Unit tests
pytest tests/ -v
```

### Golden Dataset

The evaluation uses a curated set of 20 question-answer pairs in [`src/evaluation/golden_dataset.json`](src/evaluation/golden_dataset.json), covering:

- Return/refund policy questions
- Shipping cost and timeline queries
- Product troubleshooting scenarios
- Account and warranty inquiries

---

## Security

Security is **not an afterthought** — it's a first-class module.

### Defense Layers

| Layer | Implementation | File |
|-------|---------------|------|
| **Authentication** | API key header (`X-API-Key`) + JWT bearer tokens | [`auth.py`](src/security/auth.py) |
| **Rate Limiting** | 30 requests/minute per key via SlowAPI | [`rate_limiter.py`](src/security/rate_limiter.py) |
| **Input Sanitization** | HTML stripping, Unicode normalization, length limits (500 chars) | [`sanitizer.py`](src/security/sanitizer.py) |
| **Prompt Injection Detection** | 20+ regex patterns covering direct manipulation, role-play exploits, delimiter injection, jailbreak attempts | [`sanitizer.py`](src/security/sanitizer.py) |
| **Audit Trail** | JSONL logging of every request with correlation IDs | [`audit.py`](src/security/audit.py) |
| **Fail-Closed** | Ungrounded answers trigger a safe fallback response rather than being returned | [`nodes.py`](src/agent/nodes.py) |

### Prompt Injection Patterns Detected

```
"ignore all previous instructions"
"you are now a..."
"show your system prompt"
"[INST]", "<|system|>", "### system"
"DAN mode", "developer mode", "jailbreak"
... and 15+ more patterns
```

All detections are logged with the offending input for security review.

---

## Frontend

The frontend is a **React + TypeScript + Vite + Tailwind CSS** portfolio application (not a generic SaaS template). It's designed to showcase the engineering behind the RAG system.

### Pages

| Page | Route | Purpose |
|------|-------|---------|
| **Home** | `/` | Technical hero, technology strip, RAG evaluation metric teaser, feature categories, security architecture |
| **Architecture** | `/architecture` | Interactive pipeline flow diagram showing ingestion and query paths |
| **Knowledge Base** | `/knowledge-base` | Document management — drag & drop upload, status table, chunk previews |
| **Evaluation** | `/evaluation` | RAGAS dashboard — 4 metric cards, golden dataset assertion table, debug trace modal |
| **Live Agent** | `/agent` | Chat interface — conversations, citations, RAG trace inspector, suggested questions |

### Running the Frontend

```bash
cd frontend
npm install
npm run dev        # Development server → http://localhost:5173
npm run build      # Production build → dist/
npm run preview    # Preview production build
```

---

## Testing

The test suite covers all major modules with **40 unit tests** across 5 test files:

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src --cov-report=term-missing

# Run specific module tests
pytest tests/test_agent.py -v
pytest tests/test_security.py -v
pytest tests/test_ingestion.py -v
pytest tests/test_retrieval.py -v
pytest tests/test_api.py -v
```

### Test Coverage

| Module | Tests | Covers |
|--------|-------|--------|
| `test_agent.py` | Agent node functions, graph routing, state transitions |
| `test_api.py` | API endpoints, request validation, error handling |
| `test_ingestion.py` | Document loading, chunking boundaries, embedding generation |
| `test_retrieval.py` | Hybrid search, reranking, score thresholds |
| `test_security.py` | Auth, rate limiting, prompt injection detection, sanitization |

---

## Docker Deployment

Deploy the full stack with Docker Compose:

```bash
# Start all services (Qdrant + FastAPI + Frontend)
docker compose up -d

# Start only Qdrant (if running API locally)
docker compose up qdrant -d

# View logs
docker compose logs -f api
```

### Services

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| `qdrant` | `rag-qdrant` | `6333` (REST), `6334` (gRPC) | Vector database |
| `api` | `rag-api` | `8000` | FastAPI backend |
| `frontend` | `rag-frontend` | `3000` | React app (Nginx) |

> **Local development:** You don't need Docker at all. Qdrant runs in embedded mode (`data/qdrant_storage/`), the API runs via `uvicorn`, and the frontend via `vite dev`.

---

## License

[MIT](LICENSE)

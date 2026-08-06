# RAG Customer Support Agent 🤖

A production-grade, security-hardened RAG (Retrieval-Augmented Generation) agent that answers customer questions using company documents while **citing the correct sources**.

## ✨ Features

- **🔍 Hybrid Search** — Dense (OpenAI) + Sparse (BM25) vectors with Reciprocal Rank Fusion
- **🧠 LangGraph Orchestration** — Multi-node agentic workflow with routing, grading, hallucination guard
- **📚 Source Citations** — Every answer includes verifiable source references
- **🔒 Security Hardened** — Auth, rate limiting, prompt injection detection, audit trails
- **📊 Evaluation Suite** — RAGAS + DeepEval metrics with golden dataset
- **⚡ React Chat UI** — Premium dark-mode glassmorphism interface
- **🐳 Docker Ready** — One-command deployment with Docker Compose

## 🏗️ Architecture

```
User Query → Auth → Rate Limit → Sanitize → Route Query
                                                  ↓
                                            Hybrid Search (Qdrant)
                                                  ↓
                                            Grade Relevance
                                                  ↓
                                        Generate + Citations
                                                  ↓
                                        Hallucination Check
                                                  ↓
                                            Response + Sources
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Orchestration** | LangGraph |
| **Data Plane** | LlamaIndex |
| **Vector DB** | Qdrant (hybrid search) |
| **Embeddings** | OpenAI text-embedding-3-small |
| **LLM** | GPT-4o-mini |
| **API** | FastAPI |
| **Frontend** | React + Vite |
| **Evaluation** | RAGAS + DeepEval |
| **Security** | JWT, API keys, rate limiting |

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (for Qdrant)
- OpenAI API key

### 1. Setup Environment

```bash
# Clone and enter the project
cd "RAG Customer support agent"

# Copy environment config
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-your-key-here
```

### 2. Start Qdrant

```bash
docker compose up qdrant -d
```

### 3. Install Python Dependencies

```bash
pip install -e ".[dev]"
```

### 4. Ingest Documents

```bash
python scripts/ingest.py --data-dir data/sample_docs
```

### 5. Start the API Server

```bash
uvicorn src.api.main:app --reload --port 8000
```

### 6. Start the React Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173** for the chat UI or **http://localhost:8000/docs** for the API docs.

## 📁 Project Structure

```
├── config/              # Settings & logging configuration
├── src/
│   ├── ingestion/       # Document loading, chunking, embedding
│   ├── retrieval/       # Hybrid search, reranking
│   ├── agent/           # LangGraph nodes & graph
│   ├── security/        # Auth, rate limiting, sanitization
│   ├── api/             # FastAPI routes & middleware
│   └── evaluation/      # RAGAS, DeepEval, golden dataset
├── frontend/            # React + Vite chat UI
├── data/sample_docs/    # Sample company documents
├── scripts/             # CLI scripts (ingest, evaluate)
├── tests/               # Unit tests
└── docker-compose.yml   # Container orchestration
```

## 🔒 Security

- **Authentication**: API Key + JWT token support
- **Rate Limiting**: 30 req/min per key (configurable)
- **Prompt Injection Guard**: Pattern + LLM-based detection
- **Input Sanitization**: HTML stripping, length limits, Unicode normalization
- **Audit Trail**: Full JSONL logging of every request
- **Fail-Closed**: Returns "I don't know" rather than hallucinating

## 📊 Evaluation

```bash
# Run the full evaluation suite
python scripts/evaluate.py

# Run DeepEval tests (CI/CD)
deepeval test run src/evaluation/deepeval_tests.py

# Run unit tests
pytest tests/ -v
```

## 📄 License

MIT

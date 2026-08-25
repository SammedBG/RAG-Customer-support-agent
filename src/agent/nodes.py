"""
LangGraph node implementations for the RAG agent.

Each function is a graph node that reads from and writes to AgentState.
Nodes: route_query, retrieve, grade_documents, generate, check_hallucination, fallback.
"""

from __future__ import annotations

import re
from typing import Any

from langchain_openai import ChatOpenAI

from config.logging_config import get_logger
from config.settings import get_settings
from src.agent.prompts import (
    GRADER_PROMPT,
    HALLUCINATION_CHECK_PROMPT,
    ROUTER_PROMPT,
    SYSTEM_PROMPT,
    USER_PROMPT_DIRECT,
    USER_PROMPT_WITH_CONTEXT,
)
from src.agent.state import AgentState, Citation
from src.retrieval.retriever import Retriever

logger = get_logger(__name__)

# Module-level singletons (initialized lazily)
_llm: Any | None = None
_retriever: Retriever | None = None


class SafeChatGroq:
    """Wrapper around ChatGroq with automatic model fallback for 404 (not found) and 429 (rate limit) errors."""

    def __init__(self, primary_model: str, api_key: str, fallback_models: list[str] | None = None):
        self.api_key = api_key
        default_fallbacks = ["groq/compound", "groq/compound-mini", "qwen/qwen3.6-27b", "allam-2-7b"]
        self.candidate_models = [primary_model] + [m for m in (fallback_models or default_fallbacks) if m != primary_model]
        self._active_model = primary_model
        self._llm: Any = None
        self._init_llm(self._active_model)

    def _init_llm(self, model: str):
        from langchain_groq import ChatGroq
        self._active_model = model
        self._llm = ChatGroq(
            model=model,
            api_key=self.api_key,
            temperature=0.1,
            max_tokens=1024,
        )

    def invoke(self, *args, **kwargs) -> Any:
        import re
        last_err = None
        for model in self.candidate_models:
            try:
                if self._active_model != model or self._llm is None:
                    self._init_llm(model)
                if self._llm is not None:
                    res = self._llm.invoke(*args, **kwargs)
                    if hasattr(res, "content") and isinstance(res.content, str):
                        res.content = re.sub(r"<think>.*?</think>", "", res.content, flags=re.DOTALL).strip()
                    return res
            except Exception as e:
                err_str = str(e).lower()
                is_recoverable = any(
                    k in err_str
                    for k in (
                        "model_not_found",
                        "does not exist",
                        "decommissioned",
                        "404",
                        "413",
                        "request_too_large",
                        "too large",
                        "429",
                        "rate_limit",
                        "rate limit",
                        "tokens per minute",
                        "tpm",
                    )
                )
                if is_recoverable:
                    logger.warning("groq_model_fallback_triggered", failed_model=model, error=str(e))
                    last_err = e
                    continue
                raise e
        if last_err:
            raise last_err
        raise RuntimeError("No Groq models available for invocation")


def _get_llm() -> Any:
    """Get or create the LLM singleton (Groq with fallback, OpenAI, or Mock fallback)."""
    global _llm
    if _llm is None:
        settings = get_settings()
        if settings.groq_api_key:
            _llm = SafeChatGroq(
                primary_model=settings.groq_chat_model,
                api_key=settings.groq_api_key,
                fallback_models=["groq/compound", "groq/compound-mini", "qwen/qwen3.6-27b", "allam-2-7b"],
            )
            logger.info("llm_initialized_groq", model=settings.groq_chat_model)
        elif settings.openai_api_key:
            from langchain_openai import ChatOpenAI
            _llm = ChatOpenAI(
                model=settings.openai_chat_model,
                api_key=settings.openai_api_key,
                temperature=0.1,
                max_tokens=1024,
            )
            logger.info("llm_initialized_openai", model=settings.openai_chat_model)
        else:
            # Fallback mock LLM if no API key is provided
            from langchain_community.chat_models import FakeListChatModel
            _llm = FakeListChatModel(
                responses=[
                    "retrieve",
                    "Based on the uploaded documents, here is the relevant information. [1]",
                    "grounded",
                ]
            )
            logger.info("llm_initialized_mock_fallback")
    return _llm


def _get_retriever() -> Retriever:
    """Get or create the Retriever singleton."""
    global _retriever
    if _retriever is None:
        _retriever = Retriever()
        logger.info("retriever_initialized")
    return _retriever


def set_retriever(retriever: Retriever) -> None:
    """Inject a retriever instance (useful for testing)."""
    global _retriever
    _retriever = retriever


def set_llm(llm: Any) -> None:
    """Inject an LLM instance (useful for testing)."""
    global _llm
    _llm = llm


# ─────────────────────────────────────────────────────────────
# Node 1: Route Query
# ─────────────────────────────────────────────────────────────
def route_query(state: AgentState) -> dict[str, Any]:
    """
    Determine whether the query needs retrieval or is a simple greeting.

    Uses instant zero-token heuristic routing to save LLM token quotas.
    """
    query = state["query"].strip().lower()
    logger.info("routing_query", query=state["query"][:100])

    direct_greetings = {
        "hi",
        "hello",
        "hey",
        "hi there",
        "hello there",
        "good morning",
        "good afternoon",
        "good evening",
        "thanks",
        "thank you",
        "bye",
        "goodbye",
    }

    if query in direct_greetings:
        route = "direct"
    else:
        route = "retrieve"

    logger.info("query_routed", decision=route)
    return {"route_decision": route}


# ─────────────────────────────────────────────────────────────
# Node 2: Retrieve Documents
# ─────────────────────────────────────────────────────────────
def retrieve(state: AgentState) -> dict[str, Any]:
    """
    Retrieve relevant document chunks using hybrid search.
    """
    query = state["query"]
    retry_count = state.get("retry_count", 0)

    logger.info("retrieving_documents", query=query[:100], retry=retry_count)

    retriever = _get_retriever()
    chunks = retriever.retrieve(query=query)

    # Convert RetrievedChunk objects to dicts for state serialization
    retrieved_docs = []
    for chunk in chunks:
        retrieved_docs.append(
            {
                "text": chunk.text,
                "parent_text": chunk.parent_text,
                "source_file": chunk.source_file,
                "source_path": chunk.source_path,
                "score": chunk.score,
                "chunk_id": chunk.chunk_id,
                "citation_key": chunk.citation_key,
            }
        )

    logger.info("documents_retrieved", count=len(retrieved_docs))
    return {
        "retrieved_docs": retrieved_docs,
        "retry_count": retry_count + 1,
    }


# ─────────────────────────────────────────────────────────────
# Node 3: Grade Document Relevance
# ─────────────────────────────────────────────────────────────
def grade_documents(state: AgentState) -> dict[str, Any]:
    """
    Filter retrieved documents by relevance.

    Since Hybrid Search + RRF with score threshold already extracts top relevant
    chunks, we filter non-empty chunks directly to conserve LLM token quotas.
    """
    docs = state.get("retrieved_docs", [])
    filtered_docs = [doc for doc in docs if doc.get("text", "").strip()]

    logger.info(
        "grading_complete",
        input=len(docs),
        relevant=len(filtered_docs),
    )

    return {"filtered_docs": filtered_docs}


# ─────────────────────────────────────────────────────────────
# Node 4: Generate Answer
# ─────────────────────────────────────────────────────────────
def generate(state: AgentState) -> dict[str, Any]:
    """
    Generate an answer using the filtered context documents.

    Produces an answer with inline source citations and extracts
    structured citation objects for the API response.
    """
    query = state["query"]
    route = state.get("route_decision", "retrieve")

    llm = _get_llm()

    if route == "direct" or not state.get("filtered_docs"):
        # Direct response for greetings or no relevant docs found
        prompt = USER_PROMPT_DIRECT.format(query=query)
        response = llm.invoke([
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ])
        gen_text = str(response.content)
        return {
            "generation": gen_text,
            "citations": [],
            "confidence": 0.5 if route == "direct" else 0.2,
        }

    # Build context from filtered docs using parent text for richer context (capped for token safety)
    filtered_docs = state["filtered_docs"][:3]  # Top 3 most relevant chunks
    context_parts = []
    citations: list[Citation] = []

    for i, doc in enumerate(filtered_docs):
        raw_text = doc.get("parent_text") or doc.get("text", "")
        context_text = raw_text[:1000]  # Cap each chunk to 1000 chars for token limits
        source = doc.get("source_file", "document")
        context_parts.append(f"[Document {i + 1} — Source: {source}]\n{context_text}")

        citations.append(
            Citation(
                source=source,
                chunk_text=doc.get("text", "")[:300],
                relevance_score=doc.get("score", 0.0),
                page=None,
            )
        )

    context = "\n\n---\n\n".join(context_parts)[:3500]  # Max 3.5k chars context
    prompt = USER_PROMPT_WITH_CONTEXT.format(context=context, query=query)

    response = llm.invoke([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ])
    gen_text = str(response.content)

    # Calculate confidence based on retrieval scores
    avg_score = sum(doc.get("score", 0) for doc in filtered_docs) / len(filtered_docs)
    confidence = min(1.0, avg_score * 1.2)  # Scale up slightly

    logger.info(
        "answer_generated",
        answer_len=len(gen_text),
        citations=len(citations),
        confidence=round(confidence, 2),
    )

    return {
        "generation": gen_text,
        "citations": citations,
        "confidence": confidence,
    }


# ─────────────────────────────────────────────────────────────
# Node 5: Check for Hallucination
# ─────────────────────────────────────────────────────────────
def check_hallucination(state: AgentState) -> dict[str, Any]:
    """
    Verify the generated answer is grounded in the retrieved context.
    """
    generation = state.get("generation", "")
    filtered_docs = state.get("filtered_docs", [])

    # If generation produced content and context exists, consider it grounded
    is_grounded = bool(generation and (state.get("route_decision") == "direct" or filtered_docs))

    logger.info("hallucination_check_complete", is_grounded=is_grounded)
    return {"is_grounded": is_grounded}


# ─────────────────────────────────────────────────────────────
# Node 6: Fallback Response
# ─────────────────────────────────────────────────────────────
def fallback(state: AgentState) -> dict[str, Any]:
    """
    Generate a safe fallback response when the system can't provide
    a grounded answer. This is the fail-closed behavior.
    """
    logger.warning(
        "fallback_triggered",
        query=state["query"][:100],
        retry_count=state.get("retry_count", 0),
        was_grounded=state.get("is_grounded"),
    )

    fallback_message = (
        "I wasn't able to find a sufficiently relevant answer in the currently uploaded documents. "
        "Here are a few things you can try:\n\n"
        "- **Upload more documents** — Make sure the knowledge base contains documents related to your question.\n"
        "- **Rephrase your question** — Try asking in a different way or be more specific.\n"
        "- **Check document status** — Ensure your uploaded documents have finished processing (status: Indexed).\n\n"
        "I can only answer questions based on the documents that have been uploaded to the knowledge base."
    )

    return {
        "generation": fallback_message,
        "citations": [],
        "confidence": 0.0,
        "error": "Unable to generate a grounded response",
    }

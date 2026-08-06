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


def _get_llm() -> Any:
    """Get or create the LLM singleton (Groq, OpenAI, or Mock fallback)."""
    global _llm
    if _llm is None:
        settings = get_settings()
        if settings.groq_api_key:
            from langchain_groq import ChatGroq
            _llm = ChatGroq(
                model=settings.groq_chat_model,
                api_key=settings.groq_api_key,
                temperature=0.1,
                max_tokens=1024,
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
                    "Eligible TechNova products can be returned within 30 days of delivery. [1]",
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

    Routes to:
    - "retrieve" → hybrid search pipeline
    - "direct" → direct LLM response (for greetings/chitchat)
    """
    query = state["query"]
    logger.info("routing_query", query=query[:100])

    llm = _get_llm()
    prompt = ROUTER_PROMPT.format(query=query)

    response = llm.invoke(prompt)
    content_str = response.content if isinstance(response.content, str) else str(response.content)
    decision = content_str.strip().lower()

    # Normalize decision
    if "retrieve" in decision:
        route = "retrieve"
    elif "direct" in decision:
        route = "direct"
    else:
        # Default to retrieve if uncertain
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
    Grade each retrieved document for relevance to the query.

    Filters out irrelevant documents to improve generation quality.
    """
    query = state["query"]
    docs = state.get("retrieved_docs", [])

    logger.info("grading_documents", count=len(docs))

    llm = _get_llm()
    filtered_docs: list[dict[str, Any]] = []

    for doc in docs:
        prompt = GRADER_PROMPT.format(
            query=query,
            source=doc["source_file"],
            document=doc["text"][:500],  # Limit text for grading
        )

        response = llm.invoke(prompt)
        content_str = response.content if isinstance(response.content, str) else str(response.content)
        grade = content_str.strip().lower()

        if "yes" in grade:
            filtered_docs.append(doc)
            logger.debug("doc_relevant", source=doc["source_file"], score=doc["score"])
        else:
            logger.debug("doc_filtered_out", source=doc["source_file"])

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

    # Build context from filtered docs using parent text for richer context
    filtered_docs = state["filtered_docs"]
    context_parts = []
    citations: list[Citation] = []

    for i, doc in enumerate(filtered_docs):
        context_text = doc.get("parent_text", doc["text"])
        source = doc["source_file"]
        context_parts.append(f"[Document {i + 1} — Source: {source}]\n{context_text}")

        citations.append(
            Citation(
                source=source,
                chunk_text=doc["text"][:300],
                relevance_score=doc.get("score", 0.0),
                page=None,
            )
        )

    context = "\n\n---\n\n".join(context_parts)
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

    Acts as a safety net to catch hallucinated information.
    """
    generation = state.get("generation", "")
    filtered_docs = state.get("filtered_docs", [])

    # Skip check for direct responses (greetings, etc.)
    if state.get("route_decision") == "direct" or not filtered_docs:
        return {"is_grounded": True}

    logger.info("checking_hallucination")

    llm = _get_llm()

    # Build context for verification
    context = "\n\n".join(
        f"[Source: {doc['source_file']}]\n{doc.get('parent_text', doc['text'])}"
        for doc in filtered_docs
    )

    prompt = HALLUCINATION_CHECK_PROMPT.format(
        context=context,
        answer=generation,
    )

    response = llm.invoke(prompt)
    content_str = response.content if isinstance(response.content, str) else str(response.content)
    result = content_str.strip().lower()

    is_grounded = "grounded" in result and "not_grounded" not in result

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
        "I apologize, but I'm unable to find a reliable answer to your question "
        "in our current documentation. To ensure you receive accurate information, "
        "I recommend reaching out to our support team:\n\n"
        "- **Email**: support@technova.com\n"
        "- **Phone**: 1-800-TECHNOVA (Mon-Fri 8AM-8PM EST)\n"
        "- **Live Chat**: Available 24/7 at technova.com/support\n\n"
        "They'll be happy to help you with your specific question."
    )

    return {
        "generation": fallback_message,
        "citations": [],
        "confidence": 0.0,
        "error": "Unable to generate a grounded response",
    }

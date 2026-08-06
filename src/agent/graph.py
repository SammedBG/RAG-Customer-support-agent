"""
LangGraph graph definition for the RAG agent.

Defines the state machine that orchestrates the RAG pipeline:
  START → route_query → retrieve → grade → generate → hallucination_check → END
                 ↓                    ↑ (retry)                          ↓ (fail)
               direct → generate → END                              fallback → END
"""

from typing import Any, cast

from langgraph.graph import END, StateGraph
from langgraph.graph.state import CompiledStateGraph

from config.logging_config import get_logger
from src.agent.nodes import (
    check_hallucination,
    fallback,
    generate,
    grade_documents,
    retrieve,
    route_query,
)
from src.agent.state import AgentState

logger = get_logger(__name__)


def _should_retrieve(state: AgentState) -> str:
    """Conditional edge: decide whether to retrieve or respond directly."""
    return state.get("route_decision", "retrieve")


def _check_relevance(state: AgentState) -> str:
    """Conditional edge: check if we have relevant docs or need to retry."""
    filtered_docs = state.get("filtered_docs", [])
    retry_count = state.get("retry_count", 0)
    max_retries = state.get("max_retries", 2)

    if filtered_docs:
        return "relevant"
    elif retry_count < max_retries:
        return "retry"
    else:
        return "no_relevant"


def _check_grounded(state: AgentState) -> str:
    """Conditional edge: check if the answer is grounded in context."""
    if state.get("is_grounded", False):
        return "grounded"
    return "not_grounded"


def build_graph() -> CompiledStateGraph:
    """
    Build and compile the LangGraph RAG agent.

    Graph structure:
    ┌─────────────────────────────────────────────────┐
    │  START → route_query                            │
    │    ├─ "retrieve" → retrieve → grade_documents   │
    │    │    ├─ "relevant" → generate → halluc_check  │
    │    │    │    ├─ "grounded" → END                 │
    │    │    │    └─ "not_grounded" → fallback → END  │
    │    │    ├─ "retry" → retrieve (loop)             │
    │    │    └─ "no_relevant" → fallback → END        │
    │    └─ "direct" → generate → END                 │
    └─────────────────────────────────────────────────┘
    """
    logger.info("building_rag_graph")

    graph = StateGraph(cast(Any, AgentState))

    # ── Add nodes ────────────────────────────────────────────
    graph.add_node("route_query", route_query)
    graph.add_node("retrieve", retrieve)
    graph.add_node("grade_documents", grade_documents)
    graph.add_node("generate", generate)
    graph.add_node("check_hallucination", check_hallucination)
    graph.add_node("fallback", fallback)

    # ── Set entry point ──────────────────────────────────────
    graph.set_entry_point("route_query")

    # ── Add conditional edges ────────────────────────────────

    # After routing: go to retrieve or direct generate
    graph.add_conditional_edges(
        "route_query",
        _should_retrieve,
        {
            "retrieve": "retrieve",
            "direct": "generate",
        },
    )

    # After retrieval: grade documents
    graph.add_edge("retrieve", "grade_documents")

    # After grading: check if we have relevant docs
    graph.add_conditional_edges(
        "grade_documents",
        _check_relevance,
        {
            "relevant": "generate",
            "retry": "retrieve",
            "no_relevant": "fallback",
        },
    )

    # After generation: check for hallucination (only for retrieved answers)
    graph.add_edge("generate", "check_hallucination")

    # After hallucination check: end or fallback
    graph.add_conditional_edges(
        "check_hallucination",
        _check_grounded,
        {
            "grounded": END,
            "not_grounded": "fallback",
        },
    )

    # Fallback always ends
    graph.add_edge("fallback", END)

    # ── Compile ──────────────────────────────────────────────
    compiled = graph.compile()
    logger.info("rag_graph_compiled")

    return compiled


# Module-level compiled graph (lazy initialization)
_compiled_graph = None


def get_graph():
    """Get or create the compiled graph singleton."""
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph


def invoke_agent(
    query: str,
    request_id: str = "",
    conversation_history: list[dict[str, str]] | None = None,
) -> AgentState:
    """
    Invoke the RAG agent with a user query.

    Args:
        query: The user's question.
        request_id: Unique request identifier for tracing.
        conversation_history: Previous messages in the conversation.

    Returns:
        Final AgentState with the answer, citations, and metadata.
    """
    graph = get_graph()

    initial_state: AgentState = {
        "query": query,
        "conversation_history": conversation_history or [],
        "retrieved_docs": [],
        "filtered_docs": [],
        "generation": "",
        "citations": [],
        "route_decision": "",
        "is_grounded": False,
        "retry_count": 0,
        "max_retries": 2,
        "request_id": request_id,
        "confidence": 0.0,
        "error": None,
    }

    logger.info("agent_invoked", query=query[:100], request_id=request_id)

    result = graph.invoke(initial_state)

    logger.info(
        "agent_complete",
        request_id=request_id,
        confidence=result.get("confidence", 0),
        citations=len(result.get("citations", [])),
        had_error=result.get("error") is not None,
    )

    return cast(AgentState, result)

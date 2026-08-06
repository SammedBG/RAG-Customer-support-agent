"""
Agent state schema for LangGraph.

Defines the typed state that flows through the graph nodes.
Each node reads from and writes to this state.
"""

from __future__ import annotations

from typing import Any, Optional

from typing_extensions import TypedDict


class Citation(TypedDict):
    """A single source citation attached to the answer."""

    source: str  # Filename (e.g., "refund_policy.md")
    chunk_text: str  # The text chunk used as evidence
    relevance_score: float  # How relevant this source was
    page: Optional[int]  # Page number if available


class AgentState(TypedDict):
    """
    The state that flows through the LangGraph RAG agent.

    Each node can read from and write to these fields.
    LangGraph manages state transitions automatically.
    """

    # Input
    query: str  # The user's question
    conversation_history: list[dict[str, str]]  # Previous messages

    # Retrieval
    retrieved_docs: list[dict[str, Any]]  # Raw retrieved chunks
    filtered_docs: list[dict[str, Any]]  # Docs that passed relevance grading

    # Generation
    generation: str  # The generated answer
    citations: list[Citation]  # Source citations for the answer

    # Control flow
    route_decision: str  # "retrieve" or "direct"
    is_grounded: bool  # Whether the answer is grounded in context
    retry_count: int  # Number of retrieval retries
    max_retries: int  # Maximum allowed retries

    # Metadata
    request_id: str  # Unique request identifier
    confidence: float  # Overall confidence score (0-1)
    error: Optional[str]  # Error message if something went wrong

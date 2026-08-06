"""Unit tests for the agent layer."""

from __future__ import annotations

from src.agent.state import AgentState, Citation


class TestAgentState:
    """Tests for the agent state schema."""

    def test_citation_creation(self):
        """Should create a valid citation."""
        citation = Citation(
            source="refund_policy.md",
            chunk_text="30-day money-back guarantee",
            relevance_score=0.95,
            page=None,
        )
        assert citation["source"] == "refund_policy.md"
        assert citation["relevance_score"] == 0.95

    def test_initial_state(self):
        """Should create a valid initial state."""
        state: AgentState = {
            "query": "How do I return?",
            "conversation_history": [],
            "retrieved_docs": [],
            "filtered_docs": [],
            "generation": "",
            "citations": [],
            "route_decision": "",
            "is_grounded": False,
            "retry_count": 0,
            "max_retries": 2,
            "request_id": "test-123",
            "confidence": 0.0,
            "error": None,
        }
        assert state["query"] == "How do I return?"
        assert state["retry_count"] == 0


class TestPrompts:
    """Tests for prompt templates."""

    def test_system_prompt_has_citation_instruction(self):
        """System prompt should instruct citation."""
        from src.agent.prompts import SYSTEM_PROMPT

        assert "cite" in SYSTEM_PROMPT.lower() or "source" in SYSTEM_PROMPT.lower()

    def test_system_prompt_has_grounding_instruction(self):
        """System prompt should instruct grounded responses."""
        from src.agent.prompts import SYSTEM_PROMPT

        assert "only" in SYSTEM_PROMPT.lower()
        assert "context" in SYSTEM_PROMPT.lower()

    def test_router_prompt_format(self):
        """Router prompt should accept query parameter."""
        from src.agent.prompts import ROUTER_PROMPT

        formatted = ROUTER_PROMPT.format(query="How do I return?")
        assert "How do I return?" in formatted

    def test_grader_prompt_format(self):
        """Grader prompt should accept query and document parameters."""
        from src.agent.prompts import GRADER_PROMPT

        formatted = GRADER_PROMPT.format(
            query="test query",
            source="test.md",
            document="test content",
        )
        assert "test query" in formatted
        assert "test.md" in formatted

    def test_hallucination_prompt_format(self):
        """Hallucination check prompt should accept context and answer."""
        from src.agent.prompts import HALLUCINATION_CHECK_PROMPT

        formatted = HALLUCINATION_CHECK_PROMPT.format(
            context="Some context",
            answer="Some answer",
        )
        assert "Some context" in formatted
        assert "Some answer" in formatted

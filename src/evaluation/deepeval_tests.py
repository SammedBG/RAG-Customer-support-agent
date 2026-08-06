"""
DeepEval pytest integration for CI/CD quality gates.

Each test function evaluates a specific quality dimension.
Tests fail if metrics drop below configured thresholds,
preventing quality regressions in the pipeline.

Run with: deepeval test run src/evaluation/deepeval_tests.py
    or:   pytest src/evaluation/deepeval_tests.py -v
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from config.settings import get_settings


def load_golden_dataset():
    """Load the golden QA dataset."""
    path = Path("src/evaluation/golden_dataset.json")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def get_agent_response(question: str) -> dict:
    """Get a response from the RAG agent for evaluation."""
    from src.agent.graph import invoke_agent

    result = invoke_agent(query=question, request_id="deepeval-test")
    return {
        "answer": result.get("generation", ""),
        "contexts": [
            doc.get("parent_text", doc.get("text", ""))
            for doc in result.get("filtered_docs", result.get("retrieved_docs", []))
        ],
        "citations": result.get("citations", []),
        "confidence": result.get("confidence", 0.0),
    }


class TestRAGQuality:
    """DeepEval quality tests for the RAG pipeline."""

    def test_faithfulness(self):
        """Test that answers are grounded in retrieved context (no hallucination)."""
        try:
            from deepeval import assert_test
            from deepeval.metrics import FaithfulnessMetric
            from deepeval.test_case import LLMTestCase

            settings = get_settings()
            golden_data = load_golden_dataset()

            # Test a subset for speed
            sample = golden_data[:5]

            for item in sample:
                response = get_agent_response(item["question"])

                test_case = LLMTestCase(
                    input=item["question"],
                    actual_output=response["answer"],
                    retrieval_context=response["contexts"],
                )

                metric = FaithfulnessMetric(
                    threshold=settings.deepeval_threshold,
                    model="gpt-4o-mini",
                )

                assert_test(test_case, [metric])

        except ImportError:
            pytest.skip("DeepEval not installed")

    def test_answer_relevancy(self):
        """Test that answers are relevant to the questions asked."""
        try:
            from deepeval import assert_test
            from deepeval.metrics import AnswerRelevancyMetric
            from deepeval.test_case import LLMTestCase

            settings = get_settings()
            golden_data = load_golden_dataset()

            sample = golden_data[:5]

            for item in sample:
                response = get_agent_response(item["question"])

                test_case = LLMTestCase(
                    input=item["question"],
                    actual_output=response["answer"],
                )

                metric = AnswerRelevancyMetric(
                    threshold=settings.deepeval_threshold,
                    model="gpt-4o-mini",
                )

                assert_test(test_case, [metric])

        except ImportError:
            pytest.skip("DeepEval not installed")

    def test_no_hallucination(self):
        """Test that the system doesn't hallucinate information."""
        try:
            from deepeval import assert_test
            from deepeval.metrics import HallucinationMetric
            from deepeval.test_case import LLMTestCase

            golden_data = load_golden_dataset()
            sample = golden_data[:3]

            for item in sample:
                response = get_agent_response(item["question"])

                if not response["contexts"]:
                    continue

                test_case = LLMTestCase(
                    input=item["question"],
                    actual_output=response["answer"],
                    context=response["contexts"],
                )

                metric = HallucinationMetric(
                    threshold=0.5,  # Lower threshold (higher = more hallucination allowed)
                    model="gpt-4o-mini",
                )

                assert_test(test_case, [metric])

        except ImportError:
            pytest.skip("DeepEval not installed")

    def test_citation_presence(self):
        """Test that answers include source citations."""
        golden_data = load_golden_dataset()
        sample = golden_data[:5]

        for item in sample:
            response = get_agent_response(item["question"])
            answer = response["answer"]

            # Check for inline citations or structured citations
            has_inline = "[Source:" in answer or "[source:" in answer.lower()
            has_structured = len(response["citations"]) > 0

            assert has_inline or has_structured, (
                f"No citations found for question: {item['question'][:50]}"
            )

    def test_fallback_on_unknown(self):
        """Test that the system gracefully handles questions outside its knowledge."""
        unknown_questions = [
            "What is the capital of France?",
            "Can you write me a poem about the ocean?",
            "What's the weather like today?",
        ]

        for question in unknown_questions:
            response = get_agent_response(question)
            answer = response["answer"].lower()

            # Should either refuse to answer or provide a helpful fallback
            is_appropriate = any(
                phrase in answer
                for phrase in [
                    "don't have",
                    "documentation",
                    "support team",
                    "contact",
                    "unable",
                    "can't find",
                    "support@technova",
                ]
            )

            assert is_appropriate or response["confidence"] < 0.5, (
                f"System should not confidently answer out-of-domain: {question}"
            )

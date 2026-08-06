"""
Custom evaluation metrics for the RAG pipeline.

Includes citation accuracy and response quality metrics
beyond what RAGAS/DeepEval provide out of the box.
"""

from __future__ import annotations

import re
from typing import Any


def citation_accuracy(
    answer: str,
    citations: list[dict[str, Any]],
    expected_sources: list[str],
) -> float:
    """
    Measure how accurately the answer cites the correct sources.

    Checks:
    1. Are the cited sources in the expected sources list?
    2. Are inline [Source: ...] references present in the answer?

    Returns:
        Score between 0.0 and 1.0.
    """
    if not expected_sources:
        return 1.0 if not citations else 0.0

    if not citations:
        return 0.0

    # Check if cited sources match expected sources
    cited_sources = {c.get("source", "") for c in citations}
    expected_set = set(expected_sources)

    # Precision: how many cited sources are correct?
    correct_citations = cited_sources & expected_set
    precision = len(correct_citations) / len(cited_sources) if cited_sources else 0.0

    # Recall: how many expected sources were cited?
    recall = len(correct_citations) / len(expected_set) if expected_set else 0.0

    # F1 score
    if precision + recall == 0:
        return 0.0

    f1 = 2 * (precision * recall) / (precision + recall)

    # Check for inline citations in the answer text
    inline_citations = re.findall(r"\[Source:\s*([^\]]+)\]", answer)
    has_inline = len(inline_citations) > 0

    # Bonus for having inline citations
    if has_inline:
        f1 = min(1.0, f1 * 1.1)

    return round(f1, 3)


def response_completeness(
    answer: str,
    ground_truth: str,
    key_facts: list[str] | None = None,
) -> float:
    """
    Measure how completely the answer addresses the question
    compared to the ground truth.

    Uses simple keyword overlap as a baseline metric.

    Returns:
        Score between 0.0 and 1.0.
    """
    if not answer or not ground_truth:
        return 0.0

    # Normalize texts
    answer_lower = answer.lower()
    truth_lower = ground_truth.lower()

    # Extract significant words (4+ chars) from ground truth
    truth_words = set(
        word
        for word in re.findall(r"\b\w{4,}\b", truth_lower)
        if word not in {"that", "this", "with", "from", "have", "been", "will", "your"}
    )

    if not truth_words:
        return 1.0

    # Count how many significant words appear in the answer
    found = sum(1 for word in truth_words if word in answer_lower)

    return round(found / len(truth_words), 3)


def confidence_calibration(
    confidence: float,
    is_correct: bool,
) -> float:
    """
    Measure how well-calibrated the confidence score is.

    A well-calibrated system should have high confidence for correct
    answers and low confidence for incorrect ones.

    Returns:
        Calibration score between 0.0 (poorly calibrated) and 1.0 (perfectly calibrated).
    """
    if is_correct:
        # For correct answers, confidence should be high
        return confidence
    else:
        # For incorrect answers, confidence should be low
        return 1.0 - confidence

"""
RAGAS evaluation runner.

Evaluates the RAG pipeline using RAGAS metrics:
- Faithfulness: Is the answer grounded in the retrieved context?
- Answer Relevancy: Is the answer relevant to the question?
- Context Precision: Are the retrieved documents precise?
- Context Recall: Did we retrieve all necessary documents?
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from config.logging_config import get_logger

logger = get_logger(__name__)


def load_golden_dataset(path: str = "src/evaluation/golden_dataset.json") -> list[dict[str, Any]]:
    """Load the golden QA dataset."""
    dataset_path = Path(path)
    if not dataset_path.exists():
        msg = f"Golden dataset not found: {path}"
        raise FileNotFoundError(msg)

    with open(dataset_path, encoding="utf-8") as f:
        return json.load(f)


def run_ragas_evaluation(
    results: list[dict[str, Any]],
    output_path: str = "evaluation_report.json",
) -> dict[str, float]:
    """
    Run RAGAS evaluation on a set of RAG results.

    Args:
        results: List of dicts with keys:
            - question: str
            - answer: str
            - contexts: list[str] (retrieved context chunks)
            - ground_truth: str (expected answer)
        output_path: Path to save the evaluation report.

    Returns:
        Dictionary of metric name -> score.
    """
    try:
        from datasets import Dataset
        from ragas import evaluate
        from ragas.metrics import (
            answer_relevancy,
            context_precision,
            context_recall,
            faithfulness,
        )

        logger.info("ragas_evaluation_starting", samples=len(results))

        # Prepare dataset in RAGAS format
        data = {
            "question": [r["question"] for r in results],
            "answer": [r["answer"] for r in results],
            "contexts": [r["contexts"] for r in results],
            "ground_truth": [r["ground_truth"] for r in results],
        }

        dataset = Dataset.from_dict(data)

        # Run evaluation
        eval_result = evaluate(
            dataset,
            metrics=[
                faithfulness,
                answer_relevancy,
                context_precision,
                context_recall,
            ],
        )

        scores = {
            "faithfulness": float(eval_result["faithfulness"]),
            "answer_relevancy": float(eval_result["answer_relevancy"]),
            "context_precision": float(eval_result["context_precision"]),
            "context_recall": float(eval_result["context_recall"]),
        }

        # Save report
        report = {
            "metrics": scores,
            "sample_count": len(results),
            "per_sample": eval_result.to_pandas().to_dict(orient="records")
            if hasattr(eval_result, "to_pandas")
            else [],
        }

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, default=str)

        logger.info("ragas_evaluation_complete", **scores)
        return scores

    except ImportError:
        logger.warning("ragas_not_installed", message="Install ragas: pip install ragas")
        return {"error": "RAGAS not installed"}
    except Exception as e:
        logger.error("ragas_evaluation_failed", error=str(e))
        return {"error": str(e)}


def generate_evaluation_data(
    golden_dataset_path: str = "src/evaluation/golden_dataset.json",
) -> list[dict[str, Any]]:
    """
    Generate evaluation data by running each golden question through the RAG pipeline.

    Returns:
        List of result dicts ready for RAGAS evaluation.
    """
    from src.agent.graph import invoke_agent

    golden_data = load_golden_dataset(golden_dataset_path)
    results: list[dict[str, Any]] = []

    for i, item in enumerate(golden_data):
        logger.info("evaluating_question", index=i + 1, total=len(golden_data))

        try:
            agent_result = invoke_agent(
                query=item["question"],
                request_id=f"eval-{i}",
            )

            # Extract contexts from retrieved/filtered docs
            contexts = [
                doc.get("parent_text", doc.get("text", ""))
                for doc in agent_result.get("filtered_docs", agent_result.get("retrieved_docs", []))
            ]

            results.append(
                {
                    "question": item["question"],
                    "answer": agent_result.get("generation", ""),
                    "contexts": contexts if contexts else ["No context retrieved"],
                    "ground_truth": item["ground_truth"],
                    "expected_sources": item.get("expected_sources", []),
                    "citations": agent_result.get("citations", []),
                    "confidence": agent_result.get("confidence", 0.0),
                }
            )

        except Exception as e:
            logger.error(
                "evaluation_question_failed",
                question=item["question"][:50],
                error=str(e),
            )
            results.append(
                {
                    "question": item["question"],
                    "answer": f"ERROR: {str(e)}",
                    "contexts": ["Error during evaluation"],
                    "ground_truth": item["ground_truth"],
                    "expected_sources": item.get("expected_sources", []),
                    "citations": [],
                    "confidence": 0.0,
                }
            )

    return results

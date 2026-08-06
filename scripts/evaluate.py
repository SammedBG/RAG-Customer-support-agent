"""
CLI script to run the evaluation suite.

Usage:
    python scripts/evaluate.py [--ragas] [--custom] [--output OUTPUT_PATH]
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.logging_config import setup_logging
from config.settings import get_settings


def main():
    parser = argparse.ArgumentParser(description="Run RAG pipeline evaluation")
    parser.add_argument("--ragas", action="store_true", help="Run RAGAS evaluation")
    parser.add_argument("--custom", action="store_true", help="Run custom metrics evaluation")
    parser.add_argument(
        "--output",
        type=str,
        default="evaluation_report.json",
        help="Output path for evaluation report",
    )
    parser.add_argument(
        "--samples",
        type=int,
        default=None,
        help="Number of samples to evaluate (default: all)",
    )
    args = parser.parse_args()

    # Default: run all evaluations
    if not args.ragas and not args.custom:
        args.ragas = True
        args.custom = True

    # Setup
    settings = get_settings()
    setup_logging(log_level=settings.log_level, json_format=False)

    print("=" * 60)
    print("RAG Customer Support Agent — Evaluation Suite")
    print("=" * 60)

    # Generate evaluation data
    from src.evaluation.ragas_eval import generate_evaluation_data, load_golden_dataset

    print("\n📋 Loading golden dataset...")
    golden_data = load_golden_dataset()
    total = args.samples or len(golden_data)
    print(f"   Questions: {total}")

    print("\n🤖 Running RAG pipeline on evaluation questions...")
    eval_data = generate_evaluation_data()
    if args.samples:
        eval_data = eval_data[: args.samples]

    report = {"sample_count": len(eval_data), "metrics": {}}

    # Run custom metrics
    if args.custom:
        print("\n📊 Running custom metrics...")
        from src.evaluation.metrics import citation_accuracy, response_completeness

        citation_scores = []
        completeness_scores = []

        for item in eval_data:
            ca = citation_accuracy(
                answer=item["answer"],
                citations=item.get("citations", []),
                expected_sources=item.get("expected_sources", []),
            )
            citation_scores.append(ca)

            rc = response_completeness(
                answer=item["answer"],
                ground_truth=item["ground_truth"],
            )
            completeness_scores.append(rc)

        avg_citation = sum(citation_scores) / len(citation_scores) if citation_scores else 0
        avg_completeness = sum(completeness_scores) / len(completeness_scores) if completeness_scores else 0

        report["metrics"]["citation_accuracy"] = round(avg_citation, 3)
        report["metrics"]["response_completeness"] = round(avg_completeness, 3)

        print(f"   Citation Accuracy:     {avg_citation:.3f}")
        print(f"   Response Completeness: {avg_completeness:.3f}")

    # Run RAGAS evaluation
    if args.ragas:
        print("\n[EVAL] Running RAGAS evaluation...")
        from src.evaluation.ragas_eval import run_ragas_evaluation

        ragas_scores = run_ragas_evaluation(eval_data, output_path=args.output)
        report["metrics"].update(ragas_scores)

        for metric, score in ragas_scores.items():
            if metric != "error":
                print(f"   {metric}: {score:.3f}")

    # Save report
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, default=str)

    print(f"\n[INFO] Report saved to: {args.output}")

    # Print summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    for metric, score in report["metrics"].items():
        if isinstance(score, (int, float)):
            status = "[OK]" if score >= 0.7 else "[WARN]" if score >= 0.5 else "[FAIL]"
            print(f"  {status} {metric}: {score:.3f}")


if __name__ == "__main__":
    main()

"""
Input sanitization and prompt injection detection.

Defends against:
- HTML/JS injection
- Prompt injection attempts (system prompt overrides)
- Excessive input length
- Malicious Unicode characters
"""

from __future__ import annotations

import re
import unicodedata
from typing import Optional

from config.logging_config import get_logger

logger = get_logger(__name__)

# Maximum allowed query length (characters)
MAX_QUERY_LENGTH = 500

# Patterns that indicate prompt injection attempts
INJECTION_PATTERNS = [
    # Direct system prompt manipulation
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"ignore\s+(all\s+)?above\s+instructions",
    r"forget\s+(all\s+)?previous",
    r"disregard\s+(all\s+)?(previous|above|prior)",
    r"override\s+(system|previous)\s+(prompt|instructions)",
    # Role-play exploitation
    r"you\s+are\s+now\s+a",
    r"act\s+as\s+(if\s+you\s+are\s+)?a",
    r"pretend\s+(you\s+are|to\s+be)",
    r"switch\s+to\s+.+\s+mode",
    # System prompt extraction
    r"(what|show|reveal|repeat|print)\s+(is\s+)?(your|the)\s+(system\s+)?prompt",
    r"(output|display|show)\s+(your|the)\s+instructions",
    # Delimiter manipulation
    r"\[system\]",
    r"\[INST\]",
    r"<\|im_start\|>",
    r"<\|system\|>",
    r"###\s*(system|instruction)",
    # Jailbreak patterns
    r"DAN\s+mode",
    r"developer\s+mode",
    r"jailbreak",
]

# Compile patterns for efficiency
COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]

# HTML/JS patterns to strip
HTML_JS_PATTERN = re.compile(r"<[^>]+>|javascript:|on\w+\s*=", re.IGNORECASE)


class SanitizationResult:
    """Result of input sanitization."""

    def __init__(
        self,
        sanitized_text: str,
        is_safe: bool,
        warnings: list[str] | None = None,
        blocked_reason: Optional[str] = None,
    ):
        self.sanitized_text = sanitized_text
        self.is_safe = is_safe
        self.warnings = warnings or []
        self.blocked_reason = blocked_reason


def sanitize_input(text: str) -> SanitizationResult:
    """
    Sanitize user input and check for prompt injection attempts.

    Steps:
    1. Strip HTML/JS tags
    2. Normalize Unicode
    3. Check length limits
    4. Detect prompt injection patterns
    5. Strip control characters

    Args:
        text: Raw user input.

    Returns:
        SanitizationResult with sanitized text and safety assessment.
    """
    warnings: list[str] = []

    if not text or not text.strip():
        return SanitizationResult(
            sanitized_text="",
            is_safe=False,
            blocked_reason="Empty input",
        )

    # Step 1: Normalize Unicode (prevent homoglyph attacks)
    sanitized = unicodedata.normalize("NFKC", text)

    # Step 2: Strip HTML/JS
    original = sanitized
    sanitized = HTML_JS_PATTERN.sub("", sanitized)
    if sanitized != original:
        warnings.append("HTML/JS content stripped")
        logger.warning("html_js_stripped", original_len=len(original))

    # Step 3: Remove control characters (except newlines and tabs)
    sanitized = "".join(
        char
        for char in sanitized
        if unicodedata.category(char)[0] != "C" or char in ("\n", "\t", "\r")
    )

    # Step 4: Check length
    if len(sanitized) > MAX_QUERY_LENGTH:
        sanitized = sanitized[:MAX_QUERY_LENGTH]
        warnings.append(f"Input truncated to {MAX_QUERY_LENGTH} characters")
        logger.warning("input_truncated", original_len=len(text))

    # Step 5: Check for prompt injection patterns
    for pattern in COMPILED_PATTERNS:
        if pattern.search(sanitized):
            logger.warning(
                "prompt_injection_detected",
                pattern=pattern.pattern,
                input_preview=sanitized[:50],
            )
            return SanitizationResult(
                sanitized_text="",
                is_safe=False,
                blocked_reason="Potential prompt injection detected. This incident has been logged.",
                warnings=["Prompt injection pattern detected"],
            )

    # Step 6: Final cleanup
    sanitized = sanitized.strip()

    return SanitizationResult(
        sanitized_text=sanitized,
        is_safe=True,
        warnings=warnings,
    )

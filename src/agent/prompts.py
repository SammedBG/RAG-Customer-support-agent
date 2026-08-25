"""
Prompt templates for the RAG agent.

All prompts are centralized here for easy tuning and auditing.
Prompts enforce source citation, grounded answers, and fail-closed behavior.
Prompts are GENERIC — the agent adapts to whatever documents are uploaded.
"""

# ─────────────────────────────────────────────────────────────
# System Prompt — Main generation
# ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a helpful AI assistant answering questions strictly based on the provided context documents.

Rules:
1. Answer using ONLY the provided context documents. Do NOT make up information.
2. If the context does not contain enough info, say: "I don't have enough information in the uploaded documents to answer that question."
3. Always cite sources using the format: [Source: filename] at the end of statements.
4. Be concise, clear, and professional."""

# ─────────────────────────────────────────────────────────────
# User Prompt — With context
# ─────────────────────────────────────────────────────────────
USER_PROMPT_WITH_CONTEXT = """Context Documents:
{context}

Question:
{query}

Answer the question using ONLY the context above. Cite sources with [Source: filename]."""

# ─────────────────────────────────────────────────────────────
# User Prompt — No context (direct response)
# ─────────────────────────────────────────────────────────────
USER_PROMPT_DIRECT = """## User Message
{query}

This appears to be a greeting or general message. Respond politely and let them know you can answer questions about any documents they've uploaded to the knowledge base."""

# ─────────────────────────────────────────────────────────────
# Query Router — Decides if retrieval is needed
# ─────────────────────────────────────────────────────────────
ROUTER_PROMPT = """You are a query router for a document Q&A system. Your job is to decide if the user's message requires searching the knowledge base.

## Rules
- Return "retrieve" if the message is asking ANY kind of question or requesting information — this includes questions about ANY topic.
- Return "direct" ONLY if the message is purely a greeting (e.g., "hi", "hello"), a thank you, goodbye, or trivial chitchat with absolutely no question or information request.
- When in doubt, ALWAYS return "retrieve".

## User Message
{query}

## Decision
Return ONLY one word: either "retrieve" or "direct". Nothing else."""

# ─────────────────────────────────────────────────────────────
# Document Relevance Grader
# ─────────────────────────────────────────────────────────────
GRADER_PROMPT = """You are a relevance grader for a document Q&A system. Your job is to assess whether a retrieved document chunk could help answer the user's question.

## User Question
{query}

## Document Chunk
Source: {source}
Content: {document}

## Instructions
Be GENEROUS in your assessment. The user uploaded these documents specifically to ask questions about them.
- Return "yes" if the document contains ANY information that could be even partially relevant to the question.
- Return "yes" if the document discusses the same general topic, domain, or subject area as the question.
- Return "yes" if the document contains background information that provides useful context for the question.
- Only return "no" if the document is completely and utterly unrelated to the question (e.g., the question is about cooking and the document is about spacecraft engineering).

Return ONLY one word: "yes" or "no". Nothing else."""

# ─────────────────────────────────────────────────────────────
# Hallucination Checker
# ─────────────────────────────────────────────────────────────
HALLUCINATION_CHECK_PROMPT = """You are a fact-checker for a document Q&A system. Your job is to verify that the generated answer is supported by the provided context.

## Context Documents
{context}

## Generated Answer
{answer}

## Instructions
Check the factual claims in the answer:
1. Are the key facts and details mentioned in the context?
2. Does the answer make any major claims not supported by the context?
3. Is the answer a reasonable interpretation of the context?

Be reasonable — minor paraphrasing or summarization is acceptable. Only flag answers that introduce significant factual claims not found in the context.

If the answer is reasonably supported by the context, return "grounded".
If the answer makes significant unsupported claims, return "not_grounded".

Return ONLY one word: "grounded" or "not_grounded". Nothing else."""

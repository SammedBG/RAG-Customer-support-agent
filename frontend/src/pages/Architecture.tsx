import React from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
  GitBranch,
  Search,
  CheckCircle2,
  FileCode,
} from 'lucide-react';

export default function Architecture() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-3xl mx-auto space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-100 border border-lime-300 text-lime-900 text-xs font-semibold">
          <GitBranch className="w-3.5 h-3.5" />
          Technical Blueprint
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Inside the RAG Pipeline
        </h1>
        <p className="text-lg text-slate-600">
          From document ingestion to grounded generation.
        </p>
      </motion.div>

      {/* Interactive Responsive HTML/CSS Pipeline Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.85, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm space-y-10"
      >
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
          <Zap className="w-5 h-5 text-lime-600" />
          End-to-End System Architecture Flow
        </h2>

        {/* Lane 1: Ingestion & Vector Storage */}
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block">
            Phase 1 — Ingestion & Vector Storage (LlamaIndex Data Plane)
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Company Documents', sub: 'PDF, MD, TXT, DOCX', color: 'bg-slate-100 text-slate-800' },
              { label: 'LlamaIndex Reader', sub: 'Multi-format loader', color: 'bg-slate-100 text-slate-800' },
              { label: 'Document Parsing', sub: 'SHA-256 deduplication', color: 'bg-slate-100 text-slate-800' },
              { label: 'Hierarchical Chunking', sub: '1024 Parent / 256 Child', color: 'bg-slate-100 text-slate-800' },
              { label: 'Dual Representation', sub: 'OpenAI Dense + BM25 Sparse', color: 'bg-slate-100 text-slate-800' },
              { label: 'Qdrant Vector DB', sub: 'Hybrid Collection Store', color: 'bg-lime-400 text-slate-950 font-bold border-lime-500' },
            ].map((step, idx) => (
              <div
                key={step.label}
                className={`p-3.5 rounded-xl border border-slate-200 text-center space-y-1 flex flex-col justify-center ${step.color}`}
              >
                <span className="text-xs font-bold block">{step.label}</span>
                <span className="text-[10px] opacity-75 font-mono block">{step.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider Arrow */}
        <div className="flex justify-center my-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            ↓ Dual Dense + Sparse Ingestion Complete ↓
          </span>
        </div>

        {/* Lane 2: Query Execution & LangGraph State Machine */}
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block">
            Phase 2 — Query Execution & Agent Orchestration (LangGraph State Machine)
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Customer Query', sub: 'User input question', color: 'bg-slate-900 text-white' },
              { label: 'LangGraph Router', sub: 'Intent classifier node', color: 'bg-slate-100 text-slate-800' },
              { label: 'Hybrid Retrieval', sub: 'Qdrant dense + sparse', color: 'bg-slate-100 text-slate-800' },
              { label: 'RRF Fusion & Rerank', sub: 'MS-MARCO cross-encoder', color: 'bg-slate-100 text-slate-800' },
              { label: 'LLM Generation', sub: 'Grounded response prompt', color: 'bg-slate-100 text-slate-800' },
              { label: 'Grounding & Citations', sub: 'Answer + [1] evidence', color: 'bg-lime-400 text-slate-950 font-bold border-lime-500' },
            ].map((step) => (
              <div
                key={step.label}
                className={`p-3.5 rounded-xl border border-slate-200 text-center space-y-1 flex flex-col justify-center ${step.color}`}
              >
                <span className="text-xs font-bold block">{step.label}</span>
                <span className="text-[10px] opacity-75 font-mono block">{step.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Three Detailed Architecture Groups */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.85, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {/* RETRIEVAL */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-lime-100 text-lime-800">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Retrieval Layer</h3>
          </div>

          <ul className="space-y-4 text-xs sm:text-sm">
            <li className="space-y-1">
              <span className="font-semibold text-slate-900 block">Dense Semantic Search</span>
              <p className="text-slate-600 leading-relaxed text-xs">
                Uses OpenAI <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">text-embedding-3-small</code> (1536 dimensions) to capture conceptual and contextual intent.
              </p>
            </li>
            <li className="space-y-1">
              <span className="font-semibold text-slate-900 block">Sparse / Keyword Search</span>
              <p className="text-slate-600 leading-relaxed text-xs">
                Uses FastEmbed BM25 sparse vectors to match specific serial numbers, product SKUs, and exact terminology.
              </p>
            </li>
            <li className="space-y-1">
              <span className="font-semibold text-slate-900 block">Reciprocal Rank Fusion (RRF)</span>
              <p className="text-slate-600 leading-relaxed text-xs">
                Merges candidate lists server-side on Qdrant using RRF score aggregation without manual weight tuning.
              </p>
            </li>
            <li className="space-y-1">
              <span className="font-semibold text-slate-900 block">Cross-Encoder Reranking</span>
              <p className="text-slate-600 leading-relaxed text-xs">
                Re-scores top candidate passages using MS-MARCO MiniLM cross-attention before building the LLM context prompt.
              </p>
            </li>
          </ul>
        </div>

        {/* ORCHESTRATION */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-lime-100 text-lime-800">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Orchestration State</h3>
          </div>

          <ul className="space-y-4 text-xs sm:text-sm">
            <li className="space-y-1">
              <span className="font-semibold text-slate-900 block">LangGraph State Machine</span>
              <p className="text-slate-600 leading-relaxed text-xs">
                Compiled state graph controlling transitions between routing, retrieval, document grading, and generation.
              </p>
            </li>
            <li className="space-y-1">
              <span className="font-semibold text-slate-900 block">Retrieval Routing</span>
              <p className="text-slate-600 leading-relaxed text-xs">
                Classifies incoming queries into direct responses (greetings/chitchat) versus knowledge-retrieval execution paths.
              </p>
            </li>
            <li className="space-y-1">
              <span className="font-semibold text-slate-900 block">Relevance Validation</span>
              <p className="text-slate-600 leading-relaxed text-xs">
                Evaluates retrieved document chunks and filters out irrelevant context before invoking the generator model.
              </p>
            </li>
            <li className="space-y-1">
              <span className="font-semibold text-slate-900 block">Bounded Retries & Safe Fallback</span>
              <p className="text-slate-600 leading-relaxed text-xs">
                If document grading fails, triggers up to 2 retrieval retries before safely defaulting to an insufficient-evidence message.
              </p>
            </li>
          </ul>
        </div>

        {/* RELIABILITY */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-lime-100 text-lime-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Reliability & Governance</h3>
          </div>

          <ul className="space-y-4 text-xs sm:text-sm">
            <li className="space-y-1">
              <span className="font-semibold text-slate-900 block">Source Citations</span>
              <p className="text-slate-600 leading-relaxed text-xs">
                Attaches structured Citation objects detailing exact source document filenames, chunk text, and page numbers.
              </p>
            </li>
            <li className="space-y-1">
              <span className="font-semibold text-slate-900 block">Grounding Verification</span>
              <p className="text-slate-600 leading-relaxed text-xs">
                Post-generation check verifies that generated claims are fully supported by retrieved evidence.
              </p>
            </li>
            <li className="space-y-1">
              <span className="font-semibold text-slate-900 block">RAGAS Quality Framework</span>
              <p className="text-slate-600 leading-relaxed text-xs">
                Calculates faithfulness, answer relevancy, context precision, and context recall scores against ground truth.
              </p>
            </li>
            <li className="space-y-1">
              <span className="font-semibold text-slate-900 block">DeepEval Regression Testing</span>
              <p className="text-slate-600 leading-relaxed text-xs">
                Executes quality gate assertions during CI/CD to prevent retrieval or prompt regressions.
              </p>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

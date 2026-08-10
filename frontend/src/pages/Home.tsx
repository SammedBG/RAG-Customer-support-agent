import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bot,
  Layers,
  ArrowRight,
  Shield,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Cpu,
  Lock,
  Sparkles,
  Rocket,
  Building2,
  FileText,
  Clock,
  UploadCloud,
  Code,
  Workflow,
  Zap,
} from 'lucide-react';
import { fetchEvaluationMetrics } from '../services/evaluation.service';
import { EvaluationMetrics } from '../types';

interface HomeProps {
  onOpenCustomRequest?: () => void;
}

export default function Home({ onOpenCustomRequest }: HomeProps) {
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    fetchEvaluationMetrics().then(setMetrics);
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="pt-16 pb-8 text-center max-w-4xl mx-auto px-4"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-100 border border-lime-300 text-lime-900 text-xs font-semibold mb-8">
          <span className="w-2 h-2 rounded-full bg-lime-600 animate-pulse" />
          Neura RAG Engine
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
          Customer Support, Grounded in Your Knowledge.{' '}
          <span className="block text-lime-600 mt-1">Answers You Can Verify.</span>
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          An intelligent customer support agent that retrieves company knowledge, generates grounded responses, and provides verifiable source citations.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <NavLink
            to="/agent"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-lime-400 text-slate-950 font-bold text-base hover:bg-lime-300 transition-all shadow-md hover:shadow-lime-500/20"
          >
            <Bot className="w-5 h-5" />
            Try Live Agent
          </NavLink>
          <NavLink
            to="/architecture"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white border border-slate-200 text-slate-800 font-semibold text-base hover:bg-slate-50 transition-all shadow-xs"
          >
            <Layers className="w-5 h-5 text-slate-600" />
            Explore Architecture
          </NavLink>
        </div>

        {/* Technology Strip */}
        <div className="pt-8 border-t border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-4">
            Engineered With Production Stack
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-semibold text-slate-700">
            {['LangGraph', 'LlamaIndex', 'Qdrant', 'FastAPI', 'RAGAS', 'DeepEval'].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-200 shadow-2xs font-mono text-slate-800"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* RAG Evaluation Section */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-lime-700 uppercase tracking-wider mb-1">
                <BarChart3 className="w-4 h-4" />
                Benchmark Governance
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">RAG Evaluation</h2>
              <p className="text-sm text-slate-500 mt-1">
                Quality metrics evaluated against a golden dataset of test questions.
              </p>
            </div>

            <NavLink
              to="/evaluation"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-lime-700 hover:text-lime-800 transition-colors"
            >
              Open Evaluation Dashboard
              <ArrowRight className="w-4 h-4" />
            </NavLink>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                title: 'Faithfulness',
                desc: 'Factual alignment with context',
                value: metrics?.faithfulness,
              },
              {
                title: 'Answer Relevancy',
                desc: 'Directness & completeness',
                value: metrics?.answerRelevancy,
              },
              {
                title: 'Context Precision',
                desc: 'Signal-to-noise ratio in chunks',
                value: metrics?.contextPrecision,
              },
              {
                title: 'Context Recall',
                desc: 'Coverage of required ground truth',
                value: metrics?.contextRecall,
              },
            ].map((m, idx) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="p-5 rounded-xl bg-slate-50 border border-slate-200"
              >
                <span className="text-xs font-semibold text-slate-500 block mb-1">{m.title}</span>
                <div className="text-2xl font-bold text-slate-900 my-1">
                  {m.value !== undefined && m.value !== null ? (
                    <span className="text-lime-700 font-mono">{(m.value * 100).toFixed(1)}%</span>
                  ) : (
                    <span className="text-slate-400 text-lg font-normal">—</span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 block">{m.desc}</span>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
            <div>
              {!metrics?.isEvaluated && (
                <span className="text-slate-500 italic">
                  Not evaluated yet. Run benchmark to populate evaluation metrics.
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 font-mono text-slate-600">
              <span>Dataset: {metrics?.datasetSize || 20} questions</span>
              <span>•</span>
              <span>Last evaluated: {metrics?.lastEvaluated || 'Never'}</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Engineered for Reliable Retrieval (3 Categories) */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12"
      >
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-lime-700 uppercase tracking-widest block mb-2">
            Technical Architecture
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Engineered for Reliable Retrieval
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* CATEGORY 1 — RETRIEVAL */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center font-bold">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Retrieval Pipeline
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-0.5">Hybrid Search</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Combines semantic vector retrieval with BM25 lexical search via Qdrant RRF.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-0.5">Hierarchical Chunking</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Uses small chunks for vector retrieval while preserving broader 1024-token parent context.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-0.5">Cross-Encoder Reranking</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Re-scores retrieved candidates with MS-MARCO cross-encoders before generation.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CATEGORY 2 — RELIABILITY */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Reliability & Safety
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-0.5">Verifiable Citations</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Every supported answer links back to exact markdown source files and page evidence.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-0.5">Grounding Verification</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    LangGraph state node evaluates whether generated claims are supported by context.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-0.5">Safe Fallback</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Returns an insufficient-evidence response instead of fabricating ungrounded claims.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CATEGORY 3 — EVALUATION */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Quality Evaluation
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-0.5">RAGAS Framework</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Evaluates faithfulness, relevancy, context precision, and context recall.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-0.5">DeepEval Regression Tests</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Runs quality assertions against a 20-pair ground truth golden dataset.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-0.5">Structured Traceability</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Tracks query rewrite, candidate counts, execution latency, and step decisions.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Security-Focused Architecture */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-lime-400 text-xs font-mono font-semibold border border-slate-700">
              <Lock className="w-3.5 h-3.5" />
              Security Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Security-Focused Architecture
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Designed with defense-in-depth security principles at every layer of the API and agent state machine.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
              {[
                'JWT Authentication',
                'Token Bucket Rate Limiting',
                'Input Sanitation & Escaping',
                'Structured Audit Logging',
                'Secret Environment Storage',
                'Prompt-Injection Defenses',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-lime-400 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* How It Works for Clients & Businesses */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12"
      >
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-100 border border-lime-300 text-lime-900 text-xs font-semibold">
            <Workflow className="w-3.5 h-3.5" />
            Client Implementation Flow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How It Works for Your Business
          </h2>
          <p className="text-slate-600 text-base">
            Deploying a custom AI support agent for your company takes 4 simple steps with zero technical overhead on your end.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-lime-700 bg-lime-100 px-2.5 py-1 rounded-full">
                  STEP 01
                </span>
                <UploadCloud className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Send Your Documents</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Send your company PDFs, Notion docs, user guides, or website FAQs. No formatting needed.
              </p>
            </div>
            <div className="text-[11px] font-mono text-slate-400 border-t border-slate-100 pt-3">
              Supported: PDF, MD, DOCX, TXT
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-lime-700 bg-lime-100 px-2.5 py-1 rounded-full">
                  STEP 02
                </span>
                <Cpu className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Vector Indexing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We chunk and index your knowledge into Qdrant with dual dense + BM25 sparse vectors.
              </p>
            </div>
            <div className="text-[11px] font-mono text-slate-400 border-t border-slate-100 pt-3">
              Zero-hallucination verification
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-lime-700 bg-lime-100 px-2.5 py-1 rounded-full">
                  STEP 03
                </span>
                <Sparkles className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Custom Branding</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We customize the widget colors, logo, prompt chips, and prompt guardrails for your brand.
              </p>
            </div>
            <div className="text-[11px] font-mono text-slate-400 border-t border-slate-100 pt-3">
              Tailored brand tone & rules
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-lime-700 bg-lime-100 px-2.5 py-1 rounded-full">
                  STEP 04
                </span>
                <Code className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">1-Line Embed Code</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Paste a single script tag into your website. Your AI Agent goes live 24/7 immediately.
              </p>
            </div>
            <div className="text-[11px] font-mono text-slate-400 border-t border-slate-100 pt-3">
              Instant site deployment
            </div>
          </div>
        </div>
      </motion.section>

      {/* Custom AI Agent Solutions for Businesses */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-lime-950 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="max-w-3xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-300 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Custom Enterprise Services
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Need a Custom AI Agent Built for Your Company?
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              We engineer grounded, zero-hallucination RAG customer support agents customized for your company's proprietary documents, internal knowledge bases, and brand identity.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl space-y-1.5">
                <FileText className="w-5 h-5 text-lime-400" />
                <h4 className="font-bold text-white text-sm">Your Custom Docs</h4>
                <p className="text-xs text-slate-400">PDFs, Notion, API specs, Markdown & database indexing.</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl space-y-1.5">
                <Shield className="w-5 h-5 text-lime-400" />
                <h4 className="font-bold text-white text-sm">Citation & Safety</h4>
                <p className="text-xs text-slate-400">100% source page citations with zero fabricated claims.</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl space-y-1.5">
                <Clock className="w-5 h-5 text-lime-400" />
                <h4 className="font-bold text-white text-sm">48-Hour Setup</h4>
                <p className="text-xs text-slate-400">Fast deployment directly embedded into your website.</p>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={onOpenCustomRequest}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-lime-400 text-slate-950 font-bold text-sm sm:text-base hover:bg-lime-300 transition-all shadow-md hover:shadow-lime-500/20 cursor-pointer"
              >
                <Rocket className="w-5 h-5" />
                Request Custom AI Agent Build
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Technical FAQ */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-lime-700 uppercase tracking-widest block mb-2">
            Technical FAQ
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Technical Questions
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'How does Neura reduce hallucinations?',
              a: 'Neura executes a LangGraph state machine. After generating an answer, a dedicated Grounding Verification node compares response claims against retrieved document chunks. If claims lack support, the system triggers a retry loop or returns a safe fallback.',
            },
            {
              q: 'How does hybrid retrieval work?',
              a: 'Dense vector embeddings (OpenAI text-embedding-3-small) capture semantic intent while sparse BM25 vectors index exact terminology. Candidate results are merged server-side using Qdrant Reciprocal Rank Fusion (RRF).',
            },
            {
              q: 'Why use reranking?',
              a: 'Vector similarity search operates on broad feature spaces. A cross-encoder reranker rescores the top RRF candidate chunks using full self-attention, ensuring only top-relevance context reaches the LLM prompt window.',
            },
            {
              q: 'How are citations generated?',
              a: 'During generation, the LLM is instructed to append bracketed citation keys [1], [2] referencing specific source documents. The agent constructs structured Citation objects detailing source files, snippet text, and relevance scores.',
            },
            {
              q: 'What happens when relevant information cannot be found?',
              a: 'If document grading fails to find relevant chunks or if similarity thresholds are not met, the agent returns an explicit fallback message indicating insufficient evidence rather than guessing.',
            },
            {
              q: 'How is RAG quality evaluated?',
              a: 'Quality is measured using RAGAS & DeepEval test suites over a 20-pair ground truth dataset. Automated benchmark runs score Faithfulness, Answer Relevancy, Context Precision, and Context Recall.',
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left p-5 font-semibold text-slate-900 text-sm flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <span>{item.q}</span>
                <HelpCircle className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-lime-600' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

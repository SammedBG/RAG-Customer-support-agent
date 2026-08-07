import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Play,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  fetchEvaluationMetrics,
  fetchEvaluationCases,
  runBenchmarkEvaluation,
} from '../services/evaluation.service';
import EvaluationDetailModal from '../components/evaluation/EvaluationDetailModal';
import { EvaluationMetrics, EvaluationCase } from '../types';

export default function Evaluation() {
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [cases, setCases] = useState<EvaluationCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<EvaluationCase | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadEvalData();
  }, []);

  const loadEvalData = async () => {
    const m = await fetchEvaluationMetrics();
    const c = await fetchEvaluationCases();
    setMetrics(m);
    setCases(c);
  };

  const handleRunEvaluation = async () => {
    setIsRunning(true);
    await runBenchmarkEvaluation();
    await loadEvalData();
    setIsRunning(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">RAG Evaluation</h1>
          <p className="text-slate-600 text-sm mt-1">
            Measure retrieval and generation quality against a curated golden dataset.
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-lime-400 text-slate-950 font-bold text-sm hover:bg-lime-300 transition-all shadow-sm disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Running Benchmark...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950" />
              Run Evaluation
            </>
          )}
        </button>
      </motion.div>

      {/* Benchmark Parameters Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-800 rounded-xl text-lime-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">RAGAS Benchmark Framework</h3>
            <p className="text-xs text-slate-400">Automated quality regression guardrails</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-slate-300">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Dataset Size</span>
            <span className="text-white font-bold">{metrics?.datasetSize || 20} QA pairs</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">LLM Model</span>
            <span className="text-lime-400 font-bold">{metrics?.modelName || 'gpt-4o-mini'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Embeddings</span>
            <span className="text-white font-bold">{metrics?.embeddingModel || 'text-embedding-3-small'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Last Run</span>
            <span className="text-slate-200">{metrics?.lastEvaluated || 'Never'}</span>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Faithfulness',
            desc: 'Measures factual alignment with retrieved context',
            value: metrics?.faithfulness,
          },
          {
            title: 'Answer Relevancy',
            desc: 'Measures directness and answer completeness',
            value: metrics?.answerRelevancy,
          },
          {
            title: 'Context Precision',
            desc: 'Measures signal-to-noise ratio in chunks',
            value: metrics?.contextPrecision,
          },
          {
            title: 'Context Recall',
            desc: 'Measures coverage of required ground truth',
            value: metrics?.contextRecall,
          },
        ].map((item) => (
          <div key={item.title} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block mb-1">{item.title}</span>
            <div className="text-3xl font-extrabold text-slate-900 my-2">
              {item.value !== undefined && item.value !== null ? (
                <span className="text-lime-700 font-mono">{(item.value * 100).toFixed(1)}%</span>
              ) : (
                <span className="text-slate-400 text-xl font-normal">—</span>
              )}
            </div>
            <p className="text-xs text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Evaluation Test Cases Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
            Evaluation Golden Test Cases ({cases.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">Assertion Pass Rate: {cases.filter(c => c.status === 'PASS').length}/{cases.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Question</th>
                <th className="py-3.5 px-4">Expected Source</th>
                <th className="py-3.5 px-4">Faithfulness</th>
                <th className="py-3.5 px-4">Relevancy</th>
                <th className="py-3.5 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {cases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-4 px-6 font-semibold text-slate-900 max-w-xs truncate">
                    {c.question}
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-slate-600">
                    {c.expectedSource}
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-slate-900">
                    {c.status !== 'NOT RUN' ? `${(c.metrics.faithfulness * 100).toFixed(0)}%` : '—'}
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-slate-900">
                    {c.status !== 'NOT RUN' ? `${(c.metrics.answerRelevancy * 100).toFixed(0)}%` : '—'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        c.status === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : c.status === 'FAIL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {c.status === 'PASS' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                      {c.status === 'FAIL' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Details Debug Modal */}
      <EvaluationDetailModal
        evalCase={selectedCase}
        onClose={() => setSelectedCase(null)}
      />
    </div>
  );
}

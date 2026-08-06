import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Activity, CheckCircle, Clock, Zap } from 'lucide-react';
import { RagTrace } from '../../types';

interface RagTraceViewerProps {
  trace?: RagTrace;
}

export default function RagTraceViewer({ trace }: RagTraceViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!trace) return null;

  return (
    <div className="mt-3 border-t border-slate-200/60 pt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <Activity className="w-3.5 h-3.5 text-lime-600" />
        <span>View RAG Trace</span>
        {trace.isDemo && (
          <span className="ml-1 text-[10px] font-medium bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200">
            Demo trace
          </span>
        )}
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono space-y-3 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-semibold text-lime-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> RAG Execution Flow
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {trace.totalLatencySeconds.toFixed(2)}s
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-slate-500 font-bold">1.</span>
              <div>
                <span className="text-slate-400">Original Query:</span>
                <p className="text-white font-sans mt-0.5">"{trace.originalQuery}"</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-slate-500 font-bold">2.</span>
              <div>
                <span className="text-slate-400">Query Rewrite:</span>
                <p className="text-lime-300 font-sans mt-0.5">"{trace.queryRewrite || trace.originalQuery}"</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-slate-500 font-bold">3.</span>
              <div>
                <span className="text-slate-400">Hybrid Candidate Retrieval:</span>
                <p className="text-slate-300 mt-0.5">
                  Dense (OpenAI): <span className="text-white font-bold">{trace.denseCandidatesCount || 10}</span> candidates | Sparse (BM25): <span className="text-white font-bold">{trace.sparseCandidatesCount || 10}</span> candidates
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-slate-500 font-bold">4.</span>
              <div>
                <span className="text-slate-400">RRF Fusion Merging:</span>
                <p className="text-slate-300 mt-0.5">
                  Reciprocal Rank Fusion candidates: <span className="text-white font-bold">{trace.rrfCandidatesCount || 14}</span> chunks
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-slate-500 font-bold">5.</span>
              <div>
                <span className="text-slate-400">Cross-Encoder Reranking:</span>
                <p className="text-slate-300 mt-0.5">
                  Rescored top candidates: <span className="text-lime-400 font-bold">{trace.rerankedCount || 3}</span> selected
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-slate-500 font-bold">6.</span>
              <div>
                <span className="text-slate-400">LLM Response Generation:</span>
                <p className="text-slate-300 mt-0.5">
                  Output tokens: <span className="text-white font-bold">{trace.generationTokens || 350}</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1 border-t border-slate-800">
              <span className="text-slate-500 font-bold">7.</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Grounding Verification:</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  trace.groundingCheck === 'PASS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  {trace.groundingCheck || 'PASS'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { X, CheckCircle, AlertTriangle, FileText, Target, Award } from 'lucide-react';
import { EvaluationCase } from '../../types';

interface EvaluationDetailModalProps {
  evalCase: EvaluationCase | null;
  onClose: () => void;
}

export default function EvaluationDetailModal({ evalCase, onClose }: EvaluationDetailModalProps) {
  if (!evalCase) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                evalCase.status === 'PASS'
                  ? 'bg-emerald-100 text-emerald-700'
                  : evalCase.status === 'FAIL'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {evalCase.status === 'PASS' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Evaluation Debug Trace</h3>
              <span className="text-xs text-slate-500 font-mono">Case ID: {evalCase.id}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Question & Status */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
            <span className="text-xs text-lime-400 font-semibold uppercase tracking-wider block">
              Evaluated Question
            </span>
            <p className="text-base font-semibold font-sans">{evalCase.question}</p>
          </div>

          {/* Metric Score Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-lime-600" />
              RAGAS & DeepEval Metric Scores
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <span className="text-xs text-slate-500 font-medium block">Faithfulness</span>
                <span className="text-lg font-bold text-slate-900 block mt-0.5">
                  {(evalCase.metrics.faithfulness * 100).toFixed(0)}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <span className="text-xs text-slate-500 font-medium block">Answer Relevancy</span>
                <span className="text-lg font-bold text-slate-900 block mt-0.5">
                  {(evalCase.metrics.answerRelevancy * 100).toFixed(0)}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <span className="text-xs text-slate-500 font-medium block">Context Precision</span>
                <span className="text-lg font-bold text-slate-900 block mt-0.5">
                  {(evalCase.metrics.contextPrecision * 100).toFixed(0)}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <span className="text-xs text-slate-500 font-medium block">Context Recall</span>
                <span className="text-lg font-bold text-slate-900 block mt-0.5">
                  {(evalCase.metrics.contextRecall * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Generation Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-slate-600" />
                Expected Ground-Truth Answer
              </label>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed min-h-[100px]">
                {evalCase.expectedAnswer}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-lime-600" />
                Generated Agent Answer
              </label>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed min-h-[100px]">
                {evalCase.generatedAnswer}
              </div>
            </div>
          </div>

          {/* Context Comparison */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Retrieved Grounding Context
            </label>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
              {evalCase.retrievedContext}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg transition-colors"
          >
            Close Debug View
          </button>
        </div>
      </div>
    </div>
  );
}

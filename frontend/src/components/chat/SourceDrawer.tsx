import React from 'react';
import { X, FileText, CheckCircle2, Layers, ExternalLink } from 'lucide-react';
import { Citation } from '../../types';

interface SourceDrawerProps {
  citation: Citation | null;
  onClose: () => void;
  onViewDocument?: (docName: string) => void;
}

export default function SourceDrawer({ citation, onClose, onViewDocument }: SourceDrawerProps) {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-lime-600" />
            <h3 className="font-semibold text-slate-900 text-base">Source Evidence</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 font-medium block">Source File</span>
              <span className="text-sm font-semibold text-slate-900 truncate block mt-0.5">
                {citation.source}
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 font-medium block">Page / Section</span>
              <span className="text-sm font-semibold text-slate-900 block mt-0.5">
                {citation.page ? `Page ${citation.page}` : 'Section 1'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 font-medium block">Retrieval Score</span>
              <span className="text-sm font-semibold text-lime-600 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {(citation.relevance_score * 100).toFixed(1)}% ({citation.relevance_score.toFixed(3)})
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 font-medium block">Retrieval Method</span>
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                Hybrid (Dense+BM25)
              </span>
            </div>
          </div>

          {/* Passage Content */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Retrieved Passage Context
            </label>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 leading-relaxed font-mono text-xs whitespace-pre-wrap">
              "{citation.chunk_text}"
            </div>
          </div>

          {/* Chunk ID */}
          <div className="text-xs text-slate-500 flex justify-between items-center pt-2">
            <span>Chunk ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">chunk_ref_{citation.source.replace('.', '_')}</code></span>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={() => {
              if (onViewDocument) onViewDocument(citation.source);
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            View Full Document
          </button>
        </div>
      </div>
    </div>
  );
}

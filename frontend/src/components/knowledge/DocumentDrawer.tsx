import React from 'react';
import { X, FileText, Database, Layers, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { DocumentItem } from '../../types';

interface DocumentDrawerProps {
  document: DocumentItem | null;
  onClose: () => void;
  onReindex?: (doc: DocumentItem) => void;
  onDelete?: (doc: DocumentItem) => void;
}

export default function DocumentDrawer({
  document,
  onClose,
  onReindex,
  onDelete,
}: DocumentDrawerProps) {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-slate-700" />
            <div>
              <h3 className="font-semibold text-slate-900 text-base truncate max-w-xs">
                {document.name}
              </h3>
              <span className="text-xs text-slate-500 font-mono">ID: {document.id}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Indexing Status
              </span>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-lime-500" />
                {document.status}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Chunks
              </span>
              <span className="text-sm font-bold text-slate-900 font-mono">
                {document.chunksCount ?? '—'}
              </span>
            </div>
          </div>

          {/* Technical Ingestion Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Pipeline Metadata
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">File Size</span>
                <span className="font-semibold text-slate-800 font-mono">{document.fileSize || '1.0 MB'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">Format</span>
                <span className="font-semibold text-slate-800 font-mono">{document.type}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">Embedding Model</span>
                <span className="font-semibold text-slate-800 font-mono">{document.embeddingModel || 'BAAI/bge-small-en-v1.5'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">Chunk Strategy</span>
                <span className="font-semibold text-slate-800 font-mono">{document.chunkingStrategy || 'Hierarchical'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">Parent / Child Size</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {document.parentChunkSize || 1024} / {document.childChunkSize || 256}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">Overlap Tokens</span>
                <span className="font-semibold text-slate-800 font-mono">{document.overlapTokens || 64}</span>
              </div>
            </div>
          </div>

          {/* Chunk Previews */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Indexed Chunk Samples
              </h4>
              <span className="text-xs text-slate-500">
                {document.previewChunks?.length || 0} samples
              </span>
            </div>

            {document.previewChunks && document.previewChunks.length > 0 ? (
              <div className="space-y-2.5">
                {document.previewChunks.map((chunk, idx) => (
                  <div
                    key={chunk.id || idx}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200/60 pb-1.5 font-mono">
                      <span>Chunk #{idx + 1}</span>
                      {chunk.page && <span>Page {chunk.page}</span>}
                    </div>
                    <p className="text-slate-700 leading-relaxed font-sans pt-1">{chunk.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 text-xs italic">
                No preview chunks available until ingestion completes.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
          <button
            onClick={() => {
              if (onReindex) onReindex(document);
            }}
            className="flex-1 py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
            Reindex Document
          </button>

          <button
            onClick={() => {
              if (onDelete) onDelete(document);
              onClose();
            }}
            className="py-2.5 px-4 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

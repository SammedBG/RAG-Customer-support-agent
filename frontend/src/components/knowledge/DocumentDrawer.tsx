import React from 'react';
import { X, FileText, Database, Layers, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { DocumentItem } from '../../types';

interface DocumentDrawerProps {
  document: DocumentItem | null;
  onClose: () => void;
  onReindex?: (id: string) => void;
  onDelete?: (id: string) => void;
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Document Specifications
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs text-slate-500 font-medium block">Status</span>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded mt-1 ${
                  document.status === 'Indexed' ? 'bg-emerald-100 text-emerald-800' : document.status === 'Processing' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {document.status}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs text-slate-500 font-medium block">File Type / Size</span>
                <span className="text-sm font-semibold text-slate-900 block mt-0.5">
                  {document.type} ({document.fileSize || 'N/A'})
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs text-slate-500 font-medium block">Chunks Generated</span>
                <span className="text-sm font-semibold text-slate-900 block mt-0.5">
                  {document.chunksCount ?? '—'} chunks
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs text-slate-500 font-medium block">Last Indexed</span>
                <span className="text-sm font-semibold text-slate-900 block mt-0.5">
                  {document.lastIndexed}
                </span>
              </div>
            </div>
          </div>

          {/* Ingestion Strategy */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-lime-600" />
              Chunking & Embedding Strategy
            </h4>
            <div className="p-4 bg-slate-900 text-slate-200 rounded-lg text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Embedding Model:</span>
                <span className="text-lime-400 font-bold">{document.embeddingModel || 'text-embedding-3-small'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chunk Strategy:</span>
                <span className="text-white font-bold">{document.chunkingStrategy || 'Hierarchical Parent/Child'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Parent Chunk Size:</span>
                <span className="text-white font-bold">{document.parentChunkSize || 1024} tokens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Child Chunk Size:</span>
                <span className="text-white font-bold">{document.childChunkSize || 256} tokens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Overlap:</span>
                <span className="text-white font-bold">{document.overlapTokens || 64} tokens</span>
              </div>
            </div>
          </div>

          {/* Chunk Previews */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-700" />
                Preview Chunks
              </span>
              <span className="text-slate-400 font-normal">
                {document.previewChunks?.length || 0} previews
              </span>
            </h4>

            {document.previewChunks && document.previewChunks.length > 0 ? (
              <div className="space-y-3">
                {document.previewChunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1"
                  >
                    <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                      <span>Chunk ID: {chunk.id}</span>
                      <span>Page {chunk.page || 1}</span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-sans">
                      "{chunk.text}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
                No preview chunks available until ingestion completes.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
          <button
            onClick={() => {
              if (onReindex) onReindex(document.id);
            }}
            className="flex-1 py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
            Reindex Document
          </button>

          <button
            onClick={() => {
              if (onDelete) onDelete(document.id);
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

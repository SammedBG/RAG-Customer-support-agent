import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Eye,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
} from 'lucide-react';
import {
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  reindexDocument,
} from '../services/documents.service';
import DocumentDrawer from '../components/knowledge/DocumentDrawer';
import { DocumentItem } from '../types';

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    const docs = await fetchDocuments();
    setDocuments(docs);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const file = files[0];
    await uploadDocument(file);
    await loadDocs();
    setIsUploading(false);
  };

  const handleDelete = async (id: string) => {
    await deleteDocument(id);
    await loadDocs();
  };

  const handleReindex = async (id: string) => {
    await reindexDocument(id);
    await loadDocs();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Knowledge Base</h1>
          <p className="text-slate-600 text-sm mt-1">
            Manage the documents Neura uses to answer customer questions.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-lime-400 text-slate-950 font-bold text-sm hover:bg-lime-300 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Upload Documents
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
          accept=".pdf,.md,.markdown,.txt,.docx"
        />
      </div>

      {/* Upload Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-lime-500 bg-lime-50/50 scale-[1.005]'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50'
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center mx-auto mb-4">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 text-base mb-1">
          {isUploading ? 'Ingesting Document...' : 'Drop documents here or click to browse'}
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
          Supported formats: <strong className="text-slate-700">PDF, Markdown, TXT, DOCX</strong>
        </p>
        <span className="inline-block text-[11px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded">
          Dual Dense + BM25 Sparse Indexing Engine
        </span>
      </div>

      {/* Document Management Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
            Indexed Documents ({documents.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">Qdrant Collection: customer_support_docs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Document</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Chunks</th>
                <th className="py-3.5 px-4">Last Indexed</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                  {/* Document Name */}
                  <td className="py-4 px-6 font-medium text-slate-900 flex items-center gap-3">
                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                    <div>
                      <span className="block font-semibold">{doc.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{doc.fileSize || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-4 px-4 font-mono text-xs text-slate-600">
                    {doc.type}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        doc.status === 'Indexed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : doc.status === 'Processing'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {doc.status === 'Indexed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {doc.status === 'Processing' && <Clock className="w-3 h-3 text-amber-600 animate-spin" />}
                      {doc.status === 'Failed' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                      {doc.status}
                    </span>
                  </td>

                  {/* Chunks */}
                  <td className="py-4 px-4 font-mono text-xs text-slate-700">
                    {doc.chunksCount !== null ? `${doc.chunksCount} chunks` : '—'}
                  </td>

                  {/* Last Indexed */}
                  <td className="py-4 px-4 text-xs text-slate-500">
                    {doc.lastIndexed}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center gap-1"
                        title="View Document Details & Chunks"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => handleReindex(doc.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Reindex"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Details Drawer */}
      <DocumentDrawer
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onReindex={handleReindex}
        onDelete={handleDelete}
      />
    </div>
  );
}

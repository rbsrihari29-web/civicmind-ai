import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, FileText, CheckCircle2, BookOpen, Layers, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export const KnowledgeBasePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const res = await api.getDocuments();
      setData(res);
    } catch (e) {
      console.error('Failed to load documents', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    setMessage(null);
    try {
      const res = await api.reindexDocuments();
      setMessage(res.message);
      await loadDocs();
    } catch (e: any) {
      alert(`Re-indexing failed: ${e.message}`);
    } finally {
      setReindexing(false);
    }
  };

  if (loading || !data) {
    return <div className="p-16 text-center text-xs text-slate-500">Loading civic knowledge documents...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            <span>Civic Knowledge Base & RAG Index</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official municipal charters, standard operating procedures, and solid waste management bylaws indexed in FAISS vector store.
          </p>
        </div>

        <button
          onClick={handleReindex}
          disabled={reindexing}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin' : ''}`} />
          <span>{reindexing ? 'Re-indexing Documents...' : 'Re-index Vector Store'}</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* RAG Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Source Documents</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">{data.total_documents}</div>
          <div className="text-[11px] text-slate-400 mt-1">Verified municipal guidelines</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Indexed Chunks</div>
          <div className="text-3xl font-extrabold text-indigo-600 mt-1">{data.total_chunks_indexed}</div>
          <div className="text-[11px] text-indigo-700 font-medium mt-1">Preserving section & SLA metadata</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vector Store Architecture</div>
          <div className="text-xl font-extrabold text-slate-900 mt-2 font-mono">FAISS IndexFlatIP</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Normalized inner product search</div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
          Indexed Civic Governance Documents
        </div>

        <div className="divide-y divide-slate-100">
          {data.documents.map((doc: any, idx: number) => (
            <div key={idx} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-sm">{doc.title}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Filename: <span className="font-mono text-slate-600">{doc.filename}</span> &bull; {(doc.size_bytes / 1024).toFixed(1)} KB
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified & Indexed</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldAlert, MapPin, Clock, CheckCircle2, AlertTriangle, 
  Bot, FileDown, Copy, Check, Sparkles, Layers, ChevronRight, User
} from 'lucide-react';
import { api } from '../services/api';
import { Incident, DuplicateMatchCandidate, ComplaintDraft } from '../types';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const incidentId = parseInt(id || '0');

  const [incident, setIncident] = useState<Incident | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateMatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Complaint Draft State
  const [draft, setDraft] = useState<ComplaintDraft | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // AI Assistant Chat Drawer State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'assistant'; text: string; citations?: any[] }>>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (incidentId) {
      loadIncidentData();
    }
  }, [incidentId]);

  const loadIncidentData = async () => {
    try {
      setLoading(true);
      const inc = await api.getIncident(incidentId);
      setIncident(inc);

      // Load duplicates
      try {
        const dups = await api.getIncidentDuplicates(incidentId);
        setDuplicates(dups);
      } catch (e) {
        console.warn('Duplicate candidates fetch warning', e);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load incident record');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateComplaint = async () => {
    setDraftLoading(true);
    try {
      const res = await api.generateComplaintDraft(incidentId);
      setDraft(res);
    } catch (e: any) {
      alert(`Complaint drafting failed: ${e.message}`);
    } finally {
      setDraftLoading(false);
    }
  };

  const handleCopyDraft = () => {
    if (!draft) return;
    const text = `${draft.subject}\n\n${draft.salutation}\n\n${draft.body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const res = await api.askAssistant(userText, incidentId);
      setChatHistory(prev => [...prev, { 
        sender: 'assistant', 
        text: res.response,
        citations: res.citations 
      }]);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { 
        sender: 'assistant', 
        text: `Error contacting assistant: ${err.message}` 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return <div className="p-16 text-center text-xs text-slate-500">Loading incident data...</div>;
  }

  if (error || !incident) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white rounded-2xl border border-rose-200 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Incident Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'The requested incident does not exist.'}</p>
        <Link to="/reports" className="inline-block text-xs font-semibold text-blue-600 hover:underline">
          &larr; Return to Reports
        </Link>
      </div>
    );
  }

  const statusSteps = ['submitted', 'under_review', 'dispatched', 'in_progress', 'resolved'];
  const currentStepIdx = statusSteps.indexOf(incident.status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link to="/reports" className="hover:text-blue-600">Grievances</Link>
            <span>/</span>
            <span className="font-semibold text-slate-800">Incident #{incident.id}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {incident.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 text-[11px] uppercase">
              {incident.category.replace(/_/g, ' ')}
            </span>
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{incident.address || incident.landmark || 'Chennai'}</span>
            </span>
            <span>&bull;</span>
            <span>Reported {new Date(incident.created_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleGenerateComplaint}
            disabled={draftLoading}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <FileDown className="w-4 h-4" />
            <span>{draftLoading ? 'Drafting...' : 'Generate Complaint Letter'}</span>
          </button>
        </div>
      </div>

      {/* Duplicate Warning Alert if High Match Detected */}
      {duplicates.length > 0 && duplicates[0].composite_score >= 0.50 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 text-xs text-amber-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-bold text-amber-950">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Potential Duplicate Incident Detected ({Math.round(duplicates[0].composite_score * 100)}% match)</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-bold uppercase text-[10px]">
              {duplicates[0].confidence_level} Confidence
            </span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            {duplicates[0].explanation} Matches against Incident <b>#{duplicates[0].candidate_id}</b> ({duplicates[0].candidate_title}).
          </p>
          <div className="flex flex-wrap gap-3 text-[11px] font-medium text-amber-900 bg-amber-100/60 p-2.5 rounded-xl">
            <span>Text Match: {Math.round(duplicates[0].signal_breakdown.text_similarity * 100)}%</span>
            <span>&bull;</span>
            <span>Spatial Proximity: {Math.round(duplicates[0].signal_breakdown.geographic_proximity_score * 100)}% ({duplicates[0].candidate_distance_meters != null ? `${duplicates[0].candidate_distance_meters}m away` : 'Near'})</span>
            <span>&bull;</span>
            <span>Category Match: {Math.round(duplicates[0].signal_breakdown.category_match_score * 100)}%</span>
          </div>
        </div>
      )}

      {/* SLA Status Progress Tracker */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statutory Redressal Progress</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {statusSteps.map((step, idx) => {
            const isCompleted = currentStepIdx >= idx;
            const isCurrent = currentStepIdx === idx;
            return (
              <div 
                key={step} 
                className={`p-3 rounded-xl border text-center space-y-1 transition-all ${
                  isCurrent ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20' :
                  isCompleted ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                  'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider">Step {idx + 1}</div>
                <div className="text-xs font-bold capitalize text-slate-800">{step.replace(/_/g, ' ')}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Details & AI Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description & Evidence Photos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Citizen Grievance Description
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {incident.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Obstruction Level</span>
                <div className="font-semibold text-slate-800 capitalize mt-0.5">
                  {incident.obstruction_level?.replace(/_/g, ' ') || 'None'}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Affected Footprint</span>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {incident.affected_area_sqm ? `${incident.affected_area_sqm} m²` : 'Not specified'}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Coordinates</span>
                <div className="font-mono text-slate-800 mt-0.5">
                  {incident.latitude != null ? `${incident.latitude.toFixed(4)}, ${incident.longitude?.toFixed(4)}` : 'Blurred / Hidden'}
                </div>
              </div>
            </div>
          </div>

          {/* Photo Gallery & AI Predictions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Photographic Evidence</span>
              {incident.ml_confidence != null && (
                <span className="text-xs text-blue-600 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>PyTorch Model Conf: {(incident.ml_confidence * 100).toFixed(1)}%</span>
                </span>
              )}
            </h3>

            {incident.images && incident.images.length > 0 ? (
              <div className="space-y-4">
                {incident.images.map((img) => (
                  <div key={img.id} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                    <img 
                      src={img.file_path} 
                      alt="Grievance evidence" 
                      className="w-full max-h-96 object-contain"
                    />
                    <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs">
                      <span className="font-mono text-[11px] text-slate-400">{img.original_filename}</span>
                      <span className="font-semibold text-blue-300">
                        Classified as: {img.ml_predicted_class?.replace(/_/g, ' ').toUpperCase() || 'PROCESSED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                No photo uploaded for this report.
              </div>
            )}
          </div>

          {/* Generated Complaint Modal / Section */}
          {draft && (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-indigo-200/80 pb-3">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-indigo-950 text-sm">Official Complaint Draft (Grounded in GCC Charters)</h3>
                  <p className="text-[11px] text-indigo-700">Ready to copy, print, or attach to grievance portals</p>
                </div>
                <button
                  onClick={handleCopyDraft}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Draft'}</span>
                </button>
              </div>

              <div className="bg-white p-4 rounded-xl border border-indigo-100 font-mono text-[11px] text-slate-800 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                <div className="font-bold text-indigo-950 mb-2">{draft.subject}</div>
                <div className="text-slate-600 mb-3">{draft.salutation}</div>
                <div>{draft.body}</div>
              </div>

              <div className="p-3 bg-white/80 rounded-xl border border-indigo-100 space-y-2">
                <div className="font-bold text-indigo-950 text-[11px]">Next Procedural Steps:</div>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                  {draft.evidence_checklist.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
                <div className="text-[10px] text-slate-500 italic pt-1">{draft.disclaimer}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Triage Summary & Interactive Assistant */}
        <div className="space-y-6">
          {/* Severity & Review Assessment Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Evidence-Weighted Severity
            </h3>

            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                incident.severity === 'high' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                incident.severity === 'medium' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {incident.severity} Severity
              </span>

              {incident.review_required && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                  Manual Review Flagged
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {incident.severity_explanation || 'Assessed using physical obstruction and category baseline risk.'}
            </p>
          </div>

          {/* Interactive Incident AI Assistant Box */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[460px]">
            <div className="p-3.5 bg-slate-900 text-white flex items-center space-x-2">
              <Bot className="w-4 h-4 text-sky-400" />
              <div>
                <h4 className="font-bold text-xs">Civic AI Assistant</h4>
                <p className="text-[10px] text-slate-400">Context: Incident #{incident.id}</p>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
              {chatHistory.length === 0 ? (
                <div className="text-center p-4 text-slate-400 space-y-2 mt-8">
                  <Bot className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">Have questions about this grievance?</p>
                  <p className="text-[11px]">Ask about statutory repair SLAs, responsible zonal officers, or escalation procedures.</p>
                </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={`space-y-1.5 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-2.5 rounded-xl max-w-[85%] text-left ${
                      msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}>
                      <div className="whitespace-pre-line text-[11px]">{msg.text}</div>
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="text-left">
                  <span className="inline-block p-2 rounded-xl bg-slate-100 text-slate-500 text-[11px] animate-pulse">
                    Retrieving statutory guidance...
                  </span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendChat} className="p-2 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask about SLAs, regulations..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatMessage.trim()}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

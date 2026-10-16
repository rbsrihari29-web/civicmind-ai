import React, { useEffect, useState } from 'react';
import { Layers, CheckCircle2, XCircle, AlertCircle, MapPin, ArrowRight, Clock } from 'lucide-react';
import { api } from '../services/api';
import { Incident, DuplicateMatchCandidate } from '../types';

export const DuplicateReviewPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateMatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.getIncidents();
      setIncidents(data);
      if (data.length > 0) {
        inspectIncidentDuplicates(data[0]);
      }
    } catch (e) {
      console.error('Failed to load incidents', e);
    } finally {
      setLoading(false);
    }
  };

  const inspectIncidentDuplicates = async (inc: Incident) => {
    setSelectedIncident(inc);
    setActionMessage(null);
    try {
      const dups = await api.getIncidentDuplicates(inc.id);
      setDuplicates(dups);
    } catch (e) {
      console.warn('Error fetching duplicates', e);
      setDuplicates([]);
    }
  };

  const handleReviewAction = async (candidateId: number, action: 'confirm_duplicate' | 'dismiss') => {
    if (!selectedIncident) return;
    setProcessing(true);
    try {
      await api.reviewDuplicate(
        selectedIncident.id, 
        action, 
        action === 'confirm_duplicate' ? candidateId : undefined,
        `Admin decision executed via Duplicate Review Hub`
      );
      setActionMessage(
        action === 'confirm_duplicate' 
          ? `Incident #${selectedIncident.id} successfully merged as duplicate of Incident #${candidateId}.`
          : `Duplicate candidate match dismissed.`
      );
      // Reload
      const updated = await api.getIncidentDuplicates(selectedIncident.id);
      setDuplicates(updated);
    } catch (err: any) {
      alert(`Action error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="w-6 h-6 text-purple-600" />
          <span>Multi-Signal Duplicate Incident Review</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review potential duplicate grievance clusters using explainable spatial, textual, temporal, and latent image similarity scoring.
        </p>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Incident Selector Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[620px]">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
            Incidents to Inspect ({incidents.length})
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading incidents...</div>
            ) : (
              incidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                return (
                  <div
                    key={inc.id}
                    onClick={() => inspectIncidentDuplicates(inc)}
                    className={`p-4 cursor-pointer transition-colors text-xs space-y-1 ${
                      isSelected ? 'bg-purple-50/80 border-l-4 border-purple-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-400">#{inc.id}</span>
                      <span className="capitalize text-slate-600">{inc.category.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="font-bold text-slate-900 line-clamp-1">{inc.title}</div>
                    <div className="text-[11px] text-slate-400">{inc.address || inc.landmark || 'Chennai'}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Section: Candidate Comparisons & Signal Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {selectedIncident ? (
            <div className="space-y-6">
              {/* Primary Incident Header */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                  Target Inspection Incident #{selectedIncident.id}
                </div>
                <h2 className="text-base font-bold text-slate-900">{selectedIncident.title}</h2>
                <p className="text-xs text-slate-600">{selectedIncident.description}</p>
                <div className="flex gap-3 text-[11px] text-slate-500 pt-1">
                  <span><b>Category:</b> {selectedIncident.category.replace(/_/g, ' ').toUpperCase()}</span>
                  <span>&bull;</span>
                  <span><b>Location:</b> {selectedIncident.address || 'Chennai'}</span>
                  <span>&bull;</span>
                  <span><b>Reported:</b> {new Date(selectedIncident.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Candidate Matches */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Candidate Duplicate Matches ({duplicates.length})</span>
                  <span className="text-[11px] text-slate-400 font-normal">Ranked by Composite Score</span>
                </div>

                {duplicates.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400 space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                    <div className="font-semibold text-slate-700">No duplicate matches found</div>
                    <p className="text-[11px]">This incident appears distinct from other reported grievances in this zone.</p>
                  </div>
                ) : (
                  duplicates.map((c) => (
                    <div key={c.candidate_id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-slate-400 text-xs">Match #{c.candidate_id}</span>
                            <span className="font-bold text-slate-900 text-sm">{c.candidate_title}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Reported {new Date(c.candidate_created_at).toLocaleDateString()} &bull; {c.candidate_address || 'Chennai'}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 self-start sm:self-auto">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                            c.confidence_level === 'High' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            c.confidence_level === 'Medium' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}>
                            {Math.round(c.composite_score * 100)}% Match
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {c.explanation}
                      </p>

                      {/* Explainable Signal Breakdown Progress Bars */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                        <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider mb-1">
                          Explainable Multi-Signal Breakdown:
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-600">
                            <span>Geographic Proximity (Haversine Distance: {c.candidate_distance_meters != null ? `${c.candidate_distance_meters}m` : 'N/A'})</span>
                            <span className="font-bold">{Math.round(c.signal_breakdown.geographic_proximity_score * 100)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.round(c.signal_breakdown.geographic_proximity_score * 100)}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-600">
                            <span>Text Semantic & Lexical Similarity</span>
                            <span className="font-bold">{Math.round(c.signal_breakdown.text_similarity * 100)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.round(c.signal_breakdown.text_similarity * 100)}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-600">
                            <span>Category Compatibility Match</span>
                            <span className="font-bold">{Math.round(c.signal_breakdown.category_match_score * 100)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${Math.round(c.signal_breakdown.category_match_score * 100)}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-600">
                            <span>Temporal Proximity (Hours / Days Difference)</span>
                            <span className="font-bold">{Math.round(c.signal_breakdown.temporal_proximity_score * 100)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-amber-600 h-full rounded-full" style={{ width: `${Math.round(c.signal_breakdown.temporal_proximity_score * 100)}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Administrator Action Buttons */}
                      <div className="flex items-center justify-end space-x-3 pt-2">
                        <button
                          onClick={() => handleReviewAction(c.candidate_id, 'dismiss')}
                          disabled={processing}
                          className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition-colors"
                        >
                          <XCircle className="w-4 h-4 text-slate-400" />
                          <span>Dismiss as Distinct</span>
                        </button>

                        <button
                          onClick={() => handleReviewAction(c.candidate_id, 'confirm_duplicate')}
                          disabled={processing}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-purple-600/20 transition-all hover:scale-[1.02]"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm Duplicate & Merge Ticket</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              Select an incident from the left queue to view duplicate candidates.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

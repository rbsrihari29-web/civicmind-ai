import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckSquare, Filter, AlertTriangle, CheckCircle2, 
  MapPin, Clock, Edit3, Save, Sparkles, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Incident } from '../types';

export const AdminReportReviewPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterReviewOnly, setFilterReviewOnly] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Edit / Override Form State
  const [statusVal, setStatusVal] = useState('');
  const [categoryVal, setCategoryVal] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.getIncidents();
      setIncidents(data);
      if (data.length > 0 && !selectedIncident) {
        selectForReview(data[0]);
      }
    } catch (e) {
      console.error('Failed to load review queue', e);
    } finally {
      setLoading(false);
    }
  };

  const selectForReview = (inc: Incident) => {
    setSelectedIncident(inc);
    setStatusVal(inc.status);
    setCategoryVal(inc.category);
    setAdminNotes(inc.admin_notes || '');
    setSaveSuccess(false);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setUpdating(true);
    try {
      const updated = await api.updateIncident(selectedIncident.id, {
        status: statusVal,
        category: categoryVal,
        admin_notes: adminNotes,
        review_required: false // Clear flag once reviewed
      });

      setSelectedIncident(updated);
      setIncidents(prev => prev.map(i => i.id === updated.id ? updated : i));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const displayedList = filterReviewOnly
    ? incidents.filter(i => i.review_required)
    : incidents;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-purple-600" />
            <span>Grievance Triage & Classification Review</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review machine learning defect predictions, override categories, update field dispatch status, and log administrative notes.
          </p>
        </div>

        <button
          onClick={() => setFilterReviewOnly(!filterReviewOnly)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 self-start sm:self-auto ${
            filterReviewOnly 
              ? 'bg-purple-100 text-purple-900 border-purple-300' 
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>{filterReviewOnly ? 'Showing Review Required Only' : 'Filter Review Required'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Triage List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[640px]">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between">
            <span>Triage Queue ({displayedList.length})</span>
            <span className="text-purple-600 font-semibold">{filterReviewOnly ? 'Filtered' : 'All'}</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading queue...</div>
            ) : displayedList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No grievances in this filter.</div>
            ) : (
              displayedList.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                return (
                  <div
                    key={inc.id}
                    onClick={() => selectForReview(inc)}
                    className={`p-4 cursor-pointer transition-colors text-xs space-y-1 ${
                      isSelected ? 'bg-purple-50/80 border-l-4 border-purple-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-500">#{inc.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inc.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                        inc.status === 'in_progress' ? 'bg-sky-100 text-sky-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {inc.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 line-clamp-1">{inc.title}</div>
                    
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="capitalize">{inc.category.replace(/_/g, ' ')}</span>
                      {inc.review_required && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold text-[10px]">
                          Review
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Columns: Review & Override Form */}
        <div className="lg:col-span-2 space-y-6">
          {selectedIncident ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-mono font-bold text-slate-400">Ticket #{selectedIncident.id}</span>
                  <h2 className="text-lg font-bold text-slate-900">{selectedIncident.title}</h2>
                </div>
                <Link
                  to={`/incident/${selectedIncident.id}`}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  View Public Ticket &rarr;
                </Link>
              </div>

              {/* Side-by-Side: Citizen Description vs AI Prediction */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Citizen Submission
                  </div>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {selectedIncident.description}
                  </p>
                  <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                    <div><b>Location:</b> {selectedIncident.address || selectedIncident.landmark || 'Chennai'}</div>
                    <div><b>Reported Cat:</b> {selectedIncident.user_category?.replace(/_/g, ' ') || 'None'}</div>
                    <div><b>Obstruction:</b> {selectedIncident.obstruction_level}</div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
                  <div className="font-bold text-blue-900 uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>PyTorch Model Output</span>
                    </span>
                    {selectedIncident.ml_confidence != null && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-200 text-blue-900 font-bold text-[10px]">
                        {(selectedIncident.ml_confidence * 100).toFixed(1)}% Conf
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-semibold text-blue-950">
                    Predicted: {selectedIncident.ml_category?.replace(/_/g, ' ').toUpperCase() || 'UNCLASSIFIED'}
                  </div>

                  {selectedIncident.images && selectedIncident.images.length > 0 && (
                    <div className="h-32 rounded-lg overflow-hidden bg-slate-900 border border-slate-200">
                      <img 
                        src={selectedIncident.images[0].file_path} 
                        alt="Evidence" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  )}

                  <div className="text-[11px] text-blue-800">
                    <b>Severity Rubric:</b> {selectedIncident.severity_explanation || selectedIncident.severity}
                  </div>
                </div>
              </div>

              {/* Administrator Action Form */}
              <form onSubmit={handleSaveReview} className="space-y-4 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Progression
                    </label>
                    <select
                      value={statusVal}
                      onChange={(e) => setStatusVal(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="dispatched">Dispatched to Ward Engineer</option>
                      <option value="in_progress">In Progress / Rectifying</option>
                      <option value="resolved">Resolved & Rectified</option>
                      <option value="rejected">Rejected / Invalid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Classification Override
                    </label>
                    <select
                      value={categoryVal}
                      onChange={(e) => setCategoryVal(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                    >
                      <option value="pothole_road_damage">Pothole or Road Damage</option>
                      <option value="garbage_accumulation">Garbage Accumulation</option>
                      <option value="waterlogging_flooding">Waterlogging or Flooding</option>
                      <option value="damaged_infrastructure">Damaged Public Infrastructure</option>
                      <option value="fallen_tree_obstruction">Fallen Tree or Obstruction</option>
                      <option value="other_uncertain">Other or Uncertain</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Administrative Notes & Dispatch Orders
                    </label>
                    <textarea
                      rows={3}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="e.g. Dispatched Assistant Engineer (Works) with cold-mix patching truck. Rectification proof required."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {saveSuccess && (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Review and dispatch saved successfully!</span>
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={updating}
                    className="ml-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition-all flex items-center space-x-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{updating ? 'Saving...' : 'Save Triage Decisions'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              Select an incident from the triage queue to review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

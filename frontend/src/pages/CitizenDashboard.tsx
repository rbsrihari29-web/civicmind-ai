import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, PlusCircle, CheckCircle2, Clock, AlertTriangle, 
  MapPin, Bot, PhoneCall, ChevronRight, ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { Incident } from '../types';

export const CitizenDashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const user = api.getCurrentUser();

  useEffect(() => {
    loadMyIncidents();
  }, []);

  const loadMyIncidents = async () => {
    try {
      const data = await api.getIncidents({ only_mine: true });
      setIncidents(data);
    } catch (e) {
      console.error('Failed to load incidents', e);
    } finally {
      setLoading(false);
    }
  };

  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
  const inProgressCount = incidents.filter(i => ['in_progress', 'dispatched'].includes(i.status)).length;
  const submittedCount = incidents.filter(i => ['submitted', 'under_review'].includes(i.status)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Welcome, {user?.full_name || 'Citizen'}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Citizen Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track your filed civic grievances, monitor municipal SLAs, and consult AI grievance guidance.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/assistant"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <Bot className="w-4 h-4 text-sky-400" />
            <span>Civic AI Assistant</span>
          </Link>
          <Link
            to="/report"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1.5 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report New Issue</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Total Grievances</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{incidents.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Submitted in application</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending / Under Review</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">{submittedCount}</div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">Awaiting field officer dispatch</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress / Field QRT</div>
            <div className="text-2xl font-extrabold text-sky-600 mt-1">{inProgressCount}</div>
            <div className="text-[11px] text-sky-700 font-medium mt-1">Squad actively remediating</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Successfully Resolved</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{resolvedCount}</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">Verified rectified</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Emergency & Municipal Quick Contacts Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <PhoneCall className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <div className="font-bold text-sm">Greater Chennai Corporation Emergency Grievance Line</div>
            <p className="text-xs text-blue-200">Dial 1913 for immediate hazard dispatch, open manholes, or fallen live electrical wires.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <a
            href="tel:1913"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-blue-900 hover:bg-blue-50 transition-colors"
          >
            Call 1913 (Toll Free)
          </a>
        </div>
      </div>

      {/* Recent Incidents Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">My Recent Grievances</h3>
            <p className="text-xs text-slate-500">Live operational status and AI vision defect predictions</p>
          </div>
          <Link to="/reports" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
            <span>View All Reports</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading civic grievance records...</div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-slate-700 font-semibold text-sm">No grievances submitted yet</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Spot a pothole, open manhole, water stagnation, or uncollected garbage? Report it now to trigger rapid municipal inspection.
            </p>
            <Link
              to="/report"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report First Issue</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {incidents.slice(0, 5).map((inc) => (
              <div key={inc.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-500">#{inc.id}</span>
                    <span className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors">
                      <Link to={`/incident/${inc.id}`}>{inc.title}</Link>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700 text-[11px]">
                      {inc.category.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                      inc.severity === 'high' ? 'bg-rose-100 text-rose-800' :
                      inc.severity === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {inc.severity.toUpperCase()} SEVERITY
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{inc.address || inc.landmark || 'Chennai'}</span>
                    </span>
                    <span>&bull;</span>
                    <span>{new Date(inc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                    inc.status === 'resolved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    inc.status === 'in_progress' ? 'bg-sky-100 text-sky-800 border border-sky-300' :
                    inc.status === 'dispatched' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' :
                    inc.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {inc.status.replace(/_/g, ' ')}
                  </span>
                  <Link
                    to={`/incident/${inc.id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

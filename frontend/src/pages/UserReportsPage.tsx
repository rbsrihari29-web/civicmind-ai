import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, PlusCircle, Filter, MapPin, ChevronRight, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Incident } from '../types';

export const UserReportsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.getIncidents({ only_mine: true });
      setIncidents(data);
    } catch (e) {
      console.error('Failed to load user reports', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = incidents.filter((inc) => {
    const matchesSearch = inc.title.toLowerCase().includes(search.toLowerCase()) ||
                          inc.description.toLowerCase().includes(search.toLowerCase()) ||
                          (inc.address && inc.address.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>My Submitted Grievances</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete historical audit of your submitted municipal complaints and SLA redressal timelines.
          </p>
        </div>

        <Link
          to="/report"
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1.5 shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit New Grievance</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, location, or symptom..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="dispatched">Dispatched</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected / Duplicate</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading your report records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-slate-700 font-semibold text-xs">No matching grievances found</div>
            <p className="text-[11px] text-slate-400">Try modifying your search or filter options.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((inc) => (
              <div key={inc.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{inc.id}</span>
                    <Link to={`/incident/${inc.id}`} className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors">
                      {inc.title}
                    </Link>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1 max-w-2xl">{inc.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-1">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 uppercase">
                      {inc.category.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                      inc.severity === 'high' ? 'bg-rose-100 text-rose-800' :
                      inc.severity === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {inc.severity} Severity
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{inc.address || inc.landmark || 'Chennai'}</span>
                    </span>
                    <span>&bull;</span>
                    <span>{new Date(inc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end md:self-auto">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
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
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
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

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, CheckSquare, Layers, Database, Cpu, Download, 
  AlertTriangle, CheckCircle2, Clock, ShieldCheck, MapPin, RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { AnalyticsOverview, TrendPoint } from '../types';

const COLORS = ['#f59e0b', '#10b981', '#0284c7', '#8b5cf6', '#059669', '#64748b'];

export const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [ov, tr] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getIncidentTrends()
      ]);
      setOverview(ov);
      setTrends(tr);
    } catch (e) {
      console.error('Failed to load admin analytics', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true);
    try {
      const result = await api.exportIncidents(format);
      if (format === 'csv') {
        const url = window.URL.createObjectURL(result);
        const a = document.createElement('a');
        a.href = url;
        a.download = `civicmind_incidents_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const jsonStr = JSON.stringify(result, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `civicmind_incidents_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      alert(`Export error: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading || !overview) {
    return <div className="p-16 text-center text-xs text-slate-500">Loading administrative intelligence...</div>;
  }

  const resolvedRate = overview.total_incidents > 0 
    ? Math.round((overview.resolved_incidents / overview.total_incidents) * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Municipal Operations & Triage Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
              Admin Console
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time incident dispatch, multi-signal duplicate triage, and ML model monitoring.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={loadAnalytics}
            className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Reports</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              All
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{overview.total_incidents}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across 15 GCC Zones</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved Rate</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              SLA
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">{resolvedRate}%</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">{overview.resolved_incidents} closed tickets</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending / In Triage</span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              QRT
            </span>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">{overview.pending_review_incidents}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">Requires engineer review</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Redressal Time</span>
            <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
              HRS
            </span>
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 mt-2">{overview.average_resolution_time_hours}h</div>
          <div className="text-[11px] text-indigo-700 font-medium mt-1">Under statutory 48h SLA</div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/review"
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all flex items-center space-x-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">Triage Queue</div>
            <div className="text-[11px] text-slate-400">Review & override AI predictions</div>
          </div>
        </Link>

        <Link
          to="/admin/duplicates"
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 shadow-sm hover:shadow-md transition-all flex items-center space-x-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">Duplicate Review</div>
            <div className="text-[11px] text-slate-400">Multi-signal candidate matches</div>
          </div>
        </Link>

        <Link
          to="/admin/knowledge"
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 shadow-sm hover:shadow-md transition-all flex items-center space-x-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">Knowledge Base</div>
            <div className="text-[11px] text-slate-400">Manage vector chunks & FAISS</div>
          </div>
        </Link>

        <Link
          to="/admin/evaluations"
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all flex items-center space-x-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">Model Evaluations</div>
            <div className="text-[11px] text-slate-400">Confusion matrix & per-class F1</div>
          </div>
        </Link>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Line Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">14-Day Grievance Trend</h3>
              <p className="text-[11px] text-slate-500">Incident volume vs resolved tickets</p>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Daily Rolling
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total_incidents" stroke="#3b82f6" strokeWidth={2} name="Total Received" />
                <Line type="monotone" dataKey="resolved_incidents" stroke="#10b981" strokeWidth={2} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Category Distribution</h3>
              <p className="text-[11px] text-slate-500">Grievance volume by classified civic defect</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.category_distribution} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]}>
                  {overview.category_distribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

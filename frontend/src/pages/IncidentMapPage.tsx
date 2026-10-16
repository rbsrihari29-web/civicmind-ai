import React, { useEffect, useState } from 'react';
import { MapPin, Filter, Layers, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { LeafletMap } from '../components/LeafletMap';

export const IncidentMapPage: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    setLoading(true);
    try {
      const data = await api.getMapIncidents();
      setIncidents(data);
      setFiltered(data);
    } catch (e) {
      console.error('Failed to load map data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let res = [...incidents];
    if (selectedCategory !== 'all') {
      res = res.filter(i => i.category === selectedCategory);
    }
    if (selectedSeverity !== 'all') {
      res = res.filter(i => i.severity === selectedSeverity);
    }
    if (selectedStatus !== 'all') {
      res = res.filter(i => i.status === selectedStatus);
    }
    setFiltered(res);
  }, [selectedCategory, selectedSeverity, selectedStatus, incidents]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            <span>Interactive Incident Map</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Geographic visualization of reported civic defects across Chennai municipal zones.
          </p>
        </div>

        <button
          onClick={loadMapData}
          className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 shadow-sm transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center space-x-1.5 font-bold text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filters:</span>
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="all">All Categories ({incidents.length})</option>
            <option value="pothole_road_damage">Potholes & Road Surface</option>
            <option value="garbage_accumulation">Garbage Accumulation</option>
            <option value="waterlogging_flooding">Waterlogging & Flooding</option>
            <option value="damaged_infrastructure">Damaged Infrastructure</option>
            <option value="fallen_tree_obstruction">Fallen Trees & Obstructions</option>
          </select>
        </div>

        <div>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="all">All Severities</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="ml-auto text-xs text-slate-500 font-medium">
          Showing <b>{filtered.length}</b> pinned incidents
        </div>
      </div>

      {/* Map View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2">
        <LeafletMap
          incidents={filtered}
          className="h-[560px]"
          zoom={12}
          center={[13.0418, 80.2337]}
        />
      </div>

      {/* Legend */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Category Legend:</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span>Pothole / Road</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span>Garbage</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-600 inline-block" />
            <span>Waterlogging</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
            <span>Infrastructure</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-teal-600 inline-block" />
            <span>Fallen Tree</span>
          </span>
        </div>
      </div>
    </div>
  );
};

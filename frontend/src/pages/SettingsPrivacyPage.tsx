import React, { useState } from 'react';
import { Shield, EyeOff, Download, User as UserIcon, Phone, Mail, Save, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const SettingsPrivacyPage: React.FC = () => {
  const currentUser = api.getCurrentUser();

  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [blurLocation, setBlurLocation] = useState(currentUser?.privacy_blur_location || false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await api.updateMe({
        full_name: fullName,
        phone: phone,
        privacy_blur_location: blurLocation
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportMyData = async () => {
    try {
      const data = await api.getIncidents({ only_mine: true });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my_civic_grievance_data_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Data export error: ${e.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <span>Settings & Privacy Controls</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your citizen profile, coordinate privacy protections, and personal data portability.
        </p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile and privacy preferences updated successfully!</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-slate-400" />
          <span>Profile Information</span>
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ''}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91-9840123456"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
              <input
                type="text"
                disabled
                value={currentUser?.role.toUpperCase() || 'CITIZEN'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase cursor-not-allowed"
              />
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-purple-600" />
              <span>Location Coordinate Blurring</span>
            </h3>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-4">
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-800">Blur Precise GPS Coordinates on Public Maps</span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  When enabled, exact GPS coordinates in your submitted reports are rounded to 2 decimal places (~1.1 km radius) on public map dashboards to prevent revealing private home locations.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={blurLocation}
                  onChange={(e) => setBlurLocation(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Data Portability Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
          <Download className="w-4 h-4 text-indigo-600" />
          <span>Data Portability & Audit Rights</span>
        </h2>

        <p className="text-slate-600 leading-relaxed">
          Under statutory data rights, citizens may export all personal grievance records, evidence photo references, and municipal status audit trails.
        </p>

        <button
          onClick={handleExportMyData}
          className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export My Grievance Archive (JSON)</span>
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, Camera, MapPin, Bot, Layers, CheckCircle2, 
  ArrowRight, Sparkles, Building2, AlertTriangle, FileCheck2, Cpu
} from 'lucide-react';
import { api } from '../services/api';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleDemoLogin = async (role: 'citizen' | 'admin') => {
    try {
      if (role === 'admin') {
        await api.login('admin@civicmind.gov.in', 'Admin@CivicMind2026');
        navigate('/admin');
      } else {
        await api.login('citizen@civicmind.org', 'Citizen@Pass123');
        navigate('/dashboard');
      }
    } catch (e: any) {
      alert(`Demo login error: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-950/80 border border-blue-700/80 text-blue-300 text-xs font-semibold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Civic Issue Detection &bull; Risk Prediction &bull; Grounded Assistance</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Evidence-Aware AI for <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300">
              Accountable Urban Governance
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            CivicMind AI transforms civic grievance reporting into an intelligent, transparent workflow. Powered by a verified 
            PyTorch vision classifier, spatial duplicate detection, and statutory RAG grounding based on official municipal charters.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              to="/report"
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 hover:scale-[1.02]"
            >
              <Camera className="w-4 h-4" />
              <span>Report Civic Issue Now</span>
            </Link>

            <Link
              to="/map"
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center space-x-2"
            >
              <MapPin className="w-4 h-4 text-sky-400" />
              <span>Explore Incident Map</span>
            </Link>
          </div>

          {/* Quick Demo Launch Pills */}
          <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Instant Demo Access:</span>
            <button
              onClick={() => handleDemoLogin('citizen')}
              className="px-3 py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 border border-blue-700 text-blue-200 font-medium transition-colors flex items-center space-x-1.5"
            >
              <span>Citizen Demo (Kavitha Ramanathan)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleDemoLogin('admin')}
              className="px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 border border-purple-700 text-purple-200 font-medium transition-colors flex items-center space-x-1.5"
            >
              <span>Admin Demo (Zonal Commissioner)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-extrabold text-blue-600">95.56%</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Vision Model Test Accuracy</div>
              <div className="text-[10px] text-emerald-600 font-semibold">+78.89% gain over baseline</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900">6 Classes</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Trained Defect Categories</div>
              <div className="text-[10px] text-slate-400 font-medium">Potholes, Flood, Trees, Garbage</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-indigo-600">24-48h</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Statutory Redressal SLA</div>
              <div className="text-[10px] text-slate-400 font-medium">GCC Citizen Charter backed</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Evidence-Grounded RAG</div>
              <div className="text-[10px] text-emerald-600 font-semibold">Zero hallucinations or fake rules</div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Civic Categories Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl font-bold text-slate-900">Supported Civic Defect Classifications</h2>
          <p className="text-slate-600 text-sm">
            Trained on multi-modal urban infrastructure imagery to triage grievances rapidly and route them to the responsible municipal engineering departments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Potholes & Road Surface Craters</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Detects asphalt depressions, alligator fatigue cracks, and edge collapse. Routed to Bus Route Roads & Works with 48h cold-mix patching SLA.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Garbage Accumulation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Identifies overflowing municipal compactor bins and roadside dumping. Linked to Solid Waste Management bylaws and 24h clearance SLA.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Waterlogging & Flooding</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Flags street water stagnation and storm drain choke points. Directly notifies monsoon Quick Response Teams for submersible pump deployment.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Damaged Infrastructure</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Identifies uncovered manholes, caved-in drain slabs, fractured footpaths, and dangling utility poles with immediate 1-hour cordoning protocols.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Fallen Trees & Obstructions</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Recognizes storm tree falls, blocked lanes, and entangled power wires with emergency chainsaw squad dispatch within 2-6 hours.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Civic AI Grievance Assistant</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Provides evidence-grounded answers citing official GCC Charters, prepares formal grievance complaint drafts, and tracks escalation hierarchies.
            </p>
          </div>
        </div>
      </section>

      {/* End-to-End Workflow */}
      <section className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-slate-900">How CivicMind AI Works</h2>
            <p className="text-slate-600 text-sm mt-2">Transparent end-to-end integration between citizen, machine learning, and municipal operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center mx-auto text-sm">1</div>
              <h4 className="font-bold text-slate-900 text-base">Report & Photo</h4>
              <p className="text-xs text-slate-600">Citizen uploads photo, drops GPS map pin, and notes physical obstruction level.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center mx-auto text-sm">2</div>
              <h4 className="font-bold text-slate-900 text-base">PyTorch Vision AI</h4>
              <p className="text-xs text-slate-600">MobileNetV3/CivicNet classifies the defect, outputs class probabilities, and computes confidence score.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center mx-auto text-sm">3</div>
              <h4 className="font-bold text-slate-900 text-base">Multi-Signal Duplicates</h4>
              <p className="text-xs text-slate-600">Evaluates Haversine distance, text overlap, and latent visual embeddings to highlight existing reports.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center mx-auto text-sm">4</div>
              <h4 className="font-bold text-slate-900 text-base">Grounded Action</h4>
              <p className="text-xs text-slate-600">RAG cites statutory GCC timelines and generates formal complaint drafts for citizen review.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

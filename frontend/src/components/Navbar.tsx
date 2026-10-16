import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldAlert, MapPin, FileText, Bot, BarChart3, 
  Layers, Database, Cpu, LogOut, User as UserIcon, PlusCircle, CheckSquare
} from 'lucide-react';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = api.getCurrentUser();

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:bg-blue-500 transition-colors">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                CivicMind <span className="text-blue-400 text-xs px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800 font-semibold uppercase tracking-wider">AI</span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium">Evidence-Aware Civic Intelligence</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link 
              to="/map" 
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                isActive('/map') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Incident Map</span>
            </Link>

            <Link 
              to="/assistant" 
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                isActive('/assistant') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Civic AI</span>
            </Link>

            {user && user.role === 'citizen' && (
              <>
                <Link 
                  to="/dashboard" 
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                    isActive('/dashboard') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>My Dashboard</span>
                </Link>

                <Link 
                  to="/reports" 
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                    isActive('/reports') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>My Reports</span>
                </Link>

                <Link 
                  to="/report" 
                  className="ml-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1.5 shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Report Issue</span>
                </Link>
              </>
            )}

            {user && user.role === 'admin' && (
              <>
                <Link 
                  to="/admin" 
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                    isActive('/admin') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Admin Hub</span>
                </Link>

                <Link 
                  to="/admin/review" 
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                    isActive('/admin/review') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Triage Queue</span>
                </Link>

                <Link 
                  to="/admin/duplicates" 
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                    isActive('/admin/duplicates') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Duplicates</span>
                </Link>

                <Link 
                  to="/admin/knowledge" 
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                    isActive('/admin/knowledge') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>RAG Docs</span>
                </Link>

                <Link 
                  to="/admin/evaluations" 
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                    isActive('/admin/evaluations') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                  <span>ML Eval</span>
                </Link>
              </>
            )}
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/settings"
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-medium truncate max-w-[120px]">{user.full_name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                    user.role === 'admin' ? 'bg-purple-900/80 text-purple-200 border border-purple-700' : 'bg-blue-900/80 text-blue-200 border border-blue-700'
                  }`}>
                    {user.role}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

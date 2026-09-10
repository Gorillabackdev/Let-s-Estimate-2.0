import React, { useState } from 'react';
import { Project } from '../types';
import { formatNaira } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { 
  PlusCircle, 
  Building, 
  MapPin, 
  FileText, 
  Trash2, 
  ArrowRight, 
  Calendar, 
  TrendingUp, 
  Search, 
  Sparkles, 
  Copy, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Layers,
  ShieldCheck,
  BookOpen,
  Hammer,
  Calculator
} from 'lucide-react';

interface ProjectDashboardProps {
  projects: Project[];
  loading: boolean;
  onOpenProject: (projectId: string) => void;
  onNewProject: () => void;
  onDeleteProject: (projectId: string, title: string) => void;
  onDuplicateProject?: (projectId: string, title: string) => void;
  onUpdateStatus?: (projectId: string, status: string) => void;
}

const STATUS_OPTIONS = ['All', 'Draft', 'In Progress', 'Submitted', 'Approved', 'Archived'];

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projects = [],
  loading,
  onOpenProject,
  onNewProject,
  onDeleteProject,
  onDuplicateProject,
  onUpdateStatus,
}) => {
  const { user, stats, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const safeProjects = Array.isArray(projects) ? projects : [];

  const filteredProjects = safeProjects.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      (p?.title || '').toLowerCase().includes(q) ||
      (p?.location || '').toLowerCase().includes(q) ||
      (p?.client_name && p.client_name.toLowerCase().includes(q))
    );
    const matchesStatus = selectedStatus === 'All' || (p?.status || 'Draft').toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalValue = safeProjects.reduce((acc, p) => acc + (p?.grand_total || 0), 0);

  const getStatusBadge = (status?: string) => {
    const s = (status || 'Draft').toLowerCase();
    switch (s) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in progress':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'archived':
        return 'bg-neutral-100 text-neutral-600 border-neutral-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div id="project-dashboard-view" className="space-y-6">
      
      {/* Top Banner with Summary & Quick Stats */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-emerald-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-500/40 text-xs font-semibold text-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>AI Computer Vision &amp; BOQ Estimating for Nigeria</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-xs font-bold text-amber-300">
                <span>Brand: Estimate with Isaac</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {user ? `Welcome back, ${user.full_name}` : "Let's Estimate - Projects Workspace"}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              {user?.company ? `${user.company} • ` : ''}
              Upload architectural floor plans, let AI Vision detect core structural quantities, apply Nigerian market unit rates, and export professional Bills of Quantities.
            </p>
          </div>

          {/* Official Seals Badge */}
          <div className="flex items-center gap-3 bg-slate-900/80 border border-emerald-500/30 p-3.5 rounded-2xl shadow-lg shrink-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-400/60 shadow-md bg-slate-950 shrink-0">
              <img src="/estimate_logo.jpg" alt="Estimate with Isaac" className="w-full h-full object-cover" />
            </div>
            <div className="w-12 h-12 rounded-full overflow-hidden border border-emerald-400/60 shadow-md bg-slate-950 shrink-0">
              <img src="/niqs_seal.jpg" alt="NIQS & QSRBN Accreditation" className="w-full h-full object-cover" />
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <span className="text-[11px] font-bold text-amber-300 block">NIQS &amp; QSRBN Compliant</span>
              <span className="text-[9px] text-emerald-300 font-semibold block mt-0.5">BESMM4 Standard Certified</span>
            </div>
          </div>
        </div>

        {/* Quick Dashboard Action Bar */}
        <div className="mt-6 pt-6 border-t border-emerald-700/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm">
            <div>
              <span className="text-emerald-300 block">Total Active Estimates</span>
              <span className="text-xl font-bold text-white">{projects.length} Projects</span>
            </div>
            <div className="h-8 w-px bg-emerald-700/80 hidden sm:block"></div>
            <div>
              <span className="text-emerald-300 block">Portfolio Valuation</span>
              <span className="text-xl font-bold text-white">{formatNaira(totalValue)}</span>
            </div>
            <div className="h-8 w-px bg-emerald-700/80 hidden sm:block"></div>
            <div>
              <span className="text-emerald-300 block">Markup Benchmark</span>
              <span className="text-xl font-bold text-white">15% P&O + 7.5% VAT</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="dashboard-new-project-cta"
              type="button"
              onClick={onNewProject}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-xs sm:text-sm shadow-md transition transform active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-700" />
              <span>Start New Estimate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
          <span className="text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </span>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                selectedStatus === status
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="project-search-input"
              type="text"
              placeholder="Search by project name, location (e.g. Port Harcourt, Lagos, Abuja), or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium px-1 flex items-center justify-between sm:justify-end">
            <span>Showing {filteredProjects.length} of {projects.length} estimates</span>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-slate-600">Loading saved projects from SQLite database...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No Projects Found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedStatus !== 'All'
              ? `No estimates match your filters. Clear your filters to see all projects.`
              : 'Create your first project or run an AI takeoff from an architectural drawing.'}
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={onNewProject}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const isSample = project.id === 'sample-hostel-ph';
            const status = project.status || 'Draft';
            return (
              <div
                key={project.id}
                id={`project-card-${project.id}`}
                className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden group ${
                  isSample ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200'
                }`}
              >
                {/* Card Top */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                        BOQ
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadge(status)}`}>
                        {status}
                      </span>
                      {isSample && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Sample
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {onDuplicateProject && (
                        <button
                          type="button"
                          onClick={() => onDuplicateProject(project.id, project.title)}
                          className="text-slate-400 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
                          title="Duplicate estimate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteProject(project.id, project.title)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                        title="Delete estimate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition line-clamp-2">
                    {project.title}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{project.location || 'Nigeria'}</span>
                    </div>
                    {project.client_name && (
                      <div className="flex items-center space-x-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{project.client_name}</span>
                      </div>
                    )}
                    {project.drawing_filename && (
                      <div className="flex items-center space-x-1.5 text-emerald-700 font-medium">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{project.drawing_filename}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Bottom / Valuation */}
                <div className="px-5 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                      Grand Total
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-emerald-800">
                      {formatNaira(project.grand_total)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenProject(project.id)}
                    className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <span>Open BOQ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Construction & Quantity Surveying Methodology Guide */}
      <div id="construction-estimation-guide" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Hammer className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Nigerian Construction Estimation &amp; BESMM4 Standards
                </h3>
                <p className="text-xs text-emerald-700 font-semibold">
                  Building &amp; Engineering Standard Method of Measurement (4th Edition) Compliant
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every bill generated in Let&apos;s Estimate strictly adheres to Nigerian quantity surveying principles. Rather than applying static arbitrary figures, our conditional rules engine calibrates items, unit measurements, and current market rates to the exact physical typology of your project.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Structural Integrity</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Single-storey bungalows strictly exclude RC columns and suspended slabs unless specified. Gable roofs do not generate valley gutters.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <Calculator className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Rate Build-Ups</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Composite rates encompass Materials, Artisans &amp; Labour, Plant &amp; Equipment, Haulage, 10% Contractor Overheads, and 10% Profit.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Regional Calibration</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Rates dynamically calibrate across Lagos, Abuja FCT, Rivers/Port Harcourt, Kano, Ibadan, and Eastern state economic corridors.
                </p>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center w-full md:w-56 space-y-2">
            <span className="text-2xl font-black text-emerald-800">BESMM4</span>
            <span className="text-xs font-semibold text-emerald-900">14 Construction Trades</span>
            <p className="text-[11px] text-emerald-700 leading-tight">
              Substructure, Concrete, Masonry, Carpentry, Metalwork, Finishes, Services &amp; External Works
            </p>
          </div>
        </div>
      </div>

      {/* Centered Action Button at Bottom of Page */}
      <div className="flex justify-center pt-2 pb-6">
        <button
          id="bottom-new-estimate-btn"
          type="button"
          onClick={onNewProject}
          className="inline-flex items-center space-x-2.5 px-8 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <PlusCircle className="w-5 h-5 text-emerald-200" />
          <span>Start New Construction Estimate</span>
        </button>
      </div>

    </div>
  );
};

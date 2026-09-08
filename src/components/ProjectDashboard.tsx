import React, { useState } from 'react';
import { Project } from '../types';
import { formatNaira } from '../utils/format';
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
  Download,
  Code2
} from 'lucide-react';

interface ProjectDashboardProps {
  projects: Project[];
  loading: boolean;
  onOpenProject: (projectId: string) => void;
  onNewProject: () => void;
  onDeleteProject: (projectId: string, title: string) => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projects,
  loading,
  onOpenProject,
  onNewProject,
  onDeleteProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      (p.client_name && p.client_name.toLowerCase().includes(q))
    );
  });

  return (
    <div id="project-dashboard-view" className="space-y-6">
      
      {/* Top Banner with Summary & Quick Stats */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-emerald-700/50">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-xs font-semibold text-emerald-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>AI Computer Vision for Building Blueprints</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Let's Estimate - Projects Dashboard
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Upload architectural floor plans, let AI Vision detect core structural quantities (Walls, Slab, Blockwork, Doors, Windows, Roofing), apply Nigerian market unit rates, and export professional Bills of Quantities.
          </p>
        </div>

        {/* Quick Dashboard Action Bar */}
        <div className="mt-6 pt-6 border-t border-emerald-700/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-6 text-xs sm:text-sm">
            <div>
              <span className="text-emerald-300 block">Total Saved Estimates</span>
              <span className="text-xl font-bold text-white">{projects.length} Projects</span>
            </div>
            <div className="h-8 w-px bg-emerald-700/80"></div>
            <div>
              <span className="text-emerald-300 block">Standard Markup</span>
              <span className="text-xl font-bold text-white">15% P&O + 7.5% VAT</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              id="dashboard-download-code-zip"
              href="/api/download-zip"
              download="lets-estimate-source.zip"
              className="inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-950 text-emerald-100 hover:text-white font-semibold text-xs sm:text-sm border border-emerald-600/60 transition shadow-sm"
              title="Download clean source code ZIP for GitHub"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>Download Source ZIP</span>
            </a>

            <button
              id="dashboard-new-project-cta"
              type="button"
              onClick={onNewProject}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-xs sm:text-sm shadow-md transition transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-emerald-700" />
              <span>Start New Estimate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
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
            {searchQuery
              ? `No estimates match "${searchQuery}". Clear your search query to see all projects.`
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
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                        BOQ
                      </div>
                      {isSample && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Sample Project
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteProject(project.id, project.title)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                      title="Delete estimate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

      {/* GitHub Export & Source Code Download Card */}
      <div id="github-export-card" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-slate-100 text-slate-800">
                <Code2 className="w-5 h-5 text-emerald-800" />
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Export Codebase to GitHub
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Get the full, production-ready frontend (React + Vite + Tailwind) and backend (Node.js + Express + SQLite + Gemini Vision AI) source code.
            </p>
            <div className="text-xs text-slate-500 pt-1 space-y-1">
              <p>• <strong>Direct Download:</strong> Click the button to download <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-800 font-mono text-[11px]">lets-estimate-source.zip</code> (clean, excludes <code className="text-slate-400">node_modules</code>).</p>
              <p>• <strong>AI Studio Direct Push:</strong> In the top AI Studio header menu, click <strong>Share / Export → Export to GitHub</strong> to push directly to your GitHub repository.</p>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
            <a
              href="/api/download-zip"
              download="lets-estimate-source.zip"
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm shadow-sm transition active:scale-95 text-center"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>Download ZIP (.zip)</span>
            </a>
          </div>
        </div>
      </div>

    </div>
  );
};

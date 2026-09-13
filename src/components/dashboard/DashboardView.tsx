import React from 'react';
import { 
  Building2, 
  Sparkles, 
  FileSpreadsheet, 
  Calculator, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Plus, 
  MapPin, 
  Briefcase, 
  Receipt,
  FileCheck2,
  SlidersHorizontal,
  DollarSign,
  ShieldCheck,
  Award,
  BookOpen,
  FolderArchive
} from 'lucide-react';
import { Project, AppGlobalView } from '../../types';
import { formatNaira } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

interface DashboardViewProps {
  projects: Project[];
  loading: boolean;
  onNavigate: (view: AppGlobalView, subView?: string) => void;
  onOpenProject: (projectId: string) => void;
  onNewProject: () => void;
  onAiTakeoff: () => void;
  onNewBoq: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects = [],
  loading,
  onNavigate,
  onOpenProject,
  onNewProject,
  onAiTakeoff,
  onNewBoq,
}) => {
  const { user } = useAuth();

  const safeProjects = Array.isArray(projects) ? projects : [];

  // Metrics
  const totalProjects = safeProjects.length;
  const activeProjects = safeProjects.filter(p => (p?.status || 'Draft') !== 'Archived').length;
  const totalEstimatedValue = safeProjects.reduce((acc, p) => acc + (p?.grand_total || 0), 0);
  const pendingActionsCount = 4; // AI review, valuation approval, variation review, certificate signoff

  const recentProjects = safeProjects.slice(0, 4);

  return (
    <div id="simplified-dashboard" className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* 1. WELCOME SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>NIQS &amp; BESMM4 4th Edition Accredited Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back{user?.full_name ? `, ${user.full_name}` : ''}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 max-w-2xl leading-relaxed">
            Manage your project estimates, execute AI quantity takeoffs from architectural drawings, enforce deterministic rate analysis, and certify interim contractor valuations.
          </p>
        </div>

        {/* Quick actions group on top */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => window.open('/api/download/project-zip', '_blank')}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
            title="Download Complete Source Code (ZIP)"
          >
            <FolderArchive className="w-4 h-4 text-amber-400" />
            <span>Download Project (ZIP)</span>
          </button>
          <button
            type="button"
            onClick={() => window.open('/api/guide/pdf', '_blank')}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition active:scale-95 cursor-pointer"
            title="Download PDF User Manual"
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>User Guide (PDF)</span>
          </button>
          <button
            type="button"
            onClick={onNewProject}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
          <button
            type="button"
            onClick={onAiTakeoff}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>AI Takeoff</span>
          </button>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Projects
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {totalProjects}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              In database portfolio
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Projects
            </span>
            <div className="text-2xl font-extrabold text-emerald-800 mt-1">
              {activeProjects}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              Ongoing estimation / control
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Estimated Value */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Estimated Value
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 truncate max-w-[170px]" title={formatNaira(totalEstimatedValue)}>
              {formatNaira(totalEstimatedValue)}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Across active bills
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Actions
            </span>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">
              {pendingActionsCount}
            </div>
            <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">
              Require review &amp; signoff
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. QUICK ACTIONS BAR */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Quick Actions
          </h2>
          <span className="text-xs text-slate-500">Construction Estimating Shortcuts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={onNewProject}
            className="p-4 bg-white hover:bg-emerald-50 rounded-xl border border-slate-200 hover:border-emerald-300 text-left transition shadow-2xs group cursor-pointer"
          >
            <Building2 className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition-transform" />
            <div className="mt-2 font-bold text-xs text-slate-900 group-hover:text-emerald-900">+ New Project</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Define site, client &amp; specs</div>
          </button>

          <button
            type="button"
            onClick={onAiTakeoff}
            className="p-4 bg-white hover:bg-amber-50 rounded-xl border border-slate-200 hover:border-amber-300 text-left transition shadow-2xs group cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
            <div className="mt-2 font-bold text-xs text-slate-900 group-hover:text-amber-950">AI Takeoff</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Measure drawings with Gemini</div>
          </button>

          <button
            type="button"
            onClick={onNewBoq}
            className="p-4 bg-white hover:bg-emerald-50 rounded-xl border border-slate-200 hover:border-emerald-300 text-left transition shadow-2xs group cursor-pointer"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition-transform" />
            <div className="mt-2 font-bold text-xs text-slate-900 group-hover:text-emerald-900">Create BOQ</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Spreadsheet bill of quantities</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('calculators')}
            className="p-4 bg-white hover:bg-teal-50 rounded-xl border border-slate-200 hover:border-teal-300 text-left transition shadow-2xs group cursor-pointer"
          >
            <Calculator className="w-5 h-5 text-teal-700 group-hover:scale-110 transition-transform" />
            <div className="mt-2 font-bold text-xs text-slate-900 group-hover:text-teal-950">Calculators</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Concrete, rebar, civil, NGO</div>
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT SPLIT: RECENT PROJECTS & (PENDING ACTIONS + ACTIVITY) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: RECENT PROJECTS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">
              Recent Projects
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center space-x-1"
            >
              <span>View All ({totalProjects})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-3 text-xs text-slate-500">Loading project database...</p>
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No projects yet</p>
              <p className="text-xs text-slate-500 mt-1">Start by creating your first project or running an AI drawing takeoff.</p>
              <button
                type="button"
                onClick={onNewProject}
                className="mt-4 px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold"
              >
                + Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onOpenProject(p.id)}
                  className="bg-white hover:bg-slate-50/90 rounded-2xl border border-slate-200 p-5 transition shadow-2xs hover:shadow-xs cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {p.project_type || 'Residential'}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {p.status || 'Draft'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {p.title}
                    </h3>
                    <div className="flex items-center text-xs text-slate-500 mt-1.5 space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{p.location || 'Nigeria'}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Estimate Value</span>
                      <span className="text-sm font-extrabold text-emerald-800">{formatNaira(p.grand_total)}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform inline-flex items-center">
                      Open &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: PENDING ACTIONS & RECENT ACTIVITY */}
        <div className="space-y-6">
          
          {/* PENDING ACTIONS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Pending Actions</span>
              </h2>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                4 Required
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div 
                onClick={() => onNavigate('estimating', 'takeoff')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/60 rounded-xl border border-slate-200/80 transition cursor-pointer flex items-start space-x-3"
              >
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Review AI Takeoff Measurements</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Verify concrete &amp; masonry line items against drawing scale.</div>
                </div>
              </div>

              <div 
                onClick={() => onNavigate('controls', 'variations')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/60 rounded-xl border border-slate-200/80 transition cursor-pointer flex items-start space-x-3"
              >
                <SlidersHorizontal className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Approve Variation VO-002</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Foundation depth extension on waterlogged terrain.</div>
                </div>
              </div>

              <div 
                onClick={() => onNavigate('controls', 'valuations')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/60 rounded-xl border border-slate-200/80 transition cursor-pointer flex items-start space-x-3"
              >
                <Receipt className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Complete Interim Valuation #2</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Measure work completed to 1st floor beam level.</div>
                </div>
              </div>

              <div 
                onClick={() => onNavigate('controls', 'certificates')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/60 rounded-xl border border-slate-200/80 transition cursor-pointer flex items-start space-x-3"
              >
                <FileCheck2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Generate Interim Payment Certificate</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Certify net payable sum after retention deduction.</div>
                </div>
              </div>
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Recent Activity</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-start space-x-2.5 pb-2.5 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                <div>
                  <span className="font-semibold text-slate-800">Exported NIQS Bill of Quantities</span>
                  <p className="text-[11px] text-slate-500">Excel format generated for tender package.</p>
                  <span className="text-[10px] text-slate-400">10 mins ago</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 pb-2.5 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                <div>
                  <span className="font-semibold text-slate-800">Updated Regional Rates for Port Harcourt</span>
                  <p className="text-[11px] text-slate-500">+6% terrain &amp; haulage index adjusted.</p>
                  <span className="text-[10px] text-slate-400">1 hour ago</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 pb-2.5 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                <div>
                  <span className="font-semibold text-slate-800">AI Vision Takeoff Executed</span>
                  <p className="text-[11px] text-slate-500">Extracted substructure &amp; masonry line items.</p>
                  <span className="text-[10px] text-slate-400">Yesterday</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

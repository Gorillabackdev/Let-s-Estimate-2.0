import React, { useState } from 'react';
import { 
  FolderKanban, 
  PlusCircle,
  FileSpreadsheet, 
  SlidersHorizontal, 
  Files, 
  BookOpen,
  Settings, 
  HelpCircle, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  Receipt, 
  Award, 
  Building2,
  X,
  FileText,
  DollarSign,
  PieChart,
  History,
  Layers,
  Truck,
  PackageCheck,
  CheckCircle2,
  Upload,
  Calculator
} from 'lucide-react';
import { AppGlobalView, Project } from '../../types';
import { LetsEstimateLogo } from '../brand/LetsEstimateLogo';

interface SidebarProps {
  currentView: AppGlobalView;
  currentSubView?: string;
  onNavigate: (view: AppGlobalView, subView?: string) => void;
  onNewProject?: () => void;
  activeProject?: Project | null;
  projectsCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingActionsCount?: number;
  unreadNotificationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  currentSubView = 'overview',
  onNavigate,
  onNewProject,
  activeProject,
  projectsCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  // Collapsible section state
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [estimateOpen, setEstimateOpen] = useState(
    currentView === 'editor' || currentView === 'project-workspace' || currentView === 'estimating'
  );
  const [controlsOpen, setControlsOpen] = useState(currentView === 'controls');
  const [documentsOpen, setDocumentsOpen] = useState(currentView === 'documents');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(currentView === 'settings');

  const handleNavClick = (view: AppGlobalView, subView?: string) => {
    onNavigate(view, subView);
    onCloseMobile();
  };

  const groupHeaderClass = "w-full flex items-center justify-between px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-emerald-300/90 hover:text-white transition cursor-pointer";

  const subItemClass = (isActive: boolean) => `
    w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer
    ${isActive 
      ? 'bg-emerald-800 text-white font-bold shadow-xs' 
      : 'text-slate-300 hover:text-white hover:bg-emerald-950/80'
    }
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        id="app-global-sidebar"
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 text-slate-100 border-r border-emerald-900/50 flex flex-col
          transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-30
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand & Mobile Close */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-900/60 shrink-0 bg-slate-950/90">
          <div 
            className="cursor-pointer"
            onClick={() => handleNavClick('projects')}
            title="Let's Estimate - Construction Costing"
          >
            <LetsEstimateLogo size="sm" theme="dark" showTagline={false} />
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Project Card */}
        {activeProject && activeProject.id && (
          <div className="p-3 mx-3 mt-3 bg-emerald-950/70 border border-emerald-800/60 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-emerald-400" />
                Active Project
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-200 font-semibold border border-emerald-700/50">
                {activeProject.status || 'Draft'}
              </span>
            </div>
            <p className="text-xs font-bold text-white truncate mt-1">
              {activeProject.title}
            </p>
            <button
              type="button"
              onClick={() => handleNavClick('editor', 'overview')}
              className="mt-2 w-full py-1 text-center text-[11px] font-bold rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition shadow-2xs cursor-pointer"
            >
              Open Workspace
            </button>
          </div>
        )}

        {/* Navigation Groups (Reorganized per PART 41) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          
          {/* 1. PROJECTS */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setProjectsOpen(!projectsOpen)}
              className={groupHeaderClass}
            >
              <span className="flex items-center gap-2">
                <FolderKanban className="w-3.5 h-3.5 text-emerald-400" />
                <span>Projects</span>
              </span>
              {projectsOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {projectsOpen && (
              <div className="ml-2 pl-2 border-l border-emerald-900/60 space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleNavClick('projects')}
                  className={subItemClass(currentView === 'projects')}
                >
                  <span className="flex-1 text-left">All Projects</span>
                  {projectsCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-900 text-emerald-200 font-bold">
                      {projectsCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onNewProject) onNewProject();
                    else handleNavClick('projects');
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs text-emerald-300 hover:text-white hover:bg-emerald-950/80 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>New Project</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. ESTIMATE */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setEstimateOpen(!estimateOpen)}
              className={groupHeaderClass}
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Estimate</span>
              </span>
              {estimateOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {estimateOpen && (
              <div className="ml-2 pl-2 border-l border-emerald-900/60 space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleNavClick('editor', 'overview')}
                  className={subItemClass((currentView === 'editor' || currentView === 'project-workspace') && currentSubView === 'overview')}
                >
                  <span>Project Overview</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('editor', 'questionnaire')}
                  className={subItemClass((currentView === 'editor' || currentView === 'project-workspace') && currentSubView === 'questionnaire')}
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Questionnaire</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('editor', 'drawings')}
                  className={subItemClass((currentView === 'editor' || currentView === 'project-workspace') && currentSubView === 'drawings')}
                >
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3 h-3 text-slate-400" />
                    <span>Drawings</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('editor', 'takeoff')}
                  className={subItemClass((currentView === 'editor' || currentView === 'project-workspace') && currentSubView === 'takeoff')}
                >
                  <span className="flex items-center justify-between w-full">
                    <span>Takeoff</span>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('editor', 'boq')}
                  className={subItemClass((currentView === 'editor' || currentView === 'project-workspace') && currentSubView === 'boq')}
                >
                  <span className="flex items-center justify-between w-full">
                    <span>BOQ</span>
                    {activeProject?.items && activeProject.items.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-bold">
                        {activeProject.items.length}
                      </span>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('editor', 'rates')}
                  className={subItemClass((currentView === 'editor' || currentView === 'project-workspace') && currentSubView === 'rates')}
                >
                  <span className="flex items-center gap-1.5">
                    <Calculator className="w-3 h-3 text-slate-400" />
                    <span>Rates</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('editor', 'summary')}
                  className={subItemClass((currentView === 'editor' || currentView === 'project-workspace') && currentSubView === 'summary')}
                >
                  <span>Summary</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. PROJECT CONTROL */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setControlsOpen(!controlsOpen)}
              className={groupHeaderClass}
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Project Control</span>
              </span>
              {controlsOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {controlsOpen && (
              <div className="ml-2 pl-2 border-l border-emerald-900/60 space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleNavClick('controls', 'variations')}
                  className={subItemClass(currentView === 'controls' && currentSubView === 'variations')}
                >
                  <span>Variations</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('controls', 'valuations')}
                  className={subItemClass(currentView === 'controls' && currentSubView === 'valuations')}
                >
                  <span>Valuations</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('controls', 'certificates')}
                  className={subItemClass(currentView === 'controls' && currentSubView === 'certificates')}
                >
                  <span>Certificates</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('controls', 'final-account')}
                  className={subItemClass(currentView === 'controls' && currentSubView === 'final-account')}
                >
                  <span>Final Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('controls', 'payments')}
                  className={subItemClass(currentView === 'controls' && currentSubView === 'payments')}
                >
                  <span>Cash Flow</span>
                </button>
              </div>
            )}
          </div>

          {/* 4. DOCUMENTS */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setDocumentsOpen(!documentsOpen)}
              className={groupHeaderClass}
            >
              <span className="flex items-center gap-2">
                <Files className="w-3.5 h-3.5 text-emerald-400" />
                <span>Documents</span>
              </span>
              {documentsOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {documentsOpen && (
              <div className="ml-2 pl-2 border-l border-emerald-900/60 space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleNavClick('documents', 'reports')}
                  className={subItemClass(currentView === 'documents' && currentSubView === 'reports')}
                >
                  <span>Reports</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('documents', 'exports')}
                  className={subItemClass(currentView === 'documents' && currentSubView === 'exports')}
                >
                  <span>Exports</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('documents', 'saved')}
                  className={subItemClass(currentView === 'documents' && (currentSubView === 'saved' || !currentSubView))}
                >
                  <span>Saved Documents</span>
                </button>
              </div>
            )}
          </div>

          {/* 5. LIBRARY */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setLibraryOpen(!libraryOpen)}
              className={groupHeaderClass}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Library</span>
              </span>
              {libraryOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {libraryOpen && (
              <div className="ml-2 pl-2 border-l border-emerald-900/60 space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleNavClick('estimating', 'rates')}
                  className={subItemClass(currentView === 'estimating' && currentSubView === 'rates')}
                >
                  <span>My Rates</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('projects')}
                  className={subItemClass(false)}
                >
                  <span>Previous BOQs</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('calculators')}
                  className={subItemClass(currentView === 'calculators')}
                >
                  <span>Takeoff Templates</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('team', 'suppliers')}
                  className={subItemClass(currentView === 'team')}
                >
                  <span>Suppliers</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('calculators', 'materials')}
                  className={subItemClass(false)}
                >
                  <span>Materials</span>
                </button>
              </div>
            )}
          </div>

          {/* 6. SETTINGS */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={groupHeaderClass}
            >
              <span className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-emerald-400" />
                <span>Settings</span>
              </span>
              {settingsOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {settingsOpen && (
              <div className="ml-2 pl-2 border-l border-emerald-900/60 space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleNavClick('settings', 'account')}
                  className={subItemClass(currentView === 'settings' && currentSubView === 'account')}
                >
                  <span>Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('settings', 'company')}
                  className={subItemClass(currentView === 'settings' && currentSubView === 'company')}
                >
                  <span>Company</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('settings', 'preferences')}
                  className={subItemClass(currentView === 'settings' && currentSubView === 'preferences')}
                >
                  <span>Preferences</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Accreditation Badge */}
        <div className="p-3 border-t border-emerald-900/60 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-slate-300">NIQS / BESMM4</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400">v2.5 Pro</span>
        </div>
      </aside>
    </>
  );
};

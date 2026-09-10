import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Calculator, 
  FileSpreadsheet, 
  SlidersHorizontal, 
  Files, 
  Users, 
  Bell, 
  Settings, 
  HelpCircle, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  Database, 
  TrendingUp, 
  Receipt, 
  Award, 
  FileCheck2, 
  Layers, 
  Wallet, 
  FileText,
  X,
  Building2,
  ExternalLink
} from 'lucide-react';
import { AppGlobalView, EstimatingSubView, ProjectControlsSubView, Project } from '../../types';
import { LetsEstimateLogo } from '../brand/LetsEstimateLogo';

interface SidebarProps {
  currentView: AppGlobalView;
  onNavigate: (view: AppGlobalView, subView?: string) => void;
  activeProject?: Project | null;
  projectsCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingActionsCount?: number;
  unreadNotificationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  activeProject,
  projectsCount,
  isOpenMobile,
  onCloseMobile,
  pendingActionsCount = 3,
  unreadNotificationsCount = 2,
}) => {
  const [estimatingExpanded, setEstimatingExpanded] = useState<boolean>(
    currentView === 'estimating' || currentView === 'editor'
  );
  const [controlsExpanded, setControlsExpanded] = useState<boolean>(
    currentView === 'controls'
  );

  const handleNavClick = (view: AppGlobalView, subView?: string) => {
    onNavigate(view, subView);
    onCloseMobile();
  };

  const navItemClass = (isActive: boolean) => `
    flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer
    ${isActive 
      ? 'bg-emerald-800 text-white shadow-sm font-bold' 
      : 'text-slate-300 hover:text-white hover:bg-emerald-900/60'
    }
  `;

  const subItemClass = (isActive: boolean) => `
    flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer
    ${isActive 
      ? 'bg-emerald-700/80 text-white font-bold' 
      : 'text-slate-400 hover:text-slate-200 hover:bg-emerald-950/80'
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
            onClick={() => handleNavClick('dashboard')}
            title="Return to Dashboard"
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

        {/* Active Project Quick Card if loaded */}
        {activeProject && activeProject.id && (
          <div className="p-3 mx-3 mt-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Active Project
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-800/80 text-emerald-200 font-semibold">
                {activeProject.status || 'Draft'}
              </span>
            </div>
            <p className="text-xs font-bold text-white truncate mt-1">
              {activeProject.title}
            </p>
            <button
              type="button"
              onClick={() => handleNavClick('editor')}
              className="mt-2 w-full py-1 text-center text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-xs cursor-pointer"
            >
              Open Workspace
            </button>
          </div>
        )}

        {/* Navigation Groups (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          
          {/* GROUP: MAIN */}
          <div>
            <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400/80">
              Main
            </div>
            <div className="space-y-1 mt-1">
              {/* Dashboard */}
              <button
                type="button"
                id="nav-item-dashboard"
                onClick={() => handleNavClick('dashboard')}
                className={`w-full ${navItemClass(currentView === 'dashboard')}`}
              >
                <div className="flex items-center space-x-2.5">
                  <LayoutDashboard className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Dashboard</span>
                </div>
              </button>

              {/* Projects */}
              <button
                type="button"
                id="nav-item-projects"
                onClick={() => handleNavClick('projects')}
                className={`w-full ${navItemClass(currentView === 'projects')}`}
              >
                <div className="flex items-center space-x-2.5">
                  <FolderKanban className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Projects</span>
                </div>
                {projectsCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/90 text-emerald-200 font-bold border border-emerald-700/50">
                    {projectsCount}
                  </span>
                )}
              </button>

              {/* Estimating (Expandable Group) */}
              <div>
                <button
                  type="button"
                  id="nav-item-estimating"
                  onClick={() => setEstimatingExpanded(!estimatingExpanded)}
                  className={`w-full ${navItemClass(currentView === 'estimating' || currentView === 'editor')}`}
                >
                  <div className="flex items-center space-x-2.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Estimating</span>
                  </div>
                  {estimatingExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {estimatingExpanded && (
                  <div className="mt-1 ml-4 pl-2 border-l border-emerald-800/60 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => handleNavClick('estimating', 'boq')}
                      className={`w-full ${subItemClass(currentView === 'estimating')}`}
                    >
                      <span>BOQ &amp; Estimates</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('estimating', 'takeoff')}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-emerald-950/80 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>AI Takeoff</span>
                      </span>
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('estimating', 'rates')}
                      className="w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-emerald-950/80 cursor-pointer"
                    >
                      <span>Rate Library</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('estimating', 'analysis')}
                      className="w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-emerald-950/80 cursor-pointer"
                    >
                      <span>Rate Analysis</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('estimating', 'estimate')}
                      className="w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-emerald-950/80 cursor-pointer"
                    >
                      <span>Cost Estimate</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Project Controls (Expandable Group) */}
              <div>
                <button
                  type="button"
                  id="nav-item-controls"
                  onClick={() => setControlsExpanded(!controlsExpanded)}
                  className={`w-full ${navItemClass(currentView === 'controls')}`}
                >
                  <div className="flex items-center space-x-2.5">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Project Controls</span>
                  </div>
                  {controlsExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {controlsExpanded && (
                  <div className="mt-1 ml-4 pl-2 border-l border-emerald-800/60 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => handleNavClick('controls', 'budget')}
                      className="w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-emerald-950/80 cursor-pointer"
                    >
                      <span>Project Budget</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('controls', 'valuations')}
                      className="w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-emerald-950/80 cursor-pointer"
                    >
                      <span>Valuations</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('controls', 'certificates')}
                      className="w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-emerald-950/80 cursor-pointer"
                    >
                      <span>Payment Certificates</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('controls', 'variations')}
                      className="w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-emerald-950/80 cursor-pointer"
                    >
                      <span>Variations</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('controls', 'payments')}
                      className="w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-emerald-950/80 cursor-pointer"
                    >
                      <span>Payments</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('controls', 'final-account')}
                      className="w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-emerald-950/80 cursor-pointer"
                    >
                      <span>Final Account</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Calculators & Tools */}
              <button
                type="button"
                id="nav-item-calculators"
                onClick={() => handleNavClick('calculators')}
                className={`w-full ${navItemClass(currentView === 'calculators')}`}
              >
                <div className="flex items-center space-x-2.5">
                  <Calculator className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Calculators &amp; Tools</span>
                </div>
              </button>

              {/* Documents & Reports */}
              <button
                type="button"
                id="nav-item-documents"
                onClick={() => handleNavClick('documents')}
                className={`w-full ${navItemClass(currentView === 'documents')}`}
              >
                <div className="flex items-center space-x-2.5">
                  <Files className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Documents &amp; Reports</span>
                </div>
              </button>
            </div>
          </div>

          {/* GROUP: WORKSPACE */}
          <div>
            <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400/80">
              Workspace
            </div>
            <div className="space-y-1 mt-1">
              <button
                type="button"
                id="nav-item-team"
                onClick={() => handleNavClick('team')}
                className={`w-full ${navItemClass(currentView === 'team')}`}
              >
                <div className="flex items-center space-x-2.5">
                  <Users className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Team &amp; Clients</span>
                </div>
              </button>

              <button
                type="button"
                id="nav-item-notifications"
                onClick={() => handleNavClick('dashboard')}
                className={`w-full ${navItemClass(false)}`}
              >
                <div className="flex items-center space-x-2.5">
                  <Bell className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Notifications</span>
                </div>
                {unreadNotificationsCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* GROUP: SYSTEM */}
          <div>
            <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400/80">
              System
            </div>
            <div className="space-y-1 mt-1">
              <button
                type="button"
                id="nav-item-settings"
                onClick={() => handleNavClick('settings')}
                className={`w-full ${navItemClass(currentView === 'settings')}`}
              >
                <div className="flex items-center space-x-2.5">
                  <Settings className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Settings</span>
                </div>
              </button>

              <button
                type="button"
                id="nav-item-help"
                onClick={() => handleNavClick('help')}
                className={`w-full ${navItemClass(currentView === 'help')}`}
              >
                <div className="flex items-center space-x-2.5">
                  <HelpCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Help &amp; Support</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Accreditation Badge */}
        <div className="p-3 border-t border-emerald-900/60 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-slate-300">NIQS / BESMM4</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400">v2.4 Pro</span>
        </div>
      </aside>
    </>
  );
};

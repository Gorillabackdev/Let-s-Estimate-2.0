import React from 'react';
import { 
  Home,
  LayoutGrid, 
  Folder, 
  PlusCircle, 
  Sparkles, 
  Database, 
  FileSpreadsheet, 
  Receipt, 
  Award, 
  BarChart3, 
  Settings, 
  Crown, 
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calculator,
  Truck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppGlobalView, Project } from '../../types';
import { LetsEstimateLogo } from '../brand/LetsEstimateLogo';

interface SidebarProps {
  currentView: AppGlobalView;
  currentSubView?: string;
  onNavigate: (view: AppGlobalView, subView?: string) => void;
  onNewProject?: () => void;
  onOpenRates?: () => void;
  onOpenSubscription?: () => void;
  activeProject?: Project | null;
  projectsCount?: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  currentSubView,
  onNavigate,
  onNewProject,
  onOpenRates,
  onOpenSubscription,
  activeProject,
  projectsCount = 0,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { user } = useAuth();

  const handleNav = (view: AppGlobalView, subView?: string) => {
    onNavigate(view, subView);
    onCloseMobile();
  };

  // Nav Items configured exactly to reference image
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      isActive: currentView === 'landing',
      onClick: () => handleNav('landing'),
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
      isActive: currentView === 'dashboard',
      onClick: () => handleNav('dashboard'),
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: Folder,
      isActive: currentView === 'projects' || currentView === 'project-workspace' || currentView === 'editor',
      onClick: () => handleNav('projects'),
    },
    {
      id: 'create-estimate',
      label: 'Create Estimate',
      icon: PlusCircle,
      isActive: false,
      onClick: () => {
        if (onNewProject) onNewProject();
        else handleNav('projects');
      },
    },
    {
      id: 'btl-estimator',
      label: 'BTL Estimator',
      icon: Calculator,
      isActive: currentView === 'calculators',
      onClick: () => handleNav('calculators'),
    },
    {
      id: 'ai-plan-to-boq',
      label: 'AI Plan → BOQ',
      icon: Sparkles,
      isActive: currentView === 'estimating' && currentSubView === 'takeoff',
      onClick: () => handleNav('estimating', 'takeoff'),
    },
    {
      id: 'rates-database',
      label: 'Market Rates',
      icon: Database,
      isActive: currentView === 'materials',
      onClick: () => handleNav('materials'),
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: Truck,
      isActive: currentView === 'suppliers',
      onClick: () => handleNav('suppliers'),
    },
    {
      id: 'my-boqs',
      label: 'My BOQs',
      icon: FileSpreadsheet,
      isActive: currentView === 'estimating' && currentSubView !== 'takeoff',
      onClick: () => handleNav('estimating', 'boq'),
    },
    {
      id: 'valuations',
      label: 'Valuations',
      icon: Receipt,
      isActive: currentView === 'controls' && currentSubView === 'valuations',
      onClick: () => handleNav('controls', 'valuations'),
    },
    {
      id: 'certificates',
      label: 'Certificates',
      icon: Award,
      isActive: currentView === 'controls' && currentSubView === 'certificates',
      onClick: () => handleNav('controls', 'certificates'),
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      isActive: currentView === 'documents',
      onClick: () => handleNav('documents'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      isActive: currentView === 'settings',
      onClick: () => handleNav('settings'),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container: Dark Navy Background as in reference */}
      <aside 
        id="app-global-sidebar"
        className={`
          fixed top-0 bottom-0 left-0 z-50 bg-[#0c1e28] text-slate-100 border-r border-[#162d3b] flex flex-col
          transition-all duration-300 ease-in-out lg:static lg:z-30 shrink-0
          ${isOpenMobile ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-[76px]' : 'lg:w-64'}
        `}
      >
        {/* Brand Header */}
        <div className={`h-16 flex items-center justify-between px-4 border-b border-[#162d3b] shrink-0 ${isCollapsed ? 'lg:justify-center' : ''}`}>
          <div 
            className="cursor-pointer"
            onClick={() => handleNav('dashboard')}
            title="Let's Estimate - Plan • Measure • Build"
          >
            {isCollapsed ? (
              <LetsEstimateLogo size="sm" variant="icon-only" useGreenHouseIcon={true} />
            ) : (
              <LetsEstimateLogo size="md" variant="full" showTagline={true} useGreenHouseIcon={true} theme="dark" />
            )}
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                title={isCollapsed ? item.label : undefined}
                className={`
                  w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-150 group cursor-pointer
                  ${isCollapsed ? 'justify-center p-3' : 'space-x-3 px-3.5 py-2.5'}
                  ${active 
                    ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                    : 'text-slate-300 hover:text-white hover:bg-[#132835]'
                  }
                `}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                  active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`} />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Active Project Quick Widget (if active and not collapsed) */}
        {!isCollapsed && activeProject && activeProject.id && (
          <div className="mx-3 mb-3 p-2.5 rounded-xl bg-[#102430] border border-[#1b3546] text-xs">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
              <span className="flex items-center gap-1 text-emerald-400">
                <Building2 className="w-3 h-3" />
                Active Project
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[9px] font-bold border border-emerald-800/60">
                {activeProject.status || 'Draft'}
              </span>
            </div>
            <p className="font-bold text-white text-xs truncate">
              {activeProject.title}
            </p>
            <button
              type="button"
              onClick={() => handleNav('project-workspace')}
              className="mt-1.5 w-full py-1 text-center text-[10px] font-bold rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white transition cursor-pointer"
            >
              Open Workspace
            </button>
          </div>
        )}

        {/* Pro Plan Bottom Card (as shown in reference image) */}
        <div className="p-3 border-t border-[#162d3b] shrink-0">
          {!isCollapsed ? (
            <div 
              onClick={() => {
                if (onOpenSubscription) onOpenSubscription();
                else handleNav('settings');
              }}
              className="p-3 rounded-xl bg-gradient-to-r from-emerald-900/80 to-[#0c2e28] border border-emerald-700/50 hover:border-emerald-500 transition cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-white">Pro Plan</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-emerald-200/90 mt-1 font-medium">
                Unlock more features
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onOpenSubscription) onOpenSubscription();
                else handleNav('settings');
              }}
              title="Pro Plan - Unlock more features"
              className="w-full flex items-center justify-center p-2.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-amber-400 transition cursor-pointer"
            >
              <Crown className="w-5 h-5" />
            </button>
          )}

          {/* Desktop Collapse Toggle */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="mt-2 w-full hidden lg:flex items-center justify-center p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#132835] text-[11px] font-medium transition cursor-pointer"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <span className="flex items-center gap-1.5 text-[10px]">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Collapse sidebar</span>
                </span>
              )}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

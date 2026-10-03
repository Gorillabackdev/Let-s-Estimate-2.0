import React, { useState, useEffect } from 'react';
import { 
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
  ChevronDown,
  ShieldCheck,
  Building2,
  Calculator,
  Truck,
  HeartHandshake,
  Layers,
  AlertTriangle,
  Ruler,
  Upload,
  Sliders,
  GitBranch,
  TrendingUp,
  Scale,
  ShieldAlert,
  FileCheck2,
  HelpCircle,
  BookOpen,
  DollarSign
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
  onOpenManualTakeoff?: () => void;
  onOpenQuestionnaire?: () => void;
  onOpenBoqImport?: () => void;
  onOpenVariations?: () => void;
  onOpenValuations?: () => void;
  onOpenCashFlow?: () => void;
  onOpenTender?: () => void;
  onOpenRiskAudit?: () => void;
  onOpenFinalAccount?: () => void;
  onOpenExecutiveDossier?: () => void;
  onOpenMaterialSchedule?: () => void;
  onOpenHelp?: () => void;
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
  onOpenManualTakeoff,
  onOpenQuestionnaire,
  onOpenBoqImport,
  onOpenVariations,
  onOpenValuations,
  onOpenCashFlow,
  onOpenTender,
  onOpenRiskAudit,
  onOpenFinalAccount,
  onOpenExecutiveDossier,
  onOpenMaterialSchedule,
  onOpenHelp,
  activeProject,
  projectsCount = 0,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { user } = useAuth();

  // Collapsible category groups state (all open by default so no features are hidden!)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('letsestimate_sidebar_groups_v3');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {
      estimating: true,
      controls: true,
      procurement: true,
      calculators: true,
    };
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => {
      const updated = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem('letsestimate_sidebar_groups_v3', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleNav = (view: AppGlobalView, subView?: string) => {
    onNavigate(view, subView);
    onCloseMobile();
  };

  // Auto-expand group if current view/subView matches
  useEffect(() => {
    if (
      currentView === 'estimating' || 
      (currentView === 'calculators' && (currentSubView === 'btl' || currentSubView === 'measured'))
    ) {
      setOpenGroups(prev => prev.estimating ? prev : { ...prev, estimating: true });
    } else if (currentView === 'controls' || currentView === 'documents' || currentView === 'team') {
      setOpenGroups(prev => prev.controls ? prev : { ...prev, controls: true });
    } else if (currentView === 'materials' || currentView === 'suppliers') {
      setOpenGroups(prev => prev.procurement ? prev : { ...prev, procurement: true });
    } else if (
      currentView === 'calculators' && 
      (!currentSubView || ['budgeting', 'outreach', 'construction', 'civil', 'structural', 'qs', 'general_aids', 'conversion'].includes(currentSubView))
    ) {
      setOpenGroups(prev => prev.calculators ? prev : { ...prev, calculators: true });
    }
  }, [currentView, currentSubView]);

  // Section 1: Quick Access
  const quickLinks = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
      isActive: currentView === 'dashboard',
      onClick: () => handleNav('dashboard'),
    },
    {
      id: 'projects',
      label: 'All Projects',
      icon: Folder,
      isActive: currentView === 'projects' || currentView === 'project-workspace' || currentView === 'editor',
      onClick: () => handleNav('projects'),
      badge: projectsCount > 0 ? projectsCount : undefined,
    },
  ];

  // Section 2: Estimating & Takeoffs
  const estimatingItems = [
    {
      id: 'create-estimate',
      label: 'New Project Estimate',
      icon: PlusCircle,
      isActive: false,
      onClick: () => {
        if (onNewProject) onNewProject();
        else handleNav('projects');
      },
    },
    {
      id: 'ai-plan-to-boq',
      label: 'AI Plan Takeoff',
      icon: Sparkles,
      isActive: currentView === 'estimating' && currentSubView === 'takeoff',
      onClick: () => handleNav('estimating', 'takeoff'),
    },
    {
      id: 'manual-takeoff',
      label: 'Manual Drawing Takeoff',
      icon: Ruler,
      isActive: currentView === 'estimating' && currentSubView === 'manual-takeoff',
      onClick: () => {
        if (onOpenManualTakeoff) onOpenManualTakeoff();
        else handleNav('estimating', 'manual-takeoff');
      },
    },
    {
      id: 'my-boqs',
      label: 'My BOQs & Worksheets',
      icon: FileSpreadsheet,
      isActive: currentView === 'estimating' && (!currentSubView || currentSubView === 'boq'),
      onClick: () => handleNav('estimating', 'boq'),
    },
    {
      id: 'import-boq',
      label: 'Import BOQ (Excel / CSV)',
      icon: Upload,
      isActive: false,
      onClick: () => {
        if (onOpenBoqImport) onOpenBoqImport();
        else handleNav('estimating', 'boq');
      },
    },
    {
      id: 'cost-summary',
      label: 'Cost Estimate Summary',
      icon: DollarSign,
      isActive: currentView === 'estimating' && currentSubView === 'estimate',
      onClick: () => handleNav('estimating', 'estimate'),
    },
    {
      id: 'qs-assistant',
      label: 'QS Assistant & BESMM4',
      icon: BookOpen,
      isActive: currentView === 'estimating' && currentSubView === 'qs-assistant',
      onClick: () => handleNav('estimating', 'qs-assistant'),
    },
    {
      id: 'btl-estimator',
      label: 'BTL Estimator 2.0',
      icon: Calculator,
      isActive: currentView === 'calculators' && (currentSubView === 'btl' || currentSubView === 'btl_estimator'),
      onClick: () => handleNav('calculators', 'btl'),
    },
    {
      id: 'measured-takeoff',
      label: 'Measured Works (BESMM4)',
      icon: Layers,
      isActive: currentView === 'calculators' && (currentSubView === 'measured' || currentSubView === 'measured_takeoff'),
      onClick: () => handleNav('calculators', 'measured'),
    },
    {
      id: 'specs-questionnaire',
      label: 'Specs Questionnaire',
      icon: Sliders,
      isActive: false,
      onClick: () => {
        if (onOpenQuestionnaire) onOpenQuestionnaire();
        else handleNav('estimating', 'boq');
      },
    },
  ];

  // Section 3: Project Controls & Contracts
  const controlsItems = [
    {
      id: 'valuations',
      label: 'Interim Valuations',
      icon: Receipt,
      isActive: currentView === 'controls' && currentSubView === 'valuations',
      onClick: () => {
        if (onOpenValuations) onOpenValuations();
        else handleNav('controls', 'valuations');
      },
    },
    {
      id: 'certificates',
      label: 'Payment Certificates',
      icon: Award,
      isActive: currentView === 'controls' && currentSubView === 'certificates',
      onClick: () => handleNav('controls', 'certificates'),
    },
    {
      id: 'variations',
      label: 'Variations Register',
      icon: GitBranch,
      isActive: currentView === 'controls' && currentSubView === 'variations',
      onClick: () => {
        if (onOpenVariations) onOpenVariations();
        else handleNav('controls', 'variations');
      },
    },
    {
      id: 'cashflow',
      label: 'Cash Flow & S-Curve',
      icon: TrendingUp,
      isActive: currentView === 'controls' && currentSubView === 'payments',
      onClick: () => {
        if (onOpenCashFlow) onOpenCashFlow();
        else handleNav('controls', 'payments');
      },
    },
    {
      id: 'tenders',
      label: 'Tender & Bidder Comparison',
      icon: Scale,
      isActive: currentView === 'team',
      onClick: () => {
        if (onOpenTender) onOpenTender();
        else handleNav('team');
      },
    },
    {
      id: 'risk-audit',
      label: 'Risk & Contingency Audit',
      icon: ShieldAlert,
      isActive: currentView === 'controls' && currentSubView === 'budget',
      onClick: () => {
        if (onOpenRiskAudit) onOpenRiskAudit();
        else handleNav('controls', 'budget');
      },
    },
    {
      id: 'final-account',
      label: 'Final Account Settlement',
      icon: FileCheck2,
      isActive: currentView === 'controls' && currentSubView === 'final-account',
      onClick: () => {
        if (onOpenFinalAccount) onOpenFinalAccount();
        else handleNav('controls', 'final-account');
      },
    },
    {
      id: 'executive-dossier',
      label: 'Executive Cost Dossier & Reports',
      icon: BarChart3,
      isActive: currentView === 'documents',
      onClick: () => {
        if (onOpenExecutiveDossier) onOpenExecutiveDossier();
        else handleNav('documents');
      },
    },
  ];

  // Section 4: Procurement & Materials
  const procurementItems = [
    {
      id: 'rates-database',
      label: 'Nigerian Market Rates',
      icon: Database,
      isActive: currentView === 'materials',
      onClick: () => {
        if (onOpenRates) onOpenRates();
        else handleNav('materials');
      },
    },
    {
      id: 'material-schedule',
      label: 'Material Schedule & Rebar BBS',
      icon: Layers,
      isActive: false,
      onClick: () => {
        if (onOpenMaterialSchedule) onOpenMaterialSchedule();
        else handleNav('materials');
      },
    },
    {
      id: 'suppliers',
      label: 'Verified Suppliers Directory',
      icon: Truck,
      isActive: currentView === 'suppliers',
      onClick: () => handleNav('suppliers'),
    },
  ];

  // Section 5: Quick Calculators & QS Aids
  const calculatorItems = [
    {
      id: 'calc-concrete',
      label: 'Concrete & Mix Design',
      icon: Building2,
      isActive: currentView === 'calculators' && (currentSubView === 'construction' || (!currentSubView && currentView === 'calculators')),
      onClick: () => handleNav('calculators', 'construction'),
    },
    {
      id: 'calc-civil',
      label: 'Civil Earthworks',
      icon: Layers,
      isActive: currentView === 'calculators' && currentSubView === 'civil',
      onClick: () => handleNav('calculators', 'civil'),
    },
    {
      id: 'calc-structural',
      label: 'Structural Rebar Aids',
      icon: AlertTriangle,
      isActive: currentView === 'calculators' && currentSubView === 'structural',
      onClick: () => handleNav('calculators', 'structural'),
    },
    {
      id: 'calc-qs',
      label: 'QS Quantity Conversions',
      icon: Calculator,
      isActive: currentView === 'calculators' && currentSubView === 'qs',
      onClick: () => handleNav('calculators', 'qs'),
    },
    {
      id: 'calc-outreach',
      label: 'Community & Health Outreach',
      icon: HeartHandshake,
      isActive: currentView === 'calculators' && (currentSubView === 'budgeting' || currentSubView === 'outreach'),
      onClick: () => handleNav('calculators', 'budgeting'),
    },
  ];

  // Check Admin permission
  const isUserAdmin = Boolean(
    user && (user.role === 'superadmin' || user.role === 'admin' || user.email?.toLowerCase() === 'emmanuelisaac888@gmail.com')
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container: Dark Navy Background */}
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
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* 1. Direct Quick Access */}
          <div className="space-y-1">
            {quickLinks.map((item) => {
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
                    ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3 py-2'}
                    ${active 
                      ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                      : 'text-slate-300 hover:text-white hover:bg-[#132835]'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                      active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`} />
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>
                  {!isCollapsed && item.badge !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700/50">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 2. Group: ESTIMATING & TAKEOFFS */}
          <div className="pt-1">
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => toggleGroup('estimating')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider transition cursor-pointer group"
              >
                <span className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
                  <span>Estimating &amp; Takeoffs</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-500 group-hover:text-slate-300 ${
                  openGroups.estimating ? 'rotate-0' : '-rotate-90'
                }`} />
              </button>
            ) : (
              <div className="h-px bg-slate-800 my-2" />
            )}

            {(openGroups.estimating || isCollapsed) && (
              <div className={`mt-1 space-y-1 ${!isCollapsed ? 'pl-2 border-l border-slate-800/80 ml-2' : ''}`}>
                {estimatingItems.map((item) => {
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
                        ${isCollapsed ? 'justify-center p-3' : 'space-x-2.5 px-2.5 py-1.5'}
                        ${active 
                          ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                          : 'text-slate-300 hover:text-white hover:bg-[#132835]'
                        }
                      `}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 ${
                        active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`} />
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Group: PROJECT CONTROLS & CONTRACTS */}
          <div className="pt-1">
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => toggleGroup('controls')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider transition cursor-pointer group"
              >
                <span className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
                  <span>Project Controls</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-500 group-hover:text-slate-300 ${
                  openGroups.controls ? 'rotate-0' : '-rotate-90'
                }`} />
              </button>
            ) : (
              <div className="h-px bg-slate-800 my-2" />
            )}

            {(openGroups.controls || isCollapsed) && (
              <div className={`mt-1 space-y-1 ${!isCollapsed ? 'pl-2 border-l border-slate-800/80 ml-2' : ''}`}>
                {controlsItems.map((item) => {
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
                        ${isCollapsed ? 'justify-center p-3' : 'space-x-2.5 px-2.5 py-1.5'}
                        ${active 
                          ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                          : 'text-slate-300 hover:text-white hover:bg-[#132835]'
                        }
                      `}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 ${
                        active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`} />
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Group: PROCUREMENT & MATERIALS */}
          <div className="pt-1">
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => toggleGroup('procurement')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider transition cursor-pointer group"
              >
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
                  <span>Procurement &amp; Rates</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-500 group-hover:text-slate-300 ${
                  openGroups.procurement ? 'rotate-0' : '-rotate-90'
                }`} />
              </button>
            ) : (
              <div className="h-px bg-slate-800 my-2" />
            )}

            {(openGroups.procurement || isCollapsed) && (
              <div className={`mt-1 space-y-1 ${!isCollapsed ? 'pl-2 border-l border-slate-800/80 ml-2' : ''}`}>
                {procurementItems.map((item) => {
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
                        ${isCollapsed ? 'justify-center p-3' : 'space-x-2.5 px-2.5 py-1.5'}
                        ${active 
                          ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                          : 'text-slate-300 hover:text-white hover:bg-[#132835]'
                        }
                      `}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 ${
                        active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`} />
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Group: QUICK CALCULATORS & QS AIDS */}
          <div className="pt-1">
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => toggleGroup('calculators')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider transition cursor-pointer group"
              >
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
                  <span>Quick Calculators</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-500 group-hover:text-slate-300 ${
                  openGroups.calculators ? 'rotate-0' : '-rotate-90'
                }`} />
              </button>
            ) : (
              <div className="h-px bg-slate-800 my-2" />
            )}

            {(openGroups.calculators || isCollapsed) && (
              <div className={`mt-1 space-y-1 ${!isCollapsed ? 'pl-2 border-l border-slate-800/80 ml-2' : ''}`}>
                {calculatorItems.map((item) => {
                  const Icon = item.icon;
                  const active = item.isActive;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onClick}
                      title={isCollapsed ? item.label : undefined}
                      className={`
                        w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-150 group cursor-pointer text-left
                        ${isCollapsed ? 'justify-center p-3' : 'space-x-2.5 px-2.5 py-1.5'}
                        ${active 
                          ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                          : 'text-slate-300 hover:text-white hover:bg-[#132835]'
                        }
                      `}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 ${
                        active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`} />
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. Settings, Help & Admin */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1">
            <button
              type="button"
              onClick={() => handleNav('settings')}
              title={isCollapsed ? 'Settings & Organization' : undefined}
              className={`
                w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-150 group cursor-pointer
                ${isCollapsed ? 'justify-center p-3' : 'space-x-3 px-3 py-2'}
                ${currentView === 'settings' 
                  ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                  : 'text-slate-300 hover:text-white hover:bg-[#132835]'
                }
              `}
            >
              <Settings className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                currentView === 'settings' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
              }`} />
              {!isCollapsed && (
                <span className="truncate">Settings &amp; Organization</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenHelp) onOpenHelp();
                else handleNav('help');
              }}
              title={isCollapsed ? 'Help & Support' : undefined}
              className={`
                w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-150 group cursor-pointer
                ${isCollapsed ? 'justify-center p-3' : 'space-x-3 px-3 py-2'}
                ${currentView === 'help' 
                  ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                  : 'text-slate-300 hover:text-white hover:bg-[#132835]'
                }
              `}
            >
              <HelpCircle className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                currentView === 'help' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
              }`} />
              {!isCollapsed && (
                <span className="truncate">Help &amp; Support</span>
              )}
            </button>

            {isUserAdmin && (
              <button
                type="button"
                onClick={() => handleNav('admin-portal')}
                title={isCollapsed ? 'Admin Command Portal' : undefined}
                className={`
                  w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-150 group cursor-pointer
                  ${isCollapsed ? 'justify-center p-3' : 'space-x-3 px-3 py-2'}
                  ${currentView === 'admin-portal' || currentView === 'admin' 
                    ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                    : 'text-amber-300 hover:text-amber-200 hover:bg-[#132835]'
                  }
                `}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 transition-transform group-hover:scale-105" />
                {!isCollapsed && (
                  <span className="truncate">Admin Command Portal</span>
                )}
              </button>
            )}
          </div>
        </nav>

        {/* Active Project Quick Widget (if active and not collapsed) */}
        {!isCollapsed && activeProject && activeProject.id && (
          <div className="mx-3 mb-2 p-2.5 rounded-xl bg-[#102430] border border-[#1b3546] text-xs">
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

        {/* Pro Plan Bottom Card */}
        <div className="p-3 border-t border-[#162d3b] shrink-0">
          {!isCollapsed ? (
            <div 
              onClick={() => {
                if (onOpenSubscription) onOpenSubscription();
                else handleNav('settings');
              }}
              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-900/80 to-[#0c2e28] border border-emerald-700/50 hover:border-emerald-500 transition cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-white">Pro Plan</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-emerald-200/90 mt-0.5 font-medium">
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

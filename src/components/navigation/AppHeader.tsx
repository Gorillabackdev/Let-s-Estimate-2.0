import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Menu, 
  Bell, 
  ChevronDown, 
  User, 
  FolderKanban, 
  FileSpreadsheet, 
  Sparkles, 
  SlidersHorizontal, 
  FileCheck2, 
  Calculator, 
  Upload, 
  Globe, 
  CreditCard, 
  LogOut, 
  ShieldCheck, 
  FileText,
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
  CheckCircle2,
  X,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppGlobalView, Project, BoqItem, StandardRate } from '../../types';
import { formatNaira } from '../../utils/format';

interface AppHeaderProps {
  currentView: AppGlobalView;
  onNavigate: (view: AppGlobalView, subView?: string) => void;
  onOpenMobileSidebar: () => void;
  projects: Project[];
  activeProject?: Project | null;
  onSelectProject?: (projectId: string) => void;
  onNewProject: () => void;
  onNewBoq: () => void;
  onNewEstimate: () => void;
  onAiTakeoff: () => void;
  onNewValuation: () => void;
  onNewCertificate: () => void;
  onNewVariation: () => void;
  onNewCalculation: () => void;
  onUploadDocument: () => void;
  onOpenSubscriptionModal: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentView,
  onNavigate,
  onOpenMobileSidebar,
  projects,
  activeProject,
  onSelectProject,
  onNewProject,
  onNewBoq,
  onNewEstimate,
  onAiTakeoff,
  onNewValuation,
  onNewCertificate,
  onNewVariation,
  onNewCalculation,
  onUploadDocument,
  onOpenSubscriptionModal,
}) => {
  const { user, openAuthModal, openProfileModal, logout } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const createRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setIsCreateOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items for global search
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchResults = React.useMemo(() => {
    if (!normalizedQuery) return null;

    const matchedProjects = projects.filter(p => 
      p.title.toLowerCase().includes(normalizedQuery) ||
      p.location.toLowerCase().includes(normalizedQuery) ||
      (p.client_name && p.client_name.toLowerCase().includes(normalizedQuery)) ||
      (p.contractor && p.contractor.toLowerCase().includes(normalizedQuery))
    ).slice(0, 5);

    const matchedBoqItems: Array<{ projectTitle: string; projectId: string; item: BoqItem }> = [];
    projects.forEach(p => {
      (p.items || []).forEach(item => {
        if (
          item.item.toLowerCase().includes(normalizedQuery) ||
          item.description.toLowerCase().includes(normalizedQuery) ||
          (item.section && item.section.toLowerCase().includes(normalizedQuery))
        ) {
          if (matchedBoqItems.length < 5) {
            matchedBoqItems.push({ projectTitle: p.title, projectId: p.id, item });
          }
        }
      });
    });

    const standardCalculations = [
      { name: 'Concrete Volume Calculator', cat: 'Construction' },
      { name: 'Cement / Sand / Aggregate Mix', cat: 'Construction' },
      { name: 'Sandcrete Block Estimator', cat: 'Construction' },
      { name: 'Earthworks Cut & Fill', cat: 'Civil Engineering' },
      { name: 'Reinforcement Steel Bar Weight & Length', cat: 'Structural' },
      { name: 'Rate Analysis Direct Build-up', cat: 'Quantity Surveying' },
      { name: 'Healthcare & NGO Outreach Budget', cat: 'Project Budgeting' },
    ].filter(c => c.name.toLowerCase().includes(normalizedQuery) || c.cat.toLowerCase().includes(normalizedQuery));

    return {
      projects: matchedProjects,
      items: matchedBoqItems,
      calculators: standardCalculations
    };
  }, [normalizedQuery, projects]);

  const hasResults = searchResults && (
    searchResults.projects.length > 0 || 
    searchResults.items.length > 0 || 
    searchResults.calculators.length > 0
  );

  return (
    <header id="app-global-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="w-full px-4 sm:px-6 flex items-center justify-between h-16 gap-4">
        
        {/* Left: Mobile Sidebar Trigger & Breadcrumb */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Current Location / Project context */}
          <div className="hidden sm:flex items-center space-x-2 text-xs">
            <span 
              onClick={() => onNavigate('dashboard')}
              className="text-slate-500 hover:text-emerald-700 font-medium cursor-pointer"
            >
              Let&apos;s Estimate
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-800 capitalize">
              {currentView === 'editor' && activeProject?.title 
                ? activeProject.title 
                : currentView.replace('-', ' ')}
            </span>
          </div>
        </div>

        {/* Center: Global Search Input */}
        <div className="flex-1 max-w-xl relative" ref={searchRef}>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="global-search-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search projects, BOQ items, rates, clients, calculators..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categorized Search Results Dropdown */}
          {isSearchOpen && normalizedQuery && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
              {!hasResults ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No matching projects, BOQ items, or tools found for &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="p-2 divide-y divide-slate-100">
                  {/* Category: Projects */}
                  {searchResults.projects.length > 0 && (
                    <div className="py-2">
                      <div className="px-3 py-1 text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                        <FolderKanban className="w-3 h-3" />
                        Projects
                      </div>
                      {searchResults.projects.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            if (onSelectProject) onSelectProject(p.id);
                            onNavigate('editor');
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="px-3 py-2 hover:bg-emerald-50 rounded-lg cursor-pointer transition flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{p.title}</div>
                            <div className="text-[11px] text-slate-500">{p.location} {p.client_name ? `• ${p.client_name}` : ''}</div>
                          </div>
                          <span className="font-semibold text-emerald-700">{formatNaira(p.grand_total)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category: BOQ Items */}
                  {searchResults.items.length > 0 && (
                    <div className="py-2">
                      <div className="px-3 py-1 text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                        <FileSpreadsheet className="w-3 h-3" />
                        BOQ Items
                      </div>
                      {searchResults.items.map((entry, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            if (onSelectProject) onSelectProject(entry.projectId);
                            onNavigate('editor');
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="px-3 py-2 hover:bg-emerald-50 rounded-lg cursor-pointer transition flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{entry.item.item}</div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">{entry.item.description}</div>
                            <div className="text-[10px] text-emerald-600 font-medium">In: {entry.projectTitle}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-700 font-semibold">{entry.item.qty} {entry.item.unit}</span>
                            <div className="text-[11px] text-emerald-700 font-bold">{formatNaira(entry.item.amount)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category: Calculators */}
                  {searchResults.calculators.length > 0 && (
                    <div className="py-2">
                      <div className="px-3 py-1 text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                        <Calculator className="w-3 h-3" />
                        Calculators &amp; Engineering Aids
                      </div>
                      {searchResults.calculators.map((c, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            onNavigate('calculators');
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="px-3 py-2 hover:bg-emerald-50 rounded-lg cursor-pointer transition flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-slate-900">{c.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">{c.cat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          
          {/* SECTION 10: UNIVERSAL "+ CREATE" BUTTON */}
          <div className="relative" ref={createRef}>
            <button
              id="universal-create-btn"
              type="button"
              onClick={() => setIsCreateOpen(!isCreateOpen)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create</span>
              <ChevronDown className="w-3 h-3 text-emerald-200" />
            </button>

            {/* Dropdown Menu for "+ Create" */}
            {isCreateOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    onNewProject();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition text-left cursor-pointer"
                >
                  <FolderKanban className="w-4 h-4 text-emerald-600" />
                  <span>New Project</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    onNewBoq();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition text-left cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>New BOQ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    onNewEstimate();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition text-left cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>New Estimate</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    onAiTakeoff();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition text-left cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>AI Takeoff</span>
                </button>

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    onNewValuation();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition text-left cursor-pointer"
                >
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>New Valuation</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    onNewCertificate();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition text-left cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span>New Certificate</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    onNewVariation();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition text-left cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                  <span>New Variation</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    onNewCalculation();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition text-left cursor-pointer"
                >
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>New Calculation</span>
                </button>

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    onUploadDocument();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition text-left cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Upload Document</span>
                </button>
              </div>
            )}
          </div>

          {/* User Guide PDF Quick Action */}
          <button
            id="header-user-guide-btn"
            type="button"
            onClick={() => {
              window.open('/api/guide/pdf', '_blank');
            }}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
            title="Download Let's Estimate 2.0 User Manual (PDF)"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>User Guide (PDF)</span>
          </button>

          {/* Notifications Button */}
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1.5 right-1.5 ring-2 ring-white"></span>
          </button>

          {/* User Account / Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              id="user-profile-menu-btn"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
                {user?.full_name ? user.full_name[0].toUpperCase() : 'QS'}
              </div>
              <span className="hidden md:inline text-xs font-bold text-slate-800 max-w-[100px] truncate">
                {user?.full_name || 'Account'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
            </button>

            {/* Profile Dropdown Content */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.full_name || 'Guest Estimator'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {user?.email || 'Registered User'}
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" />
                    <span>NIQS / BESMM4 Verified</span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      openProfileModal();
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left transition"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenSubscriptionModal();
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left transition"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>Billing &amp; Bank Transfer Plans</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      window.open('/api/guide/pdf', '_blank');
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left transition"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span>User Guide &amp; Field Manual (PDF)</span>
                  </button>

                  {/* Section 2: Visit Public Website option placed in profile menu */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onNavigate('landing');
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left transition"
                  >
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>Visit Public Website</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  {user ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left transition font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        openAuthModal('login');
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-emerald-700 hover:bg-emerald-50 text-left transition font-semibold"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Sign In / Register</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

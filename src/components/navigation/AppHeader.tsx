import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Menu, 
  Bell, 
  ChevronDown, 
  User, 
  LogOut, 
  CreditCard, 
  HelpCircle, 
  FolderKanban, 
  FileSpreadsheet, 
  Calculator,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppGlobalView, Project, BoqItem } from '../../types';
import { formatNaira } from '../../utils/format';

interface AppHeaderProps {
  currentView: AppGlobalView;
  onNavigate: (view: AppGlobalView, subView?: string) => void;
  onOpenMobileSidebar: () => void;
  onToggleDesktopSidebar?: () => void;
  projects: Project[];
  activeProject?: Project | null;
  onSelectProject?: (projectId: string) => void;
  onNewProject: () => void;
  onOpenSubscriptionModal: () => void;
  onImportBoq?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentView,
  onNavigate,
  onOpenMobileSidebar,
  onToggleDesktopSidebar,
  projects,
  activeProject,
  onSelectProject,
  onNewProject,
  onOpenSubscriptionModal,
  onImportBoq,
}) => {
  const { user, openAuthModal, openProfileModal, logout, isAdmin } = useAuth();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsProfileOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live filtered search results
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchResults = React.useMemo(() => {
    if (!normalizedQuery) return null;

    const matchedProjects = projects.filter(p => 
      p.title.toLowerCase().includes(normalizedQuery) ||
      p.location.toLowerCase().includes(normalizedQuery) ||
      (p.client_name && p.client_name.toLowerCase().includes(normalizedQuery))
    ).slice(0, 4);

    const standardCalculations = [
      { name: 'BTL Estimator (2-Tab Traceable Take-Off)', cat: 'Take-Off & BTL', view: 'calculators' },
      { name: 'Market Rates & BESMM4 Material Index', cat: 'Market Rates', view: 'materials' },
      { name: 'Building Material Suppliers Directory', cat: 'Suppliers', view: 'suppliers' },
      { name: 'Concrete Volume Calculator', cat: 'Construction', view: 'calculators' },
      { name: 'Sandcrete Block Estimator', cat: 'Masonry', view: 'calculators' },
      { name: 'Reinforcement Steel Bar Takeoff', cat: 'Structural', view: 'calculators' },
      { name: 'BESMM4 Rate Builder Engine', cat: 'Rates', view: 'materials' },
      { name: 'Interim Valuations & Payment Certificates', cat: 'Contracts', view: 'controls', subView: 'certificates' },
      { name: 'AI Plan to BOQ Drawing Vision', cat: 'AI Vision', view: 'estimating', subView: 'takeoff' },
    ].filter(c => c.name.toLowerCase().includes(normalizedQuery) || c.cat.toLowerCase().includes(normalizedQuery));

    return {
      projects: matchedProjects,
      calculators: standardCalculations
    };
  }, [normalizedQuery, projects]);

  const userName = user?.full_name || 'Isaac Emmanuel';
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'IE';

  const userPlan = user?.subscription_tier === 'lifetime_license' 
    ? 'Lifetime Pro' 
    : user?.subscription_tier === 'monthly' || user?.subscription_tier === 'yearly'
    ? 'Pro Plan'
    : 'Pro Plan';

  const notifications = [
    {
      id: 'notif-1',
      title: 'BOQ generated for Hostel Block 1 & 2',
      time: '2 hours ago',
      read: false,
      type: 'boq'
    },
    {
      id: 'notif-2',
      title: 'Nigerian Q3 Market Rates updated',
      time: '6 hours ago',
      read: false,
      type: 'rates'
    },
    {
      id: 'notif-3',
      title: 'Certificate of Completion issued',
      time: '1 day ago',
      read: true,
      type: 'cert'
    }
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 z-20 shrink-0">
      
      {/* Left: Sidebar Hamburger + Global Search */}
      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 max-w-xl">
        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Hamburger (Toggles Collapse) */}
        {onToggleDesktopSidebar && (
          <button
            type="button"
            onClick={onToggleDesktopSidebar}
            className="hidden lg:flex p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Global Search Bar */}
        <div ref={searchRef} className="relative flex-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search projects, files, or features..."
              className="w-full pl-9 pr-14 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-medium text-slate-800 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
            {/* Ctrl + K Shortcut Badge */}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center">
              <span className="text-[10px] font-mono font-medium text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                Ctrl + K
              </span>
            </div>
          </div>

          {/* Search Dropdown Modal/Popout */}
          {isSearchOpen && searchResults && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 z-50 animate-fade-in max-h-96 overflow-y-auto">
              {searchResults.projects.length === 0 && searchResults.calculators.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No matching results for &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Projects matches */}
                  {searchResults.projects.length > 0 && (
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-wider">
                        Projects ({searchResults.projects.length})
                      </span>
                      <div className="mt-1 space-y-1">
                        {searchResults.projects.map(p => (
                          <div
                            key={p.id}
                            onClick={() => {
                              if (onSelectProject) onSelectProject(p.id);
                              onNavigate('project-workspace');
                              setIsSearchOpen(false);
                            }}
                            className="p-2 hover:bg-emerald-50/80 rounded-lg cursor-pointer flex items-center justify-between text-xs transition"
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <FolderKanban className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="font-bold text-slate-800 truncate">{p.title}</span>
                              <span className="text-[10px] text-slate-400 truncate">({p.location})</span>
                            </div>
                            <span className="font-mono text-[11px] font-bold text-emerald-800 ml-2 shrink-0">
                              {formatNaira(p.grand_total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feature shortcuts */}
                  {searchResults.calculators.length > 0 && (
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-wider">
                        Tools &amp; Features
                      </span>
                      <div className="mt-1 space-y-1">
                        {searchResults.calculators.map((c, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              onNavigate(c.view as AppGlobalView, c.subView);
                              setIsSearchOpen(false);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center justify-between text-xs transition"
                          >
                            <span className="font-semibold text-slate-700">{c.name}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">
                              {c.cat}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Notifications + User Profile (Clean & Uncluttered) */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        
        {/* Notifications Bell */}
        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="font-bold text-slate-900">Notifications</span>
                <span className="text-[10px] text-emerald-700 font-semibold cursor-pointer hover:underline">
                  Mark all as read
                </span>
              </div>
              <div className="space-y-2">
                {notifications.map(n => (
                  <div key={n.id} className="p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-slate-800 text-xs">{n.title}</span>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1 ml-2"></span>}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill / Menu */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2.5 p-1 sm:pl-1 sm:pr-2.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            {/* User Initials Avatar */}
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
              {userInitials}
            </div>

            {/* Name and Subscription Tier */}
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                {userName}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {userPlan}
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* User Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in text-xs">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="font-bold text-slate-900 truncate">{userName}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || 'emmanuelisaac888@gmail.com'}</p>
                <div className="inline-flex items-center space-x-1 mt-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold text-[10px]">
                  <Crown className="w-3 h-3 text-emerald-600" />
                  <span>{userPlan}</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    openProfileModal();
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenSubscriptionModal();
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  <span>Subscription &amp; Billing</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate('settings');
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Account Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate('help');
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Help &amp; Support</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate('admin-portal');
                  }}
                  className="w-full px-3.5 py-2 text-left text-amber-700 hover:bg-amber-50 flex items-center space-x-2 transition cursor-pointer font-bold border-t border-slate-100"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admin Command Portal</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};

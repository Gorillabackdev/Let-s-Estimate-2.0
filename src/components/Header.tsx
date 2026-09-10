import React from 'react';
import { FileSpreadsheet, PlusCircle, Database, Building2, User as UserIcon, LogIn, ChevronDown, CreditCard, Sparkles, Globe, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LetsEstimateLogo } from './brand/LetsEstimateLogo';

interface HeaderProps {
  currentView: 'landing' | 'dashboard' | 'editor';
  onNavigate: (view: 'landing' | 'dashboard' | 'editor') => void;
  onNewProject: () => void;
  onOpenRatesModal: () => void;
  onOpenSubscriptionModal: () => void;
  activeProjectTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onNewProject,
  onOpenRatesModal,
  onOpenSubscriptionModal,
  activeProjectTitle,
}) => {
  const { user, openAuthModal, openProfileModal } = useAuth();

  return (
    <header id="app-header" className="bg-emerald-950 text-white shadow-lg border-b border-emerald-800/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Official Brand Logo & Title */}
          <div 
            className="flex items-center cursor-pointer transition hover:opacity-95" 
            onClick={() => onNavigate('dashboard')}
            title="Click to view Let's Estimate Dashboard"
          >
            <LetsEstimateLogo size="md" theme="emerald" showTagline={true} />
          </div>

          {/* Center: Current Project badge if in editor */}
          {currentView === 'editor' && activeProjectTitle && (
            <div className="hidden xl:flex items-center space-x-2 bg-emerald-900/90 border border-emerald-700/80 px-3 py-1.5 rounded-lg max-w-sm">
              <Building2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="text-xs font-medium text-emerald-100 truncate">
                {activeProjectTitle}
              </span>
            </div>
          )}

          {/* Right Navigation & Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* If in editor or dashboard, show Workspace quick button */}
            {currentView !== 'dashboard' && (
              <button
                id="header-workspace-btn"
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500/50 transition cursor-pointer shadow-xs"
                title="Go to Project Workspace & Estimator Dashboard"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span className="hidden sm:inline">Workspace</span>
              </button>
            )}

            {/* Download Source Code ZIP for GitHub */}
            <a
              id="header-download-zip-btn"
              href="/api/download-zip"
              download="lets-estimate-source.zip"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-800/90 hover:bg-emerald-700 text-emerald-100 hover:text-white border border-emerald-600 transition shadow-xs"
              title="Download clean source code ZIP for GitHub (frontend + backend)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden md:inline">Download ZIP</span>
              <span className="md:hidden">ZIP</span>
            </a>

            {/* Rates Reference Guide Modal button */}
            <button
              id="rates-guide-btn"
              type="button"
              onClick={onOpenRatesModal}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-700 transition"
              title="Nigerian Cost Index & Market Rates"
            >
              <Database className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Rate Database (₦)</span>
              <span className="sm:hidden">Rates</span>
            </button>

            {/* Phase 10: Subscription, 7-Day Trial & Bank Transfer */}
            <button
              id="subscription-billing-btn"
              type="button"
              onClick={onOpenSubscriptionModal}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500/90 hover:bg-amber-400 text-slate-950 shadow-xs transition"
              title="7-Day Trial & Bank Transfer Subscription to Isaac Emmanuel (081515121)"
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-950" />
              <span className="hidden md:inline">Billing & Plans</span>
              <span className="md:hidden">Plans</span>
            </button>

            {/* Dashboard / Saved Projects toggle */}
            <button
              id="dashboard-nav-btn"
              type="button"
              onClick={() => onNavigate(currentView === 'dashboard' ? 'editor' : 'dashboard')}
              className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition border ${
                currentView === 'dashboard'
                  ? 'bg-emerald-700 text-white border-emerald-500 shadow-sm'
                  : 'bg-emerald-800/80 text-emerald-100 hover:bg-emerald-700 border-emerald-700'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{currentView === 'dashboard' ? 'Open Workspace' : 'All Projects'}</span>
            </button>

            {/* Big "New Project" button */}
            <button
              id="header-new-project-btn"
              type="button"
              onClick={onNewProject}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-white hover:bg-emerald-50 text-emerald-900 shadow-sm transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-emerald-700" />
              <span>New Project</span>
            </button>

            {/* Phase 1 User Auth / Profile Badge */}
            {user ? (
              <button
                id="header-user-profile-btn"
                type="button"
                onClick={openProfileModal}
                className="inline-flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-lg bg-emerald-800/90 hover:bg-emerald-700 border border-emerald-600 transition shadow-xs text-left"
                title="Manage QS Profile & Account Security"
              >
                <div className="w-7 h-7 rounded-md bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                  {user.full_name?.charAt(0) || 'Q'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-white leading-tight truncate max-w-[130px]">
                    {user.full_name?.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-emerald-200/90 leading-none">
                    {user.role || 'QS'}
                  </p>
                </div>
                <ChevronDown className="w-3 h-3 text-emerald-300 hidden sm:block" />
              </button>
            ) : (
              <button
                id="header-login-btn"
                type="button"
                onClick={() => openAuthModal('login')}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};


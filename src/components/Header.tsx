import React from 'react';
import { HardHat, FileSpreadsheet, PlusCircle, Database, Sparkles, Building2, Download } from 'lucide-react';

interface HeaderProps {
  currentView: 'dashboard' | 'editor';
  onNavigate: (view: 'dashboard' | 'editor') => void;
  onNewProject: () => void;
  onOpenRatesModal: () => void;
  activeProjectTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onNewProject,
  onOpenRatesModal,
  activeProjectTitle,
}) => {
  return (
    <header id="app-header" className="bg-emerald-900 text-white shadow-md border-b border-emerald-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-600 border border-emerald-400/40 flex items-center justify-center shadow-inner">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg sm:text-xl tracking-tight text-white">Let's Estimate</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-700/80 text-emerald-200 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                  Nigeria BOQ
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 font-medium hidden sm:block">
                AI BOQ Tool for Builders & Quantity Surveyors in Nigeria
              </p>
            </div>
          </div>

          {/* Center: Current Project badge if in editor */}
          {currentView === 'editor' && activeProjectTitle && (
            <div className="hidden md:flex items-center space-x-2 bg-emerald-800/80 border border-emerald-700 px-3 py-1.5 rounded-lg max-w-sm">
              <Building2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="text-xs font-medium text-emerald-100 truncate">
                {activeProjectTitle}
              </span>
            </div>
          )}

          {/* Right Navigation & Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
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
          </div>

        </div>
      </div>
    </header>
  );
};

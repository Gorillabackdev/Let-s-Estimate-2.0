import React, { useState, useMemo } from 'react';
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
  Receipt,
  Award,
  MoreVertical,
  Search,
  Filter,
  ArrowUpRight,
  Database,
  ExternalLink,
  ChevronRight,
  Check,
  Play,
  HardHat,
  ShieldCheck,
  FileText,
  DollarSign,
  Truck
} from 'lucide-react';
import { Project, AppGlobalView } from '../../types';
import { formatNaira } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { LetsEstimateLogo } from '../brand/LetsEstimateLogo';
import { getProjectCoverImage } from '../../utils/projectImages';

// High fidelity construction photography assets
import HERO_CONSTRUCTION_IMG from '../../assets/images/construction_hero_crane_1790509965704.jpg';
import HOSTEL_THUMB_IMG from '../../assets/images/hostel_building_thumb_1790509978576.jpg';
import BUNGALOW_THUMB_IMG from '../../assets/images/bungalow_project_thumb_1790509991341.jpg';
import CLINIC_THUMB_IMG from '../../assets/images/community_clinic_thumb_1790510005065.jpg';
import SUPPORT_HARDHAT_IMG from '../../assets/images/support_card_hardhat_1790510016658.jpg';

interface DashboardViewProps {
  projects: Project[];
  loading?: boolean;
  onNavigate: (view: AppGlobalView, subView?: string) => void;
  onOpenProject: (projectId: string) => void;
  onNewProject: () => void;
  onAiTakeoff?: () => void;
  onNewBoq?: () => void;
  onOpenTakeoff?: () => void;
  onOpenRates?: () => void;
  onOpenSubscription?: () => void;
  onImportBoq?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects = [],
  loading = false,
  onNavigate,
  onOpenProject,
  onNewProject,
  onAiTakeoff,
  onNewBoq,
  onOpenTakeoff,
  onOpenRates,
  onOpenSubscription,
  onImportBoq,
}) => {
  const { user } = useAuth();
  
  // Interactive state for tasks, projects filtering, and actions menu
  const [projectSearch, setProjectSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Default tasks from reference design with checkable state
  const [tasks, setTasks] = useState([
    { id: 't1', title: 'Review OML 17 HCDT interview prep', date: 'Sep 16, 2026 • 10:00 AM', done: false },
    { id: 't2', title: 'Finalize BOQ for Hospital Project', date: 'Sep 18, 2026', done: false },
    { id: 't3', title: 'Update rates database (Q3 2026)', date: 'Sep 20, 2026', done: false },
    { id: 't4', title: 'Submit certificate of completion', date: 'Sep 22, 2026', done: false },
    { id: 't5', title: 'Client follow up - US estimate', date: 'Sep 24, 2026', done: false },
  ]);

  // Demo fallback projects matching reference design if database is empty
  const defaultReferenceProjects = useMemo(() => [
    {
      id: 'ref-proj-1',
      title: 'Hostel Block 1 & 2',
      location: 'Port Harcourt, Rivers State',
      project_type: 'Building',
      date: 'Sep 22, 2026',
      status: 'Completed',
      grand_total: 72000000,
      image: HOSTEL_THUMB_IMG,
    },
    {
      id: 'ref-proj-2',
      title: '3 Bedroom Bungalow',
      location: 'Port Harcourt',
      project_type: 'Residential',
      date: 'Sep 20, 2026',
      status: 'In Progress',
      grand_total: 38500000,
      image: BUNGALOW_THUMB_IMG,
    },
    {
      id: 'ref-proj-3',
      title: 'Community Clinic',
      location: 'Rivers State',
      project_type: 'Healthcare',
      date: 'Sep 17, 2026',
      status: 'Draft',
      grand_total: 26800000,
      image: CLINIC_THUMB_IMG,
    },
    {
      id: 'ref-proj-4',
      title: 'Oando Maintenance',
      location: 'Tebidaba Flowstation',
      project_type: 'Industrial',
      date: 'Sep 14, 2026',
      status: 'In Progress',
      grand_total: 52400000,
      image: null,
    },
    {
      id: 'ref-proj-5',
      title: 'Warehouse Project',
      location: 'Port Harcourt',
      project_type: 'Commercial',
      date: 'Sep 10, 2026',
      status: 'Completed',
      grand_total: 41300000,
      image: null,
    },
  ], []);

  // Merge real user projects with reference defaults if needed
  const displayProjects = useMemo(() => {
    if (projects.length > 0) {
      return projects.map((p, idx) => ({
        id: p.id,
        title: p.title,
        location: p.location || 'Nigeria',
        project_type: p.project_type || (idx % 2 === 0 ? 'Residential' : 'Commercial'),
        date: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Sep 2026',
        status: p.status || 'Draft',
        grand_total: p.grand_total || 0,
        image: p.image_url || p.cover_image_url || getProjectCoverImage(p, idx),
        isReal: true
      }));
    }
    return defaultReferenceProjects.map(p => ({ ...p, isReal: false }));
  }, [projects, defaultReferenceProjects]);

  // Filter projects by search query and status filter
  const filteredProjects = useMemo(() => {
    return displayProjects.filter(p => {
      const matchesSearch = 
        p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.location.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.project_type.toLowerCase().includes(projectSearch.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || p.status.toLowerCase().replace(/\s+/g, '') === statusFilter.toLowerCase().replace(/\s+/g, '');
      return matchesSearch && matchesStatus;
    });
  }, [displayProjects, projectSearch, statusFilter]);

  // Key KPI values matching reference design with live fallbacks
  const totalProjectsCount = projects.length > 0 ? projects.length : 8;
  const boqsGeneratedCount = projects.length > 0 ? Math.max(projects.length - 2, 4) : 6;
  const estimatesCreatedCount = projects.length > 0 ? projects.length + 2 : 10;
  const totalPortfolioValue = projects.length > 0 
    ? projects.reduce((acc, p) => acc + (p.grand_total || 0), 0) || 248500000 
    : 248500000;

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
  };

  const handleRowClick = (project: any) => {
    if (project.isReal) {
      onOpenProject(project.id);
    } else {
      onNewProject();
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'in progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'for review':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case 'building':
        return 'text-blue-700 bg-blue-50/80';
      case 'residential':
        return 'text-sky-700 bg-sky-50/80';
      case 'healthcare':
        return 'text-emerald-700 bg-emerald-50/80';
      case 'industrial':
        return 'text-indigo-700 bg-indigo-50/80';
      case 'commercial':
        return 'text-cyan-700 bg-cyan-50/80';
      default:
        return 'text-slate-700 bg-slate-100';
    }
  };

  const firstName = (user?.full_name || 'Isaac').split(' ')[0];

  return (
    <div id="redesigned-dashboard" className="space-y-6 max-w-[1400px] mx-auto pb-12">
      
      {/* ========================================================================= */}
      {/* 1. WELCOME HERO BANNER                                                    */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#d9edf7] via-[#e2f1fa] to-[#d6ebf8] border border-blue-100/80 p-6 sm:p-8 lg:p-10 shadow-xs">
        
        {/* Background Construction Graphic Overlay on right side */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 lg:w-5/12 hidden md:block overflow-hidden pointer-events-none select-none">
          <div className="absolute inset-0 bg-gradient-to-r from-[#e2f1fa] via-transparent to-transparent z-10" />
          <img
            src={HERO_CONSTRUCTION_IMG}
            alt="Construction Crane and Building"
            className="w-full h-full object-cover object-center opacity-85 mix-blend-multiply"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-xl">
          {/* Pill Badge */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-900 border border-emerald-300 text-xs font-bold mb-3 shadow-2xs">
            <span>Welcome back, {firstName}</span>
            <span role="img" aria-label="leaf">🍃</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-900 tracking-tight leading-none">
            Let&apos;s Estimate
          </h1>

          {/* Subtitles */}
          <p className="mt-2 text-sm sm:text-base text-slate-700 font-semibold leading-snug">
            Accurate BOQs, Rates, and Estimates in Minutes.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Built for Nigerian Contractors.
          </p>

          {/* Action CTAs */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onNewProject}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm hover:shadow transition-all duration-150 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Estimate</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('calculators')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50/80 text-emerald-950 text-xs font-bold border border-emerald-300 shadow-2xs transition-all duration-150 cursor-pointer active:scale-95"
              title="Open 2-Tab BTL Estimator and Construction Take-Off"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              <span>BTL Estimator</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenTakeoff) onOpenTakeoff();
                else onNavigate('estimating', 'takeoff');
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300/80 shadow-2xs transition-all duration-150 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Plan → BOQ</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenTakeoff) onOpenTakeoff();
                else onNavigate('estimating', 'takeoff');
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-white/70 hover:bg-white text-slate-700 text-xs font-semibold border border-slate-300/70 shadow-2xs transition-all duration-150 cursor-pointer active:scale-95 hidden sm:inline-flex"
            >
              <Play className="w-3 h-3 text-slate-500 fill-slate-500" />
              <span>Watch Demo</span>
            </button>
          </div>
        </div>

        {/* Floating Callout Card on Right (as in reference image) */}
        <div className="hidden lg:flex absolute right-8 bottom-6 z-20 bg-white/95 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200/90 shadow-md items-center space-x-3 max-w-[260px]">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <Building2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[11px] font-semibold text-slate-800 leading-snug">
            Save time, reduce cost, win more projects.
          </p>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. KPI ROW (4 METRICS: Projects, BOQs, Estimates, Estimated Value)        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Projects */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-xs font-semibold text-slate-500 block">
            Total Projects
          </span>
          <div className="flex items-baseline space-x-2.5 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {totalProjectsCount}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              ↑ 33%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            vs. last 30 days
          </span>
        </div>

        {/* KPI 2: BOQs Generated */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xs font-semibold text-slate-500 block">
            BOQs Generated
          </span>
          <div className="flex items-baseline space-x-2.5 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {boqsGeneratedCount}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              ↑ 50%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            vs. last 30 days
          </span>
        </div>

        {/* KPI 3: Estimates Created */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-xs font-semibold text-slate-500 block">
            Estimates Created
          </span>
          <div className="flex items-baseline space-x-2.5 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {estimatesCreatedCount}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              ↑ 67%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            vs. last 30 days
          </span>
        </div>

        {/* KPI 4: Total Estimated Value */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-xs font-semibold text-slate-500 block">
            Total Estimated Value
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono truncate" title={formatNaira(totalPortfolioValue)}>
              {formatNaira(totalPortfolioValue)}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 shrink-0">
              ↑ 45%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            vs. last 30 days
          </span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. TWO-COLUMN WORKFLOW GRID: Left (~68%) / Right (~32%)                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ======================================================================= */}
        {/* LEFT COLUMN (Lg: col-span-8): Overview Chart, Quick Actions, Projects  */}
        {/* ======================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* A. PROJECT OVERVIEW CHART & MONTHLY GOAL ROW */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Project Overview Chart Card (md:col-span-8) */}
            <div className="md:col-span-8 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Project Overview</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">Your estimating activity over the last 6 months</p>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px]">
                    <span className="flex items-center space-x-1.5 text-slate-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Value (₦)</span>
                    </span>
                    <span className="flex items-center space-x-1.5 text-slate-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                      <span>Projects</span>
                    </span>
                  </div>
                </div>

                {/* SVG Area / Line Chart with smooth curve */}
                <div className="mt-4 h-48 w-full relative">
                  <svg viewBox="0 0 450 160" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="chartEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal grid lines */}
                    <line x1="30" y1="20" x2="440" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="30" y1="55" x2="440" y2="55" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="30" y1="90" x2="440" y2="90" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="30" y1="125" x2="440" y2="125" stroke="#f1f5f9" />

                    {/* Y-Axis Labels */}
                    <text x="5" y="24" fill="#94a3b8" fontSize="10" fontFamily="monospace">8M</text>
                    <text x="5" y="59" fill="#94a3b8" fontSize="10" fontFamily="monospace">6M</text>
                    <text x="5" y="94" fill="#94a3b8" fontSize="10" fontFamily="monospace">4M</text>
                    <text x="5" y="129" fill="#94a3b8" fontSize="10" fontFamily="monospace">2M</text>

                    {/* Area fill under curve */}
                    <path
                      d="M 50 120 C 110 110, 160 90, 220 85 C 280 80, 330 65, 380 62 L 430 45 L 430 135 L 50 135 Z"
                      fill="url(#chartEmeraldGrad)"
                    />

                    {/* Main Line with smooth curve */}
                    <path
                      d="M 50 120 C 110 110, 160 90, 220 85 C 280 80, 330 65, 380 62 L 430 45"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Data Points on curve */}
                    <circle cx="50" cy="120" r="3.5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="130" cy="105" r="3.5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="210" cy="86" r="3.5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="290" cy="80" r="3.5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="370" cy="63" r="3.5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="430" cy="45" r="4.5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              {/* X-Axis Month Labels */}
              <div className="flex justify-between px-8 text-[11px] text-slate-500 font-medium pt-1">
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
              </div>
            </div>

            {/* Monthly Goal Card (md:col-span-4) */}
            <div className="md:col-span-4 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between items-center text-center">
              <div className="w-full text-left">
                <div className="flex items-center space-x-1.5 text-slate-900 font-bold text-xs">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Monthly Goal</span>
                </div>
              </div>

              {/* Circular Gauge Ring */}
              <div className="my-auto py-2 relative flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="#f1f5f9"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="#059669"
                    strokeWidth="10"
                    strokeDasharray={326}
                    strokeDashoffset={326 * (1 - 0.49)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                
                {/* Center Content in Gauge */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-black text-slate-900 font-mono">
                    ₦248.5M
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    of ₦500M
                  </span>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="w-full pt-1">
                <span className="text-xl font-black text-slate-900">
                  49%
                </span>
                <span className="text-[11px] font-bold text-emerald-600 block mt-0.5">
                  ↑ 12% vs last month
                </span>
              </div>
            </div>

          </div>

          {/* B. QUICK ACTIONS: Create Estimate, BTL Estimator, AI Plan to BOQ, Market Rates, Suppliers, My BOQs, Certificates */}
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 sm:gap-3">
              
              {/* 1. Create Estimate */}
              <button
                type="button"
                onClick={onNewProject}
                className="bg-white hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 rounded-xl p-3 text-left transition-all duration-150 shadow-2xs group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Plus className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-900 group-hover:text-emerald-900 truncate">
                    Create Estimate
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    Start a new project
                  </div>
                </div>
                <div className="mt-2 text-slate-400 group-hover:text-emerald-700 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* 2. BTL Estimator */}
              <button
                type="button"
                onClick={() => onNavigate('calculators')}
                className="bg-white hover:bg-teal-50/50 border border-slate-200/80 hover:border-teal-300 rounded-xl p-3 text-left transition-all duration-150 shadow-2xs group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Calculator className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-900 group-hover:text-teal-900 truncate">
                    BTL Estimator
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    Takeoff &amp; calcs
                  </div>
                </div>
                <div className="mt-2 text-slate-400 group-hover:text-teal-700 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* 3. AI Plan → BOQ */}
              <button
                type="button"
                onClick={() => {
                  if (onOpenTakeoff) onOpenTakeoff();
                  else onNavigate('estimating', 'takeoff');
                }}
                className="bg-white hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-300 rounded-xl p-3 text-left transition-all duration-150 shadow-2xs group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-900 group-hover:text-blue-900 truncate">
                    AI Plan → BOQ
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    Upload drawings
                  </div>
                </div>
                <div className="mt-2 text-slate-400 group-hover:text-blue-700 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* 4. Market Rates */}
              <button
                type="button"
                onClick={() => onNavigate('materials')}
                className="bg-white hover:bg-purple-50/50 border border-slate-200/80 hover:border-purple-300 rounded-xl p-3 text-left transition-all duration-150 shadow-2xs group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Database className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-900 group-hover:text-purple-900 truncate">
                    Market Rates
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    Nigerian rate index
                  </div>
                </div>
                <div className="mt-2 text-slate-400 group-hover:text-purple-700 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* 5. Suppliers */}
              <button
                type="button"
                onClick={() => onNavigate('suppliers')}
                className="bg-white hover:bg-sky-50/50 border border-slate-200/80 hover:border-sky-300 rounded-xl p-3 text-left transition-all duration-150 shadow-2xs group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Truck className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-900 group-hover:text-sky-900 truncate">
                    Suppliers
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    Verified vendors
                  </div>
                </div>
                <div className="mt-2 text-slate-400 group-hover:text-sky-700 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* 6. My BOQs */}
              <button
                type="button"
                onClick={() => onNavigate('estimating', 'boq')}
                className="bg-white hover:bg-amber-50/50 border border-slate-200/80 hover:border-amber-300 rounded-xl p-3 text-left transition-all duration-150 shadow-2xs group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-900 group-hover:text-amber-900 truncate">
                    My BOQs
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    Access past BOQs
                  </div>
                </div>
                <div className="mt-2 text-slate-400 group-hover:text-amber-700 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* 7. Certificates */}
              <button
                type="button"
                onClick={() => onNavigate('controls', 'certificates')}
                className="bg-white hover:bg-rose-50/50 border border-slate-200/80 hover:border-rose-300 rounded-xl p-3 text-left transition-all duration-150 shadow-2xs group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Award className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-900 group-hover:text-rose-900 truncate">
                    Certificates
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    Generate CO / IV
                  </div>
                </div>
                <div className="mt-2 text-slate-400 group-hover:text-rose-700 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

            </div>
          </div>

          {/* C. RECENT PROJECTS TABLE */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            
            {/* Header: Title + Search & Filter Controls */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Recent Projects</h2>
                <p className="text-xs text-slate-500">Track status, quantities, and current estimated values</p>
              </div>

              <div className="flex items-center space-x-2">
                {/* Search Box */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder="Search projects..."
                    className="pl-8 pr-2.5 py-1 text-xs font-medium border border-slate-200 rounded-lg w-36 sm:w-44 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="inprogress">In Progress</option>
                  <option value="draft">Draft</option>
                  <option value="forreview">For Review</option>
                </select>

                <button
                  type="button"
                  onClick={() => onNavigate('projects')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center space-x-1 pl-1 cursor-pointer"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4">Project Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Value</th>
                    <th className="py-3 px-4 text-center w-12">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No projects match your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((p) => (
                      <tr 
                        key={p.id}
                        onClick={() => handleRowClick(p)}
                        className="hover:bg-slate-50/80 transition cursor-pointer group"
                      >
                        {/* Project Thumbnail & Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center shadow-2xs">
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.title}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <Building2 className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors block truncate max-w-[180px] sm:max-w-xs">
                                {p.title}
                              </span>
                              <span className="text-[11px] text-slate-400 block truncate">
                                {p.location}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Project Type */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getTypeBadgeClass(p.project_type)}`}>
                            {p.project_type}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-medium text-[11px]">
                          {p.date}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(p.status)}`}>
                            {p.status}
                          </span>
                        </td>

                        {/* Estimated Value */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatNaira(p.grand_total)}
                        </td>

                        {/* Actions Menu */}
                        <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === p.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 animate-fade-in text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleRowClick(p);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-emerald-50 flex items-center space-x-2"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Open Workspace</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onNavigate('estimating', 'boq');
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                                  <span>View BOQ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onNewProject();
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                                >
                                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Clone as New</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN (Lg: col-span-4): Recent Activity, Upcoming Tasks, Support */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. RECENT ACTIVITY CARD */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
              <button 
                type="button" 
                onClick={() => onNavigate('documents')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              
              {/* Event 1 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 leading-snug">
                    BOQ generated for Hostel Block 1 &amp; 2
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    750 m² • 2 Storey
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                  2h ago
                </span>
              </div>

              {/* Event 2 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Calculator className="w-4 h-4 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 leading-snug">
                    Estimate created for Oando Maintenance
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tebidaba Flowstation
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                  4h ago
                </span>
              </div>

              {/* Event 3 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 leading-snug">
                    Project &ldquo;3 Bedroom Bungalow&rdquo; updated
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Rates and quantities edited
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                  6h ago
                </span>
              </div>

              {/* Event 4 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 leading-snug">
                    Certificate of Completion issued
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Project: Community Clinic
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                  8h ago
                </span>
              </div>

              {/* Event 5 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 leading-snug">
                    New user registered
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {user?.email || 'example@gmail.com'}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                  12h ago
                </span>
              </div>

            </div>
          </div>

          {/* 2. UPCOMING TASKS CARD */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h2 className="text-sm font-bold text-slate-900">Upcoming Tasks</h2>
              <button 
                type="button"
                onClick={() => onNavigate('controls')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {tasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="flex items-start space-x-3 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                >
                  <button
                    type="button"
                    className={`w-4 h-4 rounded-full border shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                      task.done 
                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                        : 'border-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {task.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-slate-800 leading-snug ${task.done ? 'line-through text-slate-400' : ''}`}>
                      {task.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {task.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. NEED HELP WITH A PROJECT? (Support / Help Panel) */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#12232f] via-[#102a3a] to-[#0c1f2b] p-5 text-white shadow-md">
            
            {/* Hardhat / Blueprint Imagery on Right */}
            <div className="absolute right-0 bottom-0 w-28 h-28 opacity-30 pointer-events-none select-none overflow-hidden">
              <img
                src={SUPPORT_HARDHAT_IMG}
                alt="Construction Support"
                className="w-full h-full object-cover object-center rounded-tl-full"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="relative z-10 max-w-[220px]">
              <h3 className="text-base font-black text-white tracking-tight">
                Need help with a project?
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Get professional quantity surveying and cost estimating services.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('help')}
                className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
              >
                <span>Contact Us</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="pt-8 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand Lockup */}
        <div className="flex items-center space-x-3">
          <LetsEstimateLogo size="sm" variant="full" showTagline={false} theme="light" />
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-[11px] text-slate-500 font-medium">
            Accurate. Fast. Reliable.
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center space-x-5 text-xs font-semibold text-slate-600">
          <button 
            type="button" 
            onClick={() => onNavigate('help')} 
            className="hover:text-emerald-700 transition cursor-pointer"
          >
            Help
          </button>
          <a 
            href="#standards" 
            onClick={(e) => { e.preventDefault(); onNavigate('help'); }}
            className="hover:text-emerald-700 transition"
          >
            Privacy
          </a>
          <a 
            href="#standards" 
            onClick={(e) => { e.preventDefault(); onNavigate('help'); }}
            className="hover:text-emerald-700 transition"
          >
            Terms
          </a>
          <button 
            type="button" 
            onClick={() => onNavigate('help')} 
            className="hover:text-emerald-700 transition cursor-pointer"
          >
            Contact
          </button>
        </div>

        {/* Copyright */}
        <div className="text-[11px] text-slate-400">
          &copy; 2026 Let&apos;s Estimate. All rights reserved.
        </div>

      </footer>

    </div>
  );
};

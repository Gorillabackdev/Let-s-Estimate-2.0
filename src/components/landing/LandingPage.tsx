import React, { useState } from 'react';
import { 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  Layers, 
  Calculator, 
  TrendingUp, 
  Compass, 
  ArrowRight, 
  ChevronRight, 
  Phone, 
  Mail, 
  MapPin, 
  Award, 
  Scale, 
  Briefcase, 
  DollarSign, 
  Clock, 
  Download,
  Users,
  Check,
  Zap,
  Sliders,
  Menu,
  X,
  FileSpreadsheet,
  Receipt,
  Database,
  Hammer,
  HardHat,
  Search
} from 'lucide-react';
import { LetsEstimateLogo } from '../brand/LetsEstimateLogo';
import { useAuth } from '../../context/AuthContext';
import { AppGlobalView, ISAAC_BANK_DETAILS } from '../../types';

// Real construction photographs from assets
import heroCraneImg from '../../assets/images/construction_hero_crane_1790509965704.jpg';
import engineerHeroImg from '../../assets/images/construction_engineer_hero_1790628930628.jpg';
import engineersInspectImg from '../../assets/images/site_engineers_inspecting_1790628945478.jpg';
import duplexImg from '../../assets/images/luxury_duplex_thumb_1790516776093.jpg';
import bungalowImg from '../../assets/images/bungalow_project_thumb_1790509991341.jpg';
import hostelImg from '../../assets/images/hostel_building_thumb_1790509978576.jpg';
import commercialImg from '../../assets/images/commercial_office_thumb_1790516762276.jpg';
import clinicImg from '../../assets/images/community_clinic_thumb_1790510005065.jpg';
import hardhatImg from '../../assets/images/support_card_hardhat_1790510016658.jpg';

interface LandingPageProps {
  onOpenApp: () => void;
  onOpenAuth: (view?: 'login' | 'register', targetView?: AppGlobalView, targetSubView?: string) => void;
  onNavigate?: (view: AppGlobalView, subView?: string) => void;
  onOpenQuestionnaireDemo?: () => void;
  onOpenSubscription?: () => void;
  onNewProject?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenApp,
  onOpenAuth,
  onNavigate,
  onOpenQuestionnaireDemo,
  onOpenSubscription,
  onNewProject,
}) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<'Lagos' | 'Rivers' | 'Abuja' | 'Enugu' | 'Kano'>('Lagos');
  const [selectedTypology, setSelectedTypology] = useState<'bungalow' | 'duplex' | 'hostel'>('bungalow');

  // Smooth scroll handler for in-page anchors
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (targetId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Interactive Estimating Preview Math
  const stateMultipliers: Record<string, { multiplier: number; swampNote: string }> = {
    Lagos: { multiplier: 1.0, swampNote: 'Standard Lagos mainland/island rates' },
    Rivers: { multiplier: 1.15, swampNote: '+15% Port Harcourt clay/swamp footing premium' },
    Abuja: { multiplier: 1.08, swampNote: '+8% FCT haulage & quarry delivery rate' },
    Enugu: { multiplier: 0.94, swampNote: 'Competitive Eastern masonry & aggregate rates' },
    Kano: { multiplier: 0.92, swampNote: 'Northern economic masonry & local labour supply' },
  };

  const typologyData: Record<string, { name: string; gfa: number; baseCost: number; itemsCount: number; img: string }> = {
    bungalow: { name: '4-Bedroom Bungalow', gfa: 220, baseCost: 48500000, itemsCount: 28, img: bungalowImg },
    duplex: { name: '5-Bedroom Contemporary Duplex', gfa: 360, baseCost: 92000000, itemsCount: 34, img: duplexImg },
    hostel: { name: '2-Storey 100-Room Student Hostel', gfa: 1200, baseCost: 265000000, itemsCount: 42, img: hostelImg },
  };

  const currentTypology = typologyData[selectedTypology];
  const currentStateInfo = stateMultipliers[selectedState];
  const adjustedTotal = Math.round(currentTypology.baseCost * currentStateInfo.multiplier);
  const costPerM2 = Math.round(adjustedTotal / currentTypology.gfa);

  // Core Product Capabilities (Section 5) - each connects to its accurate page
  const productCapabilities = [
    {
      title: 'AI Plan → BOQ',
      description: 'Upload architectural floor plans, sections & elevations. Vision models extract quantities and generate structured BESMM4 items.',
      icon: Sparkles,
      tag: 'Computer Vision',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      action: () => {
        if (user) {
          if (onNavigate) onNavigate('estimating', 'takeoff');
          else onOpenApp();
        } else {
          onOpenAuth('register', 'estimating', 'takeoff');
        }
      },
    },
    {
      title: 'Create Estimate',
      description: 'Rapid parametric and trade-by-trade cost estimation. Dynamic substructure, reinforced concrete frame, finishes, and roofing build-ups.',
      icon: Calculator,
      tag: 'Fast Takeoff',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      action: () => {
        if (user) {
          if (onNewProject) onNewProject();
          else if (onNavigate) onNavigate('projects');
          else onOpenApp();
        } else {
          onOpenAuth('register', 'projects');
        }
      },
    },
    {
      title: 'Rates Database',
      description: 'Pre-calibrated Nigerian market rates for materials, labour gangs, and plant across Lagos, Abuja, Rivers, and all 36 States.',
      icon: Database,
      tag: '36 States Calibrated',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
      action: () => {
        if (user) {
          if (onNavigate) onNavigate('materials');
          else onOpenApp();
        } else {
          onOpenAuth('register', 'materials');
        }
      },
    },
    {
      title: 'BOQs',
      description: 'Professional, audit-proof Bills of Quantities arranged by standard trades. Export to Excel, PDF, or client-facing digital dossiers.',
      icon: FileSpreadsheet,
      tag: 'BESMM4 Structured',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      action: () => {
        if (user) {
          if (onNavigate) onNavigate('estimating', 'boq');
          else onOpenApp();
        } else {
          onOpenAuth('register', 'estimating', 'boq');
        }
      },
    },
    {
      title: 'Valuations',
      description: 'Track cumulative project progress on site. Generate monthly Interim Valuations with advance deductions, retention sums, and certified balances.',
      icon: Receipt,
      tag: 'Progress Billing',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      action: () => {
        if (user) {
          if (onNavigate) onNavigate('controls', 'valuations');
          else onOpenApp();
        } else {
          onOpenAuth('register', 'controls', 'valuations');
        }
      },
    },
    {
      title: 'Certificates',
      description: 'Issue official Interim Payment Certificates (IPCs), Practical Completion Certificates, and Making Good Defects Certificates instantly.',
      icon: Award,
      tag: 'Legal IPC Sign-off',
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
      action: () => {
        if (user) {
          if (onNavigate) onNavigate('controls', 'certificates');
          else onOpenApp();
        } else {
          onOpenAuth('register', 'controls', 'certificates');
        }
      },
    },
  ];

  return (
    <div id="public-home-root" className="min-h-screen bg-white text-slate-900 selection:bg-emerald-500 selection:text-white flex flex-col font-sans">
      
      {/* Top Professional Announcement Bar */}
      <div className="bg-[#0b1e28] border-b border-emerald-950/60 text-slate-300 text-xs py-2 px-4 text-center flex items-center justify-center gap-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
          NIQS &amp; QSRBN COMPLIANT
        </span>
        <span className="hidden sm:inline">Engineered specifically for Nigerian Quantity Surveyors, Contractors &amp; Building Firms.</span>
        <span className="sm:hidden">Nigerian Construction Estimating Platform</span>
        {user ? (
          <button 
            onClick={onOpenApp}
            className="underline hover:text-white font-bold transition ml-1 cursor-pointer text-emerald-400"
          >
            Go to Dashboard &rarr;
          </button>
        ) : (
          <button 
            onClick={() => onOpenAuth('register')}
            className="underline hover:text-white font-bold transition ml-1 cursor-pointer text-emerald-400"
          >
            Start Free Trial &rarr;
          </button>
        )}
      </div>

      {/* ================================================== */}
      {/* 3. HEADER & NAVIGATION                             */}
      {/* ================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 transition-shadow">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Tagline */}
          <a 
            href="#home" 
            onClick={(e) => scrollToSection(e, 'home')}
            className="cursor-pointer flex items-center"
          >
            <LetsEstimateLogo size="md" theme="light" showTagline={true} taglineText="Plan. Measure. Build." />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-semibold text-slate-700">
            <a 
              href="#home" 
              onClick={(e) => scrollToSection(e, 'home')}
              className="text-emerald-800 hover:text-emerald-600 transition-colors"
            >
              Home
            </a>
            <a 
              href="#features" 
              onClick={(e) => scrollToSection(e, 'features')}
              className="hover:text-emerald-700 transition-colors"
            >
              Features
            </a>
            <a 
              href="#pricing" 
              onClick={(e) => scrollToSection(e, 'pricing')}
              className="hover:text-emerald-700 transition-colors"
            >
              Pricing
            </a>
            <a 
              href="#resources" 
              onClick={(e) => scrollToSection(e, 'resources')}
              className="hover:text-emerald-700 transition-colors"
            >
              Resources
            </a>
            <a 
              href="#about" 
              onClick={(e) => scrollToSection(e, 'about')}
              className="hover:text-emerald-700 transition-colors"
            >
              About
            </a>
          </nav>

          {/* Right side CTAs */}
          <div className="hidden sm:flex items-center space-x-3">
            {user ? (
              <button
                type="button"
                onClick={onOpenApp}
                className="px-5 py-2.5 text-sm font-bold bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition active:scale-98 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="text-sm font-bold text-slate-700 hover:text-emerald-800 px-4 py-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="px-5 py-2.5 text-sm font-bold bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition active:scale-98 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Sign Up &rarr;</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pt-4 pb-6 border-t border-slate-200 mt-3 space-y-3 animate-fade-in">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
              <a 
                href="#home" 
                onClick={(e) => scrollToSection(e, 'home')}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 text-emerald-800"
              >
                Home
              </a>
              <a 
                href="#features" 
                onClick={(e) => scrollToSection(e, 'features')}
                className="px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                Features
              </a>
              <a 
                href="#pricing" 
                onClick={(e) => scrollToSection(e, 'pricing')}
                className="px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                Pricing
              </a>
              <a 
                href="#resources" 
                onClick={(e) => scrollToSection(e, 'resources')}
                className="px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                Resources
              </a>
              <a 
                href="#about" 
                onClick={(e) => scrollToSection(e, 'about')}
                className="px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                About
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenApp();
                  }}
                  className="w-full py-2.5 text-center text-sm font-bold bg-emerald-800 text-white rounded-xl shadow-xs"
                >
                  Go to Dashboard &rarr;
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth('register');
                    }}
                    className="w-full py-2.5 text-center text-sm font-bold bg-emerald-800 text-white rounded-xl shadow-xs"
                  >
                    Sign Up &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth('login');
                    }}
                    className="w-full py-2.5 text-center text-sm font-bold border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
                  >
                    Log In
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ================================================== */}
      {/* 4. HERO SECTION                                    */}
      {/* ================================================== */}
      <section id="home" className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-[#0c1e28] text-white pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-8 overflow-hidden">
        {/* Construction Crane & Site Background Overlay */}
        <div className="absolute inset-0 z-0 opacity-25 mix-blend-luminosity pointer-events-none">
          <img 
            src={heroCraneImg} 
            alt="Active Building Construction Site" 
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-900/80 z-0 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline, Copy & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Professional Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 backdrop-blur-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>BESMM4 4th Edition Standard</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 backdrop-blur-xs">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>36 Nigerian States Calibrated</span>
              </span>
            </div>

            {/* Exact Required Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight text-white leading-tight">
              Accurate BOQs, Rates &amp; Estimates in Minutes.
            </h1>

            {/* Exact Required Supporting Text */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Let&apos;s Estimate helps Nigerian contractors, quantity surveyors and construction companies create professional BOQs, access accurate rates, and generate detailed estimates faster and smarter.
            </p>

            {/* Primary & Secondary Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              {user ? (
                <button
                  type="button"
                  onClick={onOpenApp}
                  className="px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-xl shadow-emerald-950/50 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('register')}
                    className="px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-xl shadow-emerald-950/50 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Sign Up &rarr;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenAuth('login')}
                    className="px-7 py-4 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-base border border-slate-700 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Log In &rarr;</span>
                  </button>
                </>
              )}
            </div>

            {/* Trust Quote / Credibility Snippet */}
            <div className="pt-4 flex items-center gap-4 text-xs text-slate-400">
              <div className="flex -space-x-2">
                <img src={duplexImg} alt="Duplex Project" className="w-8 h-8 rounded-full border-2 border-slate-800 object-cover" />
                <img src={bungalowImg} alt="Bungalow Project" className="w-8 h-8 rounded-full border-2 border-slate-800 object-cover" />
                <img src={commercialImg} alt="Commercial Project" className="w-8 h-8 rounded-full border-2 border-slate-800 object-cover" />
              </div>
              <div>
                <span className="text-white font-bold">Trusted by Nigerian Quantity Surveyors</span> &amp; General Contractors nationwide.
              </div>
            </div>

          </div>

          {/* Right Column: Professional Construction Photograph Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-900 group">
              <img 
                src={engineerHeroImg} 
                alt="Quantity surveyor reviewing architectural building drawings and site plans" 
                className="w-full h-80 sm:h-96 object-cover object-top group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                    Live Takeoff Engine
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    AI + Deterministic Math
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-semibold">
                  From architectural elevations and floor plans to complete Nigerian Bill of Quantities in under 3 minutes.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================================================== */}
      {/* 5. BELOW HERO: PLATFORM CAPABILITIES               */}
      {/* ================================================== */}
      <section id="features" className="py-20 px-4 sm:px-8 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 inline-block">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Six Powerful Modules Built for Construction Professionals
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Explore the end-to-end toolset designed to replace disconnected spreadsheets with standardized, audit-proof Nigerian cost engineering.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productCapabilities.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <div
                  key={idx}
                  onClick={cap.action}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md hover:border-emerald-600 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${cap.badgeColor}`}>
                        {cap.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {cap.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {cap.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-800 group-hover:text-emerald-700">
                    <span>{user ? 'Open in Workspace' : 'Learn More & Sign Up'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ================================================== */}
      {/* 6. PLATFORM CREDIBILITY & REAL CONSTRUCTION IMAGERY */}
      {/* ================================================== */}
      <section className="py-20 px-4 sm:px-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Visual Photo Grid of Active Nigerian Construction */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden shadow-xs border border-slate-200 h-48 sm:h-60">
                  <img 
                    src={engineersInspectImg} 
                    alt="Site engineers inspecting concrete casting and rebar on active site" 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xs border border-slate-200 h-36 sm:h-44">
                  <img 
                    src={duplexImg} 
                    alt="Completed luxury duplex residential project" 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-6">
                <div className="rounded-2xl overflow-hidden shadow-xs border border-slate-200 h-36 sm:h-44">
                  <img 
                    src={commercialImg} 
                    alt="Multi-storey commercial office development" 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xs border border-slate-200 h-48 sm:h-60">
                  <img 
                    src={hardhatImg} 
                    alt="Professional construction equipment and quantity surveyor tools" 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Why Let's Estimate Details */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 inline-block">
                Why Let&apos;s Estimate
              </span>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Designed Around the Reality of Nigerian Building Projects
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Nigerian construction presents distinct structural and economic challenges — from clay and swamp terrains in the Niger Delta to rapid currency shifts and regional aggregate haulage fees. Generic foreign takeoff software fails to account for these nuances.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Deterministic Mathematical Measurement</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      No random guessing. Quantities tie directly to explicit floor areas, wall perimeters, and structural element schedules.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">36-State Calibrated Rates &amp; Logistics</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Sharp local benchmarks for Dangote/BUA 50kg cement, sharp sand tippers, 20mm granite, and high-yield rebar in Lagos, Rivers, Abuja, Kano, and beyond.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">BESMM4 Sections A through Y Compliance</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Generates bills strictly recognized by Nigerian Institute of Quantity Surveyors (NIQS) and public procurement boards.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (user) onOpenApp();
                    else onOpenAuth('register');
                  }}
                  className="px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition active:scale-98 cursor-pointer"
                >
                  {user ? 'Go to Dashboard →' : 'Create Your Free Account →'}
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ================================================== */}
      {/* HOW IT WORKS SECTION                               */}
      {/* ================================================== */}
      <section className="py-20 px-4 sm:px-8 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 inline-block">
              Workflow
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              How Let&apos;s Estimate Works
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Three clear steps to take your project from architectural drawings to an approved, bankable contract bill.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-extrabold text-lg flex items-center justify-center mb-4">
                  1
                </div>
                <h3 className="text-lg font-bold text-white">Upload Drawing Sheets</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Upload architectural floor plans, elevations, and structural drawings in PDF or image formats. Calibrate scale bars and specify foundation parameters.
                </p>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-700 h-32 mt-4">
                <img src={bungalowImg} alt="Bungalow Plan Takeoff" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-extrabold text-lg flex items-center justify-center mb-4">
                  2
                </div>
                <h3 className="text-lg font-bold text-white">Calibrate Regional Rates</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Select state logistics, terrain type (e.g. Niger Delta swamp premium), contractor profit &amp; overheads (15%), and statutory VAT (7.5%).
                </p>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-700 h-32 mt-4">
                <img src={clinicImg} alt="Community Clinic Estimate" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-extrabold text-lg flex items-center justify-center mb-4">
                  3
                </div>
                <h3 className="text-lg font-bold text-white">Generate BOQs &amp; Valuations</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Export audit-proof Excel &amp; PDF bills. During construction, certify monthly interim valuations, track variations, and issue payment certificates.
                </p>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-700 h-32 mt-4">
                <img src={hostelImg} alt="Hostel Building BOQ" className="w-full h-full object-cover" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ================================================== */}
      {/* INTERACTIVE COST BENCHMARK TOOL                    */}
      {/* ================================================== */}
      <section id="resources" className="py-20 px-4 sm:px-8 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 inline-block">
              Interactive Nigerian Cost Benchmark
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Test Real-Time Rate Variations by State &amp; Typology
            </h2>
            <p className="text-sm text-slate-600">
              Preview how regional logistics, haulage, and ground conditions impact total estimate amounts before starting a project.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-100">
              
              {/* Typology Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  1. Select Building Typology
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bungalow', label: 'Bungalow', sub: '4-Bed • 220m²' },
                    { id: 'duplex', label: 'Duplex', sub: '5-Bed • 360m²' },
                    { id: 'hostel', label: 'Hostel', sub: '100-Room • 1,200m²' },
                  ].map((typ) => (
                    <button
                      key={typ.id}
                      type="button"
                      onClick={() => setSelectedTypology(typ.id as any)}
                      className={`p-3 rounded-xl text-left border transition cursor-pointer ${
                        selectedTypology === typ.id
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold text-xs sm:text-sm">{typ.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{typ.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* State Location Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  2. Select Project State Location
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['Lagos', 'Rivers', 'Abuja', 'Enugu', 'Kano'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedState(st)}
                      className={`py-2.5 px-2 rounded-xl text-center text-xs font-bold border transition cursor-pointer ${
                        selectedState === st
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  {currentStateInfo.swampNote}
                </p>
              </div>

            </div>

            {/* Results Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-1 rounded-2xl overflow-hidden border border-slate-200 h-44">
                <img 
                  src={currentTypology.img} 
                  alt={currentTypology.name} 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    {currentTypology.name} &bull; {selectedState}, Nigeria
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-1 font-mono">
                    ₦{adjustedTotal.toLocaleString('en-NG')}
                  </div>
                  <span className="text-xs text-slate-500">
                    Gross Floor Area: {currentTypology.gfa} m² &bull; Estimated ~₦{costPerM2.toLocaleString('en-NG')} / m²
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                    15% Contractor P&amp;O included
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                    7.5% Statutory VAT included
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                    BESMM4 Standard Items: {currentTypology.itemsCount} trades
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (user) {
                        if (onNavigate) onNavigate('estimating', 'boq');
                        else onOpenApp();
                      } else {
                        onOpenAuth('register', 'estimating', 'boq');
                      }
                    }}
                    className="px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
                  >
                    <span>Create Full BOQ with These Rates &rarr;</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ================================================== */}
      {/* TOOLS & STANDARDS: NIQS & QSRBN REFERENCES        */}
      {/* ================================================== */}
      <section id="about" className="py-20 px-4 sm:px-8 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 inline-block">
              Governing Standards
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Aligned with Nigerian Institute of Quantity Surveyors (NIQS)
            </h2>
            <p className="text-sm text-slate-600">
              Let&apos;s Estimate incorporates standard measurement rules, standard trade groupings, and regulatory frameworks published by NIQS and monitored by the Quantity Surveyors Registration Board of Nigeria (QSRBN).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Standard 1: BESMM4 */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">BESMM4 Standard Method</h3>
                  <span className="text-xs font-semibold text-emerald-800">4th Edition Standard</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Measurement rules are coded to BESMM4 trade groupings — Preliminaries, Substructure, RC Frames, Blockwork, Roofing, Finishes, and Services. Each trade reflects statutory descriptions and measurement units.
              </p>
              <ul className="text-xs space-y-2 text-slate-700 pt-2 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Standard Preliminaries &amp; statutory provisions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Substructure excavation, DPM &amp; foundation blockwork</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Vibrated reinforced concrete frame &amp; high-yield rebar</span>
                </li>
              </ul>
            </div>

            {/* Standard 2: Practice Standards & Contract Admin */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Contract Administration &amp; Valuations</h3>
                  <span className="text-xs font-semibold text-emerald-800">JCT, FIDIC &amp; FMW Conditions</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Support for monthly Interim Payment Certificates (IPCs), 5% statutory retention holding, advance payment amortizations, approved variation orders, and final account reconciliations.
              </p>
              <ul className="text-xs space-y-2 text-slate-700 pt-2 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Interim Valuations with gross vs net balance tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Official Certificates of Practical Completion</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Final Account statements &amp; defect liability records</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* ================================================== */}
      {/* PRICING SECTION                                    */}
      {/* ================================================== */}
      <section id="pricing" className="py-20 px-4 sm:px-8 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 inline-block">
              Pricing Plans
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Straightforward, Transparent Pricing
            </h2>
            <p className="text-sm text-slate-600">
              Pay in Naira via Paystack or direct bank transfer to our corporate account.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            
            {/* 1. 30-Day Free Trial */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evaluation</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">30-Day Free Trial</h3>
                <div className="mt-3 flex items-baseline">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">₦0</span>
                  <span className="text-xs text-slate-500 ml-1">/ 30 days</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Full access to evaluate AI plan takeoff, rates database, and standard BESMM4 outputs.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>30 Days Full Platform Access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>AI Vision Drawing Takeoff</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>36-State Market Rate Library</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Excel &amp; PDF Report Exports</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (user) onOpenApp();
                  else onOpenAuth('register');
                }}
                className="mt-6 w-full py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                {user ? 'Go to Dashboard →' : 'Start 30-Day Trial →'}
              </button>
            </div>

            {/* 2. Single BOQ Pass */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Per-Project Pass</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Single BOQ Pass</h3>
                <div className="mt-3 flex items-baseline">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">₦3,000</span>
                  <span className="text-xs text-slate-500 ml-1">/ project</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  One-off full AI drawing takeoff &amp; Bill of Quantities generation for a single project.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>1 Full Project BOQ &amp; Takeoff</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Access to NIQS Master Rates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Material Schedule &amp; Haulage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Audit-Proof Excel &amp; PDF</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (user) {
                    if (onOpenSubscription) onOpenSubscription();
                    else onOpenApp();
                  } else {
                    onOpenAuth('register');
                  }
                }}
                className="mt-6 w-full py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 font-bold text-xs hover:bg-blue-100 transition cursor-pointer"
              >
                {user ? 'Get Single BOQ Pass →' : 'Sign Up for Single BOQ →'}
              </button>
            </div>

            {/* 3. Professional Monthly */}
            <div className="bg-white rounded-2xl border-2 border-emerald-600 p-5 sm:p-6 flex flex-col justify-between relative shadow-md">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-800 text-white font-bold text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider">
                Most Popular
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Professional License</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Professional Monthly</h3>
                <div className="mt-3 flex items-baseline">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">₦50,000</span>
                  <span className="text-xs text-slate-500 ml-1">/ month</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Full unlimited access for practicing Quantity Surveyors, consulting firms, and builders.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Unlimited AI BOQ Generation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Unlimited IPCs &amp; Valuations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>FIDIC 70 Inflation Simulator</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Priority WhatsApp QS Support</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (user) {
                    if (onOpenSubscription) onOpenSubscription();
                    else onOpenApp();
                  } else {
                    onOpenAuth('register');
                  }
                }}
                className="mt-6 w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-98 cursor-pointer"
              >
                {user ? 'Manage Subscription / Upgrade →' : 'Sign Up for Pro Monthly →'}
              </button>
            </div>

            {/* 4. Corporate Annual Plan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Save ₦200,000</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Corporate Annual</h3>
                <div className="mt-3 flex items-baseline">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">₦400,000</span>
                  <span className="text-xs text-slate-500 ml-1">/ year</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Complete annual cost engineering suite for multidisciplinary practices and developers.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Everything in Pro for 365 Days</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Team Projects &amp; Collaboration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Custom NIQS Stamp Digital Seal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Dedicated QS Consultation</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (user) {
                    if (onOpenSubscription) onOpenSubscription();
                    else onOpenApp();
                  } else {
                    onOpenAuth('register');
                  }
                }}
                className="mt-6 w-full py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                {user ? 'Annual Subscription →' : 'Sign Up for Annual →'}
              </button>
            </div>

          </div>

          {/* Enterprise Lifetime Option Callout */}
          <div className="mt-6 bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  Perpetual License
                </span>
                <span className="text-sm font-bold text-white">Enterprise Lifetime License — ₦2,000,000</span>
              </div>
              <p className="text-xs text-slate-400">
                Permanent perpetual deployment for ministries, large construction groups, and developers. Zero recurring monthly or annual renewals. Includes all future upgrades &amp; custom verified license key.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (user) {
                  if (onOpenSubscription) onOpenSubscription();
                  else onOpenApp();
                } else {
                  onOpenAuth('register');
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 transition active:scale-98 cursor-pointer"
            >
              Get Lifetime License &rarr;
            </button>
          </div>

          {/* Direct Bank Transfer Notice */}
          <div className="mt-10 bg-white border border-slate-200 p-4 rounded-xl text-center text-xs text-slate-600 max-w-2xl mx-auto shadow-2xs">
            <span className="font-bold text-slate-800">Prefer Direct Nigerian Bank Transfer? </span>
            We accept instant NIP transfers to {ISAAC_BANK_DETAILS.bankName} ({ISAAC_BANK_DETAILS.accountNumber} - {ISAAC_BANK_DETAILS.accountName}). Subscriptions activated within 15 minutes.
          </div>

        </div>
      </section>

      {/* ================================================== */}
      {/* FINAL CALL TO ACTION (CTA)                         */}
      {/* ================================================== */}
      <section className="py-20 px-4 sm:px-8 bg-gradient-to-r from-emerald-900 via-emerald-800 to-[#0c2e28] text-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Start Generating Accurate Estimates Today.
          </h2>
          <p className="text-base sm:text-lg text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
            Join quantity surveyors, builders, and developers across Nigeria creating reliable, audit-proof BOQs with Let&apos;s Estimate.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <button
                type="button"
                onClick={onOpenApp}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-emerald-950 font-black text-base shadow-xl hover:bg-emerald-50 transition active:scale-98 cursor-pointer"
              >
                Go to Dashboard &rarr;
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-emerald-950 font-black text-base shadow-xl hover:bg-emerald-50 transition active:scale-98 cursor-pointer"
                >
                  Sign Up &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="w-full sm:w-auto px-7 py-4 rounded-xl bg-emerald-950/60 hover:bg-emerald-950/80 text-white font-bold text-base border border-emerald-600/50 transition active:scale-98 cursor-pointer"
                >
                  Log In &rarr;
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* FOOTER & CONTACT SECTION                          */}
      {/* ================================================== */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-8 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          <div className="space-y-3 md:col-span-2">
            <a 
              href="#home" 
              onClick={(e) => scrollToSection(e, 'home')}
              className="inline-block cursor-pointer"
            >
              <LetsEstimateLogo size="md" theme="dark" showTagline={true} taglineText="Plan. Measure. Build." />
            </a>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed mt-2">
              Let&apos;s Estimate is Nigeria&apos;s specialized construction cost estimation platform, engineered for quantity surveyors, contractors, and building firms adhering to BESMM4 measurement standards.
            </p>
            <div className="text-xs text-slate-300 pt-2 space-y-1">
              <div>
                <span className="text-slate-400">Lead Consultant:</span> <strong className="text-white">Emmanuel Isaac, MYQSF</strong>
              </div>
              <div>
                <span className="text-slate-400">Official Contact:</span>{' '}
                <a href="mailto:estimatewithisaac@gmail.com" className="text-emerald-400 font-bold hover:underline">
                  estimatewithisaac@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Navigation</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <a 
                  href="#home" 
                  onClick={(e) => scrollToSection(e, 'home')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Home
                </a>
              </li>
              <li>
                <a 
                  href="#features" 
                  onClick={(e) => scrollToSection(e, 'features')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Features
                </a>
              </li>
              <li>
                <a 
                  href="#pricing" 
                  onClick={(e) => scrollToSection(e, 'pricing')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a 
                  href="#resources" 
                  onClick={(e) => scrollToSection(e, 'resources')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Resources
                </a>
              </li>
              <li>
                <a 
                  href="#about" 
                  onClick={(e) => scrollToSection(e, 'about')}
                  className="hover:text-white transition cursor-pointer"
                >
                  About
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Account &amp; Access</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              {user ? (
                <li>
                  <button type="button" onClick={onOpenApp} className="hover:text-white transition font-bold text-emerald-400">
                    Dashboard &rarr;
                  </button>
                </li>
              ) : (
                <>
                  <li>
                    <button type="button" onClick={() => onOpenAuth('login')} className="hover:text-white transition">
                      Log In
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => onOpenAuth('register')} className="hover:text-white transition">
                      Sign Up
                    </button>
                  </li>
                </>
              )}
              <li className="pt-2">
                <span className="inline-block px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                  MYQSF Standard
                </span>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} Let&apos;s Estimate (Estimate with Isaac). All rights reserved.
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>NIQS &amp; BESMM4 Compliant</span>
            <span>&bull;</span>
            <span>MYQSF Practice Standard</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

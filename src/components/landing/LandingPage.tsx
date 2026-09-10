/**
 * Let's Estimate - Public SaaS Marketing & Product Landing Page
 * Brand: Estimate with Isaac
 * Specialized AI & Deterministic Cost Management SaaS for Nigerian Construction Professionals
 */

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
  Sliders
} from 'lucide-react';
import { LetsEstimateLogo } from '../brand/LetsEstimateLogo';
import { ISAAC_BANK_DETAILS } from '../../types';

interface LandingPageProps {
  onOpenApp: () => void;
  onOpenAuth: (view?: 'login' | 'register') => void;
  onOpenQuestionnaireDemo?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenApp,
  onOpenAuth,
  onOpenQuestionnaireDemo,
}) => {
  const [selectedState, setSelectedState] = useState<'Lagos' | 'Rivers' | 'Abuja' | 'Enugu' | 'Kano'>('Lagos');
  const [selectedTypology, setSelectedTypology] = useState<'bungalow' | 'duplex' | 'hostel'>('bungalow');

  // Interactive Estimating Preview Math
  const stateMultipliers: Record<string, { multiplier: number; swampNote: string }> = {
    Lagos: { multiplier: 1.0, swampNote: 'Standard Lagos mainland/island rates' },
    Rivers: { multiplier: 1.15, swampNote: '+15% Port Harcourt clay/swamp footing premium' },
    Abuja: { multiplier: 1.08, swampNote: '+8% FCT haulage & quarry delivery rate' },
    Enugu: { multiplier: 0.94, swampNote: 'Competitive Eastern masonry & aggregate rates' },
    Kano: { multiplier: 0.92, swampNote: 'Northern economic masonry & local labour supply' },
  };

  const typologyData: Record<string, { name: string; gfa: number; baseCost: number; itemsCount: number }> = {
    bungalow: { name: '4-Bedroom Bungalow', gfa: 220, baseCost: 48500000, itemsCount: 28 },
    duplex: { name: '5-Bedroom Contemporary Duplex', gfa: 360, baseCost: 92000000, itemsCount: 34 },
    hostel: { name: '2-Storey 100-Room Student Hostel', gfa: 1200, baseCost: 265000000, itemsCount: 42 },
  };

  const currentTypology = typologyData[selectedTypology];
  const currentStateInfo = stateMultipliers[selectedState];
  const adjustedTotal = Math.round(currentTypology.baseCost * currentStateInfo.multiplier);
  const costPerM2 = Math.round(adjustedTotal / currentTypology.gfa);

  return (
    <div id="landing-page-root" className="min-h-screen bg-slate-900 text-slate-100 selection:bg-emerald-500 selection:text-white flex flex-col font-sans">
      
      {/* Top Announcement Bar */}
      <div className="bg-emerald-950/80 border-b border-emerald-800/40 text-emerald-300 text-xs py-2 px-4 text-center flex items-center justify-center gap-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
          BESMM4 COMPLIANT
        </span>
        <span>Engineered specifically for Nigerian Quantity Surveyors, Contractors & Developers.</span>
        <button 
          onClick={onOpenApp}
          className="underline hover:text-white font-semibold transition ml-1 cursor-pointer"
        >
          Try Live Demo &rarr;
        </button>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="cursor-pointer" onClick={onOpenApp}>
            <LetsEstimateLogo size="md" theme="dark" showTagline={true} />
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#estimator-preview" className="hover:text-emerald-400 transition-colors">Interactive Cost Benchmarks</a>
            <a href="#besmm4-standards" className="hover:text-emerald-400 transition-colors">BESMM4 Standards</a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onOpenApp}
              className="px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/30 transition active:scale-98 flex items-center gap-1.5"
            >
              <span>Launch App</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-8 overflow-hidden bg-radial from-slate-800/60 via-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          
          {/* Official Logos Badge Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-800/90 border border-amber-400/40 text-xs text-slate-200 shadow-xl backdrop-blur-xs">
              <div className="w-7 h-7 rounded-lg overflow-hidden border border-amber-400/50 shrink-0">
                <img src="/estimate_logo.jpg" alt="Estimate with Isaac Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-amber-400 tracking-tight">Estimate with Isaac</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300 font-medium">Official Brand</span>
            </div>

            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-200 shadow-xl backdrop-blur-xs">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-amber-400/60 shrink-0">
                <img src="/niqs_seal.jpg" alt="NIQS & QSRBN Accreditation" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-white tracking-tight">NIQS &amp; QSRBN Compliant</span>
              <span className="text-emerald-500">|</span>
              <span className="text-emerald-300 font-medium">BESMM4 Certified</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
            The AI Quantity Surveyor Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Nigerian Construction</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Upload architectural floor plans, elevations, and sections. Generate fully deterministic, 
            NIQS BESMM4-compliant Bills of Quantities, rate analyses, interim valuations, and executive client dossiers in seconds.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenApp}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-900/40 transition active:scale-98 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-emerald-200" />
              <span>Launch Interactive Takeoff App</span>
            </button>

            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white font-semibold text-base border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <Building2 className="w-5 h-5 text-slate-400" />
              <span>Create Free Account</span>
            </button>
          </div>

          {/* Trust Metric Badges */}
          <div className="mt-14 pt-10 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6 text-left max-w-4xl mx-auto">
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
              <div className="text-2xl font-extrabold text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Deterministic math without random hallucination</div>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
              <div className="text-2xl font-extrabold text-emerald-400">36 States</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Calibrated Nigerian market material & labour rates</div>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
              <div className="text-2xl font-extrabold text-emerald-400">BESMM4</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Strict NIQS Standard Method of Measurement</div>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
              <div className="text-2xl font-extrabold text-emerald-400">&lt; 15s</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Drawing upload to complete trade takeoff bill</div>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Estimator Live Preview */}
      <section id="estimator-preview" className="py-16 px-4 sm:px-8 bg-slate-950 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Live Nigerian Cost Benchmark</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Select State & Typology to Preview Instant Rates
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              See how our intelligent engine adjusts rates for Niger Delta clay/swamp, Lagos logistics, and Northern corridors.
            </p>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl">
            
            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-6 border-b border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Building Typology
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bungalow', label: 'Bungalow', sub: '4-Bed • 220m²' },
                    { id: 'duplex', label: 'Duplex', sub: '5-Bed • 360m²' },
                    { id: 'hostel', label: 'Hostel', sub: '100-Room • 1200m²' },
                  ].map((typ) => (
                    <button
                      key={typ.id}
                      onClick={() => setSelectedTypology(typ.id as any)}
                      className={`p-3 rounded-xl text-left border transition ${
                        selectedTypology === typ.id
                          ? 'bg-emerald-950/60 border-emerald-500/80 text-white'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs sm:text-sm">{typ.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{typ.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Project State Location
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['Lagos', 'Rivers', 'Abuja', 'Enugu', 'Kano'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedState(st)}
                      className={`py-2.5 px-2 rounded-xl text-center text-xs font-bold border transition ${
                        selectedState === st
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-emerald-400/90 mt-2.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{currentStateInfo.swampNote}</span>
                </p>
              </div>
            </div>

            {/* Results Display */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                <span className="text-xs text-slate-400 font-medium">Estimated Grand Total</span>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1">
                  ₦ {adjustedTotal.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">Includes 15% P&O + 7.5% VAT</span>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                <span className="text-xs text-slate-400 font-medium">Average Cost per m² GFA</span>
                <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                  ₦ {costPerM2.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ m²</span>
                </div>
                <span className="text-[10px] text-slate-400">Gross Floor Area: {currentTypology.gfa} m²</span>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                <span className="text-xs text-slate-400 font-medium">BESMM4 Work Trades</span>
                <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {currentTypology.itemsCount} Measured Items
                </div>
                <span className="text-[10px] text-slate-400">Substructure to Finishes & Services</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <span className="text-xs text-slate-400">
                Want to upload your actual CAD or PDF blueprint for exact dimensions?
              </span>
              <button
                onClick={onOpenApp}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <span>Take Off This Project in App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-8 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Comprehensive SaaS Suite</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1">
              Built for Every Stage of the Construction Contract
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              From initial architectural review to the final account statement, Let&apos;s Estimate handles the full life-cycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Multimodal AI Takeoff</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Reads blueprints with Gemini 2.5 Flash Vision. Measures external & spine blockwork, concrete slabs, roofing, doors, and finishes without manual scaling errors.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">BESMM4 Standard WBS</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Enforces structural logic: bungalows have no RC columns or suspended slabs; gable roofs have no valley gutters. Prevents spurious quantity inflation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">36-State Market Rates</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Live building material prices: Dangote/BUA Cement, granite aggregate, sharp sand, 225mm vibrated blocks, and local artisan daily rates across Nigeria.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Valuations & Variations</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Issue certified Interim Payment Certificates (IPC), retention deductions, advance payment recoveries, and formal Variation Orders with full audit history.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Tender Comparison</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Compare bids from up to 5 contractors side-by-side. Highlights front-loading anomalies, erratic unit rates, and recommends the safest bid.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Executive Client Dossiers</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Generate professional PDF and Excel exports formatted for Nigerian corporate boards, high-net-worth clients, and institutional bank loan submissions.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Official Governing Standards & Accredited Logos Showcase */}
      <section id="besmm4-standards" className="py-20 px-4 sm:px-8 bg-slate-950 border-t border-slate-800 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Governing Accreditations &amp; Standards</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1">
              Built in Strict Compliance with Nigerian Quantity Surveying Bodies
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Every formula, dimension rule, rate breakdown, and trade header is aligned with the Nigerian Institute of Quantity Surveyors (NIQS) and QSRBN regulatory standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* Logo Card 1: Official Brand Logo */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 rounded-3xl p-8 border-2 border-amber-500/40 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-lg bg-slate-950 shrink-0">
                    <img 
                      src="/estimate_logo.jpg" 
                      alt="Let's Estimate - Estimate with Isaac Official Brand Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30 mb-1">
                      OFFICIAL BRAND
                    </div>
                    <h3 className="text-xl font-extrabold text-white">Let&apos;s Estimate</h3>
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Estimate with Isaac</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  The recognized trademark for AI-assisted building cost estimation and quantity takeoff across Nigeria. 
                  Developed by Isaac for professional quantity surveyors, builders, and commercial project managers seeking rigorous, audit-proof BOQs.
                </p>

                <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Deterministic quantity measurement without AI hallucination</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Pre-estimation structural questionnaire calibration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Naira (₦) rate bank calibrated for all 36 Nigerian states</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <button
                  onClick={onOpenApp}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20"
                >
                  <span>Open Estimator Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Logo Card 2: Official NIQS & QSRBN Accreditation Seal */}
            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 rounded-3xl p-8 border-2 border-emerald-500/40 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-400/60 shadow-lg bg-slate-950 shrink-0">
                    <img 
                      src="/niqs_seal.jpg" 
                      alt="NIQS & QSRBN Professional Accreditation Seal" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-400/30 mb-1">
                      PROFESSIONAL ACCREDITATION
                    </div>
                    <h3 className="text-xl font-extrabold text-white">NIQS &amp; QSRBN Compliant</h3>
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">BESMM4 4th Edition Standard</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Formulated in strict adherence to the Building and Engineering Standard Method of Measurement (BESMM4) 
                  published by The Nigerian Institute of Quantity Surveyors (NIQS) and monitored by the Quantity Surveyors Registration Board of Nigeria (QSRBN).
                </p>

                <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>BESMM4 Sections A to Y standard work breakdown structure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>15% Contractor Profit &amp; Overheads statutory allocation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>7.5% Nigerian Value Added Tax (VAT) statutory calculation</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <button
                  onClick={onOpenQuestionnaireDemo || onOpenApp}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
                >
                  <span>Test Questionnaire &amp; BESMM4 Rules</span>
                  <Sliders className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-8 bg-slate-950 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Straightforward Transparent Pricing</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1">
              Invest in Speed, Accuracy & Professional Trust
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Pay in Naira via Paystack, Flutterwave or direct bank transfer to our corporate account.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* Tier 1: Free Trial */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Starter Evaluation</div>
                <h3 className="text-xl font-bold text-white mt-1">Free Trial</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-white">₦0</span>
                  <span className="text-xs text-slate-400 ml-1">/ forever</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Perfect for testing drawing takeoffs and evaluating BESMM4 standards.
                </p>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>1 Active Project Takeoff</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Gemini 2.5 Flash Drawing Vision</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Standard Nigerian Rate Database</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Excel & CSV BOQ Export</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onOpenApp}
                className="mt-8 w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-semibold text-xs hover:bg-slate-700 transition"
              >
                Launch Free Demo
              </button>
            </div>

            {/* Tier 2: Pro QS (Recommended) */}
            <div className="bg-slate-900 rounded-2xl border-2 border-emerald-500/80 p-6 sm:p-8 flex flex-col justify-between relative shadow-2xl shadow-emerald-950/50">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-extrabold text-[11px] px-3 py-0.5 rounded-full uppercase tracking-wider">
                Most Popular for QS & Contractors
              </div>

              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Professional License</div>
                <h3 className="text-xl font-bold text-white mt-1">Professional QS</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-white">₦45,000</span>
                  <span className="text-xs text-slate-400 ml-1">/ month</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Complete tools for consulting Quantity Surveyors and building contractors.
                </p>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited Project BOQs & Versions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>36-State Dynamic Material & Labour Rates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Interim Valuations & Certified IPCs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Variation Orders & Material Schedules</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Client Dossier & NIQS Printable Reports</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="mt-8 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/40 transition active:scale-98"
              >
                Upgrade to Professional QS
              </button>
            </div>

            {/* Tier 3: Enterprise */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Firms & Consortia</div>
                <h3 className="text-xl font-bold text-white mt-1">Enterprise Firm</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-white">₦120,000</span>
                  <span className="text-xs text-slate-400 ml-1">/ month</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  For multidisciplinary practices, large contractors & developers.
                </p>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Everything in Professional QS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Multi-User QS Team Collaboration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Subcontractor Tender Comparison (Up to 5)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Custom Corporate Watermark & Branding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Priority Nigerian WhatsApp/Phone Support</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="mt-8 w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-semibold text-xs hover:bg-slate-700 transition"
              >
                Contact for Enterprise
              </button>
            </div>

          </div>

          {/* Direct Bank Transfer Notice */}
          <div className="mt-10 bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center text-xs text-slate-400 max-w-2xl mx-auto">
            <span className="font-semibold text-slate-300">Prefer Direct Nigerian Bank Transfer? </span>
            We accept instant NIP transfers to {ISAAC_BANK_DETAILS.bankName} ({ISAAC_BANK_DETAILS.accountNumber} - {ISAAC_BANK_DETAILS.accountName}). Subscriptions activated within 15 minutes.
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-10 px-4 sm:px-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <LetsEstimateLogo size="sm" theme="dark" showTagline={true} />
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />
            <span className="text-[11px] text-slate-400">
              &copy; {new Date().getFullYear()} Let&apos;s Estimate (Estimate with Isaac). All rights reserved.
            </span>
          </div>

          <div className="flex items-center space-x-6 text-slate-400">
            <span className="hidden md:inline text-emerald-400/80">NIQS &amp; BESMM4 Standard Compliant</span>
            <button onClick={onOpenApp} className="hover:text-emerald-400 transition font-semibold">
              Open App
            </button>
            <button onClick={() => onOpenAuth('login')} className="hover:text-emerald-400 transition font-semibold">
              Login
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};

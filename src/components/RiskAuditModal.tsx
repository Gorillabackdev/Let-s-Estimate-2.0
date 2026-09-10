import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  Lightbulb, 
  Percent, 
  Calculator, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight, 
  Sliders, 
  DollarSign, 
  Flame, 
  FileText,
  BadgeAlert,
  HelpCircle
} from 'lucide-react';
import { ProjectFluctuation, ValueEngineeringProposal, CostRiskAuditResult, BoqItem } from '../types';

interface RiskAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  projectLocation: string;
  projectTotal: number;
  boqItems: BoqItem[];
}

export const RiskAuditModal: React.FC<RiskAuditModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectLocation,
  projectTotal,
  boqItems
}) => {
  const [activeTab, setActiveTab] = useState<'fluctuation' | 'value-engineering'>('fluctuation');
  const [loadingFluctuation, setLoadingFluctuation] = useState(true);
  const [savingFluctuation, setSavingFluctuation] = useState(false);
  const [fluctuation, setFluctuation] = useState<ProjectFluctuation | null>(null);

  // AI Value Engineering Audit state
  const [loadingAiAudit, setLoadingAiAudit] = useState(false);
  const [auditResult, setAuditResult] = useState<CostRiskAuditResult | null>(null);

  // Form parameters for fluctuation
  const [formData, setFormData] = useState({
    base_cement_price: 5500,
    current_cement_price: 8800,
    cement_weight: 0.30,
    base_rebar_price: 750000,
    current_rebar_price: 1280000,
    rebar_weight: 0.25,
    base_diesel_price: 800,
    current_diesel_price: 1350,
    diesel_weight: 0.15,
    base_labour_rate: 4500,
    current_labour_rate: 7000,
    labour_weight: 0.20,
    fixed_element: 0.10,
    base_date: '2024-01-15',
    valuation_date: '2025-02-01'
  });

  const loadFluctuation = async () => {
    if (!projectId) return;
    setLoadingFluctuation(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/fluctuation`);
      const data = await res.json();
      if (data.success && data.fluctuation) {
        setFluctuation(data.fluctuation);
        setFormData({
          base_cement_price: data.fluctuation.base_cement_price,
          current_cement_price: data.fluctuation.current_cement_price,
          cement_weight: data.fluctuation.cement_weight,
          base_rebar_price: data.fluctuation.base_rebar_price,
          current_rebar_price: data.fluctuation.current_rebar_price,
          rebar_weight: data.fluctuation.rebar_weight,
          base_diesel_price: data.fluctuation.base_diesel_price,
          current_diesel_price: data.fluctuation.current_diesel_price,
          diesel_weight: data.fluctuation.diesel_weight,
          base_labour_rate: data.fluctuation.base_labour_rate,
          current_labour_rate: data.fluctuation.current_labour_rate,
          labour_weight: data.fluctuation.labour_weight,
          fixed_element: data.fluctuation.fixed_element,
          base_date: data.fluctuation.base_date || '2024-01-15',
          valuation_date: data.fluctuation.valuation_date || '2025-02-01'
        });
      }
    } catch (err) {
      console.error('Failed to load fluctuation:', err);
    } finally {
      setLoadingFluctuation(false);
    }
  };

  const runValueEngineeringAudit = async () => {
    setLoadingAiAudit(true);
    try {
      const res = await fetch('/api/ai/value-engineering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: projectName,
          location: projectLocation,
          grandTotal: projectTotal,
          items: boqItems
        })
      });
      const data = await res.json();
      if (data.success && data.audit) {
        setAuditResult(data.audit);
      }
    } catch (err) {
      console.error('Failed to run AI value engineering:', err);
    } finally {
      setLoadingAiAudit(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      loadFluctuation();
      // Auto run audit if not yet loaded
      if (!auditResult) {
        runValueEngineeringAudit();
      }
    }
  }, [isOpen, projectId]);

  // Live calculation of FIDIC 70 price adjustment multiplier
  const calculateLiveMultiplier = () => {
    const a = formData.fixed_element;
    const b = formData.cement_weight * (formData.current_cement_price / formData.base_cement_price);
    const c = formData.rebar_weight * (formData.current_rebar_price / formData.base_rebar_price);
    const d = formData.diesel_weight * (formData.current_diesel_price / formData.base_diesel_price);
    const e = formData.labour_weight * (formData.current_labour_rate / formData.base_labour_rate);
    return +(a + b + c + d + e).toFixed(4);
  };

  const liveMultiplier = calculateLiveMultiplier();
  const liveClaimableSum = Math.round(projectTotal * Math.max(0, liveMultiplier - 1));
  const revisedContractSum = projectTotal + liveClaimableSum;

  const handleSaveFluctuation = async () => {
    setSavingFluctuation(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/fluctuation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          original_contract_sum: projectTotal
        })
      });
      const data = await res.json();
      if (data.success && data.fluctuation) {
        setFluctuation(data.fluctuation);
        alert('FIDIC Clause 70 fluctuation parameters and claimable sum saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save fluctuation:', err);
      alert('Failed to save fluctuation settings.');
    } finally {
      setSavingFluctuation(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        id="cost-risk-audit-modal" 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-emerald-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-700/60 rounded-xl border border-emerald-500/30">
              <ShieldAlert className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">AI Cost Risk & Inflation Fluctuation Simulator</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/30 text-amber-200 rounded-full border border-amber-400/30">
                  FIDIC 70 / NIQS
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Simulate building material price escalations, calculate contract price adjustment claims, and explore AI value engineering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium">
            <button
              onClick={() => setActiveTab('fluctuation')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
                activeTab === 'fluctuation'
                  ? 'bg-white text-emerald-800 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              <span>FIDIC Clause 70 Fluctuation Formula</span>
            </button>
            <button
              onClick={() => setActiveTab('value-engineering')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
                activeTab === 'value-engineering'
                  ? 'bg-white text-emerald-800 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI Value Engineering & Material Substitution</span>
            </button>
          </div>

          {activeTab === 'value-engineering' && (
            <button
              onClick={runValueEngineeringAudit}
              disabled={loadingAiAudit}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loadingAiAudit ? 'animate-spin' : ''}`} />
              <span>Re-run AI Audit</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'fluctuation' ? (
            /* TAB 1: FIDIC Clause 70 Fluctuation Simulator */
            <div className="space-y-6">
              {/* Formula & Live Multiplier Banner */}
              <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl p-5 shadow-sm border border-emerald-800">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-wider text-emerald-300 font-semibold flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Standard FIDIC Clause 70 / NIQS Price Adjustment Formula</span>
                    </div>
                    <div className="font-mono text-sm bg-black/30 p-2.5 rounded-lg border border-white/10 text-emerald-100">
                      P<sub>n</sub> / P<sub>0</sub> = a + b(C<sub>n</sub> / C<sub>0</sub>) + c(R<sub>n</sub> / R<sub>0</sub>) + d(D<sub>n</sub> / D<sub>0</sub>) + e(L<sub>n</sub> / L<sub>0</sub>)
                    </div>
                    <p className="text-[11px] text-emerald-200">
                      Where <strong>a</strong> is non-adjustable fixed factor (10%), and <strong>b, c, d, e</strong> represent Cement (30%), Rebar (25%), AGO Diesel (15%), and Artisan Labour (20%).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/10 p-4 rounded-xl border border-white/10 text-right">
                    <div>
                      <div className="text-[11px] text-emerald-200">Contract Sum</div>
                      <div className="text-sm font-mono font-bold">₦{projectTotal.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-emerald-200">Adjustment Factor</div>
                      <div className="text-xl font-mono font-bold text-amber-300">
                        {liveMultiplier}x
                      </div>
                      <div className="text-[10px] text-amber-200">+{((liveMultiplier - 1) * 100).toFixed(1)}% inflation</div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <div className="text-[11px] text-emerald-200">Claimable Fluctuation</div>
                      <div className="text-base font-mono font-bold text-emerald-300">
                        +₦{liveClaimableSum.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-200">Total: ₦{revisedContractSum.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Material Index Adjustment Inputs */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Nigerian Market Price Indices & Material Weightings</h3>
                    <p className="text-xs text-slate-500">Adjust tender base prices vs current site delivery prices to simulate price escalation</p>
                  </div>
                  <button
                    onClick={handleSaveFluctuation}
                    disabled={savingFluctuation}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{savingFluctuation ? 'Saving...' : 'Save Fluctuation Baseline'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  {/* Cement */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                        <span>Portland Cement (50kg Bag)</span>
                      </div>
                      <span className="text-emerald-700 font-bold">Weight: {(formData.cement_weight * 100).toFixed(0)}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 mb-1">Base Price at Tender (₦)</label>
                        <input
                          type="number"
                          value={formData.base_cement_price}
                          onChange={e => setFormData({ ...formData, base_cement_price: Number(e.target.value) })}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">Current Valuation Price (₦)</label>
                        <input
                          type="number"
                          value={formData.current_cement_price}
                          onChange={e => setFormData({ ...formData, current_cement_price: Number(e.target.value) })}
                          className="w-full border border-emerald-400 rounded-lg px-2.5 py-1.5 bg-emerald-50/50 font-mono font-bold text-emerald-900"
                        />
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Escalation: <strong className="text-emerald-700">+{(((formData.current_cement_price - formData.base_cement_price) / formData.base_cement_price) * 100).toFixed(1)}%</strong> (Dangote / BUA standard 42.5R)
                    </div>
                  </div>

                  {/* High Yield Rebar */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        <span>High-Yield Steel Rebar (Per Tonne)</span>
                      </div>
                      <span className="text-blue-700 font-bold">Weight: {(formData.rebar_weight * 100).toFixed(0)}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 mb-1">Base Price at Tender (₦)</label>
                        <input
                          type="number"
                          value={formData.base_rebar_price}
                          onChange={e => setFormData({ ...formData, base_rebar_price: Number(e.target.value) })}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">Current Valuation Price (₦)</label>
                        <input
                          type="number"
                          value={formData.current_rebar_price}
                          onChange={e => setFormData({ ...formData, current_rebar_price: Number(e.target.value) })}
                          className="w-full border border-blue-400 rounded-lg px-2.5 py-1.5 bg-blue-50/50 font-mono font-bold text-blue-900"
                        />
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Escalation: <strong className="text-blue-700">+{(((formData.current_rebar_price - formData.base_rebar_price) / formData.base_rebar_price) * 100).toFixed(1)}%</strong> (12mm-25mm Tiger / African Steel)
                    </div>
                  </div>

                  {/* AGO Diesel */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>AGO Diesel (Per Litre)</span>
                      </div>
                      <span className="text-amber-700 font-bold">Weight: {(formData.diesel_weight * 100).toFixed(0)}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 mb-1">Base Price at Tender (₦)</label>
                        <input
                          type="number"
                          value={formData.base_diesel_price}
                          onChange={e => setFormData({ ...formData, base_diesel_price: Number(e.target.value) })}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">Current Valuation Price (₦)</label>
                        <input
                          type="number"
                          value={formData.current_diesel_price}
                          onChange={e => setFormData({ ...formData, current_diesel_price: Number(e.target.value) })}
                          className="w-full border border-amber-400 rounded-lg px-2.5 py-1.5 bg-amber-50/50 font-mono font-bold text-amber-900"
                        />
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Escalation: <strong className="text-amber-700">+{(((formData.current_diesel_price - formData.base_diesel_price) / formData.base_diesel_price) * 100).toFixed(1)}%</strong> (Site generators & haulage)
                    </div>
                  </div>

                  {/* Artisan Labour Rate */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span>Artisan Mason / Carpenter Daily Rate</span>
                      </div>
                      <span className="text-emerald-700 font-bold">Weight: {(formData.labour_weight * 100).toFixed(0)}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 mb-1">Base Rate at Tender (₦)</label>
                        <input
                          type="number"
                          value={formData.base_labour_rate}
                          onChange={e => setFormData({ ...formData, base_labour_rate: Number(e.target.value) })}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">Current Valuation Rate (₦)</label>
                        <input
                          type="number"
                          value={formData.current_labour_rate}
                          onChange={e => setFormData({ ...formData, current_labour_rate: Number(e.target.value) })}
                          className="w-full border border-emerald-400 rounded-lg px-2.5 py-1.5 bg-emerald-50/50 font-mono font-bold text-emerald-900"
                        />
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Escalation: <strong className="text-emerald-700">+{(((formData.current_labour_rate - formData.base_labour_rate) / formData.base_labour_rate) * 100).toFixed(1)}%</strong> (Skilled artisan daywork rate)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: AI Value Engineering & Material Substitution Proposals */
            <div className="space-y-6">
              {loadingAiAudit ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-500">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
                  <div className="text-sm font-bold text-slate-800">Analyzing Project BOQ with Google Gemini 2.5 Flash...</div>
                  <div className="text-xs text-slate-500 mt-1">Cross-referencing Nigerian market alternatives and structural feasibility</div>
                </div>
              ) : auditResult ? (
                <div className="space-y-6">
                  {/* Top Risk Exposure Header */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Overall Project Risk</span>
                        <BadgeAlert className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="text-2xl font-black text-amber-950 mt-1">
                        {auditResult.overallRiskScore} <span className="text-xs text-amber-700 font-medium">/ 100</span>
                      </div>
                      <div className="text-xs font-bold text-amber-700 mt-0.5">
                        Risk Level: {auditResult.riskLevel}
                      </div>
                    </div>

                    <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Macroeconomic Exposure Breakdown (Nigeria)
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <strong className="text-slate-800">Cement:</strong> <span className="text-slate-600">{auditResult.macroeconomicExposure?.cementSensitivity || 'High price adjustments'}</span>
                        </div>
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <strong className="text-slate-800">Steel / Rebar:</strong> <span className="text-slate-600">{auditResult.macroeconomicExposure?.rebarSensitivity || 'Tied to FX and scrap'}</span>
                        </div>
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <strong className="text-slate-800">FX Import:</strong> <span className="text-slate-600">{auditResult.macroeconomicExposure?.fxImportRisk || 'Imported tiles and fittings'}</span>
                        </div>
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <strong className="text-slate-800">Diesel / Haulage:</strong> <span className="text-slate-600">{auditResult.macroeconomicExposure?.fuelHaulageRisk || 'Impacts sand and granite drop'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  {auditResult.aiExecutiveSummary && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">Principal QS Advisory Recommendation:</strong>
                        <p className="mt-0.5 leading-relaxed text-emerald-800">{auditResult.aiExecutiveSummary}</p>
                      </div>
                    </div>
                  )}

                  {/* Value Engineering Proposals Cards */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Recommended Value Engineering Proposals (Material Substitutions)</span>
                      </h3>
                      <span className="text-xs text-slate-500">
                        {auditResult.valueEngineeringProposals.length} high-impact substitutions identified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5">
                      {auditResult.valueEngineeringProposals.map((prop, idx) => (
                        <div key={prop.id || idx} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-emerald-300 transition shadow-xs">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                  {prop.trade}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  prop.riskLevel === 'Low' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {prop.riskLevel} Structural Risk
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-right">
                              <div>
                                <span className="text-xs text-slate-500">Est. Cost Savings:</span>
                                <div className="text-sm font-bold font-mono text-emerald-700">
                                  -₦{Number(prop.potentialSavingsNaira).toLocaleString()} ({prop.savingsPercentage}%)
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                            <div className="space-y-1">
                              <span className="text-slate-400 font-medium">Original Specification:</span>
                              <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 font-medium">
                                {prop.originalSpecification}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" />
                                Proposed Value Engineering Alternative:
                              </span>
                              <p className="text-emerald-950 bg-emerald-50/70 p-2 rounded border border-emerald-200 font-semibold">
                                {prop.proposedAlternative}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                            <div>
                              <strong className="text-slate-700">Feasibility:</strong> {prop.structuralFeasibility}
                            </div>
                            <div>
                              <strong className="text-slate-700">Nigerian Supply Chain:</strong> {prop.nigerianSupplyChainNotes}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Formulas conform to standard Federation Internationale des Ingenieurs-Conseils (FIDIC) and NIQS Guidelines</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

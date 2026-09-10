import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  BarChart3,
  Layers
} from 'lucide-react';
import { CashFlowForecast, CashFlowMilestone } from '../types';

interface CashFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  projectTotal: number;
}

export const CashFlowModal: React.FC<CashFlowModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectTotal
}) => {
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<CashFlowForecast | null>(null);
  const [durationMonths, setDurationMonths] = useState(12);
  const [chartMode, setChartMode] = useState<'s-curve' | 'monthly-bars'>('s-curve');
  
  // Milestone add state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    milestone_name: '',
    stage_order: 1,
    percentage: 15,
    planned_amount: 0,
    month_number: 1,
    estimated_completion_date: 'Month 1',
    status: 'Scheduled' as CashFlowMilestone['status'],
    actual_certified_amount: 0,
    notes: ''
  });

  const loadCashFlow = async (months = durationMonths) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/cashflow?durationMonths=${months}`);
      const data = await res.json();
      if (data.success && data.forecast) {
        setForecast(data.forecast);
        setDurationMonths(data.forecast.durationMonths || months);
      }
    } catch (err) {
      console.error('Failed to load cash flow:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      loadCashFlow();
    }
  }, [isOpen, projectId]);

  const handleRegenerate = async () => {
    if (!confirm('Re-balance schedule to BESMM4 standard distribution for ' + durationMonths + ' months?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/cashflow/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMonths })
      });
      const data = await res.json();
      if (data.success && data.forecast) {
        setForecast(data.forecast);
      }
    } catch (err) {
      console.error('Failed to rebalance cash flow:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (milestoneId: string, currentStatus: string) => {
    const statuses: Array<CashFlowMilestone['status']> = ['Scheduled', 'In Progress', 'Certified'];
    const nextIdx = (statuses.indexOf(currentStatus as any) + 1) % statuses.length;
    const nextStatus = statuses[nextIdx];
    
    // Find planned amount
    const ms = forecast?.milestones.find(m => m.id === milestoneId);
    const newCertified = nextStatus === 'Certified' ? (ms?.planned_amount || 0) : (nextStatus === 'In Progress' ? Math.round((ms?.planned_amount || 0) * 0.5) : 0);

    try {
      await fetch(`/api/projects/${projectId}/cashflow/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          actual_certified_amount: newCertified
        })
      });
      loadCashFlow(durationMonths);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to remove this milestone?')) return;
    try {
      await fetch(`/api/projects/${projectId}/cashflow/milestones/${milestoneId}`, {
        method: 'DELETE'
      });
      loadCashFlow(durationMonths);
    } catch (err) {
      console.error('Failed to delete milestone:', err);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestone.milestone_name) return;
    
    const calculatedPlanned = newMilestone.planned_amount > 0 
      ? newMilestone.planned_amount 
      : Math.round((projectTotal * Number(newMilestone.percentage)) / 100);

    try {
      await fetch(`/api/projects/${projectId}/cashflow/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMilestone,
          planned_amount: calculatedPlanned,
          stage_order: (forecast?.milestones.length || 0) + 1
        })
      });
      setShowAddForm(false);
      setNewMilestone({
        milestone_name: '',
        stage_order: 1,
        percentage: 10,
        planned_amount: 0,
        month_number: 1,
        estimated_completion_date: 'Month 1',
        status: 'Scheduled',
        actual_certified_amount: 0,
        notes: ''
      });
      loadCashFlow(durationMonths);
    } catch (err) {
      console.error('Failed to add milestone:', err);
    }
  };

  const exportCashFlowCsv = () => {
    if (!forecast) return;
    let csv = 'Month,Month Label,Planned Monthly (NGN),Planned Cumulative (NGN),Actual Cumulative (NGN),Progress (%)\n';
    forecast.monthlyDistribution.forEach(pt => {
      csv += `${pt.month},"${pt.monthLabel}",${pt.plannedMonthly},${pt.plannedCumulative},${pt.actualCumulative || 0},${pt.percentageComplete}%\n`;
    });
    csv += '\n\nMilestone Schedule\n';
    csv += 'Stage,Milestone Name,Month,Percentage (%),Planned Amount (NGN),Status,Actual Certified (NGN),Notes\n';
    forecast.milestones.forEach(m => {
      csv += `${m.stage_order},"${m.milestone_name}",M${m.month_number},${m.percentage}%,${m.planned_amount},"${m.status}",${m.actual_certified_amount},"${m.notes || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${projectName.replace(/[^a-z0-9]/gi, '_')}_cash_flow_forecast.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const distribution = forecast?.monthlyDistribution || [];
  const maxCum = forecast?.projectTotal || projectTotal || 1;
  const maxMonthly = forecast?.peakMonthlyOutlay || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        id="cash-flow-forecast-modal" 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-emerald-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-700/60 rounded-xl border border-emerald-500/30">
              <TrendingUp className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Cash Flow Forecast & S-Curve</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/30 text-emerald-200 rounded-full border border-emerald-400/30">
                  BESMM4 / NIQS
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Financial outlay forecasting, cumulative S-Curve projections, and progress billing milestones
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCashFlowCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-medium mb-1">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Contract Sum</span>
              </div>
              <div className="text-base font-bold text-emerald-950">
                ₦{(forecast?.projectTotal || projectTotal).toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-700 mt-0.5">Base project budget</div>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-blue-800 text-xs font-medium mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Advance (15%)</span>
              </div>
              <div className="text-base font-bold text-blue-950">
                ₦{(forecast?.mobilizationAdvanceAmount || Math.round(projectTotal * 0.15)).toLocaleString()}
              </div>
              <div className="text-[11px] text-blue-700 mt-0.5">Site mobilization advance</div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-medium mb-1">
                <BarChart3 className="w-4 h-4 text-amber-600" />
                <span>Peak Monthly Outlay</span>
              </div>
              <div className="text-base font-bold text-amber-950">
                ₦{(forecast?.peakMonthlyOutlay || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">Maximum monthly burn</div>
            </div>

            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-purple-800 text-xs font-medium mb-1">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>Certified to Date</span>
              </div>
              <div className="text-base font-bold text-purple-950">
                ₦{(forecast?.totalCertifiedToDate || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-purple-700 mt-0.5">
                {forecast?.projectTotal ? `${Math.round(((forecast.totalCertifiedToDate || 0) / forecast.projectTotal) * 100)}% complete` : '0%'}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 text-slate-800 text-xs font-medium mb-1">
                <Layers className="w-4 h-4 text-slate-600" />
                <span>Retention (5%)</span>
              </div>
              <div className="text-base font-bold text-slate-900">
                ₦{(forecast?.retentionAmount || Math.round(projectTotal * 0.05)).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">Defects liability reserve</div>
            </div>
          </div>

          {/* S-Curve Chart Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Project Cash Outlay S-Curve</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                    {durationMonths} Months Program
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual bell-curve cumulative outlay (Standard Gaussian Sigmoid S-Curve model)
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Duration select */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Duration:</span>
                  <select
                    value={durationMonths}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setDurationMonths(m);
                      loadCashFlow(m);
                    }}
                    className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value={6}>6 Months</option>
                    <option value={9}>9 Months</option>
                    <option value={12}>12 Months (Standard)</option>
                    <option value={18}>18 Months</option>
                    <option value={24}>24 Months</option>
                  </select>
                </div>

                {/* View toggles */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setChartMode('s-curve')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${chartMode === 's-curve' ? 'bg-white shadow text-emerald-800 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Cumulative S-Curve
                  </button>
                  <button
                    onClick={() => setChartMode('monthly-bars')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${chartMode === 'monthly-bars' ? 'bg-white shadow text-emerald-800 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Monthly Outlays
                  </button>
                </div>

                <button
                  onClick={handleRegenerate}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition font-medium"
                  title="Re-balance Milestones"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Milestones</span>
                </button>
              </div>
            </div>

            {/* SVG Visualizer */}
            {loading ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                <span>Computing S-Curve distribution...</span>
              </div>
            ) : chartMode === 's-curve' ? (
              <div className="relative w-full h-72 bg-gradient-to-b from-slate-50/50 to-white rounded-lg border border-slate-100 p-2">
                <svg viewBox="0 0 800 240" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="780" y2="20" stroke="#f1f5f9" strokeDasharray="4 4" />
                  <line x1="40" y1="75" x2="780" y2="75" stroke="#f1f5f9" strokeDasharray="4 4" />
                  <line x1="40" y1="130" x2="780" y2="130" stroke="#f1f5f9" strokeDasharray="4 4" />
                  <line x1="40" y1="185" x2="780" y2="185" stroke="#f1f5f9" strokeDasharray="4 4" />
                  <line x1="40" y1="210" x2="780" y2="210" stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* Y Axis Labels */}
                  <text x="35" y="24" textAnchor="end" fontSize="9" fill="#94a3b8">100%</text>
                  <text x="35" y="79" textAnchor="end" fontSize="9" fill="#94a3b8">75%</text>
                  <text x="35" y="134" textAnchor="end" fontSize="9" fill="#94a3b8">50%</text>
                  <text x="35" y="189" textAnchor="end" fontSize="9" fill="#94a3b8">25%</text>
                  <text x="35" y="213" textAnchor="end" fontSize="9" fill="#94a3b8">0</text>

                  {/* Planned Cumulative Area Fill & Line */}
                  {(() => {
                    if (distribution.length < 2) return null;
                    const stepX = (780 - 60) / (distribution.length - 1);
                    const pointsPlanned = distribution.map((d, i) => {
                      const x = 60 + i * stepX;
                      const ratio = Math.min(1, Math.max(0, d.plannedCumulative / maxCum));
                      const y = 210 - ratio * 190;
                      return { x, y, d };
                    });

                    const areaPath = `M ${pointsPlanned[0].x} 210 ` + 
                      pointsPlanned.map(p => `L ${p.x} ${p.y}`).join(' ') + 
                      ` L ${pointsPlanned[pointsPlanned.length - 1].x} 210 Z`;

                    const linePath = pointsPlanned.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

                    // Actual certified points if available
                    const pointsActual = distribution
                      .filter(d => d.actualCumulative !== null && d.actualCumulative > 0)
                      .map((d, i) => {
                        const originalIdx = distribution.findIndex(x => x.month === d.month);
                        const x = 60 + originalIdx * stepX;
                        const ratio = Math.min(1, Math.max(0, (d.actualCumulative || 0) / maxCum));
                        const y = 210 - ratio * 190;
                        return { x, y, d };
                      });

                    const actualLinePath = pointsActual.length > 0 
                      ? pointsActual.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
                      : null;

                    return (
                      <g>
                        <defs>
                          <linearGradient id="scurveGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Planned Area */}
                        <path d={areaPath} fill="url(#scurveGradient)" />

                        {/* Planned S-Curve Line */}
                        <path d={linePath} fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Planned Node dots */}
                        {pointsPlanned.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke="#059669" strokeWidth="2" />
                            <text x={p.x} y="225" textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="500">
                              {p.d.monthLabel}
                            </text>
                          </g>
                        ))}

                        {/* Actual Certified Line if present */}
                        {actualLinePath && (
                          <g>
                            <path d={actualLinePath} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="5 4" strokeLinecap="round" />
                            {pointsActual.map((p, i) => (
                              <circle key={i} cx={p.x} cy={p.y} r="4" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />
                            ))}
                          </g>
                        )}
                      </g>
                    );
                  })()}
                </svg>

                {/* Legend Overlay */}
                <div className="absolute top-3 right-4 flex items-center gap-4 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-emerald-600 rounded-full inline-block"></span>
                    <span className="text-slate-700 font-medium">Planned Cumulative (S-Curve)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 border-t-2 border-dashed border-purple-500 inline-block"></span>
                    <span className="text-slate-700 font-medium">Actual Certified</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Monthly Outlay Bar Chart */
              <div className="h-72 w-full flex items-end gap-2 px-6 pt-6 pb-2 bg-gradient-to-b from-slate-50/50 to-white rounded-lg border border-slate-100">
                {distribution.map((d, i) => {
                  const heightPct = maxMonthly > 0 ? Math.round((d.plannedMonthly / maxMonthly) * 85) : 10;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <div className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        ₦{(d.plannedMonthly / 1000000).toFixed(1)}M
                      </div>
                      <div 
                        className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all duration-300 min-h-[4px]"
                        style={{ height: `${heightPct}%` }}
                      ></div>
                      <span className="text-[11px] font-semibold text-slate-600 mt-1">{d.monthLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Construction Milestones Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-800">BESMM4 Work Stages & Milestone Schedule</h3>
                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                  {forecast?.milestones.length || 0} Stages
                </span>
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Milestone</span>
              </button>
            </div>

            {/* Add Milestone Inline Form */}
            {showAddForm && (
              <form onSubmit={handleAddMilestone} className="p-4 bg-emerald-50/50 border-b border-emerald-100 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Stage / Milestone Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Roof Trusses & Aluminium Covering"
                    value={newMilestone.milestone_name}
                    onChange={e => setNewMilestone({ ...newMilestone, milestone_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Target Month</label>
                  <select
                    value={newMilestone.month_number}
                    onChange={e => setNewMilestone({ ...newMilestone, month_number: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-xs"
                  >
                    {Array.from({ length: durationMonths }).map((_, idx) => (
                      <option key={idx + 1} value={idx + 1}>Month {idx + 1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Stage Share (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newMilestone.percentage}
                    onChange={e => setNewMilestone({ ...newMilestone, percentage: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-xs"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-slate-700 font-medium mb-1">Notes / Key Deliverables</label>
                  <input
                    type="text"
                    placeholder="e.g. Slump tests, reinforcement inspection sign-off"
                    value={newMilestone.notes}
                    onChange={e => setNewMilestone({ ...newMilestone, notes: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-xs"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                  >
                    Save Stage
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 w-12">#</th>
                    <th className="py-2.5 px-4">Stage / Milestone Description</th>
                    <th className="py-2.5 px-4 w-24">Month</th>
                    <th className="py-2.5 px-4 w-20 text-right">% Share</th>
                    <th className="py-2.5 px-4 text-right">Planned (₦)</th>
                    <th className="py-2.5 px-4 text-right">Certified (₦)</th>
                    <th className="py-2.5 px-4 w-32 text-center">Status</th>
                    <th className="py-2.5 px-4 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {forecast?.milestones && forecast.milestones.length > 0 ? (
                    forecast.milestones.map((ms, index) => (
                      <tr key={ms.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-400">{index + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{ms.milestone_name}</div>
                          {ms.notes && <div className="text-[11px] text-slate-500 mt-0.5">{ms.notes}</div>}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">Month {ms.month_number}</td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-700">{ms.percentage}%</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-900">
                          ₦{Number(ms.planned_amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-purple-900">
                          ₦{Number(ms.actual_certified_amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleStatusChange(ms.id, ms.status)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                              ms.status === 'Certified'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : ms.status === 'In Progress'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                            title="Click to cycle status"
                          >
                            {ms.status === 'Certified' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : ms.status === 'In Progress' ? (
                              <Clock className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            <span>{ms.status}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteMilestone(ms.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Remove milestone"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No cash flow milestones configured. Click "Reset Milestones" to generate BESMM4 standards.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>All calculations follow standard Nigerian Institute of Quantity Surveyors (NIQS) cash flow models</span>
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

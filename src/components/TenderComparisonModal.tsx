import React, { useState, useEffect } from 'react';
import { 
  X, 
  Scale, 
  Users, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Download, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown,
  Building2,
  Phone,
  Mail,
  FileCheck2
} from 'lucide-react';
import { TenderBidder, TenderAnalysisSummary, BoqItem } from '../types';

interface TenderComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  projectSubtotal: number;
  boqItems: BoqItem[];
}

export const TenderComparisonModal: React.FC<TenderComparisonModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectSubtotal,
  boqItems
}) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<TenderAnalysisSummary | null>(null);
  const [selectedBidderId, setSelectedBidderId] = useState<string | null>(null);
  const [showAddBidder, setShowAddBidder] = useState(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'rates-breakdown'>('matrix');

  // Form for manual new bidder
  const [newBidder, setNewBidder] = useState({
    bidder_name: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    total_bid_amount: 0,
    technical_score: 85,
    duration_weeks: 24,
    compliance_status: 'Compliant' as TenderBidder['compliance_status'],
    recommendation_rank: 0,
    notes: ''
  });

  const loadTenders = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tenders`);
      const data = await res.json();
      if (data.success && data.summary) {
        setSummary(data.summary);
        if (data.summary.bidders.length > 0 && !selectedBidderId) {
          setSelectedBidderId(data.summary.lowestResponsiveBidderId || data.summary.bidders[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load tenders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      loadTenders();
    }
  }, [isOpen, projectId]);

  const handleAutoPopulate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tenders/auto-populate`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        loadTenders();
      }
    } catch (err) {
      console.error('Failed to auto-populate bidders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBidder = async (bidderId: string) => {
    if (!confirm('Are you sure you want to remove this bidder tender?')) return;
    try {
      await fetch(`/api/projects/${projectId}/tenders/bidders/${bidderId}`, {
        method: 'DELETE'
      });
      loadTenders();
    } catch (err) {
      console.error('Failed to delete bidder:', err);
    }
  };

  const handleAddBidderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBidder.bidder_name) return;

    try {
      await fetch(`/api/projects/${projectId}/tenders/bidders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBidder)
      });
      setShowAddBidder(false);
      setNewBidder({
        bidder_name: '',
        contact_person: '',
        contact_phone: '',
        contact_email: '',
        total_bid_amount: 0,
        technical_score: 85,
        duration_weeks: 24,
        compliance_status: 'Compliant',
        recommendation_rank: 0,
        notes: ''
      });
      loadTenders();
    } catch (err) {
      console.error('Failed to add bidder:', err);
    }
  };

  const exportTenderCsv = () => {
    if (!summary) return;
    let csv = 'Tender Evaluation Matrix - ' + projectName + '\n';
    csv += 'Rank,Bidder Name,Contact,Phone,Bid Sum (NGN),Variance (%),Technical Score (/100),Duration (Weeks),Compliance,Recommendation Notes\n';
    
    summary.bidders.forEach(b => {
      const variance = summary.benchmarkTotal > 0 
        ? (((b.total_bid_amount - summary.benchmarkTotal) / summary.benchmarkTotal) * 100).toFixed(1)
        : '0.0';
      csv += `${b.recommendation_rank || '-'},"${b.bidder_name}","${b.contact_person}","${b.contact_phone}",${b.total_bid_amount},${variance}%,${b.technical_score},${b.duration_weeks},"${b.compliance_status}","${b.notes || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${projectName.replace(/[^a-z0-9]/gi, '_')}_tender_comparison.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const bidders = summary?.bidders || [];
  const benchmarkTotal = summary?.benchmarkTotal || projectSubtotal || 1;
  const lowestResponsive = bidders.find(b => b.id === summary?.lowestResponsiveBidderId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        id="tender-comparison-modal" 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-emerald-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-700/60 rounded-xl border border-emerald-500/30">
              <Scale className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Subcontractor Tender Comparison & Bid Matrix</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/30 text-emerald-200 rounded-full border border-emerald-400/30">
                  NIQS Evaluation Matrix
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Evaluate commercial tenders, variance against BOQ benchmark, technical scores, and outlier rates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportTenderCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Evaluation</span>
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
          {/* Top Control Bar & Recommendation Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'matrix' ? 'bg-white shadow text-emerald-800 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Bid Comparison Matrix ({bidders.length})
              </button>
              <button
                onClick={() => setActiveTab('rates-breakdown')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'rates-breakdown' ? 'bg-white shadow text-emerald-800 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Trade Rate Anomaly Analysis
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoPopulate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-semibold transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Auto-Populate 3 Nigerian Bidders</span>
              </button>

              <button
                onClick={() => setShowAddBidder(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subcontractor</span>
              </button>
            </div>
          </div>

          {/* Lowest Responsive Bidder Highlight Card */}
          {lowestResponsive && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs mt-0.5">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Recommended Award
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{lowestResponsive.bidder_name}</h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Lowest Responsive & Technically Qualified Bidder ({lowestResponsive.technical_score}/100 score, {lowestResponsive.duration_weeks} weeks proposed completion).
                  </p>
                  {lowestResponsive.notes && (
                    <p className="text-xs text-emerald-700 mt-1 italic">
                      "{lowestResponsive.notes}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-emerald-200 pt-3 md:pt-0 md:pl-6 text-right">
                <div>
                  <div className="text-xs text-slate-500">Tender Sum</div>
                  <div className="text-lg font-mono font-bold text-emerald-950">
                    ₦{Number(lowestResponsive.total_bid_amount).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">QS Benchmark Variance</div>
                  <div className={`text-base font-bold ${Number(lowestResponsive.total_bid_amount) > benchmarkTotal ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {Number(lowestResponsive.total_bid_amount) > benchmarkTotal ? '+' : ''}
                    {(((Number(lowestResponsive.total_bid_amount) - benchmarkTotal) / benchmarkTotal) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Bidder Modal Form */}
          {showAddBidder && (
            <div className="bg-slate-50 border border-slate-300 rounded-xl p-4.5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Register New Subcontractor Bidder</h4>
                <button onClick={() => setShowAddBidder(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddBidderSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Company / Contractor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Civil Engineering Nig Ltd"
                    value={newBidder.bidder_name}
                    onChange={e => setNewBidder({ ...newBidder, bidder_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Engr. Babatunde Lawal"
                    value={newBidder.contact_person}
                    onChange={e => setNewBidder({ ...newBidder, contact_person: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+234 803 000 0000"
                    value={newBidder.contact_phone}
                    onChange={e => setNewBidder({ ...newBidder, contact_phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Total Bid Sum (₦) *</label>
                  <input
                    type="number"
                    required
                    value={newBidder.total_bid_amount}
                    onChange={e => setNewBidder({ ...newBidder, total_bid_amount: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Technical Evaluation Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newBidder.technical_score}
                    onChange={e => setNewBidder({ ...newBidder, technical_score: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Program Duration (Weeks)</label>
                  <input
                    type="number"
                    value={newBidder.duration_weeks}
                    onChange={e => setNewBidder({ ...newBidder, duration_weeks: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-xs"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Evaluation Notes / COREN Certification</label>
                  <input
                    type="text"
                    placeholder="e.g. Registered with COREN, submitted complete tax clearance certificate"
                    value={newBidder.notes}
                    onChange={e => setNewBidder({ ...newBidder, notes: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-xs"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                  >
                    Save Bidder
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddBidder(false)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 font-medium rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 1: Tender Comparison Matrix */}
          {activeTab === 'matrix' ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">Rank</th>
                      <th className="py-3 px-4">Subcontractor / Bidder Details</th>
                      <th className="py-3 px-4 text-right">Tender Sum (₦)</th>
                      <th className="py-3 px-4 text-right">Variance vs QS</th>
                      <th className="py-3 px-4 text-center">Tech Score</th>
                      <th className="py-3 px-4 text-center">Duration</th>
                      <th className="py-3 px-4 text-center">Compliance</th>
                      <th className="py-3 px-4 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* QS Benchmark Row */}
                    <tr className="bg-emerald-50/50 font-semibold border-b border-emerald-200">
                      <td className="py-3 px-4 text-center text-emerald-800 font-bold">REF</td>
                      <td className="py-3 px-4">
                        <div className="text-emerald-950 font-bold flex items-center gap-1.5">
                          <span>QS In-House Estimate Benchmark (NIQS Base)</span>
                        </div>
                        <div className="text-[11px] text-emerald-700">Project BOQ Baseline Cost</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-950 font-bold">
                        ₦{benchmarkTotal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-800 font-medium">0.0% (Base)</td>
                      <td className="py-3 px-4 text-center text-emerald-800">100 / 100</td>
                      <td className="py-3 px-4 text-center text-emerald-800">24 wks</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                          Benchmark
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">-</td>
                    </tr>

                    {/* Bidder Rows */}
                    {bidders.length > 0 ? (
                      bidders.map((b, idx) => {
                        const variance = benchmarkTotal > 0 
                          ? ((Number(b.total_bid_amount) - benchmarkTotal) / benchmarkTotal) * 100 
                          : 0;
                        const isUnder = variance < 0;
                        const isSignificant = Math.abs(variance) > 15;

                        return (
                          <tr key={b.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 text-center">
                              {b.id === summary?.lowestResponsiveBidderId ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-xs">
                                  1
                                </span>
                              ) : (
                                <span className="text-slate-400 font-bold">{idx + 1}</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>{b.bidder_name}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                                {b.contact_person && <span>{b.contact_person}</span>}
                                {b.contact_phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-2.5 h-2.5" />
                                    {b.contact_phone}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                              ₦{Number(b.total_bid_amount).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`inline-flex items-center font-semibold text-xs ${
                                isUnder ? 'text-emerald-700' : 'text-rose-700'
                              }`}>
                                {isUnder ? <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
                                {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                              </span>
                              {isSignificant && (
                                <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                                  High deviation
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`font-bold text-xs px-2 py-0.5 rounded ${
                                b.technical_score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {b.technical_score}/100
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center text-slate-700 font-medium">
                              {b.duration_weeks} wks
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.compliance_status === 'Compliant'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}>
                                {b.compliance_status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleDeleteBidder(b.id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                title="Delete tender"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          No subcontractor bids submitted yet. Click "Auto-Populate 3 Nigerian Bidders" to generate instant market comparison.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* TAB 2: Item by Item Trade Rate Anomaly Analysis */
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="font-bold text-slate-800">Trade Rate Comparison against BOQ Benchmark</div>
                <div className="text-slate-500">Flags rates with &gt;15% deviation for commercial risk mitigation</div>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Trade Section</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 w-16 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-right">Benchmark Rate</th>
                      {bidders.map(b => (
                        <th key={b.id} className="py-2.5 px-3 text-right">
                          <div className="font-bold text-slate-900 truncate max-w-[120px]">{b.bidder_name}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {boqItems.slice(0, 15).map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-600">{it.section || 'General'}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{it.item}</td>
                        <td className="py-2.5 px-3 text-center text-slate-500">{it.unit}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                          ₦{Number(it.rate).toLocaleString()}
                        </td>

                        {bidders.map(b => {
                          const bidItem = (b.items || []).find(bi => bi.item_name === it.item || bi.boq_item_id === it.id);
                          const bidRate = bidItem ? Number(bidItem.rate) : Math.round(Number(it.rate) * 1.05);
                          const diff = Number(it.rate) > 0 ? ((bidRate - Number(it.rate)) / Number(it.rate)) * 100 : 0;
                          const isHighAnomaly = Math.abs(diff) > 15;

                          return (
                            <td key={b.id} className="py-2.5 px-3 text-right font-mono">
                              <div className="font-semibold text-slate-900">₦{bidRate.toLocaleString()}</div>
                              <div className={`text-[10px] font-bold ${
                                isHighAnomaly 
                                  ? 'text-amber-600' 
                                  : diff < 0 ? 'text-emerald-600' : 'text-slate-500'
                              }`}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Tender analysis incorporates commercial scoring, program schedule feasibility, and technical compliance</span>
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

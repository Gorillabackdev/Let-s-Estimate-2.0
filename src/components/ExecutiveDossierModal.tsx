import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Printer, CheckCircle2, ShieldCheck, Download, 
  Building2, TrendingUp, Package, Scale, Award, X, AlertTriangle 
} from 'lucide-react';
import { Project, ExecutiveDossier } from '../types';

interface ExecutiveDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  token?: string | null;
}

export const ExecutiveDossierModal: React.FC<ExecutiveDossierModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  token
}) => {
  const [dossier, setDossier] = useState<ExecutiveDossier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && projectId) {
      loadDossier();
    }
  }, [isOpen, projectId]);

  const loadDossier = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/projects/${projectId}/dossier`, { headers });
      const data = await res.json();
      if (data.dossier) {
        setDossier(data.dossier);
      }
    } catch (err) {
      console.error('Failed to compile dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white">
      <div 
        id="executive-dossier-modal"
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:rounded-none"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-700 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Executive QS Project Dossier & Audit Pack
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">
                  Comprehensive Report
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {projectName} • Compiled for Board Approval, Bank Financing & Client Audit
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600 transition flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF Dossier</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dossier Document Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 font-sans">
          
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-semibold text-slate-700">Compiling executive project records, bills and valuations...</p>
            </div>
          ) : dossier ? (
            <>
              {/* Cover Banner */}
              <div className="border-b-2 border-emerald-900 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                      NIQS Professional Cost Audit
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Ref: {dossier.project.id}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight mt-2">
                    Executive Cost Engineering Dossier
                  </h1>
                  <p className="text-sm font-semibold text-slate-700 mt-1">
                    Project: {dossier.project.title}
                  </p>
                </div>

                <div className="text-left sm:text-right text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p><strong className="text-slate-900">Lead QS:</strong> {dossier.compiledBy}</p>
                  <p><strong className="text-slate-900">Compiled:</strong> {new Date(dossier.compiledAt).toLocaleDateString('en-GB')}</p>
                  <p><strong className="text-slate-900">Client:</strong> {dossier.project.client_name || 'Corporate Developer'}</p>
                </div>
              </div>

              {/* 1. Executive Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Contract Sum</span>
                  <span className="text-lg font-black text-emerald-950 block mt-1">
                    ₦{Number(dossier.summary.grandTotal).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500">Including VAT & Overheads</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Subtotal (Works Only)</span>
                  <span className="text-lg font-bold text-slate-900 block mt-1">
                    ₦{Number(dossier.summary.subtotal).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500">{dossier.boqTrades.length} Trade Sections</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Gross Floor Area (GFA)</span>
                  <span className="text-lg font-bold text-slate-900 block mt-1">
                    {dossier.summary.gfa ? `${dossier.summary.gfa.toLocaleString()} m²` : 'N/A'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {dossier.summary.costPerSqm ? `₦${dossier.summary.costPerSqm.toLocaleString()} / m²` : 'Unit rate'}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Contingency Reserve</span>
                  <span className="text-lg font-bold text-amber-900 block mt-1">
                    ₦{Number(dossier.summary.contingency).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500">Risk mitigation buffer</span>
                </div>
              </div>

              {/* 2. Trade Breakdown Table */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-emerald-800" />
                  <span>Trade Breakdown & Percentage Weighting</span>
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Trade Section</th>
                        <th className="px-3 py-2 text-center">Items</th>
                        <th className="px-3 py-2 text-right">Amount (₦)</th>
                        <th className="px-3 py-2 text-right">% of Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {dossier.boqTrades.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-semibold text-slate-900">{t.section}</td>
                          <td className="px-3 py-2 text-center text-slate-500">{t.itemCount}</td>
                          <td className="px-3 py-2 text-right font-mono font-medium">₦{(t.totalAmount ?? (t as any).amount ?? 0).toLocaleString()}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-emerald-800">{t.percentage ?? (t as any).percent ?? 0}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Major Construction Materials Summary */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center space-x-1.5">
                  <Package className="w-4 h-4 text-emerald-800" />
                  <span>Core Material Procurement Schedule (Lagos / Abuja Benchmark)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dossier.materialSummary.map((m, idx) => (
                    <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{m.category}</span>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{m.item}</p>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-800">{m.totalQty.toLocaleString()} {m.unit}</span>
                        <span className="font-mono text-emerald-800 font-semibold">₦{m.totalCost.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Cash Flow & Tender Comparison Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cash Flow */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center space-x-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                    <span>Disbursement Schedule (S-Curve)</span>
                  </h4>
                  {dossier.cashFlowSummary ? (
                    <div className="space-y-2 text-xs text-slate-700">
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span>Project Duration:</span>
                        <span className="font-bold">{dossier.cashFlowSummary.scheduledMonths} Months</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span>Capital Milestones:</span>
                        <span className="font-bold">{dossier.cashFlowSummary.totalMilestones} Planned Stages</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Anticipated Peak Outflow Month:</span>
                        <span className="font-bold text-emerald-800">Month {dossier.cashFlowSummary.peakMonth} (Superstructure)</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Standard 12-month linear disbursement applied.</p>
                  )}
                </div>

                {/* Tender Matrix */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center space-x-1.5">
                    <Scale className="w-4 h-4 text-teal-700" />
                    <span>Competitive Subcontractor Tendering</span>
                  </h4>
                  {dossier.tenderSummary ? (
                    <div className="space-y-2 text-xs text-slate-700">
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span>Subcontractors Bidding:</span>
                        <span className="font-bold">{dossier.tenderSummary.bidders.length} Qualified Contractors</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span>Average Tender Sum:</span>
                        <span className="font-bold font-mono">₦{dossier.tenderSummary.averageBidSum.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Lowest Responsive Tender:</span>
                        <span className="font-bold font-mono text-emerald-800">₦{dossier.tenderSummary.lowestBidSum.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Tender comparison module ready for bid intake.</p>
                  )}
                </div>
              </div>

              {/* 5. Statutory Assurance & Seal */}
              <div className="border-2 border-emerald-900/40 rounded-xl p-5 bg-gradient-to-br from-emerald-50/50 to-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-900 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                    NIQS
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                      Certified Professional QS Audit Stamp
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Prepared by Isaac Emmanuel (MNIQS, RQS/NIQS/8421). Formatted to Nigerian SMM7 / NIQS Cost Information rules.
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-bold bg-emerald-800 text-white">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verified Project Dossier</span>
                  </span>
                </div>
              </div>

            </>
          ) : (
            <p className="text-sm text-red-600">Could not compile dossier.</p>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>Let's Estimate • Executive QS Project Dossier</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle2, AlertCircle, RefreshCw, Printer, 
  Save, ShieldCheck, Calendar, DollarSign, Award, X, ChevronRight
} from 'lucide-react';
import { Project, ProjectFinalAccount } from '../types';
import { safeFetchJson } from '../utils/api';

interface FinalAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  token?: string | null;
}

export const FinalAccountModal: React.FC<FinalAccountModalProps> = ({
  isOpen,
  onClose,
  project,
  token
}) => {
  const [data, setData] = useState<ProjectFinalAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && project.id) {
      loadFinalAccount();
    }
  }, [isOpen, project.id]);

  const loadFinalAccount = async () => {
    try {
      setLoading(true);
      const { ok, data: resData } = await safeFetchJson<{ finalAccount: ProjectFinalAccount }>(`/api/projects/${project.id}/final-account`);
      if (ok && resData?.finalAccount) {
        setData(resData.finalAccount);
      }
    } catch {
      // Handled cleanly
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setLoading(true);
      const { ok, data: resData } = await safeFetchJson<{ finalAccount: ProjectFinalAccount }>(`/api/projects/${project.id}/final-account/recalculate`, {
        method: 'POST'
      });
      if (ok && resData?.finalAccount) {
        setData(resData.finalAccount);
        setSuccessMsg('Recalculated from latest contract sum, variations, fluctuations, and valuations.');
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch {
      // Handled cleanly
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!data) return;
    try {
      setSaving(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const { ok, data: resData } = await safeFetchJson<{ finalAccount: ProjectFinalAccount }>(`/api/projects/${project.id}/final-account`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      if (ok && resData?.finalAccount) {
        setData(resData.finalAccount);
        setSuccessMsg('Final Account Statement saved successfully.');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch {
      // Handled cleanly
    } finally {
      setSaving(false);
    }
  };

  const updateNumericField = (field: keyof ProjectFinalAccount, val: number) => {
    if (!data) return;
    const updated = { ...data, [field]: val };
    
    // Recalculate Net variations
    updated.net_variations = Number(updated.approved_variations_additions) - Number(updated.approved_variations_omissions);
    
    // Gross Final Account Sum
    updated.gross_final_account_sum = 
      Number(updated.original_contract_sum) +
      Number(updated.net_variations) +
      Number(updated.fluctuation_claim_amount) +
      Number(updated.provisional_sums_adjustment) +
      Number(updated.prime_cost_adjustment) +
      Number(updated.dayworks_amount) -
      Number(updated.liquidated_damages_deduction) -
      Number(updated.other_setoffs);

    // Balance Due
    updated.balance_due_contractor = 
      Number(updated.gross_final_account_sum) - 
      Number(updated.total_previous_payments) + 
      Number(updated.retention_released);

    setData(updated);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white">
      <div 
        id="final-account-modal"
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:rounded-none"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-700 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 border border-emerald-500/40 flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Final Account & Contract Closeout Statement
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950">
                  NIQS / SMM7
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {project.title} • {project.client_name || 'Client Project'} • {project.location}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 print:hidden text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRecalculate}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
              <span>Auto-Recalculate from Project Data</span>
            </button>
            {successMsg && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{successMsg}</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-slate-600 font-medium">Status:</label>
            <select
              value={data?.status || 'Draft'}
              onChange={(e) => setData(prev => prev ? { ...prev, status: e.target.value as any } : null)}
              className="px-2 py-1 rounded-md border border-slate-300 bg-white font-bold text-slate-800"
            >
              <option value="Draft">Draft</option>
              <option value="Agreed by QS & Contractor">Agreed by QS & Contractor</option>
              <option value="Certified Final">Certified Final</option>
            </select>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg font-bold bg-emerald-800 hover:bg-emerald-700 text-white transition flex items-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Statement'}</span>
            </button>
          </div>
        </div>

        {/* Statement Body (Styled as official NIQS Document) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 font-sans">
          
          {/* Official Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 block">
                Nigerian Institute of Quantity Surveyors (NIQS) Standard Format
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight mt-1">
                Statement of Final Account & Contract Closeout
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                In settlement of all contractual claims, variations, fluctuations and balance due.
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-600">
              <p><strong className="text-slate-900">Project Ref:</strong> {project.id}</p>
              <p><strong className="text-slate-900">Certificate Date:</strong> {data?.signoff_date || new Date().toISOString().split('T')[0]}</p>
              <p>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white uppercase">
                  {data?.status || 'Draft'}
                </span>
              </p>
            </div>
          </div>

          {/* Project Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px] block">Project Title</span>
              <span className="font-bold text-slate-900">{project.title}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px] block">Employer / Client</span>
              <span className="font-semibold text-slate-900">{project.client_name || 'Project Employer'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px] block">Site Location</span>
              <span className="font-semibold text-slate-900">{project.location}</span>
            </div>
          </div>

          {/* Core Financial Computation Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="px-4 py-3 w-16 text-center">Item</th>
                  <th className="px-4 py-3">Description of Account Component</th>
                  <th className="px-4 py-3 text-right w-48">Amount (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                
                {/* 1. Original Contract Sum */}
                <tr className="bg-white font-medium">
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-500">1.0</td>
                  <td className="px-4 py-3 text-slate-900 font-bold">
                    Original Contract Sum (Signed Tender Agreement)
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-950">
                    ₦{Number(data?.original_contract_sum || 0).toLocaleString()}
                  </td>
                </tr>

                {/* 2. Variations */}
                <tr className="bg-slate-50/50">
                  <td className="px-4 py-2.5 text-center font-mono text-slate-500">2.1</td>
                  <td className="px-4 py-2.5 text-slate-700 pl-8">
                    Add: Approved Variations & Additional Works
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-emerald-800">
                    + ₦{Number(data?.approved_variations_additions || 0).toLocaleString()}
                  </td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="px-4 py-2.5 text-center font-mono text-slate-500">2.2</td>
                  <td className="px-4 py-2.5 text-slate-700 pl-8">
                    Less: Approved Variations & Omissions
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-700">
                    - ₦{Number(data?.approved_variations_omissions || 0).toLocaleString()}
                  </td>
                </tr>
                <tr className="bg-slate-100 font-semibold">
                  <td className="px-4 py-2 text-center font-mono text-slate-500">2.0</td>
                  <td className="px-4 py-2 text-slate-800">
                    Net Variations Balance
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    ₦{Number(data?.net_variations || 0).toLocaleString()}
                  </td>
                </tr>

                {/* 3. Fluctuation Claim (FIDIC 70) */}
                <tr className="bg-white">
                  <td className="px-4 py-2.5 text-center font-mono text-slate-500">3.0</td>
                  <td className="px-4 py-2.5 text-slate-800">
                    Add: Fluctuation / Price Adjustment (FIDIC Clause 70 / Nigerian Inflation Indices)
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-emerald-800 font-semibold">
                    + ₦{Number(data?.fluctuation_claim_amount || 0).toLocaleString()}
                  </td>
                </tr>

                {/* 4. Provisional Sums & Prime Cost adjustments */}
                <tr className="bg-slate-50/50">
                  <td className="px-4 py-2.5 text-center font-mono text-slate-500">4.0</td>
                  <td className="px-4 py-2.5 text-slate-700">
                    Adjustment of Provisional Sums & Prime Cost (Actual Expenditure)
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-800">
                    ₦{Number(data?.provisional_sums_adjustment || 0).toLocaleString()}
                  </td>
                </tr>

                {/* 5. Dayworks */}
                <tr className="bg-white">
                  <td className="px-4 py-2.5 text-center font-mono text-slate-500">5.0</td>
                  <td className="px-4 py-2.5 text-slate-700">
                    Authorized Dayworks & Emergency Repairs
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-800">
                    ₦{Number(data?.dayworks_amount || 0).toLocaleString()}
                  </td>
                </tr>

                {/* 6. Liquidated Damages deduction */}
                <tr className="bg-slate-50/50">
                  <td className="px-4 py-2.5 text-center font-mono text-slate-500">6.0</td>
                  <td className="px-4 py-2.5 text-slate-700">
                    Less: Liquidated & Ascertained Damages (LAD / Delay penalty)
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-700">
                    - ₦{Number(data?.liquidated_damages_deduction || 0).toLocaleString()}
                  </td>
                </tr>

                {/* GROSS FINAL ACCOUNT SUM */}
                <tr className="bg-emerald-900 text-white font-extrabold text-sm sm:text-base border-y-2 border-emerald-950">
                  <td className="px-4 py-3 text-center font-mono">A</td>
                  <td className="px-4 py-3 uppercase tracking-wide">
                    Gross Agreed Final Account Sum
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    ₦{Number(data?.gross_final_account_sum || 0).toLocaleString()}
                  </td>
                </tr>

                {/* 7. Previous Payments */}
                <tr className="bg-white">
                  <td className="px-4 py-2.5 text-center font-mono text-slate-500">B</td>
                  <td className="px-4 py-2.5 text-slate-800">
                    Less: Total Previous Interim Certificate Payments (IPCs 1 to Final)
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-700 font-semibold">
                    - ₦{Number(data?.total_previous_payments || 0).toLocaleString()}
                  </td>
                </tr>

                {/* 8. Retention Release */}
                <tr className="bg-slate-50/50">
                  <td className="px-4 py-2.5 text-center font-mono text-slate-500">C</td>
                  <td className="px-4 py-2.5 text-slate-800">
                    Add: 50% Retention Released on Practical Completion (Total Held: ₦{Number(data?.total_retention_held || 0).toLocaleString()})
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-emerald-800 font-semibold">
                    + ₦{Number(data?.retention_released || 0).toLocaleString()}
                  </td>
                </tr>

                {/* NET BALANCE DUE CONTRACTOR */}
                <tr className="bg-amber-100 text-amber-950 font-black text-sm sm:text-base border-t-2 border-amber-400">
                  <td className="px-4 py-3.5 text-center font-mono">D</td>
                  <td className="px-4 py-3.5 uppercase tracking-wide">
                    Net Balance Payable / Due to Contractor
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-lg text-emerald-950">
                    ₦{Number(data?.balance_due_contractor || 0).toLocaleString()}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          {/* Project Dates & Defects Liability Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">
                Practical Completion Date:
              </label>
              <input
                type="date"
                value={data?.practical_completion_date || ''}
                onChange={(e) => setData(prev => prev ? { ...prev, practical_completion_date: e.target.value } : null)}
                className="w-full px-3 py-1.5 rounded-md border border-slate-300 bg-white font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">
                Defects Liability Period (DLP) Expiry Date (6 Months):
              </label>
              <input
                type="date"
                value={data?.defects_liability_end_date || ''}
                onChange={(e) => setData(prev => prev ? { ...prev, defects_liability_end_date: e.target.value } : null)}
                className="w-full px-3 py-1.5 rounded-md border border-slate-300 bg-white font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Signatures & Certification Box */}
          <div className="border border-slate-300 rounded-xl p-5 bg-white space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
              Statutory Certification & Sign-off
            </h4>

            <p className="text-xs text-slate-600 leading-relaxed italic">
              "We hereby certify that this Statement of Final Account represents a full and final agreed settlement of the contract sum, including all authorized variations, fluctuations, and dayworks up to the date of Practical Completion."
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              {/* Consultant QS */}
              <div className="border border-slate-200 p-4 rounded-lg bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Consultant Quantity Surveyor</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{data?.qs_signoff_name || 'Isaac Emmanuel, MNIQS'}</p>
                <p className="text-xs text-emerald-800 font-mono font-semibold">Reg: {data?.qs_registration_number || 'RQS/NIQS/8421'}</p>
                <div className="mt-4 pt-3 border-t border-dashed border-slate-300 flex justify-between items-center text-[10px] text-slate-500">
                  <span>Authorized Signature & Stamp</span>
                  <span>Date: {data?.signoff_date || new Date().toISOString().split('T')[0]}</span>
                </div>
              </div>

              {/* Contractor Sign-off */}
              <div className="border border-slate-200 p-4 rounded-lg bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Main Building Contractor</span>
                <p className="text-sm font-bold text-slate-900 mt-1">Authorized Managing Director / Commercial Director</p>
                <p className="text-xs text-slate-600">Representing Contractor</p>
                <div className="mt-4 pt-3 border-t border-dashed border-slate-300 flex justify-between items-center text-[10px] text-slate-500">
                  <span>Contractor Signature & Seal</span>
                  <span>Date: {data?.signoff_date || new Date().toISOString().split('T')[0]}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>Let's Estimate • NIQS Standard Conditions of Contract (SMM7)</span>
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

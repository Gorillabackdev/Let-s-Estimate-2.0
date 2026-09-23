import React, { useState } from 'react';
import { 
  Award, 
  Printer, 
  Save, 
  RefreshCw, 
  Check, 
  Edit3, 
  ShieldCheck, 
  AlertCircle,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { ProjectFinalAccount } from '../../types';
import { formatNaira } from '../../utils/format';

interface FinalAccountSheetProps {
  finalAccount: ProjectFinalAccount | null;
  contractSum: number;
  totalVariationsNet: number;
  certifiedToDate: number;
  projectTitle?: string;
  clientName?: string;
  contractorName?: string;
  onSave: (data: Partial<ProjectFinalAccount>) => Promise<void> | void;
  onRecalculate: () => Promise<void> | void;
}

export const FinalAccountSheet: React.FC<FinalAccountSheetProps> = ({
  finalAccount,
  contractSum,
  totalVariationsNet,
  certifiedToDate,
  projectTitle,
  clientName,
  contractorName,
  onSave,
  onRecalculate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local form state
  const [formData, setFormData] = useState({
    original_contract_sum: Number(finalAccount?.original_contract_sum ?? contractSum),
    net_variations: Number(finalAccount?.net_variations ?? totalVariationsNet),
    provisional_sums_adjustment: Number(finalAccount?.provisional_sums_adjustment ?? 0),
    prime_cost_adjustment: Number(finalAccount?.prime_cost_adjustment ?? 0),
    fluctuation_claim_amount: Number(finalAccount?.fluctuation_claim_amount ?? 0),
    other_setoffs: Number(finalAccount?.other_setoffs ?? 0),
    liquidated_damages_deduction: Number(finalAccount?.liquidated_damages_deduction ?? 0),
    total_previous_payments: Number(finalAccount?.total_previous_payments ?? certifiedToDate),
    retention_released: Number(finalAccount?.retention_released ?? 0),
    status: (finalAccount?.status as any) || 'Draft',
    qs_signoff_name: finalAccount?.qs_signoff_name || 'Consultant Quantity Surveyor, RQS',
    qs_registration_number: finalAccount?.qs_registration_number || 'QSRBN/NIQS/REG',
    notes: finalAccount?.notes || ''
  });

  // Calculate live totals
  const grossFinalSum = 
    Number(formData.original_contract_sum || 0) +
    Number(formData.net_variations || 0) +
    Number(formData.provisional_sums_adjustment || 0) +
    Number(formData.prime_cost_adjustment || 0) +
    Number(formData.fluctuation_claim_amount || 0) +
    Number(formData.other_setoffs || 0) -
    Number(formData.liquidated_damages_deduction || 0);

  const netBalanceDue = 
    grossFinalSum - 
    Number(formData.total_previous_payments || 0) + 
    Number(formData.retention_released || 0);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave({
        ...formData,
        gross_final_account_sum: grossFinalSum,
        balance_due_contractor: netBalanceDue
      });
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecalculateClick = async () => {
    try {
      setIsRecalculating(true);
      await onRecalculate();
      // Sync form data
      setFormData((prev) => ({
        ...prev,
        original_contract_sum: contractSum,
        net_variations: totalVariationsNet,
        total_previous_payments: certifiedToDate
      }));
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">
            Final Account Closeout Statement
          </h3>
          <p className="text-xs text-slate-500">
            Definitive financial reconciliation of contract sum, approved variations, provisional sums, and price escalation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleRecalculateClick}
            disabled={isRecalculating}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center space-x-1.5 transition cursor-pointer shadow-2xs disabled:opacity-50"
            title="Auto-recalculate baseline figures from verified project variations and valuations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>Sync Records</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition cursor-pointer shadow-2xs ${
              isEditing 
                ? 'bg-slate-900 text-white' 
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isEditing ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Exit Edit Mode</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit All Figures</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold inline-flex items-center space-x-1.5 transition cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Statement'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
          <strong>100% Sole Discretion Mode:</strong> You can edit every contract sum line, fluctuation claim, liquidated damages, and previous payments directly below.
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 font-bold block text-[10px] uppercase">Original Tender Sum</span>
          <span className="text-lg font-extrabold text-slate-900 mt-0.5 block font-mono">
            {formatNaira(formData.original_contract_sum)}
          </span>
          <span className="text-[10px] text-slate-400">Baseline contract award</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 font-bold block text-[10px] uppercase">Gross Final Account Sum</span>
          <span className="text-lg font-extrabold text-slate-900 mt-0.5 block font-mono">
            {formatNaira(grossFinalSum)}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold">Total adjusted contract liabilities</span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300">
          <span className="text-emerald-950 font-bold block text-[10px] uppercase">Net Final Balance Due</span>
          <span className="text-lg font-black text-emerald-950 mt-0.5 block font-mono">
            {formatNaira(netBalanceDue)}
          </span>
          <span className="text-[10px] text-emerald-800 font-semibold">Final check payable to contractor</span>
        </div>
      </div>

      {/* Closeout Statement Table */}
      <div className="border-2 border-emerald-900/30 rounded-2xl p-6 sm:p-8 bg-white space-y-6 shadow-sm print:border-none">
        <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
          <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase block">
            OFFICIAL FINAL ACCOUNT &bull; CONTRACT CLOSEOUT STATEMENT
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            SUMMARY OF FINAL ACCOUNT
          </h2>
          <div className="flex items-center justify-center space-x-3 text-xs text-slate-500">
            <span>Status:</span>
            {isEditing ? (
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="px-2 py-0.5 bg-slate-50 border border-slate-300 rounded font-bold text-slate-800"
              >
                <option value="Draft">Draft (Negotiating)</option>
                <option value="Agreed">Agreed by Contractor</option>
                <option value="Certified">Certified by QS</option>
                <option value="Closed">Closed &amp; Fully Paid</option>
              </select>
            ) : (
              <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                {formData.status}
              </span>
            )}
          </div>
        </div>

        {(projectTitle || clientName || contractorName) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            {projectTitle && (
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Project</span>
                <span className="font-bold text-slate-800">{projectTitle}</span>
              </div>
            )}
            {clientName && (
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Employer</span>
                <span className="font-bold text-slate-800">{clientName}</span>
              </div>
            )}
            {contractorName && (
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Main Contractor</span>
                <span className="font-bold text-slate-800">{contractorName}</span>
              </div>
            )}
          </div>
        )}

        <table className="w-full text-xs">
          <tbody className="divide-y divide-slate-200">
            {/* 1. Original Contract Sum */}
            <tr className="bg-slate-50/50">
              <td className="p-3 font-bold text-slate-800">1. Original Contract Sum</td>
              <td className="p-3 text-right font-mono font-bold text-slate-900 w-48">
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.original_contract_sum}
                    onChange={(e) => setFormData({ ...formData, original_contract_sum: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold"
                  />
                ) : (
                  formatNaira(formData.original_contract_sum)
                )}
              </td>
            </tr>

            {/* 2. Net Approved Variations */}
            <tr>
              <td className="p-3 text-slate-700 pl-6">
                2. Net Approved Variations (Additions less Omissions)
              </td>
              <td className={`p-3 text-right font-mono font-bold ${formData.net_variations >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.net_variations}
                    onChange={(e) => setFormData({ ...formData, net_variations: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold"
                  />
                ) : (
                  formData.net_variations >= 0 ? `+${formatNaira(formData.net_variations)}` : `-${formatNaira(Math.abs(formData.net_variations))}`
                )}
              </td>
            </tr>

            {/* 3. Provisional Sums */}
            <tr>
              <td className="p-3 text-slate-700 pl-6">
                3. Provisional Sums Adjustment (Defined vs Actual expended)
              </td>
              <td className="p-3 text-right font-mono font-bold text-slate-900">
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.provisional_sums_adjustment}
                    onChange={(e) => setFormData({ ...formData, provisional_sums_adjustment: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold"
                  />
                ) : (
                  formData.provisional_sums_adjustment >= 0 ? `+${formatNaira(formData.provisional_sums_adjustment)}` : `-${formatNaira(Math.abs(formData.provisional_sums_adjustment))}`
                )}
              </td>
            </tr>

            {/* 4. Prime Cost Adjustment */}
            <tr>
              <td className="p-3 text-slate-700 pl-6">
                4. Prime Cost (PC) Sums Adjustment
              </td>
              <td className="p-3 text-right font-mono font-bold text-slate-900">
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.prime_cost_adjustment}
                    onChange={(e) => setFormData({ ...formData, prime_cost_adjustment: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold"
                  />
                ) : (
                  formData.prime_cost_adjustment >= 0 ? `+${formatNaira(formData.prime_cost_adjustment)}` : `-${formatNaira(Math.abs(formData.prime_cost_adjustment))}`
                )}
              </td>
            </tr>

            {/* 5. Fluctuation Claim (Price Escalation FIDIC 70) */}
            <tr>
              <td className="p-3 text-slate-700 pl-6">
                5. Fluctuation Claim (Price Escalation on Hyper-inflated Materials)
              </td>
              <td className="p-3 text-right font-mono font-bold text-emerald-800">
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.fluctuation_claim_amount}
                    onChange={(e) => setFormData({ ...formData, fluctuation_claim_amount: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold text-emerald-800"
                  />
                ) : (
                  `+${formatNaira(formData.fluctuation_claim_amount)}`
                )}
              </td>
            </tr>

            {/* 6. Liquidated & Ascertained Damages Deduction */}
            <tr>
              <td className="p-3 text-slate-700 pl-6">
                6. Less Liquidated &amp; Ascertained Damages (L&amp;AD for delay)
              </td>
              <td className="p-3 text-right font-mono font-bold text-rose-600">
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.liquidated_damages_deduction}
                    onChange={(e) => setFormData({ ...formData, liquidated_damages_deduction: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold text-rose-600"
                  />
                ) : (
                  `-${formatNaira(formData.liquidated_damages_deduction)}`
                )}
              </td>
            </tr>

            {/* SUB-TOTAL: GROSS FINAL ACCOUNT */}
            <tr className="bg-slate-100 font-extrabold border-t-2 border-b-2 border-slate-400">
              <td className="p-3.5 text-slate-900 uppercase">
                GROSS FINAL ACCOUNT SUM
              </td>
              <td className="p-3.5 text-right font-mono text-sm text-slate-900">
                {formatNaira(grossFinalSum)}
              </td>
            </tr>

            {/* 7. Less Interim Payments Certified to Date */}
            <tr>
              <td className="p-3 text-slate-700 pl-6">
                7. Less Total Interim Payments Previously Certified to Date
              </td>
              <td className="p-3 text-right font-mono font-bold text-slate-700">
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.total_previous_payments}
                    onChange={(e) => setFormData({ ...formData, total_previous_payments: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold"
                  />
                ) : (
                  `-${formatNaira(formData.total_previous_payments)}`
                )}
              </td>
            </tr>

            {/* 8. Plus Retention Released */}
            <tr>
              <td className="p-3 text-slate-700 pl-6">
                8. Plus Retention Monies Released (Practical Completion / End of DLP)
              </td>
              <td className="p-3 text-right font-mono font-bold text-emerald-800">
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.retention_released}
                    onChange={(e) => setFormData({ ...formData, retention_released: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold text-emerald-800"
                  />
                ) : (
                  `+${formatNaira(formData.retention_released)}`
                )}
              </td>
            </tr>

            {/* NET BALANCE DUE */}
            <tr className="bg-emerald-100/90 border-t-2 border-emerald-800">
              <td className="p-4 font-black text-slate-900 text-sm uppercase">
                NET FINAL BALANCE DUE TO CONTRACTOR
              </td>
              <td className="p-4 text-right font-mono text-base sm:text-lg font-black text-emerald-950">
                {formatNaira(netBalanceDue)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signatures */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-700 uppercase text-[10px] block">Contractor Concurrence:</span>
            <p className="text-slate-500 text-[11px]">
              We hereby agree that the above statement represents full and final settlement of all claims under this contract.
            </p>
            <div className="pt-2 border-t border-slate-200 text-slate-600 font-semibold">
              Signature &amp; Date: _______________________
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Consultant Quantity Surveyor Certification</span>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase">Sign-Off Surveyor Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.qs_signoff_name}
                  onChange={(e) => setFormData({ ...formData, qs_signoff_name: e.target.value })}
                  className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded font-bold text-slate-900 mt-0.5"
                />
              ) : (
                <span className="font-extrabold text-slate-900 block mt-0.5">{formData.qs_signoff_name}</span>
              )}
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase">QSRBN Registration No.</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.qs_registration_number}
                  onChange={(e) => setFormData({ ...formData, qs_registration_number: e.target.value })}
                  className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 mt-0.5"
                />
              ) : (
                <span className="font-mono font-bold text-slate-700 block mt-0.5">{formData.qs_registration_number}</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

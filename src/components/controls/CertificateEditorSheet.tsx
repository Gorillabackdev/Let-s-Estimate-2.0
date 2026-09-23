import React, { useState } from 'react';
import { 
  FileCheck2, 
  Printer, 
  Edit3, 
  Check, 
  Building2, 
  Calendar, 
  ShieldCheck, 
  RotateCcw,
  UserCheck
} from 'lucide-react';
import { CertificateType, ProjectValuation } from '../../types';
import { formatNaira } from '../../utils/format';

export interface CertificateFormData {
  certNumber: string;
  issueDate: string;
  clientName: string;
  contractorName: string;
  projectTitle: string;
  contractSum: number;
  grossValuation: number;
  retentionPct: number;
  retentionAmount: number;
  advanceDeduction: number;
  previousPayments: number;
  netAmountCertified: number;
  qsName: string;
  qsRegNo: string;
}

interface CertificateEditorSheetProps {
  certData: CertificateFormData;
  onChange: (data: CertificateFormData) => void;
  valuations: ProjectValuation[];
  selectedCertType: CertificateType;
  onSelectCertType: (type: CertificateType) => void;
  onSelectValuationSource?: (val: ProjectValuation | null) => void;
}

export const CertificateEditorSheet: React.FC<CertificateEditorSheetProps> = ({
  certData,
  onChange,
  valuations,
  selectedCertType,
  onSelectCertType,
  onSelectValuationSource
}) => {
  const [isEditMode, setIsEditMode] = useState(false);

  // Auto-recalculate net amount
  const handleRecalculateNet = () => {
    const gross = Number(certData.grossValuation || 0);
    const ret = gross * (Number(certData.retentionPct || 0) / 100);
    const adv = Number(certData.advanceDeduction || 0);
    const prev = Number(certData.previousPayments || 0);
    const net = Math.max(0, gross - ret - adv - prev);

    onChange({
      ...certData,
      retentionAmount: ret,
      netAmountCertified: net
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const certTitleMap: Record<CertificateType, string> = {
    interim_payment_certificate: 'INTERIM PAYMENT CERTIFICATE (IPC)',
    practical_completion: 'PRACTICAL COMPLETION PAYMENT CERTIFICATE',
    making_good_defects: 'CERTIFICATE OF MAKING GOOD DEFECTS',
    final_payment_certificate: 'FINAL PAYMENT CERTIFICATE'
  };

  return (
    <div className="space-y-4">
      {/* Top Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        {/* Certificate Type Selector */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'interim_payment_certificate', label: 'Interim (IPC)' },
            { id: 'practical_completion', label: 'Practical Completion' },
            { id: 'making_good_defects', label: 'Making Good Defects' },
            { id: 'final_payment_certificate', label: 'Final Certificate' }
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCertType(c.id as CertificateType)}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                selectedCertType === c.id
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {valuations.length > 0 && (
            <select
              onChange={(e) => {
                const valId = e.target.value;
                if (!valId) {
                  onSelectValuationSource?.(null);
                } else {
                  const found = valuations.find(v => v.id === valId);
                  if (found) onSelectValuationSource?.(found);
                }
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">Manual / Custom Values</option>
              {valuations.map((v) => (
                <option key={v.id} value={v.id}>
                  Sync with {v.valuation_number} ({formatNaira(Number(v.amount_due || 0))})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition cursor-pointer ${
              isEditMode 
                ? 'bg-emerald-700 text-white' 
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isEditMode ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Done Editing</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit All Fields</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
            title="Print or export official certificate"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {isEditMode && (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
          <span>
            <strong>Edit Mode Active:</strong> You have 100% sole discretion to edit any certificate field directly below.
          </span>
          <button
            type="button"
            onClick={handleRecalculateNet}
            className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-bold inline-flex items-center space-x-1 cursor-pointer hover:bg-emerald-900"
            title="Recalculate Net Amount from Gross - Retention - Advance - Previous"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Recalculate Net</span>
          </button>
        </div>
      )}

      {/* Official Certificate Sheet */}
      <div className="border-2 border-emerald-900/30 rounded-2xl p-6 sm:p-8 bg-white space-y-6 shadow-sm print:border-none print:shadow-none">
        
        {/* Certificate Masthead */}
        <div className="text-center pb-6 border-b-2 border-slate-800 space-y-1">
          <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase block">
            FEDERAL REPUBLIC OF NIGERIA &bull; STANDARD CONTRACT ADMINISTRATION
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            {certTitleMap[selectedCertType]}
          </h2>
          <div className="flex items-center justify-center space-x-4 text-xs font-semibold text-slate-600 mt-2">
            <span className="flex items-center space-x-1">
              <span>Certificate Ref:</span>
              {isEditMode ? (
                <input
                  type="text"
                  value={certData.certNumber}
                  onChange={(e) => onChange({ ...certData, certNumber: e.target.value })}
                  className="px-2 py-0.5 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-slate-900 w-28"
                />
              ) : (
                <strong className="font-mono text-slate-900">{certData.certNumber}</strong>
              )}
            </span>
            <span>&bull;</span>
            <span className="flex items-center space-x-1">
              <span>Date of Issue:</span>
              {isEditMode ? (
                <input
                  type="date"
                  value={certData.issueDate}
                  onChange={(e) => onChange({ ...certData, issueDate: e.target.value })}
                  className="px-2 py-0.5 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900"
                />
              ) : (
                <strong className="text-slate-900">{certData.issueDate}</strong>
              )}
            </span>
          </div>
        </div>

        {/* Project & Parties Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <span className="block font-bold text-slate-400 uppercase text-[10px]">Employer / Client:</span>
            {isEditMode ? (
              <input
                type="text"
                value={certData.clientName}
                onChange={(e) => onChange({ ...certData, clientName: e.target.value })}
                className="w-full px-2.5 py-1.5 mt-0.5 bg-white border border-slate-300 rounded font-bold text-slate-900"
              />
            ) : (
              <span className="text-sm font-extrabold text-slate-900 block">{certData.clientName || 'Client Pending'}</span>
            )}

            <span className="block font-bold text-slate-400 uppercase text-[10px] mt-3">Project Title:</span>
            {isEditMode ? (
              <input
                type="text"
                value={certData.projectTitle}
                onChange={(e) => onChange({ ...certData, projectTitle: e.target.value })}
                className="w-full px-2.5 py-1.5 mt-0.5 bg-white border border-slate-300 rounded font-bold text-slate-900"
              />
            ) : (
              <span className="text-xs font-semibold text-slate-800 block">{certData.projectTitle || 'Project Title'}</span>
            )}
          </div>

          <div>
            <span className="block font-bold text-slate-400 uppercase text-[10px]">Main Contractor:</span>
            {isEditMode ? (
              <input
                type="text"
                value={certData.contractorName}
                onChange={(e) => onChange({ ...certData, contractorName: e.target.value })}
                className="w-full px-2.5 py-1.5 mt-0.5 bg-white border border-slate-300 rounded font-bold text-slate-900"
              />
            ) : (
              <span className="text-sm font-extrabold text-slate-900 block">{certData.contractorName || 'Contractor Pending'}</span>
            )}

            <span className="block font-bold text-slate-400 uppercase text-[10px] mt-3">Original Contract Sum:</span>
            {isEditMode ? (
              <input
                type="number"
                value={certData.contractSum}
                onChange={(e) => onChange({ ...certData, contractSum: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 mt-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900"
              />
            ) : (
              <span className="text-xs font-mono font-bold text-slate-900 block">{formatNaira(certData.contractSum)}</span>
            )}
          </div>
        </div>

        {/* Valuation Financial Breakdown Table */}
        <div className="border border-slate-300 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-slate-200">
              {/* Row 1: Gross Valuation */}
              <tr className="bg-slate-50/50">
                <td className="p-3.5 font-bold text-slate-700">
                  1. Gross Total Value of Work Completed to Date (including unfixed materials on site)
                </td>
                <td className="p-3.5 text-right font-mono font-extrabold text-slate-900 w-48">
                  {isEditMode ? (
                    <input
                      type="number"
                      value={certData.grossValuation}
                      onChange={(e) => {
                        const g = Number(e.target.value);
                        const ret = g * (certData.retentionPct / 100);
                        const net = Math.max(0, g - ret - certData.advanceDeduction - certData.previousPayments);
                        onChange({ ...certData, grossValuation: g, retentionAmount: ret, netAmountCertified: net });
                      }}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold"
                    />
                  ) : (
                    formatNaira(certData.grossValuation)
                  )}
                </td>
              </tr>

              {/* Row 2: Retention Deduction */}
              <tr>
                <td className="p-3.5 text-slate-600 pl-6">
                  2. Less Retention Held ({certData.retentionPct}% of gross value)
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                  {isEditMode ? (
                    <input
                      type="number"
                      value={certData.retentionAmount}
                      onChange={(e) => {
                        const ret = Number(e.target.value);
                        const net = Math.max(0, certData.grossValuation - ret - certData.advanceDeduction - certData.previousPayments);
                        onChange({ ...certData, retentionAmount: ret, netAmountCertified: net });
                      }}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold text-rose-600"
                    />
                  ) : (
                    `-${formatNaira(certData.retentionAmount)}`
                  )}
                </td>
              </tr>

              {/* Row 3: Advance Payment Recovery */}
              <tr>
                <td className="p-3.5 text-slate-600 pl-6">
                  3. Less Mobilization / Advance Payment Recovery
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-amber-700">
                  {isEditMode ? (
                    <input
                      type="number"
                      value={certData.advanceDeduction}
                      onChange={(e) => {
                        const adv = Number(e.target.value);
                        const net = Math.max(0, certData.grossValuation - certData.retentionAmount - adv - certData.previousPayments);
                        onChange({ ...certData, advanceDeduction: adv, netAmountCertified: net });
                      }}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold text-amber-700"
                    />
                  ) : (
                    `-${formatNaira(certData.advanceDeduction)}`
                  )}
                </td>
              </tr>

              {/* Row 4: Previous Certified Payments */}
              <tr>
                <td className="p-3.5 text-slate-600 pl-6">
                  4. Less Total Interim Payments Previously Certified to Date
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-slate-700">
                  {isEditMode ? (
                    <input
                      type="number"
                      value={certData.previousPayments}
                      onChange={(e) => {
                        const prev = Number(e.target.value);
                        const net = Math.max(0, certData.grossValuation - certData.retentionAmount - certData.advanceDeduction - prev);
                        onChange({ ...certData, previousPayments: prev, netAmountCertified: net });
                      }}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold"
                    />
                  ) : (
                    `-${formatNaira(certData.previousPayments)}`
                  )}
                </td>
              </tr>

              {/* Row 5: Net Amount Due */}
              <tr className="bg-emerald-50/70 border-t-2 border-emerald-800">
                <td className="p-4 font-black text-slate-900 text-sm uppercase tracking-wide">
                  NET AMOUNT CERTIFIED AND NOW PAYABLE TO CONTRACTOR
                </td>
                <td className="p-4 text-right font-mono text-base sm:text-lg font-black text-emerald-950">
                  {isEditMode ? (
                    <input
                      type="number"
                      value={certData.netAmountCertified}
                      onChange={(e) => onChange({ ...certData, netAmountCertified: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-white border-2 border-emerald-600 rounded text-right font-mono font-extrabold text-emerald-950"
                    />
                  ) : (
                    formatNaira(certData.netAmountCertified)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Certifying QS Sign-off Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-slate-400 uppercase text-[10px] block">Contract Payment Clause:</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              We hereby certify that the sum stated above is properly due and payable by the Employer to the Contractor in accordance with the Conditions of Contract within 21 days from date of presentation.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Certifying Quantity Surveyor Sign-Off</span>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase">Surveyor Name &amp; Title</label>
              {isEditMode ? (
                <input
                  type="text"
                  value={certData.qsName}
                  onChange={(e) => onChange({ ...certData, qsName: e.target.value })}
                  className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded font-bold text-slate-900 mt-0.5"
                />
              ) : (
                <span className="font-extrabold text-slate-900 block mt-0.5">{certData.qsName || 'Consultant Quantity Surveyor'}</span>
              )}
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase">QSRBN Registration No.</label>
              {isEditMode ? (
                <input
                  type="text"
                  value={certData.qsRegNo}
                  onChange={(e) => onChange({ ...certData, qsRegNo: e.target.value })}
                  className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 mt-0.5"
                />
              ) : (
                <span className="font-mono font-bold text-slate-700 block mt-0.5">{certData.qsRegNo || 'QSRBN/REG'}</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

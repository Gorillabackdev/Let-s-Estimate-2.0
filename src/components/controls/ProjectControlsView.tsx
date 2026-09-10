import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Receipt, 
  FileCheck2, 
  TrendingUp, 
  DollarSign, 
  Award, 
  Plus, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Building2,
  FileText
} from 'lucide-react';
import { Project, ProjectControlsSubView, CertificateType, ProjectCertificate } from '../../types';
import { formatNaira } from '../../utils/format';

interface ProjectControlsViewProps {
  project?: Project | null;
  projects?: Project[];
  initialSubView?: ProjectControlsSubView;
  onSelectProject?: (projectId: string) => void;
}

export const ProjectControlsView: React.FC<ProjectControlsViewProps> = ({
  project,
  projects = [],
  initialSubView = 'budget',
  onSelectProject,
}) => {
  const [activeSubView, setActiveSubView] = useState<ProjectControlsSubView>(initialSubView);
  const [selectedCertType, setSelectedCertType] = useState<CertificateType>('interim_payment_certificate');
  const [showNewCertModal, setShowNewCertModal] = useState(false);

  // Fallback demo numbers based on active project or default
  const contractSum = project?.grand_total || 45000000;
  const projectTitle = project?.title || 'Federal Ministry of Works Dual Carriageway / Residential Development';
  const contractor = project?.contractor || 'Cappa & D’Alberto Plc / Julius Berger Nigeria';
  const clientName = project?.client_name || 'Lagos State Ministry of Housing';

  // Sample interim valuations
  const sampleValuations = [
    {
      num: 'Valuation No. 01',
      date: '15 Jan 2026',
      grossVal: Math.round(contractSum * 0.25),
      retention: Math.round(contractSum * 0.25 * 0.05),
      advanceDeduction: Math.round(contractSum * 0.25 * 0.15),
      netDue: Math.round(contractSum * 0.25 * 0.8),
      status: 'Paid'
    },
    {
      num: 'Valuation No. 02',
      date: '28 Feb 2026',
      grossVal: Math.round(contractSum * 0.55),
      retention: Math.round(contractSum * 0.55 * 0.05),
      advanceDeduction: Math.round(contractSum * 0.55 * 0.15),
      netDue: Math.round(contractSum * 0.30 * 0.8),
      status: 'Certified'
    }
  ];

  // Sample certificates
  const [certificates, setCertificates] = useState<ProjectCertificate[]>([
    {
      id: 'ipc-001',
      project_id: project?.id || 'demo-1',
      certificate_type: 'interim_payment_certificate',
      certificate_number: 'IPC/2026/001',
      issue_date: '2026-01-18',
      contractor_name: contractor,
      client_name: clientName,
      project_title: projectTitle,
      contract_sum: contractSum,
      gross_valuation: Math.round(contractSum * 0.25),
      retention_deduction: Math.round(contractSum * 0.25 * 0.05),
      advance_deduction: Math.round(contractSum * 0.25 * 0.15),
      previous_payments: 0,
      net_amount_certified: Math.round(contractSum * 0.25 * 0.8),
      signoff_qs: 'QS Isaac Emmanuel FNIQS, RQS',
      signoff_reg_no: 'NIQS-RQS-4819',
      status: 'Honoured'
    },
    {
      id: 'ipc-002',
      project_id: project?.id || 'demo-1',
      certificate_type: 'interim_payment_certificate',
      certificate_number: 'IPC/2026/002',
      issue_date: '2026-03-02',
      contractor_name: contractor,
      client_name: clientName,
      project_title: projectTitle,
      contract_sum: contractSum,
      gross_valuation: Math.round(contractSum * 0.55),
      retention_deduction: Math.round(contractSum * 0.55 * 0.05),
      advance_deduction: Math.round(contractSum * 0.55 * 0.15),
      previous_payments: Math.round(contractSum * 0.25 * 0.8),
      net_amount_certified: Math.round(contractSum * 0.30 * 0.8),
      signoff_qs: 'QS Isaac Emmanuel FNIQS, RQS',
      signoff_reg_no: 'NIQS-RQS-4819',
      status: 'Issued'
    }
  ]);

  // Sample variations
  const [variations, setVariations] = useState([
    {
      ref: 'VO-001',
      title: 'Foundation Soil Stabilization in Swamp Zone',
      addition: 2450000,
      omission: 0,
      net: 2450000,
      status: 'Approved',
      reason: 'Unforeseen peat layer requiring hardcore and geotextile stabilization.'
    },
    {
      ref: 'VO-002',
      title: 'Substitute Ceramic Tiles with Polished Porcelain in Foyer',
      addition: 850000,
      omission: 420000,
      net: 430000,
      status: 'Approved',
      reason: 'Client aesthetic upgrade request.'
    }
  ]);

  const safeVariations = Array.isArray(variations) ? variations : [];
  const totalVariationsNet = safeVariations.filter(v => v?.status === 'Approved').reduce((a, b) => a + (b?.net || 0), 0);
  const revisedContractSum = (contractSum || 0) + totalVariationsNet;

  return (
    <div id="project-controls-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Project Cost Controls &amp; Contract Administration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Valuations, interim payment certificates (IPCs), variation orders, and final account reconciliation.
          </p>
        </div>

        {/* Project Switcher if multiple projects */}
        {projects.length > 0 && onSelectProject && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-semibold">Active Project:</span>
            <select
              value={project?.id || ''}
              onChange={(e) => onSelectProject(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Contract Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Original Contract Sum</span>
          <div className="text-lg font-extrabold text-slate-900 mt-0.5">{formatNaira(contractSum)}</div>
          <span className="text-[10px] text-slate-500">Based on approved BOQ</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved Variations</span>
          <div className="text-lg font-extrabold text-emerald-800 mt-0.5">+{formatNaira(totalVariationsNet)}</div>
          <span className="text-[10px] text-slate-500">{variations.length} Variation orders logged</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Revised Contract Sum</span>
          <div className="text-lg font-extrabold text-slate-900 mt-0.5">{formatNaira(revisedContractSum)}</div>
          <span className="text-[10px] text-slate-500">Anticipated final account</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Certified to Date</span>
          <div className="text-lg font-extrabold text-teal-800 mt-0.5">{formatNaira(Math.round(contractSum * 0.55 * 0.8))}</div>
          <span className="text-[10px] text-emerald-700 font-semibold">IPCs 001 &amp; 002 issued</span>
        </div>
      </div>

      {/* Sub-navigation Tabs for Project Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'budget', label: 'Project Budget', icon: DollarSign },
            { id: 'valuations', label: 'Valuations', icon: Receipt },
            { id: 'certificates', label: 'Payment Certificates', icon: FileCheck2 },
            { id: 'variations', label: 'Variations', icon: SlidersHorizontal },
            { id: 'payments', label: 'Payments', icon: TrendingUp },
            { id: 'final-account', label: 'Final Account', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubView(tab.id as ProjectControlsSubView)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT: VALUATIONS */}
      {activeSubView === 'valuations' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Interim Contractor Valuations</h3>
              <p className="text-xs text-slate-500">Progressive measurements and interim valuations certified by the Quantity Surveyor.</p>
            </div>
            <button
              type="button"
              className="px-3.5 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold inline-flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Interim Valuation</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">Valuation Ref</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Gross Valuation</th>
                  <th className="p-3 text-right">Retention (5%)</th>
                  <th className="p-3 text-right">Advance Recovery (15%)</th>
                  <th className="p-3 text-right">Net Amount Due</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sampleValuations.map((v, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{v.num}</td>
                    <td className="p-3 text-slate-600">{v.date}</td>
                    <td className="p-3 text-right font-semibold text-slate-800">{formatNaira(v.grossVal)}</td>
                    <td className="p-3 text-right text-rose-600">-{formatNaira(v.retention)}</td>
                    <td className="p-3 text-right text-amber-700">-{formatNaira(v.advanceDeduction)}</td>
                    <td className="p-3 text-right font-extrabold text-emerald-800">{formatNaira(v.netDue)}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PAYMENT CERTIFICATES */}
      {activeSubView === 'certificates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Official Payment Certificates</h3>
                <p className="text-xs text-slate-500">Standard Nigerian Institute of Quantity Surveyors (NIQS) certified payment forms.</p>
              </div>

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
                    onClick={() => setSelectedCertType(c.id as CertificateType)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      selectedCertType === c.id
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Certificate Preview Card */}
            <div className="mt-6 border-2 border-emerald-900/40 rounded-2xl p-6 bg-slate-50/50 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-emerald-800 uppercase font-extrabold">
                    Federal Republic of Nigeria — Construction Contract Administration
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                    {selectedCertType === 'interim_payment_certificate' && 'INTERIM PAYMENT CERTIFICATE (IPC)'}
                    {selectedCertType === 'practical_completion' && 'CERTIFICATE OF PRACTICAL COMPLETION'}
                    {selectedCertType === 'making_good_defects' && 'CERTIFICATE OF MAKING GOOD DEFECTS'}
                    {selectedCertType === 'final_payment_certificate' && 'FINAL PAYMENT CERTIFICATE'}
                  </h2>
                  <div className="text-xs font-mono text-slate-500 mt-0.5">
                    CERT NO: IPC/2026/002 &bull; DATE: 02 MARCH 2026
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Certified by RQS</span>
                  </div>
                </div>
              </div>

              {/* Certificate metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Employer / Client:</span>
                  <span className="font-bold text-slate-900">{clientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Main Contractor:</span>
                  <span className="font-bold text-slate-900">{contractor}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Project Title:</span>
                  <span className="font-bold text-slate-900">{projectTitle}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Original Contract Sum:</span>
                  <span className="font-bold text-slate-900">{formatNaira(contractSum)}</span>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">1. Gross Valuation of Work Executed:</span>
                  <span className="font-bold text-slate-900">{formatNaira(Math.round(contractSum * 0.55))}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 text-rose-600">
                  <span>2. Less 5% Retention Held:</span>
                  <span className="font-bold">-{formatNaira(Math.round(contractSum * 0.55 * 0.05))}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 text-amber-700">
                  <span>3. Less Advance Payment Deduction (15%):</span>
                  <span className="font-bold">-{formatNaira(Math.round(contractSum * 0.55 * 0.15))}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600">
                  <span>4. Less Previous Payments Certified (IPC 001):</span>
                  <span className="font-bold">-{formatNaira(Math.round(contractSum * 0.25 * 0.8))}</span>
                </div>
                <div className="flex justify-between py-2 pt-3 font-extrabold text-sm text-emerald-950 bg-emerald-50/80 px-3 rounded-lg">
                  <span>NET AMOUNT CERTIFIED / PAYABLE TO CONTRACTOR:</span>
                  <span className="text-base text-emerald-800">{formatNaira(Math.round(contractSum * 0.30 * 0.8))}</span>
                </div>
              </div>

              {/* Signoff */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Quantity Surveying Consultant Signoff:</span>
                  <span className="font-bold text-slate-900">QS Isaac Emmanuel FNIQS, RQS</span>
                  <span className="text-[10px] text-slate-500 block font-mono">QSRBN Registration No: NIQS-RQS-4819</span>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center space-x-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download / Print Official Certificate</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: VARIATIONS */}
      {activeSubView === 'variations' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Variation Orders (VO)</h3>
              <p className="text-xs text-slate-500">Track contract additions, omissions, and client modification orders.</p>
            </div>
            <button
              type="button"
              className="px-3.5 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold inline-flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue Variation Order</span>
            </button>
          </div>

          <div className="space-y-3">
            {variations.map((v, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{v.ref}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {v.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 mt-1">{v.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{v.reason}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Net Financial Effect</span>
                  <span className="text-sm font-extrabold text-emerald-800">+{formatNaira(v.net)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: FINAL ACCOUNT */}
      {activeSubView === 'final-account' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Final Account &amp; Contract Closeout Statement</h3>
              <p className="text-xs text-slate-500">Comprehensive final account calculation for contract closeout and release of retention.</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-200">
              <span className="font-medium text-slate-700">Original Contract Sum:</span>
              <span className="font-bold text-slate-900">{formatNaira(contractSum)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200 text-emerald-700">
              <span className="font-medium">Approved Variations (Additions):</span>
              <span className="font-bold">+{formatNaira(totalVariationsNet)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200 text-slate-600">
              <span className="font-medium">Provisional Sums Adjusted:</span>
              <span className="font-bold">₦0.00</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200 font-extrabold text-slate-900">
              <span>Gross Final Account Sum:</span>
              <span>{formatNaira(revisedContractSum)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200 text-slate-600">
              <span>Less Total Interim Payments to Date:</span>
              <span className="font-bold">-{formatNaira(Math.round(contractSum * 0.55 * 0.8))}</span>
            </div>
            <div className="flex justify-between py-2 pt-3 font-extrabold text-sm text-emerald-950 bg-emerald-100/70 px-3 rounded-lg">
              <span>FINAL BALANCE DUE TO CONTRACTOR:</span>
              <span className="text-base text-emerald-800">{formatNaira(revisedContractSum - Math.round(contractSum * 0.55 * 0.8))}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BUDGET */}
      {activeSubView === 'budget' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900">Project Master Cost Budget</h3>
          <p className="text-xs text-slate-500">Cost allocation across construction trades, preliminaries, contingency and statutory taxes.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Direct Trade Works</span>
              <span className="text-base font-extrabold text-slate-900 mt-1 block">{formatNaira(Math.round(contractSum * 0.75))}</span>
              <span className="text-[11px] text-slate-500">Substructure, superstructure, finishes</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Preliminaries &amp; Overheads</span>
              <span className="text-base font-extrabold text-slate-900 mt-1 block">{formatNaira(Math.round(contractSum * 0.15))}</span>
              <span className="text-[11px] text-slate-500">Site supervision, plant &amp; insurance</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Contingency &amp; Taxes</span>
              <span className="text-base font-extrabold text-slate-900 mt-1 block">{formatNaira(Math.round(contractSum * 0.10))}</span>
              <span className="text-[11px] text-slate-500">5% Contingency + 7.5% VAT</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PAYMENTS */}
      {activeSubView === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900">Payment Disbursements &amp; Receipts</h3>
          <p className="text-xs text-slate-500">Reconciliation of certified contractor amounts against bank transfer disbursements.</p>
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-900 text-xs border border-emerald-200">
            <strong>All Certified Payments Current:</strong> IPC 001 paid in full via Access Bank. IPC 002 certified and awaiting client mandate disbursement.
          </div>
        </div>
      )}

    </div>
  );
};

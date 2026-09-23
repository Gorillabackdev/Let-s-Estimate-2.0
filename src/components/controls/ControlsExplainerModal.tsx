import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  SlidersHorizontal, 
  Receipt, 
  FileCheck2, 
  Award, 
  DollarSign, 
  Info,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Scale
} from 'lucide-react';

interface ControlsExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GuideTab = 'overview' | 'variations' | 'ipc' | 'certificates' | 'final-account' | 'budget';

export const ControlsExplainerModal: React.FC<ControlsExplainerModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('overview');

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 my-8 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Quantity Surveying Financial Controls Guide
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard Nigerian Institute of Quantity Surveyors (NIQS) &amp; BESMM4 Contract Administration
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-2 text-xs">
          {[
            { id: 'overview', label: '1. Why Figures Exist', icon: Info },
            { id: 'variations', label: '2. Variation Orders (VO)', icon: SlidersHorizontal },
            { id: 'ipc', label: '3. Interim Valuations (IPC)', icon: Receipt },
            { id: 'certificates', label: '4. Payment Certificates', icon: FileCheck2 },
            { id: 'final-account', label: '5. Final Account', icon: Award },
            { id: 'budget', label: '6. Master Budget', icon: DollarSign },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as GuideTab)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="text-xs leading-relaxed text-slate-700 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                <div className="flex items-center space-x-2 text-amber-900 font-extrabold text-sm">
                  <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>&quot;Where did those initial figures come from? I didn&apos;t enter them.&quot;</span>
                </div>
                <p className="text-amber-900/90 text-xs">
                  When a project workspace is initialized, the system automatically pulls baseline figures from the project&apos;s verified <strong>Bill of Quantities (BOQ)</strong> (such as the contract sum, subtotal, and preliminaries). For trade allocations and sample certificates, standard <strong>BESMM4 reference percentages</strong> (e.g. 18% Substructure, 24% RC Superstructure, 5% Retention) are loaded as smart defaults.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-950 font-extrabold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>The Quantity Surveyor&apos;s Sole Discretion Principle</span>
                </div>
                <p className="text-emerald-900/90 text-xs">
                  <strong>No figure is locked or enforced.</strong> The initial numbers are solely starting suggestions. As the Project Quantity Surveyor, you have <strong>100% sole discretion</strong> to edit, override, or replace any contract sum, target budget, trade breakdown, variation order, valuation measurement, or certificate figure at any time.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <span className="font-bold text-slate-900 block">Live Auto-Recalculation</span>
                  <p className="text-slate-600 text-[11px]">
                    Whenever you add a variation order or log an interim valuation, all financial metrics (Revised Contract Sum, Net Amount Certified, Balance to Complete) update instantly.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <span className="font-bold text-slate-900 block">Durable Persistence</span>
                  <p className="text-slate-600 text-[11px]">
                    All variations, valuations, budget adjustments, and certificates are saved directly to the project database and can be exported as official reports.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VARIATIONS */}
          {activeTab === 'variations' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">What is a Variation Order (VO)?</h3>
                <p className="text-slate-600 mt-1">
                  Under standard construction contracts (such as NIQS, JCT, and FIDIC), a <strong>Variation Order</strong> represents any alteration, addition, or omission to the contract works from the original tender documents.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="font-extrabold text-emerald-900 block">+ Additions (Extra Work)</span>
                  <p className="text-emerald-800 text-[11px]">
                    Examples: Client upgrades floor tiles from ceramic to Spanish porcelain; structural engineer issues site instruction (SI) to deepen foundation footings due to bad clay soil.
                  </p>
                  <span className="text-[11px] font-bold text-emerald-950 block mt-1">Impact: Increases the Contract Sum.</span>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                  <span className="font-extrabold text-rose-900 block">- Omissions (Omitted Work)</span>
                  <p className="text-rose-800 text-[11px]">
                    Examples: Client chooses not to build the perimeter gatehouse; decorative parapet wall replaced with simple aluminium coping.
                  </p>
                  <span className="text-[11px] font-bold text-rose-950 block mt-1">Impact: Decreases the Contract Sum.</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 block">How it works in the app:</span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>Click <strong>&quot;Issue Variation Order&quot;</strong> in the Variations tab.</li>
                  <li>Enter the description, trade section, site instruction reference (e.g. ASI-03), quantity, and unit rate.</li>
                  <li>Select <strong>Approved</strong> to immediately apply it to the <strong>Revised Contract Sum</strong>, or <strong>Submitted / Draft</strong> while negotiating with the contractor.</li>
                  <li>Edit or delete any variation anytime with a single click.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: IPC */}
          {activeTab === 'ipc' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">What is an Interim Valuation (IPC)?</h3>
                <p className="text-slate-600 mt-1">
                  During construction, the main contractor does not wait until the entire project is completed to be paid. Instead, the Quantity Surveyor carries out <strong>monthly physical site measurements</strong> of work properly executed, plus materials safely stored on site.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Standard Nigerian Valuation Formula:</span>
                <div className="font-mono text-[11px] bg-white p-3 rounded-lg border border-slate-300 text-slate-800 space-y-1">
                  <div>&nbsp;&nbsp;Gross Work Executed to Date (Previous + Current Period)</div>
                  <div className="text-rose-600">- Less 5% Retention (held for Defects Liability)</div>
                  <div className="text-amber-700">- Less Advance Payment Recovery (e.g. 15% mobilization recoupment)</div>
                  <div className="text-slate-600">- Less Previous Payments Certified to Date</div>
                  <div className="pt-1 border-t border-slate-300 font-bold text-emerald-800">
                    = Net Amount Certified / Payable to Contractor
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="font-extrabold text-emerald-900 block">Why is Retention held?</span>
                <p className="text-emerald-800 text-[11px]">
                  Standard Nigerian building contracts stipulate holding <strong>5% of gross work</strong> as security. 50% of the retention is released upon Practical Completion, and the remaining 50% is released after the 6-month Defects Liability Period (DLP) once all snagging items are made good.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: PAYMENT CERTIFICATES */}
          {activeTab === 'certificates' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">What is an Official Payment Certificate?</h3>
                <p className="text-slate-600 mt-1">
                  The Payment Certificate is the <strong>legally binding financial instrument</strong> signed by the Registered Quantity Surveyor (RQS) instructing the Client / Employer to pay the Main Contractor within the contractually agreed honor period (typically 14 to 21 days).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <span className="font-bold text-slate-900 block">Interim Payment Certificate (IPC)</span>
                  <p className="text-slate-600 text-[11px]">
                    Issued monthly (IPC-01, IPC-02, etc.) based on approved interim valuations of progressive work.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <span className="font-bold text-slate-900 block">Practical Completion Certificate</span>
                  <p className="text-slate-600 text-[11px]">
                    Issued when the building is fit for occupation. Triggers the release of the first 50% of retention held.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <span className="font-bold text-slate-900 block">Making Good Defects</span>
                  <p className="text-slate-600 text-[11px]">
                    Issued after the contractor remedies all snags identified during the 6-month Defects Liability Period.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <span className="font-bold text-slate-900 block">Final Payment Certificate</span>
                  <p className="text-slate-600 text-[11px]">
                    The final closeout payment releasing remaining retention and fully concluding financial liabilities.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px]">
                <strong>Complete Customization:</strong> Click &quot;Edit Certificate&quot; anytime to overwrite any client name, contractor, gross valuation, retention deduction, or certifying surveyor credentials directly.
              </div>
            </div>
          )}

          {/* TAB 5: FINAL ACCOUNT */}
          {activeTab === 'final-account' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">What is Final Account Reconciliation?</h3>
                <p className="text-slate-600 mt-1">
                  The <strong>Final Account</strong> is the definitive statement prepared by the Quantity Surveyor upon completion of the physical works. It reconciles every single financial addition, omission, provisional sum adjustment, and price fluctuation claim over the life of the contract.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Key Items in the Closeout Statement:</span>
                <ul className="space-y-1.5 text-slate-600 text-[11px]">
                  <li>&bull; <strong>Original Contract Sum:</strong> The initial accepted tender amount.</li>
                  <li>&bull; <strong>Net Approved Variations:</strong> Total additions minus total omissions.</li>
                  <li>&bull; <strong>Provisional Sums Adjustment:</strong> Replacing unmeasured estimates with actual subcontracts.</li>
                  <li>&bull; <strong>Fluctuation Claims (FIDIC Clause 70):</strong> Legitimate price escalation reimbursement for hyper-inflated materials (cement, diesel, reinforcement bars).</li>
                  <li>&bull; <strong>Liquidated &amp; Ascertained Damages (L&amp;AD):</strong> Deductions if contractor delayed completion without valid extension of time.</li>
                  <li>&bull; <strong>Release of Retention:</strong> Releasing held retention back to the contractor.</li>
                  <li>&bull; <strong>Net Final Balance Due:</strong> Gross final account minus all interim payments already made.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 6: MASTER BUDGET */}
          {activeTab === 'budget' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">What is the Project Master Cost Budget?</h3>
                <p className="text-slate-600 mt-1">
                  The Master Budget establishes the financial benchmark for cost control. It divides the total construction capital into direct trade works, preliminaries &amp; site overheads, contingency reserves, and statutory taxes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Trade Section Allocations (BESMM4):</span>
                <p className="text-slate-600 text-[11px]">
                  You can allocate budget ceilings to specific trades (Substructure, Superstructure, Blockwork, Roof, Finishes, MEP). As work progresses, log actual committed expenditure against each trade to monitor whether any trade is running over budget.
                </p>
                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-900 text-[11px]">
                  <strong>100% Editable:</strong> You can add custom trade rows, delete trades, edit budget amounts, or click &quot;Sync from BOQ Items&quot; to auto-group line items directly from your estimate.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Click any tab above for detailed quantity surveying workflows.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

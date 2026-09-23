import React, { useState, useEffect } from 'react';
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
  FileText,
  Trash2,
  Edit3,
  Pencil,
  Eye,
  RefreshCw,
  Save,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Printer,
  Calculator,
  UserCheck,
  Check
} from 'lucide-react';
import { 
  Project, 
  ProjectControlsSubView, 
  CertificateType, 
  ProjectCertificate, 
  ProjectVariation, 
  ProjectValuation, 
  ProjectFinalAccount 
} from '../../types';
import { formatNaira } from '../../utils/format';
import { safeFetchJson } from '../../utils/api';
import { ControlsExplainerModal } from './ControlsExplainerModal';
import { TradeBudgetTable, TradeBudgetItem, DEFAULT_BESMM4_TRADES } from './TradeBudgetTable';
import { CertificateEditorSheet } from './CertificateEditorSheet';
import { FinalAccountSheet } from './FinalAccountSheet';

export interface ProjectControlsViewProps {
  project?: Project | null;
  projects?: Project[];
  initialSubView?: ProjectControlsSubView;
  onSelectProject?: (projectId: string) => Promise<void> | void;
  onEditProject?: (updatedFields: Partial<Project>) => Promise<void> | void;
  onNewProject?: () => void;
  onDeleteProject?: (projectId: string, title: string) => Promise<void> | void;
  token?: string | null;
}

const BESMM4_SECTIONS = [
  'Substructure (Earthworks & Foundations)',
  'Reinforced Concrete Superstructure (Columns, Beams, Slabs)',
  'Blockwork & Masonry (Internal & External)',
  'Roofing & Rainwater Disposal',
  'Carpentry, Metalwork & Structural Steel',
  'Doors, Windows & Ironmongery',
  'Finishes (Wall Plaster, Floor Screed, Tiling, Painting)',
  'Plumbing & Drainage Installations',
  'Electrical & Mechanical Services',
  'External Works (Paving, Fencing, Drainage)',
  'Preliminaries & General Items'
];

export const ProjectControlsView: React.FC<ProjectControlsViewProps> = ({
  project,
  projects = [],
  initialSubView = 'budget',
  onSelectProject,
  onEditProject,
  onNewProject,
  onDeleteProject,
  token
}) => {
  const [activeSubView, setActiveSubView] = useState<ProjectControlsSubView>(initialSubView);
  const [showExplanation, setShowExplanation] = useState(false);

  // Real data state
  const [variations, setVariations] = useState<ProjectVariation[]>([]);
  const [valuations, setValuations] = useState<ProjectValuation[]>([]);
  const [finalAccount, setFinalAccount] = useState<ProjectFinalAccount | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Variations Modal state
  const [isVariationModalOpen, setIsVariationModalOpen] = useState(false);
  const [editingVariation, setEditingVariation] = useState<ProjectVariation | null>(null);
  const [varForm, setVarForm] = useState({
    variation_number: '',
    description: '',
    reason: '',
    section: BESMM4_SECTIONS[0],
    quantity: 1,
    unit: 'Item',
    rate: 0,
    type: 'addition' as 'addition' | 'omission',
    status: 'Approved' as 'Draft' | 'Submitted' | 'Approved' | 'Rejected'
  });

  // Valuations Modal state
  const [isValuationModalOpen, setIsValuationModalOpen] = useState(false);
  const [editingValuation, setEditingValuation] = useState<ProjectValuation | null>(null);
  const [valForm, setValForm] = useState({
    valuation_number: '',
    valuation_date: new Date().toISOString().split('T')[0],
    description: '',
    previous_valuation: 0,
    current_valuation: 0,
    retention_percent: 5.0,
    advance_payment_deduction: 0,
    previous_payments: 0,
    status: 'Certified' as 'Draft' | 'Certified' | 'Paid'
  });

  // Certificates state
  const [selectedCertType, setSelectedCertType] = useState<CertificateType>('interim_payment_certificate');
  const [isCertViewerOpen, setIsCertViewerOpen] = useState(false);
  const [certData, setCertData] = useState({
    certNumber: 'IPC-01',
    issueDate: new Date().toISOString().split('T')[0],
    clientName: '',
    contractorName: '',
    projectTitle: '',
    contractSum: 0,
    grossValuation: 0,
    retentionPct: 5.0,
    retentionAmount: 0,
    advanceDeduction: 0,
    previousPayments: 0,
    netAmountCertified: 0,
    qsName: 'QS Isaac Emmanuel FNIQS, RQS',
    qsRegNo: 'NIQS-RQS-4819'
  });

  // Project Budget Edit state
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    target_budget: 0,
    po_percent: 15,
    contingency_percent: 5,
    vat_percent: 7.5,
    swamp_premium_percent: 0,
    advance_payment_percent: 15,
    contractor: '',
    client_name: ''
  });

  // Final Account Edit state
  const [isEditingFinalAccount, setIsEditingFinalAccount] = useState(false);
  const [finalAccountForm, setFinalAccountForm] = useState<Partial<ProjectFinalAccount>>({});

  const contractSum = Number(project?.grand_total || project?.subtotal || 0);
  const projectTitle = project?.title || 'Project Estimate';
  const contractor = project?.contractor || 'Contractor Pending Assignment';
  const clientName = project?.client_name || 'Client / Employer';

  // Trade Budgets state
  const [tradeBudgets, setTradeBudgets] = useState<TradeBudgetItem[]>([]);

  useEffect(() => {
    if (contractSum > 0 && tradeBudgets.length === 0) {
      setTradeBudgets(
        DEFAULT_BESMM4_TRADES.map((t, idx) => ({
          id: `tb-${idx + 1}`,
          name: t.name,
          budget: Math.round((contractSum * 0.75) * (t.defaultPct / 100)),
          notes: t.notes
        }))
      );
    }
  }, [contractSum]);

  // Show temporary toast message
  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Sync subview from prop if initialSubView changes
  useEffect(() => {
    if (initialSubView) {
      setActiveSubView(initialSubView);
    }
  }, [initialSubView]);

  // Load real project controls data
  useEffect(() => {
    if (project?.id) {
      loadProjectData(project.id);
      
      // Initialize budget form
      setBudgetForm({
        target_budget: Number(project.target_budget || project.grand_total || 0),
        po_percent: Number(project.po_percent ?? 15),
        contingency_percent: Number(project.contingency_percent ?? 5),
        vat_percent: Number(project.vat_percent ?? 7.5),
        swamp_premium_percent: Number(project.swamp_premium_percent ?? 0),
        advance_payment_percent: Number(project.advance_payment_percent ?? 15),
        contractor: project.contractor || '',
        client_name: project.client_name || ''
      });
    }
  }, [project?.id]);

  const loadProjectData = async (projectId: string) => {
    try {
      setLoadingData(true);
      
      // 1. Variations
      const varRes = await safeFetchJson<{ variations: ProjectVariation[] }>(`/api/projects/${projectId}/variations`);
      if (varRes.ok && varRes.data?.variations) {
        setVariations(varRes.data.variations);
      } else {
        setVariations([]);
      }

      // 2. Valuations
      const valRes = await safeFetchJson<{ valuations: ProjectValuation[] }>(`/api/projects/${projectId}/valuations`);
      if (valRes.ok && valRes.data?.valuations) {
        setValuations(valRes.data.valuations);
      } else {
        setValuations([]);
      }

      // 3. Final Account
      const faRes = await safeFetchJson<{ finalAccount: ProjectFinalAccount }>(`/api/projects/${projectId}/final-account`);
      if (faRes.ok && faRes.data?.finalAccount) {
        setFinalAccount(faRes.data.finalAccount);
        setFinalAccountForm(faRes.data.finalAccount);
      }
    } catch (err: any) {
      console.error('Failed to load project controls data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Compute live variation totals from REAL project variations
  const approvedVariations = variations.filter(v => v.status === 'Approved');
  const approvedAdditions = approvedVariations
    .filter(v => v.type === 'addition')
    .reduce((sum, v) => sum + Math.abs(Number(v.amount || 0)), 0);
  const approvedOmissions = approvedVariations
    .filter(v => v.type === 'omission')
    .reduce((sum, v) => sum + Math.abs(Number(v.amount || 0)), 0);
  const totalVariationsNet = approvedAdditions - approvedOmissions;
  const revisedContractSum = contractSum + totalVariationsNet;

  // Compute valuations progress
  const latestValuation = valuations.length > 0 ? valuations[valuations.length - 1] : null;
  const certifiedToDate = valuations
    .filter(v => v.status === 'Certified' || v.status === 'Paid')
    .reduce((sum, v) => sum + Number(v.amount_due || 0), 0);
  const totalGrossWorkToDate = latestValuation ? Number(latestValuation.cumulative_value || 0) : 0;

  // -------------------------------------------------------------
  // VARIATION HANDLERS
  // -------------------------------------------------------------
  const openNewVariationModal = () => {
    setEditingVariation(null);
    const nextNum = `VO-${String(variations.length + 1).padStart(2, '0')}`;
    setVarForm({
      variation_number: nextNum,
      description: '',
      reason: '',
      section: BESMM4_SECTIONS[0],
      quantity: 1,
      unit: 'm²',
      rate: 0,
      type: 'addition',
      status: 'Approved'
    });
    setIsVariationModalOpen(true);
  };

  const openEditVariationModal = (v: ProjectVariation) => {
    setEditingVariation(v);
    setVarForm({
      variation_number: v.variation_number,
      description: v.description || '',
      reason: v.reason || '',
      section: v.section || BESMM4_SECTIONS[0],
      quantity: Number(v.quantity) || 1,
      unit: v.unit || 'm²',
      rate: Number(v.rate) || 0,
      type: v.type || 'addition',
      status: (v.status as any) || 'Approved'
    });
    setIsVariationModalOpen(true);
  };

  const handleSaveVariation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) return;
    if (!varForm.description.trim()) {
      alert('Please enter a description for the variation order.');
      return;
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const amount = Math.abs(Number(varForm.quantity) * Number(varForm.rate)) * (varForm.type === 'omission' ? -1 : 1);

      if (editingVariation) {
        // Update existing variation
        const { ok, error } = await safeFetchJson(`/api/projects/${project.id}/variations/${editingVariation.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            variation_number: varForm.variation_number,
            description: varForm.description,
            reason: varForm.reason,
            section: varForm.section,
            quantity: Number(varForm.quantity),
            unit: varForm.unit,
            rate: Number(varForm.rate),
            type: varForm.type,
            status: varForm.status
          })
        });
        if (ok) {
          showFeedback(`Variation order ${varForm.variation_number} updated.`);
          setIsVariationModalOpen(false);
          loadProjectData(project.id);
        } else {
          alert('Failed to update variation: ' + (error || 'Unknown error'));
        }
      } else {
        // Create new variation
        const { ok, data, error } = await safeFetchJson<{ variation: ProjectVariation }>(`/api/projects/${project.id}/variations`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            variation_number: varForm.variation_number,
            description: varForm.description,
            reason: varForm.reason,
            section: varForm.section,
            quantity: Number(varForm.quantity),
            unit: varForm.unit,
            rate: Number(varForm.rate),
            amount,
            type: varForm.type,
            status: varForm.status
          })
        });
        if (ok) {
          showFeedback(`Variation order ${varForm.variation_number} created successfully.`);
          setIsVariationModalOpen(false);
          loadProjectData(project.id);
        } else {
          alert('Failed to create variation: ' + (error || 'Unknown error'));
        }
      }
    } catch (err: any) {
      alert('Error saving variation: ' + err.message);
    }
  };

  const handleDeleteVariation = async (variationId: string, varNumber: string) => {
    if (!project?.id) return;
    if (!window.confirm(`Are you sure you want to delete variation ${varNumber}?`)) return;

    try {
      const { ok } = await safeFetchJson(`/api/projects/${project.id}/variations/${variationId}`, {
        method: 'DELETE'
      });
      if (ok) {
        showFeedback(`Variation ${varNumber} deleted.`);
        loadProjectData(project.id);
      } else {
        alert('Failed to delete variation.');
      }
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleUpdateVariationStatus = async (variationId: string, newStatus: string) => {
    if (!project?.id) return;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await safeFetchJson(`/api/projects/${project.id}/variations/${variationId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      showFeedback(`Status updated to ${newStatus}.`);
      loadProjectData(project.id);
    } catch (err: any) {
      alert('Status update failed: ' + err.message);
    }
  };

  // -------------------------------------------------------------
  // VALUATION HANDLERS
  // -------------------------------------------------------------
  const openNewValuationModal = () => {
    setEditingValuation(null);
    const nextIndex = valuations.length + 1;
    const nextNum = `IPC-${String(nextIndex).padStart(2, '0')}`;
    
    // Auto populate prior values
    const prevVal = latestValuation ? Number(latestValuation.cumulative_value || 0) : 0;
    const prevPaid = valuations.reduce((sum, v) => sum + Number(v.amount_due || 0), 0);

    setValForm({
      valuation_number: nextNum,
      valuation_date: new Date().toISOString().split('T')[0],
      description: `Progressive valuation for ${projectTitle}`,
      previous_valuation: prevVal,
      current_valuation: 0,
      retention_percent: 5.0,
      advance_payment_deduction: 0,
      previous_payments: prevPaid,
      status: 'Certified'
    });
    setIsValuationModalOpen(true);
  };

  const openEditValuationModal = (v: ProjectValuation) => {
    setEditingValuation(v);
    setValForm({
      valuation_number: v.valuation_number,
      valuation_date: v.valuation_date || new Date().toISOString().split('T')[0],
      description: v.description || '',
      previous_valuation: Number(v.previous_valuation || 0),
      current_valuation: Number(v.current_valuation || 0),
      retention_percent: Number(v.retention_percent ?? 5.0),
      advance_payment_deduction: Number(v.advance_payment_deduction || 0),
      previous_payments: Number(v.previous_payments || 0),
      status: (v.status as any) || 'Certified'
    });
    setIsValuationModalOpen(true);
  };

  const handleSaveValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) return;
    if (valForm.current_valuation <= 0 && !editingValuation) {
      alert('Please enter the current valuation amount of work executed.');
      return;
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      if (editingValuation) {
        // Update valuation
        const { ok, error } = await safeFetchJson(`/api/projects/${project.id}/valuations/${editingValuation.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(valForm)
        });
        if (ok) {
          showFeedback(`Valuation ${valForm.valuation_number} updated.`);
          setIsValuationModalOpen(false);
          loadProjectData(project.id);
        } else {
          alert('Failed to update valuation: ' + (error || 'Unknown error'));
        }
      } else {
        // Create valuation
        const { ok, error } = await safeFetchJson(`/api/projects/${project.id}/valuations`, {
          method: 'POST',
          headers,
          body: JSON.stringify(valForm)
        });
        if (ok) {
          showFeedback(`Valuation ${valForm.valuation_number} created successfully.`);
          setIsValuationModalOpen(false);
          loadProjectData(project.id);
        } else {
          alert('Failed to create valuation: ' + (error || 'Unknown error'));
        }
      }
    } catch (err: any) {
      alert('Error saving valuation: ' + err.message);
    }
  };

  const handleDeleteValuation = async (valuationId: string, valNum: string) => {
    if (!project?.id) return;
    if (!window.confirm(`Are you sure you want to delete valuation ${valNum}?`)) return;

    try {
      const { ok } = await safeFetchJson(`/api/projects/${project.id}/valuations/${valuationId}`, {
        method: 'DELETE'
      });
      if (ok) {
        showFeedback(`Valuation ${valNum} deleted.`);
        loadProjectData(project.id);
      } else {
        alert('Failed to delete valuation.');
      }
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  // -------------------------------------------------------------
  // CERTIFICATE PREPARATION
  // -------------------------------------------------------------
  const prepareCertificate = (type: CertificateType, val?: ProjectValuation) => {
    setSelectedCertType(type);

    const sourceVal = val || latestValuation;
    const grossVal = sourceVal ? Number(sourceVal.cumulative_value || sourceVal.current_valuation || 0) : contractSum * 0.3;
    const retPct = sourceVal ? Number(sourceVal.retention_percent ?? 5.0) : 5.0;
    const retAmt = grossVal * (retPct / 100);
    const advDed = sourceVal ? Number(sourceVal.advance_payment_deduction || 0) : 0;
    const prevPaid = sourceVal ? Number(sourceVal.previous_payments || 0) : 0;
    const netDue = sourceVal ? Number(sourceVal.amount_due || 0) : Math.max(0, grossVal - retAmt - advDed - prevPaid);

    setCertData({
      certNumber: sourceVal ? sourceVal.valuation_number : 'IPC-01',
      issueDate: sourceVal ? sourceVal.valuation_date : new Date().toISOString().split('T')[0],
      clientName: project?.client_name || clientName,
      contractorName: project?.contractor || contractor,
      projectTitle: project?.title || projectTitle,
      contractSum,
      grossValuation: grossVal,
      retentionPct: retPct,
      retentionAmount: retAmt,
      advanceDeduction: advDed,
      previousPayments: prevPaid,
      netAmountCertified: netDue,
      qsName: 'QS Isaac Emmanuel FNIQS, RQS',
      qsRegNo: 'NIQS-RQS-4819'
    });

    setIsCertViewerOpen(true);
  };

  // -------------------------------------------------------------
  // BUDGET SAVE
  // -------------------------------------------------------------
  const handleSaveBudget = async () => {
    if (!project?.id || !onEditProject) return;
    try {
      await onEditProject({
        id: project.id,
        target_budget: Number(budgetForm.target_budget),
        po_percent: Number(budgetForm.po_percent),
        contingency_percent: Number(budgetForm.contingency_percent),
        vat_percent: Number(budgetForm.vat_percent),
        swamp_premium_percent: Number(budgetForm.swamp_premium_percent),
        advance_payment_percent: Number(budgetForm.advance_payment_percent),
        contractor: budgetForm.contractor,
        client_name: budgetForm.client_name
      });
      setIsEditingBudget(false);
      showFeedback('Project budget parameters saved successfully.');
    } catch (err: any) {
      alert('Failed to save budget: ' + err.message);
    }
  };

  // -------------------------------------------------------------
  // FINAL ACCOUNT RECALCULATE & SAVE
  // -------------------------------------------------------------
  const handleRecalculateFinalAccount = async () => {
    if (!project?.id) return;
    try {
      setLoadingData(true);
      const { ok, data } = await safeFetchJson<{ finalAccount: ProjectFinalAccount }>(`/api/projects/${project.id}/final-account/recalculate`, {
        method: 'POST'
      });
      if (ok && data?.finalAccount) {
        setFinalAccount(data.finalAccount);
        setFinalAccountForm(data.finalAccount);
        showFeedback('Final account statement recalculated from contract sum, variations, and valuations.');
      } else {
        alert('Recalculate failed.');
      }
    } catch (err: any) {
      alert('Recalculate error: ' + err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSaveFinalAccount = async () => {
    if (!project?.id || !finalAccountForm) return;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const { ok, data } = await safeFetchJson<{ finalAccount: ProjectFinalAccount }>(`/api/projects/${project.id}/final-account`, {
        method: 'POST',
        headers,
        body: JSON.stringify(finalAccountForm)
      });
      if (ok && data?.finalAccount) {
        setFinalAccount(data.finalAccount);
        setIsEditingFinalAccount(false);
        showFeedback('Final account statement saved successfully.');
      } else {
        alert('Failed to save final account statement.');
      }
    } catch (err: any) {
      alert('Error saving final account: ' + err.message);
    }
  };

  // Calculate live modal fields
  const modalValGross = Number(valForm.previous_valuation || 0) + Number(valForm.current_valuation || 0);
  const modalValRetention = modalValGross * (Number(valForm.retention_percent || 0) / 100);
  const modalValDue = Math.max(0, modalValGross - modalValRetention - Number(valForm.advance_payment_deduction || 0) - Number(valForm.previous_payments || 0));

  return (
    <div id="project-controls-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-md animate-in fade-in duration-200 ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-800 text-white' 
            : 'bg-rose-700 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-white/80 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Project Cost Controls &amp; Contract Administration
            </h1>
            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
              title="How does Project Control work?"
            >
              <HelpCircle className="w-4 h-4 text-emerald-700" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time quantity surveying controls: Interim Contractor Valuations (IPC), Variation Orders, Official NIQS Certificates, and Final Account Reconciliation.
          </p>
        </div>

        {/* Project Switcher and Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {projects.length > 0 && onSelectProject && (
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-semibold">Active:</span>
              <select
                value={project?.id || ''}
                onChange={(e) => onSelectProject(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 shadow-2xs"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {onNewProject && (
            <button
              type="button"
              onClick={onNewProject}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold flex items-center space-x-1 transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          )}

          {project && onDeleteProject && (
            <button
              type="button"
              onClick={() => onDeleteProject(project.id, project.title)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              title="Delete Project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* EDUCATIONAL QS ACCORDION: How it works */}
      {showExplanation && (
        <div className="p-5 bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl shadow-md space-y-3 animate-in fade-in duration-200 text-xs">
          <div className="flex items-start justify-between border-b border-emerald-700/60 pb-2.5">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <h3 className="font-extrabold text-sm text-white">
                How Quantity Surveying Project Controls Work in Practice
              </h3>
            </div>
            <button
              onClick={() => setShowExplanation(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-[11px] leading-relaxed text-slate-200 pt-1">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
              <span className="font-bold text-amber-300 block text-xs">1. Variation Orders (VO)</span>
              <p>
                Any addition, omission, or change to the contract scope (architect&apos;s site instruction, foundation soil adjustment, finish upgrades). Approved additions increase the contract sum, while omissions decrease it.
              </p>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
              <span className="font-bold text-emerald-300 block text-xs">2. Interim Valuations (IPC)</span>
              <p>
                Monthly measurements of physical works completed on site. The RQS deducts standard 5% retention and recovers the advance payment. The resulting net balance is certified for payment.
              </p>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
              <span className="font-bold text-cyan-300 block text-xs">3. Payment Certificates</span>
              <p>
                Official contractual documents issued to the Employer (Client) mandating payment to the Contractor within the contractual honor period (typically 14–21 days).
              </p>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
              <span className="font-bold text-purple-300 block text-xs">4. Final Account</span>
              <p>
                The ultimate financial settlement at project completion. Aggregates original contract sum, net approved variations, fluctuation claims, release of retention, and sets final balance due.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contract Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Original Contract Sum</span>
          <div className="text-lg font-extrabold text-slate-900 mt-0.5">{formatNaira(contractSum)}</div>
          <span className="text-[10px] text-slate-500">From verified BOQ</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved Net Variations</span>
          <div className={`text-lg font-extrabold mt-0.5 ${totalVariationsNet >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
            {totalVariationsNet >= 0 ? `+${formatNaira(totalVariationsNet)}` : `-${formatNaira(Math.abs(totalVariationsNet))}`}
          </div>
          <span className="text-[10px] text-slate-500">{approvedVariations.length} Approved / {variations.length} Logged</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Revised Contract Sum</span>
          <div className="text-lg font-extrabold text-slate-900 mt-0.5">{formatNaira(revisedContractSum)}</div>
          <span className="text-[10px] text-slate-500">Anticipated final account</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Certified to Date</span>
          <div className="text-lg font-extrabold text-teal-800 mt-0.5">{formatNaira(certifiedToDate)}</div>
          <span className="text-[10px] text-emerald-700 font-semibold">{valuations.length} Valuations logged</span>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'budget', label: 'Project Budget', icon: DollarSign },
            { id: 'variations', label: `Variations (${variations.length})`, icon: SlidersHorizontal },
            { id: 'valuations', label: `Valuations (${valuations.length})`, icon: Receipt },
            { id: 'certificates', label: 'Payment Certificates', icon: FileCheck2 },
            { id: 'final-account', label: 'Final Account', icon: Award },
            { id: 'payments', label: 'Payments', icon: TrendingUp },
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

      {/* ========================================================================= */}
      {/* TAB 1: PROJECT BUDGET */}
      {/* ========================================================================= */}
      {activeSubView === 'budget' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Project Master Cost Budget</h3>
              <p className="text-xs text-slate-500">
                Baseline contract breakdown across direct trade works, preliminaries, contingency reserves, and statutory tax obligations.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {isEditingBudget ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditingBudget(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBudget}
                    className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Budget</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingBudget(true)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Budget Parameters</span>
                </button>
              )}
            </div>
          </div>

          {/* Budget Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Direct Trade Works (Subtotal)</span>
              <span className="text-lg font-extrabold text-slate-900 mt-1 block">
                {formatNaira(project?.subtotal || contractSum * 0.75)}
              </span>
              <span className="text-[11px] text-slate-500">Measured BOQ line items</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block uppercase font-bold text-[10px]">
                Preliminaries &amp; Overheads ({project?.po_percent ?? 15}%)
              </span>
              <span className="text-lg font-extrabold text-slate-900 mt-1 block">
                {formatNaira(project?.po_amount || contractSum * 0.15)}
              </span>
              <span className="text-[11px] text-slate-500">Site management, safety, plant &amp; insurance</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block uppercase font-bold text-[10px]">
                Contingency ({project?.contingency_percent ?? 5}%) &amp; VAT ({project?.vat_percent ?? 7.5}%)
              </span>
              <span className="text-lg font-extrabold text-slate-900 mt-1 block">
                {formatNaira(contractSum - (project?.subtotal || contractSum * 0.75) - (project?.po_amount || contractSum * 0.15))}
              </span>
              <span className="text-[11px] text-slate-500">Statutory taxes &amp; unallocated reserves</span>
            </div>
          </div>

          {/* Edit Budget Form when active */}
          {isEditingBudget ? (
            <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-4 text-xs animate-in fade-in duration-150">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                <Edit3 className="w-4 h-4 text-emerald-700" />
                <span>Adjust Project Financial Parameters</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Budget (₦ Baseline)</label>
                  <input
                    type="number"
                    value={budgetForm.target_budget}
                    onChange={(e) => setBudgetForm({ ...budgetForm, target_budget: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Preliminaries &amp; Overheads (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={budgetForm.po_percent}
                    onChange={(e) => setBudgetForm({ ...budgetForm, po_percent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Contingency Allowance (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={budgetForm.contingency_percent}
                    onChange={(e) => setBudgetForm({ ...budgetForm, contingency_percent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Statutory VAT (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={budgetForm.vat_percent}
                    onChange={(e) => setBudgetForm({ ...budgetForm, vat_percent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Advance Payment Recovery (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={budgetForm.advance_payment_percent}
                    onChange={(e) => setBudgetForm({ ...budgetForm, advance_payment_percent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Swamp / Terrain Premium (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={budgetForm.swamp_premium_percent}
                    onChange={(e) => setBudgetForm({ ...budgetForm, swamp_premium_percent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Main Contractor Name</label>
                  <input
                    type="text"
                    value={budgetForm.contractor}
                    onChange={(e) => setBudgetForm({ ...budgetForm, contractor: e.target.value })}
                    placeholder="e.g. Cappa & D'Alberto Plc / Julius Berger"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Client / Employer Name</label>
                  <input
                    type="text"
                    value={budgetForm.client_name}
                    onChange={(e) => setBudgetForm({ ...budgetForm, client_name: e.target.value })}
                    placeholder="e.g. Lagos State Ministry of Works"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Trade breakdown based on BESMM4 sections */}
          <div className="pt-2">
            <TradeBudgetTable
              contractSum={contractSum}
              subtotal={contractSum * 0.75}
              tradeBudgets={tradeBudgets}
              onChange={setTradeBudgets}
              onSave={async () => {
                showFeedback('Trade section budget allocations updated.');
              }}
              boqItems={project?.items}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VARIATIONS (ADDITIONS & OMISSIONS) */}
      {/* ========================================================================= */}
      {activeSubView === 'variations' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Variation Orders (VO)</h3>
              <p className="text-xs text-slate-500">
                Log and certify architectural site instructions, client additions, and structural omissions affecting the contract sum.
              </p>
            </div>
            <button
              type="button"
              onClick={openNewVariationModal}
              className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold inline-flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue Variation Order</span>
            </button>
          </div>

          {/* Variations Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-emerald-800 font-bold block text-[10px] uppercase">Approved Additions (+)</span>
              <span className="text-base font-extrabold text-emerald-900 mt-0.5 block">+{formatNaira(approvedAdditions)}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
              <span className="text-rose-800 font-bold block text-[10px] uppercase">Approved Omissions (-)</span>
              <span className="text-base font-extrabold text-rose-900 mt-0.5 block">-{formatNaira(approvedOmissions)}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-600 font-bold block text-[10px] uppercase">Net Variation Balance</span>
              <span className={`text-base font-extrabold mt-0.5 block ${totalVariationsNet >= 0 ? 'text-emerald-900' : 'text-rose-700'}`}>
                {totalVariationsNet >= 0 ? `+${formatNaira(totalVariationsNet)}` : `-${formatNaira(Math.abs(totalVariationsNet))}`}
              </span>
            </div>
          </div>

          {/* Variations List */}
          {variations.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
              <SlidersHorizontal className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Variation Orders Logged Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No variations have been issued for this project. When client alterations, site instructions, or design omissions occur, click &quot;Issue Variation Order&quot; to log them.
              </p>
              <button
                type="button"
                onClick={openNewVariationModal}
                className="mt-3 px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue First Variation</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {variations.map((v) => {
                const isAddition = (v.type || 'addition') === 'addition';
                const amount = Math.abs(Number(v.amount || 0));
                return (
                  <div 
                    key={v.id} 
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-md">
                          {v.variation_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          v.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                          v.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {v.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isAddition ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {isAddition ? '+ Addition' : '- Omission'}
                        </span>
                        <span className="text-slate-400 text-[10px]">&bull; {v.section || 'General'}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{v.description}</h4>
                      {v.reason && <p className="text-slate-500 text-[11px]">{v.reason}</p>}
                      <div className="text-[11px] text-slate-400">
                        {v.quantity} {v.unit} @ {formatNaira(Number(v.rate || 0))} per {v.unit}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0 sm:self-center">
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Net Financial Value</span>
                        <span className={`text-base font-extrabold font-mono ${isAddition ? 'text-emerald-800' : 'text-rose-700'}`}>
                          {isAddition ? `+${formatNaira(amount)}` : `-${formatNaira(amount)}`}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1 pl-2 border-l border-slate-100">
                        <button
                          type="button"
                          onClick={() => openEditVariationModal(v)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                          title="Edit Variation"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVariation(v.id, v.variation_number)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Variation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VALUATIONS (PROGRESSIVE CONTRACTOR VALUATIONS) */}
      {/* ========================================================================= */}
      {activeSubView === 'valuations' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Interim Contractor Valuations</h3>
              <p className="text-xs text-slate-500">
                Progressive measurements certified by the Quantity Surveyor, tracking retention, advance payments, and net amounts due.
              </p>
            </div>
            <button
              type="button"
              onClick={openNewValuationModal}
              className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold inline-flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Interim Valuation</span>
            </button>
          </div>

          {valuations.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
              <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Interim Valuations Recorded Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No progressive contractor valuations have been logged. When the contractor submits a monthly valuation claim, click &quot;New Interim Valuation&quot; to measure and certify.
              </p>
              <button
                type="button"
                onClick={openNewValuationModal}
                className="mt-3 px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Valuation 01</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">Valuation Ref</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Cumulative Work</th>
                    <th className="p-3 text-right">Retention (5%)</th>
                    <th className="p-3 text-right">Advance Recovery</th>
                    <th className="p-3 text-right">Net Certified Due</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {valuations.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900 font-mono">{v.valuation_number}</td>
                      <td className="p-3 text-slate-600">{v.valuation_date}</td>
                      <td className="p-3 text-right font-semibold text-slate-800">{formatNaira(Number(v.cumulative_value || 0))}</td>
                      <td className="p-3 text-right text-rose-600">-{formatNaira(Number(v.retention_amount || 0))}</td>
                      <td className="p-3 text-right text-amber-700">-{formatNaira(Number(v.advance_payment_deduction || 0))}</td>
                      <td className="p-3 text-right font-extrabold text-emerald-800 font-mono">{formatNaira(Number(v.amount_due || 0))}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          v.status === 'Certified' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => prepareCertificate('interim_payment_certificate', v)}
                            className="p-1 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                            title="Generate Official IPC"
                          >
                            <FileCheck2 className="w-4 h-4 text-emerald-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditValuationModal(v)}
                            className="p-1 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                            title="Edit Valuation"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteValuation(v.id, v.valuation_number)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Valuation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PAYMENT CERTIFICATES (OFFICIAL NIQS FORMS) */}
      {/* ========================================================================= */}
      {activeSubView === 'certificates' && (
        <CertificateEditorSheet
          certData={certData}
          onChange={(newCert) => setCertData(newCert)}
          valuations={valuations}
          selectedCertType={selectedCertType}
          onSelectCertType={(t) => prepareCertificate(t)}
          onSelectValuationSource={(val) => {
            if (val) {
              setCertData(prev => ({
                ...prev,
                grossValuation: Number(val.cumulative_value || val.current_valuation || 0),
                retentionAmount: Number(val.retention_amount || 0),
                advanceDeduction: Number(val.advance_payment_deduction || 0),
                previousPayments: Number(val.previous_payments || 0),
                netAmountCertified: Number(val.amount_due || 0)
              }));
            }
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 5: FINAL ACCOUNT & CLOSEOUT */}
      {/* ========================================================================= */}
      {activeSubView === 'final-account' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <FinalAccountSheet
            finalAccount={finalAccount}
            contractSum={contractSum}
            totalVariationsNet={totalVariationsNet}
            certifiedToDate={certifiedToDate}
            projectTitle={projectTitle}
            clientName={clientName}
            contractorName={contractor}
            onSave={async (data) => {
              if (!project?.id) return;
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              if (token) headers['Authorization'] = `Bearer ${token}`;

              const { ok, data: resData } = await safeFetchJson<{ finalAccount: ProjectFinalAccount }>(`/api/projects/${project.id}/final-account`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
              });
              if (ok && resData?.finalAccount) {
                setFinalAccount(resData.finalAccount);
                showFeedback('Final account statement saved successfully.');
              } else {
                throw new Error('Failed to save final account statement.');
              }
            }}
            onRecalculate={handleRecalculateFinalAccount}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: PAYMENTS & DISBURSEMENTS */}
      {/* ========================================================================= */}
      {activeSubView === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Payment Disbursements &amp; Bank Transfers</h3>
              <p className="text-xs text-slate-500">Reconciliation of certified contractor amounts against bank disbursements.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-900 text-xs border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="font-bold block">Certified vs Disbursed Reconciliation:</span>
              <span className="text-emerald-800 mt-0.5 block">
                Total Certified to Date: {formatNaira(certifiedToDate)} across {valuations.length} valuation certificates.
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-200/80 text-emerald-900 font-extrabold">
              {valuations.every(v => v.status === 'Paid') ? 'All Certified Accounts Settled' : 'Active Payment Cycle'}
            </span>
          </div>

          {valuations.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-700">Valuation Payment Register</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Certified Date</th>
                      <th className="p-3 text-right">Amount Due</th>
                      <th className="p-3 text-center">Settlement Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {valuations.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold font-mono text-slate-900">{v.valuation_number}</td>
                        <td className="p-3 text-slate-600">{v.valuation_date}</td>
                        <td className="p-3 text-right font-extrabold text-emerald-800 font-mono">{formatNaira(Number(v.amount_due || 0))}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            v.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {v.status === 'Paid' ? 'Disbursed / Paid' : 'Pending Client Mandate'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const newStatus = v.status === 'Paid' ? 'Certified' : 'Paid';
                              handleSaveValuation({
                                preventDefault: () => {}
                              } as any);
                            }}
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
                          >
                            Toggle Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT VARIATION ORDER */}
      {/* ========================================================================= */}
      {isVariationModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setIsVariationModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingVariation ? `Edit Variation Order: ${varForm.variation_number}` : 'Issue New Variation Order'}
                </h3>
              </div>
              <button onClick={() => setIsVariationModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVariation} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Variation Ref No.</label>
                  <input
                    type="text"
                    required
                    value={varForm.variation_number}
                    onChange={(e) => setVarForm({ ...varForm, variation_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Variation Type</label>
                  <select
                    value={varForm.type}
                    onChange={(e) => setVarForm({ ...varForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  >
                    <option value="addition">+ Addition (Extra Work)</option>
                    <option value="omission">- Omission (Deduction)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Trade Section</label>
                <select
                  value={varForm.section}
                  onChange={(e) => setVarForm({ ...varForm, section: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                >
                  {BESMM4_SECTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description of Variation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Substitute standard hollow sandcrete blocks with solid vibrated blocks in foundation"
                  value={varForm.description}
                  onChange={(e) => setVarForm({ ...varForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason / Site Instruction Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Architect Site Instruction (ASI No. 04) due to soil test report"
                  value={varForm.reason}
                  onChange={(e) => setVarForm({ ...varForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={varForm.quantity}
                    onChange={(e) => setVarForm({ ...varForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="m², m³, nr, sum"
                    value={varForm.unit}
                    onChange={(e) => setVarForm({ ...varForm, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Unit Rate (₦)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={varForm.rate}
                    onChange={(e) => setVarForm({ ...varForm, rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Approval Status</label>
                  <select
                    value={varForm.status}
                    onChange={(e) => setVarForm({ ...varForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  >
                    <option value="Approved">Approved (Applied to Contract)</option>
                    <option value="Submitted">Submitted (Under Review)</option>
                    <option value="Draft">Draft</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="text-right">
                  <span className="block text-slate-400 font-bold text-[10px] uppercase">Net Amount</span>
                  <span className={`text-base font-extrabold font-mono mt-1 block ${varForm.type === 'addition' ? 'text-emerald-800' : 'text-rose-700'}`}>
                    {varForm.type === 'addition' ? '+' : '-'}{formatNaira(Number(varForm.quantity || 0) * Number(varForm.rate || 0))}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsVariationModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingVariation ? 'Save Changes' : 'Issue Variation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT VALUATION (IPC) */}
      {/* ========================================================================= */}
      {isValuationModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setIsValuationModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 my-8 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingValuation ? `Edit Interim Valuation: ${valForm.valuation_number}` : 'Record Interim Contractor Valuation'}
                </h3>
              </div>
              <button onClick={() => setIsValuationModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveValuation} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Valuation Ref (IPC No.)</label>
                  <input
                    type="text"
                    required
                    value={valForm.valuation_number}
                    onChange={(e) => setValForm({ ...valForm, valuation_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Valuation Date</label>
                  <input
                    type="date"
                    required
                    value={valForm.valuation_date}
                    onChange={(e) => setValForm({ ...valForm, valuation_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Valuation Description / Work Period</label>
                <input
                  type="text"
                  value={valForm.description}
                  onChange={(e) => setValForm({ ...valForm, description: e.target.value })}
                  placeholder="e.g. Interim valuation for superstructure framing and first floor slab"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Previous Work Valuation (₦)</label>
                  <input
                    type="number"
                    min="0"
                    value={valForm.previous_valuation}
                    onChange={(e) => setValForm({ ...valForm, previous_valuation: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">This Period Valuation (₦ Current)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={valForm.current_valuation}
                    onChange={(e) => setValForm({ ...valForm, current_valuation: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border-2 border-emerald-600 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Retention (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={valForm.retention_percent}
                    onChange={(e) => setValForm({ ...valForm, retention_percent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Advance Deduct (₦)</label>
                  <input
                    type="number"
                    min="0"
                    value={valForm.advance_payment_deduction}
                    onChange={(e) => setValForm({ ...valForm, advance_payment_deduction: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Previous Paid (₦)</label>
                  <input
                    type="number"
                    min="0"
                    value={valForm.previous_payments}
                    onChange={(e) => setValForm({ ...valForm, previous_payments: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Live calculation banner */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span>Gross Cumulative Work:</span>
                  <span className="font-bold font-mono">{formatNaira(modalValGross)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Less Retention ({valForm.retention_percent}%):</span>
                  <span className="font-bold font-mono">-{formatNaira(modalValRetention)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-emerald-900 pt-1 border-t border-slate-200">
                  <span>Calculated Net Amount Due:</span>
                  <span className="text-sm font-mono">{formatNaira(modalValDue)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Valuation Status</label>
                  <select
                    value={valForm.status}
                    onChange={(e) => setValForm({ ...valForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  >
                    <option value="Certified">Certified (Ready for Payment)</option>
                    <option value="Paid">Paid / Honoured by Client</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsValuationModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingValuation ? 'Save Changes' : 'Save Valuation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ControlsExplainerModal
        isOpen={showExplanation}
        onClose={() => setShowExplanation(false)}
      />

    </div>
  );
};

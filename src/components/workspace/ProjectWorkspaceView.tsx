import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  User, 
  Briefcase, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Sparkles, 
  FileSpreadsheet, 
  Calculator, 
  Receipt, 
  Upload, 
  Files, 
  SlidersHorizontal, 
  History, 
  ExternalLink,
  ShieldCheck,
  Download,
  AlertCircle,
  FileCheck2,
  FolderKanban,
  ChevronRight,
  Folder,
  FileText,
  Search,
  Filter,
  Eye,
  Trash2,
  ArrowLeft,
  DollarSign,
  Ruler,
  Layers,
  Scale,
  RotateCcw,
  Pencil,
  Edit3
} from 'lucide-react';
import { Project, ProjectWorkspaceTab, BoqItem, ProjectQuestionnaire } from '../../types';
import { formatNaira, formatNumber, calculateBoqTotals } from '../../utils/format';
import { generateDeterministicBoq, normalizeQuestionnaire } from '../../utils/constructionKnowledgeBase';
import { DEFAULT_QUESTIONNAIRE } from '../ProjectQuestionnaireModal';
import { BoqTable } from '../BoqTable';
import { ProjectControlsView } from '../controls/ProjectControlsView';
import { CalculatorsHubView } from '../calculators/CalculatorsHubView';
import { DrawingUploader } from '../DrawingUploader';
import { ManualTakeoffWorkspace } from '../estimating/ManualTakeoffWorkspace';
import { ProjectEditModal } from '../projects/ProjectEditModal';
import { DeleteProjectModal } from '../projects/DeleteProjectModal';

interface ProjectWorkspaceViewProps {
  project: Project;
  initialTab?: ProjectWorkspaceTab;
  onUpdateProject: (updated: Partial<Project>) => void;
  onEditProject?: (updated: Partial<Project>) => Promise<void> | void;
  onDeleteProject?: (projectId: string, title: string) => Promise<void> | void;
  onUpdateBoqItem: (index: number, field: keyof BoqItem, value: any) => void;
  onAddBoqItem: (item?: Partial<BoqItem>) => void;
  onDeleteBoqItem: (index: number) => void;
  onApplyMarketRates: () => void;
  onOpenAiTakeoff: () => void;
  onOpenRateLibrary: () => void;
  onOpenQuestionnaire: () => void;
  onExportExcel: () => void;
  onExportPdf?: () => void;
  onOpenDossier: () => void;
  onBackToProjects?: () => void;
  onOpenVersionsModal?: () => void;
  onOpenAuditDrawer?: () => void;
  onTakeoffSuccess?: (items: any[], filename: string, provider: string, summary?: string) => void;
  onImportBoq?: () => void;
}

// 14 Standard BESMM4 / QS Document Categories
const DOCUMENT_CATEGORIES = [
  { id: 'Architectural', label: 'Architectural', description: 'Plans, elevations, sections & 3D models' },
  { id: 'Structural', label: 'Structural', description: 'BBS, framing plans, foundation details' },
  { id: 'Electrical', label: 'Electrical', description: 'Conduit runs, distribution boards, load schedules' },
  { id: 'Mechanical', label: 'Mechanical', description: 'HVAC, ducting, fire suppression & lifts' },
  { id: 'Plumbing', label: 'Plumbing', description: 'Water supply, drainage, inspection chambers' },
  { id: 'Specifications', label: 'Specifications', description: 'Materials, workmanship & NBS/BESMM standards' },
  { id: 'Schedules', label: 'Schedules', description: 'Doors, windows, ironmongery & finishes' },
  { id: 'Contracts', label: 'Contracts', description: 'Conditions of contract, award letter, bonds' },
  { id: 'BOQs', label: 'BOQs', description: 'Unpriced bills, tender submittals, priced bills' },
  { id: 'Estimates', label: 'Estimates', description: 'Preliminary estimates, elemental cost plans' },
  { id: 'Valuations', label: 'Valuations', description: 'Interim measurement sheets & joint records' },
  { id: 'Certificates', label: 'Certificates', description: 'IPCs, practical completion, final certificate' },
  { id: 'Reports', label: 'Reports', description: 'Soil investigation, site progress, cost audits' },
  { id: 'Supporting Documents', label: 'Supporting Documents', description: 'Site photos, correspondence, addenda' },
];

export const ProjectWorkspaceView: React.FC<ProjectWorkspaceViewProps> = ({
  project,
  initialTab,
  onUpdateProject,
  onEditProject,
  onDeleteProject,
  onUpdateBoqItem,
  onAddBoqItem,
  onDeleteBoqItem,
  onApplyMarketRates,
  onOpenAiTakeoff,
  onOpenRateLibrary,
  onOpenQuestionnaire,
  onExportExcel,
  onExportPdf,
  onOpenDossier,
  onBackToProjects,
  onOpenVersionsModal,
  onOpenAuditDrawer,
  onTakeoffSuccess,
  onImportBoq,
}) => {
  const [activeTab, setActiveTab] = useState<ProjectWorkspaceTab>(initialTab || 'overview');
  const [takeoffEngine, setTakeoffEngine] = useState<'manual' | 'ai'>('manual');
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(true);
  const [selectedDocCategory, setSelectedDocCategory] = useState<string | null>(null);
  const [docSearchQuery, setDocSearchQuery] = useState<string>('');
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [isDeletingModalOpen, setIsDeletingModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(project.title);

  useEffect(() => {
    setTempTitle(project.title);
  }, [project.title]);

  const handleSaveTitle = async () => {
    const trimmed = tempTitle.trim();
    if (!trimmed || trimmed === project.title) {
      setIsEditingTitle(false);
      return;
    }
    setIsEditingTitle(false);
    onUpdateProject({ title: trimmed });
    if (onEditProject) {
      await onEditProject({ id: project.id, title: trimmed });
    }
    try {
      await fetch(`/api/projects/${project.id}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed })
      });
    } catch (e) {
      console.error('Failed to rename project:', e);
    }
  };

  // Synchronize when initialTab changes (e.g. from Sidebar navigation)
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Local state for questionnaire editing inside tab
  const [localQuestionnaire, setLocalQuestionnaire] = useState<ProjectQuestionnaire>(() => {
    return normalizeQuestionnaire({
      ...(project.questionnaire || {}),
      general: {
        ...(project.questionnaire?.general || {}),
        buildingType: project.questionnaire?.general?.buildingType || ((project.number_of_floors || 1) > 1 ? '2-storey building' : 'Bungalow'),
        numberOfFloors: project.questionnaire?.general?.numberOfFloors || project.number_of_floors || 1,
        approximateGFA: project.questionnaire?.general?.approximateGFA || project.gfa || 250,
        location: project.questionnaire?.general?.location || project.location || 'Lagos',
        terrain: project.questionnaire?.general?.terrain || ((project.swamp_premium_percent && project.swamp_premium_percent > 0) ? 'Swamp' : 'Normal'),
      },
      substructure: {
        ...(project.questionnaire?.substructure || {}),
        foundationType: project.questionnaire?.substructure?.foundationType || ((project.swamp_premium_percent && project.swamp_premium_percent > 0) ? 'Raft foundation' : 'Strip foundation'),
      },
    });
  });

  // Keep localQuestionnaire updated whenever project changes or loads
  useEffect(() => {
    setLocalQuestionnaire(normalizeQuestionnaire({
      ...(project.questionnaire || {}),
      general: {
        ...(project.questionnaire?.general || {}),
        buildingType: project.questionnaire?.general?.buildingType || ((project.number_of_floors || 1) > 1 ? '2-storey building' : 'Bungalow'),
        numberOfFloors: project.questionnaire?.general?.numberOfFloors || project.number_of_floors || 1,
        approximateGFA: project.questionnaire?.general?.approximateGFA || project.gfa || 250,
        location: project.questionnaire?.general?.location || project.location || 'Lagos',
        terrain: project.questionnaire?.general?.terrain || ((project.swamp_premium_percent && project.swamp_premium_percent > 0) ? 'Swamp' : 'Normal'),
      },
      substructure: {
        ...(project.questionnaire?.substructure || {}),
        foundationType: project.questionnaire?.substructure?.foundationType || ((project.swamp_premium_percent && project.swamp_premium_percent > 0) ? 'Raft foundation' : 'Strip foundation'),
      },
    }));
  }, [project.id, project.questionnaire, project.number_of_floors, project.gfa, project.location, project.swamp_premium_percent]);

  const [uploadedDocs, setUploadedDocs] = useState<Array<{ id: string; category: string; title: string; filename: string; size: string; date: string }>>([
    { id: '1', category: 'Architectural', title: 'Ground & First Floor Architectural Drawings (Rev C)', filename: 'Arch_Drawings_RevC.pdf', size: '12.4 MB', date: 'Yesterday' },
    { id: '2', category: 'Architectural', title: 'Door and Window Elevations & Section Details', filename: 'Window_Door_Schedules.pdf', size: '3.1 MB', date: '3 days ago' },
    { id: '3', category: 'Architectural', title: 'Roof Framing Layout & Drainage Falls', filename: 'Roof_Plan.pdf', size: '4.8 MB', date: '5 days ago' },
    { id: '4', category: 'Structural', title: 'Foundation Footing & Ground Beam Details', filename: 'Ground_Beam_BBS.pdf', size: '8.2 MB', date: '2 days ago' },
    { id: '5', category: 'Structural', title: 'First Floor Slab Reinforcement & Column Schedule', filename: 'Slab_Column_Schedule.dwg', size: '14.5 MB', date: '4 days ago' },
    { id: '6', category: 'Electrical', title: 'Lighting, Power Points & Distribution Schematics', filename: 'Electrical_Services_RevB.pdf', size: '2.9 MB', date: '1 week ago' },
    { id: '7', category: 'Mechanical', title: 'HVAC & Mechanical Ventilation Schematics', filename: 'HVAC_Layout.pdf', size: '5.2 MB', date: '1 week ago' },
    { id: '8', category: 'Plumbing', title: 'Potable Water Reticulation & Soil Waste Pipework', filename: 'Plumbing_Sanitary_Plan.pdf', size: '3.7 MB', date: '1 week ago' },
    { id: '9', category: 'Specifications', title: 'General Specifications of Materials and Workmanship', filename: 'BESMM4_Materials_Spec.pdf', size: '6.4 MB', date: '2 weeks ago' },
    { id: '10', category: 'Contracts', title: 'JCT / Standard Form of Building Contract 2026', filename: 'Building_Contract_Signed.pdf', size: '4.1 MB', date: '3 weeks ago' },
    { id: '11', category: 'BOQs', title: 'Approved Official Tender Bill of Quantities (Priced)', filename: 'Approved_Tender_BOQ.xlsx', size: '1.2 MB', date: 'Yesterday' },
    { id: '12', category: 'Valuations', title: 'Interim Valuation No. 02 Joint Measurement Sheet', filename: 'Valuation_02_Joint_Sheet.pdf', size: '2.5 MB', date: '2 hours ago' },
    { id: '13', category: 'Certificates', title: 'Interim Payment Certificate IPC-002 Certified', filename: 'IPC_002_Certified.pdf', size: '820 KB', date: '2 hours ago' },
    { id: '14', category: 'Reports', title: 'Geotechnical Soil Investigation & Borehole Logs', filename: 'Soil_Report_Borehole.pdf', size: '9.8 MB', date: '1 month ago' },
  ]);

  const progress = project.status === 'Approved' ? 100 : project.status === 'Submitted' ? 75 : project.status === 'In Progress' ? 50 : 25;

  // Simplified Navigation per Priority #5: Project → Drawings → Takeoff → BOQ → Rates → Reports
  const primaryTabs: Array<{ id: ProjectWorkspaceTab; label: string; icon: any; badge?: number }> = [
    { id: 'overview', label: 'Project', icon: Building2 },
    { id: 'drawings', label: 'Drawings', icon: Upload, badge: project.drawings?.length || (project.drawing_filename ? 1 : 0) },
    { id: 'takeoff', label: 'Takeoff', icon: Ruler, badge: (project.manual_measurements || []).length },
    { id: 'boq', label: 'BOQ', icon: FileSpreadsheet, badge: (project.items || []).length },
    { id: 'rates', label: 'Rates', icon: Calculator },
    { id: 'summary', label: 'Reports', icon: Files },
  ];

  // Secondary & Advanced QS Tools
  const advancedTabs: Array<{ id: ProjectWorkspaceTab; label: string; icon: any; badge?: number }> = [
    { id: 'questionnaire', label: 'Questionnaire', icon: CheckCircle2 },
    { id: 'documents', label: 'Documents', icon: Files, badge: uploadedDocs.length },
    { id: 'cost-control', label: 'Cost Control & IPCs', icon: SlidersHorizontal },
    { id: 'versions', label: 'Versions', icon: History },
    { id: 'activity', label: 'Audit Activity', icon: ShieldCheck },
  ];

  const getSanitizedQuestionnaire = (): ProjectQuestionnaire => {
    const base = normalizeQuestionnaire(localQuestionnaire);
    return {
      ...base,
      general: {
        ...base.general,
        numberOfFloors: Math.max(1, Number(base.general?.numberOfFloors) || 1),
        approximateGFA: Math.max(10, Number(base.general?.approximateGFA) || 200),
      }
    };
  };

  const handleGenerateQuestionnaireEstimate = () => {
    const sanitized = getSanitizedQuestionnaire();
    const generated = generateDeterministicBoq(sanitized);
    const totals = calculateBoqTotals(
      generated,
      project.po_percent,
      project.vat_percent,
      project.swamp_premium_percent
    );

    onUpdateProject({
      questionnaire: sanitized,
      items: generated,
      subtotal: totals.subtotal,
      po_amount: totals.poAmount,
      vat_amount: totals.vatAmount,
      grand_total: totals.grandTotal,
    });

    setLocalQuestionnaire(sanitized);
    setActiveTab('boq');
  };

  return (
    <div id="project-workspace-container" className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">
        <button 
          type="button" 
          onClick={onBackToProjects} 
          className="hover:text-emerald-700 flex items-center space-x-1 cursor-pointer"
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Projects</span>
        </button>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="font-bold text-slate-800 truncate max-w-xs">{project.title}</span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-emerald-800 font-semibold capitalize">
          {activeTab === 'estimate' ? 'BOQ' : activeTab}
        </span>
      </nav>

      {/* PART 43: Top Project Banner (Project Name, Client, Location, Status) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                {project.reference || 'REF-2026-01'}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                project.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                project.status === 'Submitted' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {project.status || 'In Progress'}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <MapPin className="w-3 h-3 text-slate-400" />
                {project.location || 'Lagos, Nigeria'}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <User className="w-3 h-3 text-slate-400" />
                {project.client_name || 'Private Client'}
              </span>
            </div>

            {isEditingTitle ? (
              <div className="flex items-center space-x-2 mt-1">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setTempTitle(project.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className="text-xl sm:text-2xl font-black text-slate-900 bg-white border-2 border-emerald-600 rounded-lg px-3 py-1 focus:outline-none shadow-xs w-full max-w-lg"
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempTitle(project.title);
                    setIsEditingTitle(false);
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 group">
                <h1 
                  onClick={() => setIsEditingTitle(true)}
                  className="text-2xl font-black text-slate-900 tracking-tight cursor-pointer hover:text-emerald-800 transition flex items-center gap-2"
                  title="Click to edit project name"
                >
                  <span>{project.title}</span>
                  <Pencil className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition" />
                </h1>
                <span className="text-[11px] text-slate-400 hidden group-hover:inline">
                  (click to edit)
                </span>
              </div>
            )}
            
            <p className="text-xs text-slate-500 flex items-center space-x-3">
              <span>BESMM4 Standard</span>
              <span>&bull;</span>
              <span>GFA: {formatNumber(project.gfa || 350)} m²</span>
              <span>&bull;</span>
              <span>{project.number_of_floors || 2} Floors</span>
              <span>&bull;</span>
              <span>Last updated {new Date(project.updated_at || Date.now()).toLocaleDateString('en-GB')}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onImportBoq && (
              <button
                type="button"
                onClick={onImportBoq}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 transition inline-flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                title="Import external Bill of Quantities (.xlsx, .csv) to review manually"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Import BOQ</span>
              </button>
            )}

            <button
              type="button"
              onClick={onExportExcel}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition inline-flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Download BESMM4 Excel Spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export Excel</span>
            </button>

            {onExportPdf && (
              <button
                type="button"
                onClick={onExportPdf}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition inline-flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                title="Download Stamped QS PDF"
              >
                <FileText className="w-3.5 h-3.5 text-rose-700" />
                <span>Export PDF</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEditingModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition inline-flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Edit project details, client, terrain & rates"
            >
              <Pencil className="w-3.5 h-3.5 text-emerald-700" />
              <span>Edit Details</span>
            </button>

            {onDeleteProject && (
              <button
                type="button"
                onClick={() => setIsDeletingModalOpen(true)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition inline-flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                title="Delete this project"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenDossier}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white transition inline-flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Executive Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* PART 43: Secondary Navigation (Overview | Questionnaire | Drawings | Takeoff | BOQ | Rates | Summary) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id || (tab.id === 'boq' && activeTab === 'estimate');
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Advanced Tabs Toggle */}
          {isAdvancedMode && advancedTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Advanced Disclosure Toggle */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-slate-50 rounded-xl border border-slate-200 text-[11px] self-end md:self-auto shrink-0">
          <span className="text-slate-500 font-medium">Control Tools:</span>
          <button
            type="button"
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              isAdvancedMode 
                ? 'bg-emerald-700 text-white shadow-2xs' 
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            {isAdvancedMode ? 'Showing All' : 'Core Only'}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
              Estimation Pipeline Shortcuts
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('questionnaire')}
                className="p-3 bg-white hover:bg-purple-50 rounded-xl border border-slate-200 hover:border-purple-300 text-left transition shadow-2xs group cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-purple-700" />
                <div className="font-bold text-xs text-slate-900 mt-1.5">Questionnaire</div>
                <div className="text-[10px] text-slate-500">Project parameters</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('drawings')}
                className="p-3 bg-white hover:bg-sky-50 rounded-xl border border-slate-200 hover:border-sky-300 text-left transition shadow-2xs group cursor-pointer"
              >
                <Upload className="w-4 h-4 text-sky-700" />
                <div className="font-bold text-xs text-slate-900 mt-1.5">Drawings</div>
                <div className="text-[10px] text-slate-500">Upload blueprints</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('takeoff')}
                className="p-3 bg-white hover:bg-amber-50 rounded-xl border border-slate-200 hover:border-amber-300 text-left transition shadow-2xs group cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <div className="font-bold text-xs text-slate-900 mt-1.5">Takeoff</div>
                <div className="text-[10px] text-slate-500">AI &amp; Manual tools</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('boq')}
                className="p-3 bg-white hover:bg-emerald-50 rounded-xl border border-slate-200 hover:border-emerald-300 text-left transition shadow-2xs group cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <div className="font-bold text-xs text-slate-900 mt-1.5">BOQ Spreadsheet</div>
                <div className="text-[10px] text-slate-500">{(project.items || []).length} Bill rows</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('rates')}
                className="p-3 bg-white hover:bg-teal-50 rounded-xl border border-slate-200 hover:border-teal-300 text-left transition shadow-2xs group cursor-pointer"
              >
                <Calculator className="w-4 h-4 text-teal-700" />
                <div className="font-bold text-xs text-slate-900 mt-1.5">Market Rates</div>
                <div className="text-[10px] text-slate-500">Nigerian cost library</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className="p-3 bg-white hover:bg-blue-50 rounded-xl border border-slate-200 hover:border-blue-300 text-left transition shadow-2xs group cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-blue-700" />
                <div className="font-bold text-xs text-slate-900 mt-1.5">Cost Summary</div>
                <div className="text-[10px] text-slate-500">P&amp;O, VAT &amp; Export</div>
              </button>
            </div>
          </div>

          {/* Project Details & Financial Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-slate-900">Project Parameters &amp; Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Gross Floor Area (GFA):</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{formatNumber(project.gfa || 350)} m²</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Number of Floors:</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{project.number_of_floors || 2} Floors</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Terrain Condition:</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {project.swamp_premium_percent > 0 ? `Swamp / Waterlogged (+${project.swamp_premium_percent}%)` : 'Firm Normal Ground'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Profit &amp; Overheads:</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{project.po_percent || 15}%</span>
                </div>
              </div>

              {project.description && (
                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-700 block mb-1">Project Scope &amp; Notes:</span>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {project.description}
                  </p>
                </div>
              )}
            </div>

            {/* Financial Overview Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center justify-between">
                <span>Bill Total Snapshot</span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  BESMM4
                </span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Bill Subtotal:</span>
                  <span className="font-mono font-bold text-slate-800">{formatNaira(project.subtotal || 0)}</span>
                </div>
                {project.swamp_premium_percent > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Swamp Ground (+{project.swamp_premium_percent}%):</span>
                    <span className="font-mono font-bold text-amber-800">
                      {formatNaira(Math.round((project.subtotal || 0) * (project.swamp_premium_percent / 100)))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">P&amp;O ({project.po_percent || 15}%):</span>
                  <span className="font-mono font-bold text-slate-800">{formatNaira(project.po_amount || 0)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">VAT (7.5%):</span>
                  <span className="font-mono font-bold text-slate-800">{formatNaira(project.vat_amount || 0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-emerald-950">
                  <span>Grand Total:</span>
                  <span className="font-mono text-emerald-800">{formatNaira(project.grand_total || 0)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className="w-full mt-2 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs cursor-pointer"
              >
                View Full Elemental Cost Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: QUESTIONNAIRE (PART 40) */}
      {/* ========================================================================= */}
      {activeTab === 'questionnaire' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  <span>Pre-Estimation Project Questionnaire</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define project specifications according to Nigerian standard construction practices (BESMM4).
                </p>
              </div>

              {/* PART 40: Disclose Preliminary Parametric Estimate */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Label: Preliminary Parametric Estimate
                </span>
              </div>
            </div>

            {/* Questionnaire Fields Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              
              {/* Building Type */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <label className="font-bold text-slate-700 block">Building Typology</label>
                <select
                  value={localQuestionnaire.general?.buildingType || 'Bungalow'}
                  onChange={(e) => setLocalQuestionnaire(prev => {
                    const norm = normalizeQuestionnaire(prev);
                    return {
                      ...norm,
                      general: { ...norm.general, buildingType: e.target.value as any }
                    };
                  })}
                  className="w-full p-2 bg-white rounded-lg border border-slate-300 text-slate-800 font-semibold"
                >
                  <option value="Bungalow">Residential Bungalow</option>
                  <option value="Duplex">Residential Duplex</option>
                  <option value="2-storey building">2-Storey Building</option>
                  <option value="3-storey building">3-Storey Building</option>
                  <option value="Multi-storey">Multi-Storey Commercial Block</option>
                  <option value="Renovation">Renovation Project</option>
                  <option value="Other">Other Building Type</option>
                </select>
              </div>

              {/* Number of Floors */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <label className="font-bold text-slate-700 block">Number of Storeys</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={localQuestionnaire.general?.numberOfFloors ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                    setLocalQuestionnaire(prev => {
                      const norm = normalizeQuestionnaire(prev);
                      return {
                        ...norm,
                        general: { ...norm.general, numberOfFloors: val as any }
                      };
                    });
                  }}
                  onBlur={(e) => {
                    if (!e.target.value || parseInt(e.target.value, 10) < 1) {
                      setLocalQuestionnaire(prev => {
                        const norm = normalizeQuestionnaire(prev);
                        return {
                          ...norm,
                          general: { ...norm.general, numberOfFloors: 1 }
                        };
                      });
                    }
                  }}
                  placeholder="1"
                  className="w-full p-2 bg-white rounded-lg border border-slate-300 text-slate-800 font-semibold"
                />
              </div>

              {/* Approximate GFA */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <label className="font-bold text-slate-700 block">Gross Floor Area (GFA in m²)</label>
                <input
                  type="number"
                  min="50"
                  step="10"
                  value={localQuestionnaire.general?.approximateGFA ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
                    setLocalQuestionnaire(prev => {
                      const norm = normalizeQuestionnaire(prev);
                      return {
                        ...norm,
                        general: { ...norm.general, approximateGFA: val as any }
                      };
                    });
                  }}
                  onBlur={(e) => {
                    if (!e.target.value || parseFloat(e.target.value) < 10) {
                      setLocalQuestionnaire(prev => {
                        const norm = normalizeQuestionnaire(prev);
                        return {
                          ...norm,
                          general: { ...norm.general, approximateGFA: 200 }
                        };
                      });
                    }
                  }}
                  placeholder="200"
                  className="w-full p-2 bg-white rounded-lg border border-slate-300 text-slate-800 font-semibold"
                />
              </div>

              {/* Foundation Type */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <label className="font-bold text-slate-700 block">Substructure Foundation Type</label>
                <select
                  value={localQuestionnaire.substructure?.foundationType || 'Strip foundation'}
                  onChange={(e) => setLocalQuestionnaire(prev => {
                    const norm = normalizeQuestionnaire(prev);
                    return {
                      ...norm,
                      substructure: { ...norm.substructure, foundationType: e.target.value as any }
                    };
                  })}
                  className="w-full p-2 bg-white rounded-lg border border-slate-300 text-slate-800 font-semibold"
                >
                  <option value="Strip foundation">Strip Foundation (Normal Ground)</option>
                  <option value="Pad foundation">Pad Footings &amp; Columns</option>
                  <option value="Ground beam foundation">Pad Footings &amp; Ground Beams</option>
                  <option value="Raft foundation">Reinforced Concrete Raft Foundation</option>
                  <option value="Pile foundation">Precast / Bored Piling Foundation</option>
                </select>
              </div>

              {/* Soil / Terrain Condition */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <label className="font-bold text-slate-700 block">Terrain &amp; Soil Condition</label>
                <select
                  value={localQuestionnaire.general?.terrain || 'Normal'}
                  onChange={(e) => setLocalQuestionnaire(prev => {
                    const norm = normalizeQuestionnaire(prev);
                    return {
                      ...norm,
                      general: { ...norm.general, terrain: e.target.value as any }
                    };
                  })}
                  className="w-full p-2 bg-white rounded-lg border border-slate-300 text-slate-800 font-semibold"
                >
                  <option value="Normal">Firm Normal Ground (Dry)</option>
                  <option value="Swamp">Swamp / Waterlogged Ground (+15% surcharge)</option>
                  <option value="Waterlogged">High Water Table / Waterlogged</option>
                  <option value="Coastal">Loose Coastal Sand</option>
                  <option value="Hilly">Hilly / Rocky Ground</option>
                </select>
              </div>

              {/* Roof Covering */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <label className="font-bold text-slate-700 block">Roof Covering Material</label>
                <select
                  value={localQuestionnaire.roofing?.roofCovering || 'Aluminium longspan'}
                  onChange={(e) => setLocalQuestionnaire(prev => {
                    const norm = normalizeQuestionnaire(prev);
                    return {
                      ...norm,
                      roofing: { ...norm.roofing, roofCovering: e.target.value as any }
                    };
                  })}
                  className="w-full p-2 bg-white rounded-lg border border-slate-300 text-slate-800 font-semibold"
                >
                  <option value="Aluminium longspan">Aluminium Longspan (0.55mm)</option>
                  <option value="Stone-coated">Stone-Coated Metal Tiles (Gerard)</option>
                  <option value="Concrete tiles">Concrete Flat Roof Tiles</option>
                  <option value="Clay tiles">Clay Tiles</option>
                  <option value="Fibre cement">Fibre Cement Corrugated</option>
                  <option value="Other">Other Covering</option>
                </select>
              </div>

            </div>

            {/* Explanatory Notice per PART 40 */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-extrabold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>Notice on Estimation Source Labeling (PART 40)</span>
              </div>
              <p className="leading-relaxed">
                Estimates generated from questionnaire parameters without architectural or structural drawings will be strictly labeled as <strong>"Preliminary Parametric Estimate"</strong> rather than "Drawing Takeoff". This guarantees that client-facing reports distinguish between evidence-based measurements and parametric assumptions.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const sanitized = getSanitizedQuestionnaire();
                  setLocalQuestionnaire(sanitized);
                  onUpdateProject({ questionnaire: sanitized });
                  alert('Questionnaire parameters saved to project profile.');
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs"
              >
                Save Parameters Only
              </button>

              <button
                type="button"
                onClick={handleGenerateQuestionnaireEstimate}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white cursor-pointer shadow-xs inline-flex items-center space-x-1.5"
              >
                <Calculator className="w-4 h-4 text-emerald-200" />
                <span>Generate Preliminary Parametric Estimate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DRAWINGS */}
      {/* ========================================================================= */}
      {activeTab === 'drawings' && (
        <div className="space-y-6">
          <DrawingUploader
            onTakeoffSuccess={(items, filename, provider, summary) => {
              if (onTakeoffSuccess) {
                onTakeoffSuccess(items, filename, provider, summary);
              } else {
                onUpdateProject({
                  drawing_filename: filename,
                  items: items,
                });
              }
              setActiveTab('boq');
            }}
            isProcessing={false}
            setIsProcessing={() => {}}
            questionnaire={localQuestionnaire}
            onOpenQuestionnaire={() => setActiveTab('questionnaire')}
            onOpenManualTakeoff={() => {
              setTakeoffEngine('manual');
              setActiveTab('takeoff');
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TAKEOFF (PART 39: Clear Separation of Engines) */}
      {/* ========================================================================= */}
      {activeTab === 'takeoff' && (
        <div className="space-y-6">
          {/* Engine Selector Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500">Takeoff Engine:</span>
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTakeoffEngine('manual')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                    takeoffEngine === 'manual'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Ruler className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Manual Takeoff (Ruler / Scale)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTakeoffEngine('ai')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                    takeoffEngine === 'ai'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>AI Drawing Vision Takeoff</span>
                </button>
              </div>
            </div>

            <span className="text-[11px] text-slate-500 font-medium">
              {takeoffEngine === 'manual' 
                ? 'Precise linear, area, volume & deduction measurements' 
                : 'Automated blueprint dimensional extraction via Gemini'}
            </span>
          </div>

          {/* Engine 1: Manual Takeoff */}
          {takeoffEngine === 'manual' && (
            <ManualTakeoffWorkspace
              project={project}
              onAddBoqItem={onAddBoqItem}
              onUpdateProjectMeasurements={(measurements) => {
                onUpdateProject({ manual_measurements: measurements });
              }}
            />
          )}

          {/* Engine 2: AI Takeoff */}
          {takeoffEngine === 'ai' && (
            <DrawingUploader
              onTakeoffSuccess={(items, filename, provider, summary) => {
                if (onTakeoffSuccess) {
                  onTakeoffSuccess(items, filename, provider, summary);
                } else {
                  onUpdateProject({
                    drawing_filename: filename,
                    items: items,
                  });
                }
                setActiveTab('boq');
              }}
              isProcessing={false}
              setIsProcessing={() => {}}
              questionnaire={localQuestionnaire}
              onOpenQuestionnaire={() => setActiveTab('questionnaire')}
              onOpenManualTakeoff={() => setTakeoffEngine('manual')}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: BOQ (PART 38, 50) */}
      {/* ========================================================================= */}
      {(activeTab === 'boq' || activeTab === 'estimate') && (
        <div className="space-y-4">
          <BoqTable
            items={project.items || []}
            onUpdateItem={onUpdateBoqItem}
            onAddItem={onAddBoqItem}
            onDeleteItem={onDeleteBoqItem}
            onApplyMarketRates={onApplyMarketRates}
            onImportBoq={onImportBoq}
            onViewOnDrawing={(item) => {
              setTakeoffEngine('manual');
              setActiveTab('takeoff');
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: RATES */}
      {/* ========================================================================= */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-700" />
                  <span>Nigerian Construction Market Rates Engine</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live localized prices in Nigerian Naira (₦) for <strong>{project.location || 'Lagos'}</strong> calibrated against NIQS standards.
                </p>
              </div>

              <button
                type="button"
                onClick={onApplyMarketRates}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Apply Market Rates to All BOQ Items</span>
              </button>
            </div>

            {/* Rates Table Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              
              {/* Material Rates */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-1">
                  Core Materials (Lagos / SW)
                </span>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Dangote Cement 42.5N (50kg):</span>
                  <span className="font-mono font-bold text-slate-900">₦9,800 / bag</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Clean Sharp Sand (20-ton):</span>
                  <span className="font-mono font-bold text-slate-900">₦14,000 / ton</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Granite Chippings 3/4" (30-ton):</span>
                  <span className="font-mono font-bold text-slate-900">₦18,500 / ton</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">High-Yield Rebar (TMT Fe500):</span>
                  <span className="font-mono font-bold text-slate-900">₦1,350,000 / ton</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">225mm Vibrated Sandcrete Block:</span>
                  <span className="font-mono font-bold text-slate-900">₦650 / pc</span>
                </div>
              </div>

              {/* Direct Labour Rates */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-1">
                  Direct Daily Labour Wages
                </span>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Skilled Mason / Bricklayer:</span>
                  <span className="font-mono font-bold text-slate-900">₦8,500 / day</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Steel Fixer / Iron Bender:</span>
                  <span className="font-mono font-bold text-slate-900">₦8,500 / day</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Formwork Carpenter:</span>
                  <span className="font-mono font-bold text-slate-900">₦8,000 / day</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Unskilled Labourer / Attendant:</span>
                  <span className="font-mono font-bold text-slate-900">₦4,500 / day</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Site QS / Resident Supervisor:</span>
                  <span className="font-mono font-bold text-slate-900">₦25,000 / day</span>
                </div>
              </div>

              {/* Composite Trade Rates */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-1">
                  All-In Composite Trade Rates
                </span>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">RC Grade 25 Concrete in Foundation:</span>
                  <span className="font-mono font-bold text-slate-900">₦95,000 / m³</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">225mm Blockwork in Mortar (1:4):</span>
                  <span className="font-mono font-bold text-slate-900">₦14,500 / m²</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">12mm High-Yield Rebar Fixed:</span>
                  <span className="font-mono font-bold text-slate-900">₦1,650 / kg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Internal Wall Plastering 15mm:</span>
                  <span className="font-mono font-bold text-slate-900">₦3,800 / m²</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Aluminium Longspan 0.55mm:</span>
                  <span className="font-mono font-bold text-slate-900">₦11,200 / m²</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: SUMMARY */}
      {/* ========================================================================= */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-700" />
                  <span>Executive Elemental Cost Summary</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  NIQS standard tender recap with material procurement schedules and formal certification.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onExportExcel}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white transition shadow-2xs inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel (.xlsx)</span>
                </button>
                {onExportPdf && (
                  <button
                    type="button"
                    onClick={onExportPdf}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-800 hover:bg-rose-700 text-white transition shadow-2xs inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download PDF (.pdf)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4">Bill Element</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-right">Amount (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  <tr>
                    <td className="py-2.5 px-4 font-bold">Bill No 1: Preliminaries</td>
                    <td className="py-2.5 px-4 text-slate-500">Site setup, insurance, supervisor, safety, tests</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-right">
                      {formatNaira(Math.round((project.subtotal || 0) * 0.05))}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold">Bill No 2: Substructure</td>
                    <td className="py-2.5 px-4 text-slate-500">Excavation, hardcore, blinding, foundation concrete, ground slab</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-right">
                      {formatNaira(Math.round((project.subtotal || 0) * 0.32))}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold">Bill No 3: Superstructure Frame</td>
                    <td className="py-2.5 px-4 text-slate-500">Reinforced concrete columns, suspended beams &amp; slabs, staircase</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-right">
                      {formatNaira(Math.round((project.subtotal || 0) * 0.28))}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold">Bill No 4: Blockwork &amp; Roofing</td>
                    <td className="py-2.5 px-4 text-slate-500">External &amp; internal hollow sandcrete walls, timber trusses, longspan sheets</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-right">
                      {formatNaira(Math.round((project.subtotal || 0) * 0.20))}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold">Bill No 5: Finishes &amp; Services</td>
                    <td className="py-2.5 px-4 text-slate-500">Plastering, POP, floor tiling, electrical wiring, sanitary plumbing</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-right">
                      {formatNaira(Math.round((project.subtotal || 0) * 0.15))}
                    </td>
                  </tr>

                  {/* Subtotal */}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={2} className="py-2.5 px-4 text-right">Measured Works Subtotal:</td>
                    <td className="py-2.5 px-4 font-mono text-right">{formatNaira(project.subtotal || 0)}</td>
                  </tr>

                  {/* Swamp Ground */}
                  {project.swamp_premium_percent > 0 && (
                    <tr className="text-amber-900 bg-amber-50/50">
                      <td colSpan={2} className="py-2.5 px-4 text-right font-medium">
                        Swamp Ground Surcharge (+{project.swamp_premium_percent}%):
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-right">
                        {formatNaira(Math.round((project.subtotal || 0) * (project.swamp_premium_percent / 100)))}
                      </td>
                    </tr>
                  )}

                  {/* Contractor P&O */}
                  <tr>
                    <td colSpan={2} className="py-2.5 px-4 text-right text-slate-600 font-medium">
                      Contractor's Profit &amp; Overheads ({project.po_percent || 15}%):
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-right">
                      {formatNaira(project.po_amount || 0)}
                    </td>
                  </tr>

                  {/* VAT */}
                  <tr>
                    <td colSpan={2} className="py-2.5 px-4 text-right text-slate-600 font-medium">
                      Value Added Tax (VAT @ 7.5%):
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-right">
                      {formatNaira(project.vat_amount || 0)}
                    </td>
                  </tr>

                  {/* Grand Total */}
                  <tr className="bg-emerald-100/70 text-emerald-950 font-black text-sm">
                    <td colSpan={2} className="py-3 px-4 text-right uppercase">
                      Grand Total Contract Estimate:
                    </td>
                    <td className="py-3 px-4 font-mono text-right text-emerald-900 text-base">
                      {formatNaira(project.grand_total || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Material Requirement Schedule */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] block">
                Primary Material Procurement Schedule
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 block font-medium">Portland Cement:</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {formatNumber(Math.round((project.gfa || 350) * 3.8))} Bags
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 block font-medium">Sharp Sand:</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {formatNumber(Math.round((project.gfa || 350) * 0.45))} Tonnes
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 block font-medium">Granite Chippings:</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {formatNumber(Math.round((project.gfa || 350) * 0.55))} Tonnes
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 block font-medium">High-Yield Rebar:</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {formatNumber(Number(((project.gfa || 350) * 0.038).toFixed(1)))} Tonnes
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 block font-medium">Sandcrete Blocks:</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {formatNumber(Math.round((project.gfa || 350) * 12.5))} Pieces
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: COST CONTROL (Advanced) */}
      {/* ========================================================================= */}
      {activeTab === 'cost-control' && (
        <ProjectControlsView project={project} />
      )}

      {/* ========================================================================= */}
      {/* TAB 9: DOCUMENTS (Advanced - 14 Categories) */}
      {/* ========================================================================= */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Folder className="w-5 h-5 text-emerald-700" />
                <span>Project Document Repository</span>
              </h3>
              <p className="text-xs text-slate-500">
                14 standard BESMM4 categories. Organize drawings, tender specifications, contracts and certificates.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search folders..."
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 w-44 sm:w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Folder Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {DOCUMENT_CATEGORIES.filter(cat => 
              cat.label.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
              cat.description.toLowerCase().includes(docSearchQuery.toLowerCase())
            ).map((cat) => {
              const categoryDocs = uploadedDocs.filter(d => d.category === cat.id);
              const count = categoryDocs.length;
              const isSelected = selectedDocCategory === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedDocCategory(isSelected ? null : cat.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected 
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500' 
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <Folder className={`w-5 h-5 ${count > 0 ? 'text-emerald-700' : 'text-slate-400'}`} />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {count} {count === 1 ? 'file' : 'files'}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="font-bold text-xs text-slate-900">{cat.label}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{cat.description}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Category Details & Document List */}
          {selectedDocCategory && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2">
                  <Folder className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-xs text-slate-900">
                    Category: {selectedDocCategory} ({uploadedDocs.filter(d => d.category === selectedDocCategory).length} documents)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newTitle = prompt('Enter document title for ' + selectedDocCategory);
                    if (newTitle) {
                      setUploadedDocs(prev => [
                        {
                          id: `doc-${Date.now()}`,
                          category: selectedDocCategory,
                          title: newTitle,
                          filename: `${newTitle.replace(/\s+/g, '_')}.pdf`,
                          size: '2.4 MB',
                          date: 'Just now'
                        },
                        ...prev
                      ]);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs transition inline-flex items-center space-x-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload to {selectedDocCategory}</span>
                </button>
              </div>

              <div className="space-y-2">
                {uploadedDocs.filter(d => d.category === selectedDocCategory).map(doc => (
                  <div 
                    key={doc.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between hover:border-slate-300 transition text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900">{doc.title}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{doc.filename} &bull; {doc.size}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-400">{doc.date}</span>
                      <button
                        type="button"
                        onClick={() => alert(`Downloading ${doc.filename}...`)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: VERSIONS (Advanced) */}
      {/* ========================================================================= */}
      {activeTab === 'versions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <History className="w-5 h-5 text-emerald-700" />
                <span>Estimate Version Control &amp; Milestone Snapshots</span>
              </h3>
              <p className="text-xs text-slate-500">
                Track formal revision milestones: V1 Draft, V2 Client Review, V3 Tender Issue, V4 Approved Contract.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenVersionsModal}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center space-x-2 shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Manage &amp; Compare Versions</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Active Project Estimate
              </span>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {project.active_version || 'V1 - Active Workspace'} &bull; {formatNaira(project.grand_total)}
              </div>
              <div className="text-slate-600 text-[11px] mt-0.5">
                {(project.items || []).length} BOQ items in active workspace &bull; NIQS / BESMM4 Standard
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenVersionsModal}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-50 transition cursor-pointer"
            >
              Take Milestone Snapshot
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 11: ACTIVITY / AUDIT (Advanced) */}
      {/* ========================================================================= */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span>QSRBN Forensic Audit Log &amp; Activity Trail</span>
              </h3>
              <p className="text-xs text-slate-500">
                Tamper-evident timestamped ledger of estimate edits, rate changes, variations, valuations, and approvals.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenAuditDrawer}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center space-x-2 shadow-2xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full Audit Report</span>
            </button>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 'aud-1',
                type: 'Rate updated',
                category: 'boq',
                title: 'Market Rate Calibration Applied',
                description: 'Reinforced concrete foundation rates updated to ₦95,000/m³ based on current Lagos market indices.',
                actor: 'QS Isaac Emmanuel (QSRBN/2024/098)',
                time: '12 mins ago',
                timestamp: '2026-03-10 14:32',
                badge: 'Rate Build-Up',
                badgeColor: 'bg-teal-100 text-teal-800'
              },
              {
                id: 'aud-2',
                type: 'Measurement confirmed',
                category: 'boq',
                title: 'Quantity Surveyor Verified Ground Beam BBS',
                description: 'High yield TMT rebar confirmed at 14.8 tonnes from structural framing schedule.',
                actor: 'QS Isaac Emmanuel',
                time: '45 mins ago',
                timestamp: '2026-03-10 13:59',
                badge: 'QS Verified',
                badgeColor: 'bg-emerald-100 text-emerald-800'
              },
              {
                id: 'aud-3',
                type: 'Valuation issued',
                category: 'financial',
                title: 'Interim Valuation No. 02 Prepared',
                description: 'Certified cumulative work value of ₦18,450,000 for Superstructure frame and blockwork.',
                actor: 'Project QS Emmanuel',
                time: '2 hours ago',
                timestamp: '2026-03-10 12:30',
                badge: 'Valuation 02',
                badgeColor: 'bg-blue-100 text-blue-800'
              },
              {
                id: 'aud-4',
                type: 'Variation approved',
                category: 'variations',
                title: 'VO-01: Foundation Raft Redesign Approved',
                description: 'Swamp soil depth required replacement of strip foundation with 300mm raft slab (+₦3,450,000).',
                actor: 'Structural Eng. Adebayo & Client',
                time: '1 day ago',
                timestamp: '2026-03-09 16:45',
                badge: '+₦3,450,000',
                badgeColor: 'bg-amber-100 text-amber-800'
              },
              {
                id: 'aud-5',
                type: 'Drawing uploaded',
                category: 'documents',
                title: 'Architectural Working Drawings Rev C Uploaded',
                description: 'Floor plans, elevations and section drawings stored in Document Repository (Arch_Drawings_RevC.pdf).',
                actor: 'Project Architect',
                time: 'Yesterday',
                timestamp: '2026-03-09 11:15',
                badge: '12.4 MB',
                badgeColor: 'bg-purple-100 text-purple-800'
              }
            ].map((evt) => (
              <div
                key={evt.id}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{evt.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${evt.badgeColor}`}>
                      {evt.badge}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{evt.description}</p>
                  <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-1 font-medium">
                    <span>{evt.actor}</span>
                    <span>&bull;</span>
                    <span>{evt.time} ({evt.timestamp})</span>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200">
                    {evt.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditingModalOpen && (
        <ProjectEditModal
          project={project}
          isOpen={isEditingModalOpen}
          onClose={() => setIsEditingModalOpen(false)}
          onSave={async (updated) => {
            onUpdateProject(updated);
            if (onEditProject) {
              await onEditProject(updated);
            }
            setIsEditingModalOpen(false);
          }}
        />
      )}

      {/* Delete Project Modal */}
      {isDeletingModalOpen && (
        <DeleteProjectModal
          project={project}
          isOpen={isDeletingModalOpen}
          onClose={() => setIsDeletingModalOpen(false)}
          onConfirmDelete={async (projectId, title) => {
            if (onDeleteProject) {
              await onDeleteProject(projectId, title);
            }
            setIsDeletingModalOpen(false);
            if (onBackToProjects) {
              onBackToProjects();
            }
          }}
        />
      )}

    </div>
  );
};

import React, { useState } from 'react';
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
  DollarSign
} from 'lucide-react';
import { Project, ProjectWorkspaceTab, BoqItem } from '../../types';
import { formatNaira } from '../../utils/format';
import { BoqTable } from '../BoqTable';
import { ProjectControlsView } from '../controls/ProjectControlsView';
import { CalculatorsHubView } from '../calculators/CalculatorsHubView';
import { DrawingUploader } from '../DrawingUploader';

interface ProjectWorkspaceViewProps {
  project: Project;
  onUpdateProject: (updated: Partial<Project>) => void;
  onUpdateBoqItem: (index: number, field: keyof BoqItem, value: any) => void;
  onAddBoqItem: (item?: Partial<BoqItem>) => void;
  onDeleteBoqItem: (index: number) => void;
  onApplyMarketRates: () => void;
  onOpenAiTakeoff: () => void;
  onOpenRateLibrary: () => void;
  onOpenQuestionnaire: () => void;
  onExportExcel: () => void;
  onOpenDossier: () => void;
  onBackToProjects?: () => void;
  onOpenVersionsModal?: () => void;
  onOpenAuditDrawer?: () => void;
}

// 14 Standard BESMM4 / QS Document Categories (Item 31)
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
  onUpdateProject,
  onUpdateBoqItem,
  onAddBoqItem,
  onDeleteBoqItem,
  onApplyMarketRates,
  onOpenAiTakeoff,
  onOpenRateLibrary,
  onOpenQuestionnaire,
  onExportExcel,
  onOpenDossier,
  onBackToProjects,
  onOpenVersionsModal,
  onOpenAuditDrawer,
}) => {
  const [activeTab, setActiveTab] = useState<ProjectWorkspaceTab>('overview');
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(true);
  const [selectedDocCategory, setSelectedDocCategory] = useState<string | null>(null);
  const [docSearchQuery, setDocSearchQuery] = useState<string>('');
  const [auditFilter, setAuditFilter] = useState<string>('all');

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

  // Tab definitions with progressive disclosure (Item 37)
  const coreTabs: Array<{ id: ProjectWorkspaceTab; label: string; icon: any; badge?: number; advanced?: boolean }> = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'estimate', label: 'Estimate & BOQ', icon: FileSpreadsheet, badge: (project.items || []).length },
    { id: 'calculations', label: 'Calculations', icon: Calculator },
    { id: 'documents', label: 'Documents', icon: Files, badge: uploadedDocs.length },
    { id: 'cost-control', label: 'Cost Control & IPCs', icon: SlidersHorizontal, advanced: true },
    { id: 'versions', label: 'Versions', icon: History, advanced: true },
    { id: 'activity', label: 'Audit Activity', icon: ShieldCheck, advanced: true },
  ];

  const visibleTabs = isAdvancedMode ? coreTabs : coreTabs.filter(t => !t.advanced);

  return (
    <div id="project-workspace-container" className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Breadcrumbs Navigation (Item 48 & 45) */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={onBackToProjects}
          className="hover:text-emerald-800 font-medium inline-flex items-center space-x-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-0.5" />
          <span>Projects</span>
        </button>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="font-semibold text-slate-800 truncate max-w-xs">{project.title}</span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-emerald-800 font-bold capitalize">
          {activeTab === 'cost-control' ? 'Cost Control & IPCs' : activeTab.replace('-', ' ')}
        </span>
      </nav>

      {/* Project Banner Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
              {project.project_type || 'Building Project'}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Status: {project.status || 'Draft'}
            </span>
            {project.reference && (
              <span className="text-[10px] font-mono text-slate-400">
                REF: {project.reference}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {project.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {project.location || 'Nigeria'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {project.client_name || 'Client Unspecified'}
            </span>
            {project.contractor && (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {project.contractor}
              </span>
            )}
          </div>
        </div>

        {/* Contract Value Highlight & Quick Actions */}
        <div className="flex flex-col sm:items-end gap-3 shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block text-left sm:text-right">
              Total Contract Sum / Estimate
            </span>
            <span className="text-2xl font-black text-emerald-800 block text-left sm:text-right">
              {formatNaira(project.grand_total)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenDossier}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Files className="w-3.5 h-3.5 text-slate-300" />
              <span>QS Dossier</span>
            </button>
            <button
              type="button"
              onClick={onExportExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export BOQ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation with Progressive Disclosure Switch (Item 37) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ProjectWorkspaceTab)}
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
        </div>

        {/* Progressive Disclosure Toggle */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-slate-50 rounded-xl border border-slate-200 text-[11px] self-end md:self-auto">
          <span className="text-slate-500 font-medium">Advanced Options:</span>
          <button
            type="button"
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              isAdvancedMode 
                ? 'bg-emerald-700 text-white shadow-2xs' 
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            {isAdvancedMode ? 'Full Controls' : 'Standard'}
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Actions Row */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
              Project Actions
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('estimate')}
                className="p-3 bg-white hover:bg-emerald-50 rounded-xl border border-slate-200 hover:border-emerald-300 text-left transition shadow-2xs group cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <div className="font-bold text-xs text-slate-900 mt-1.5">Edit BOQ</div>
                <div className="text-[10px] text-slate-500">{(project.items || []).length} Bill items</div>
              </button>

              <button
                type="button"
                onClick={onOpenAiTakeoff}
                className="p-3 bg-white hover:bg-amber-50 rounded-xl border border-slate-200 hover:border-amber-300 text-left transition shadow-2xs group cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <div className="font-bold text-xs text-slate-900 mt-1.5">AI Takeoff</div>
                <div className="text-[10px] text-slate-500">Extract from drawings</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('calculations')}
                className="p-3 bg-white hover:bg-teal-50 rounded-xl border border-slate-200 hover:border-teal-300 text-left transition shadow-2xs group cursor-pointer"
              >
                <Calculator className="w-4 h-4 text-teal-700" />
                <div className="font-bold text-xs text-slate-900 mt-1.5">New Calculation</div>
                <div className="text-[10px] text-slate-500">Concrete, rebar, blocks</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('cost-control')}
                className="p-3 bg-white hover:bg-blue-50 rounded-xl border border-slate-200 hover:border-blue-300 text-left transition shadow-2xs group cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-blue-700" />
                <div className="font-bold text-xs text-slate-900 mt-1.5">New Valuation</div>
                <div className="text-[10px] text-slate-500">Progress payment</div>
              </button>

              <button
                type="button"
                onClick={onOpenQuestionnaire}
                className="p-3 bg-white hover:bg-purple-50 rounded-xl border border-slate-200 hover:border-purple-300 text-left transition shadow-2xs group cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-purple-700" />
                <div className="font-bold text-xs text-slate-900 mt-1.5">Questionnaire</div>
                <div className="text-[10px] text-slate-500">Project parameters</div>
              </button>
            </div>
          </div>

          {/* Details Grid: Status, Progress & Parameters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-slate-900">Project Parameters &amp; Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Gross Floor Area (GFA):</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{project.gfa || 350} m²</span>
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

            {/* Outstanding Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Outstanding Actions</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <div className="font-bold text-amber-950">Review AI Vision Measurements</div>
                  <div className="text-[11px] text-amber-800 mt-0.5">Confirm foundation concrete and rebar tonnage against scale.</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-bold text-slate-900">Sign Interim Payment Certificate 002</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Ready for QSRBN stamp and endorsement.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ESTIMATE */}
      {activeTab === 'estimate' && (
        <div className="space-y-4">
          <BoqTable
            items={project.items || []}
            onUpdateItem={onUpdateBoqItem}
            onAddItem={onAddBoqItem}
            onDeleteItem={onDeleteBoqItem}
            onApplyMarketRates={onApplyMarketRates}
          />
        </div>
      )}

      {/* TAB 3: COST CONTROL */}
      {activeTab === 'cost-control' && (
        <ProjectControlsView project={project} />
      )}

      {/* TAB 4: CALCULATIONS */}
      {activeTab === 'calculations' && (
        <CalculatorsHubView
          onApplyToBoq={(item) => {
            onAddBoqItem({
              item: item.item,
              description: item.description,
              qty: item.qty,
              unit: item.unit,
              rate: 15000,
              amount: item.qty * 15000,
              section: item.section || 'Substructure'
            });
            setActiveTab('estimate');
          }}
        />
      )}

      {/* TAB 5: DOCUMENTS & LIBRARY (14 Categories - Item 31) */}
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

          {/* Folder Cards Grid (Item 31) */}
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
                  className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-bold inline-flex items-center space-x-1.5 shadow-2xs hover:bg-emerald-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload to {selectedDocCategory}</span>
                </button>
              </div>

              {uploadedDocs.filter(d => d.category === selectedDocCategory).length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No documents uploaded to this category yet. Click "Upload to {selectedDocCategory}" to attach plans or specs.
                </div>
              ) : (
                <div className="space-y-2">
                  {uploadedDocs.filter(d => d.category === selectedDocCategory).map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900">{doc.title}</div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-2 mt-0.5">
                            <span>{doc.filename}</span>
                            <span>&bull;</span>
                            <span>{doc.size}</span>
                            <span>&bull;</span>
                            <span>{doc.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => alert(`Viewing ${doc.filename}`)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100"
                          title="View document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedDocs(prev => prev.filter(d => d.id !== doc.id));
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AUDIT ACTIVITY (Item 33) */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span>Project Audit Trail &amp; Activity Log</span>
              </h3>
              <p className="text-xs text-slate-500">
                Transparent QS governance: tracks BOQ edits, rate changes, certificates, valuations, and contract approvals.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5 text-xs font-semibold overflow-x-auto">
              {[
                { id: 'all', label: 'All Events' },
                { id: 'boq', label: 'BOQ & Rates' },
                { id: 'financial', label: 'Valuations & IPCs' },
                { id: 'variations', label: 'Variations' },
                { id: 'documents', label: 'Documents' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAuditFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                    auditFilter === f.id
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Events Timeline (11 Events - Item 33) */}
          <div className="space-y-3">
            {[
              {
                id: 'aud-1',
                type: 'Certificate generated',
                category: 'financial',
                title: 'Interim Payment Certificate IPC-002 Issued',
                description: 'Net payment of ₦9,900,000 certified for contractor following Valuation No. 02 inspection.',
                actor: 'QS Isaac Emmanuel (Lead QS)',
                time: '2 hours ago',
                timestamp: '2026-03-10 14:15',
                badge: 'Certified',
                badgeColor: 'bg-emerald-100 text-emerald-800'
              },
              {
                id: 'aud-2',
                type: 'Valuation created',
                category: 'financial',
                title: 'Interim Valuation No. 02 Created',
                description: 'Joint measurement computed at 45% project completion. Gross work done ₦23,450,000.',
                actor: 'Engr. Babatunde Adeyemi',
                time: '4 hours ago',
                timestamp: '2026-03-10 12:30',
                badge: 'Valuation',
                badgeColor: 'bg-blue-100 text-blue-800'
              },
              {
                id: 'aud-3',
                type: 'Variation approved',
                category: 'variations',
                title: 'Variation Order VO-002 Approved',
                description: 'Upgrade from standard vitrified tiles to 600x600mm polished porcelain tiles (+₦430,000).',
                actor: 'Arch. Fatima Al-Hassan',
                time: 'Yesterday at 16:45',
                timestamp: '2026-03-09 16:45',
                badge: '+₦430,000',
                badgeColor: 'bg-amber-100 text-amber-800'
              },
              {
                id: 'aud-4',
                type: 'Quantity changed',
                category: 'boq',
                title: 'Substructure Concrete Quantity Adjusted',
                description: 'Reinforced concrete Grade 20/25 in ground beams updated from 42.0 m³ to 48.5 m³.',
                actor: 'QS Isaac Emmanuel',
                time: 'Yesterday at 11:10',
                timestamp: '2026-03-09 11:10',
                badge: 'Qty: 48.5 m³',
                badgeColor: 'bg-slate-100 text-slate-800'
              },
              {
                id: 'aud-5',
                type: 'Rate changed',
                category: 'boq',
                title: '225mm Hollow Sandcrete Blockwork Unit Rate Updated',
                description: 'Market rate refreshed from ₦13,800/m² to Lagos current rate ₦14,500/m².',
                actor: 'QS Isaac Emmanuel',
                time: '2 days ago',
                timestamp: '2026-03-08 09:20',
                badge: '₦14,500 / m²',
                badgeColor: 'bg-purple-100 text-purple-800'
              },
              {
                id: 'aud-6',
                type: 'Document uploaded',
                category: 'documents',
                title: 'Revised Architectural Drawings Rev C Uploaded',
                description: 'Arch_Drawings_RevC.pdf (12.4 MB) attached to Architectural Drawings repository.',
                actor: 'Arch. Fatima Al-Hassan',
                time: '2 days ago',
                timestamp: '2026-03-08 08:45',
                badge: 'Drawing',
                badgeColor: 'bg-teal-100 text-teal-800'
              },
              {
                id: 'aud-7',
                type: 'Estimate approved',
                category: 'approvals',
                title: 'Estimate Version V2 - Tender Issue Formally Approved',
                description: 'Project baseline contract estimate of ₦48,500,000 ratified for client review.',
                actor: 'Lead Client Representative',
                time: '3 days ago',
                timestamp: '2026-03-07 15:00',
                badge: 'Approved',
                badgeColor: 'bg-emerald-100 text-emerald-800'
              },
              {
                id: 'aud-8',
                type: 'Payment recorded',
                category: 'financial',
                title: 'Advance Mobilization Payment Recorded',
                description: '₦7,275,000 (15% Advance Payment) credited against Advance Payment Guarantee.',
                actor: 'Accounts & Project Finance',
                time: '1 week ago',
                timestamp: '2026-03-03 10:00',
                badge: '₦7,275,000',
                badgeColor: 'bg-emerald-100 text-emerald-800'
              },
              {
                id: 'aud-9',
                type: 'BOQ created',
                category: 'boq',
                title: 'Complete BESMM4 Bill of Quantities Generated',
                description: '38 bill items structured into Substructure, Frame, Finishes & Services.',
                actor: "Let's Estimate AI & QS Emmanuel",
                time: '2 weeks ago',
                timestamp: '2026-02-24 14:00',
                badge: '38 Items',
                badgeColor: 'bg-slate-100 text-slate-800'
              },
              {
                id: 'aud-10',
                type: 'Project created',
                category: 'project',
                title: 'Project Initialized & Geolocation Set',
                description: `Project registered under reference ${project.reference || 'REF-2026-01'} in ${project.location || 'Nigeria'}.`,
                actor: 'QS Isaac Emmanuel',
                time: '2 weeks ago',
                timestamp: '2026-02-24 09:30',
                badge: 'Created',
                badgeColor: 'bg-emerald-100 text-emerald-800'
              }
            ].filter(evt => {
              if (auditFilter === 'all') return true;
              if (auditFilter === 'boq') return evt.category === 'boq';
              if (auditFilter === 'financial') return evt.category === 'financial';
              if (auditFilter === 'variations') return evt.category === 'variations';
              if (auditFilter === 'documents') return evt.category === 'documents';
              return true;
            }).map((evt) => (
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

      {/* TAB 7: VERSIONS (Item 32) */}
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

    </div>
  );
};

/**
 * Let's Estimate - AI-Powered BOQ Takeoff Tool for Nigerian Builders
 * Master Refactored Application Component
 */

import React, { useState, useEffect } from 'react';
import { 
  Project, 
  BoqItem, 
  StandardRate, 
  AppGlobalView, 
  EstimatingSubView, 
  ProjectControlsSubView, 
  UserSubscriptionInfo, 
  ProjectQuestionnaire 
} from './types';
import { calculateBoqTotals } from './utils/format';
import { Sidebar } from './components/navigation/Sidebar';
import { AppHeader } from './components/navigation/AppHeader';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProjectsView } from './components/projects/ProjectsView';
import { ProjectWorkspaceView } from './components/workspace/ProjectWorkspaceView';
import { CalculatorsHubView, TemplateBoqItem } from './components/calculators/CalculatorsHubView';
import { EstimatingHubView } from './components/estimating/EstimatingHubView';
import { ProjectControlsView } from './components/controls/ProjectControlsView';
import { DocumentsReportsView } from './components/documents/DocumentsReportsView';
import { TeamClientsView } from './components/team/TeamClientsView';
import { SettingsView } from './components/settings/SettingsView';
import { HelpSupportView } from './components/help/HelpSupportView';
import { SuppliersView } from './components/library/SuppliersView';
import { MaterialsView } from './components/library/MaterialsView';
import { DrawingUploader } from './components/DrawingUploader';
import { BoqTable } from './components/BoqTable';
import { FinancialSummary } from './components/FinancialSummary';
import { ExportActions } from './components/ExportActions';
import { NigerianRatesModal } from './components/NigerianRatesModal';
import { EstimateVersionsModal } from './components/EstimateVersionsModal';
import { ProjectVariationsModal } from './components/ProjectVariationsModal';
import { ProjectValuationsModal } from './components/ProjectValuationsModal';
import { ProjectAuditDrawer } from './components/ProjectAuditDrawer';
import { MaterialScheduleModal } from './components/MaterialScheduleModal';
import { ProjectDocumentsModal } from './components/ProjectDocumentsModal';
import { ProjectShareModal } from './components/ProjectShareModal';
import { SharedTenderView } from './components/SharedTenderView';
import { CashFlowModal } from './components/CashFlowModal';
import { TenderComparisonModal } from './components/TenderComparisonModal';
import { RiskAuditModal } from './components/RiskAuditModal';
import { SubscriptionBillingModal } from './components/SubscriptionBillingModal';
import { FinalAccountModal } from './components/FinalAccountModal';
import { ExecutiveDossierModal } from './components/ExecutiveDossierModal';
import { ProjectQuestionnaireModal } from './components/ProjectQuestionnaireModal';
import { DuplicateItemModal, DuplicatePromptData } from './components/estimating/DuplicateItemModal';
import { BoqImportModal } from './components/estimating/BoqImportModal';
import { CreateProjectModal } from './components/projects/CreateProjectModal';
import { LandingPage } from './components/landing/LandingPage';
import { generateDeterministicBoq } from './utils/constructionKnowledgeBase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { safeFetchJson } from './utils/api';
import { exportProjectToExcel, exportProjectToPdf } from './utils/excelExport';
import { 
  CheckCircle2, 
  AlertTriangle, 
  CreditCard, 
  ShieldCheck 
} from 'lucide-react';

const DEFAULT_NEW_PROJECT: Project = {
  id: '',
  title: 'New Building Project Estimate',
  location: 'Lagos, Nigeria',
  client_name: '',
  drawing_filename: '',
  status: 'Draft',
  currency: 'NGN',
  po_percent: 15.0,            // 15% Profit & Overheads
  vat_percent: 7.5,             // 7.5% Nigerian VAT
  swamp_premium_percent: 0.0,   // Swamp / Terrain Multiplier
  subtotal: 0,
  po_amount: 0,
  vat_amount: 0,
  grand_total: 0,
  items: [],
};

function MainApp() {
  const { user, token, refreshStats, openAuthModal } = useAuth();
  
  // Navigation state
  const [currentView, setCurrentView] = useState<AppGlobalView>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#landing' || hash === '#home' || hash === '#pricing' || hash === '#standards') {
        return 'landing';
      }
      if (hash === '#projects') return 'projects';
      if (hash === '#calculators') return 'calculators';
      if (hash === '#estimating') return 'estimating';
      if (hash === '#controls') return 'controls';
      if (hash === '#documents') return 'documents';
      if (hash === '#team') return 'team';
      if (hash === '#settings') return 'settings';
      if (hash === '#help') return 'help';
    }
    return 'dashboard';
  });

  const [activeSubView, setActiveSubView] = useState<string | undefined>();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Projects and active work
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [activeProject, setActiveProject] = useState<Project>(DEFAULT_NEW_PROJECT);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isProcessingTakeoff, setIsProcessingTakeoff] = useState(false);

  // Modals state
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
  const [isVariationsModalOpen, setIsVariationsModalOpen] = useState(false);
  const [isValuationsModalOpen, setIsValuationsModalOpen] = useState(false);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCashFlowModalOpen, setIsCashFlowModalOpen] = useState(false);
  const [isTenderModalOpen, setIsTenderModalOpen] = useState(false);
  const [isRiskAuditModalOpen, setIsRiskAuditModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isFinalAccountModalOpen, setIsFinalAccountModalOpen] = useState(false);
  const [isExecutiveDossierModalOpen, setIsExecutiveDossierModalOpen] = useState(false);
  const [isQuestionnaireModalOpen, setIsQuestionnaireModalOpen] = useState(false);
  const [isBoqImportModalOpen, setIsBoqImportModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [duplicatePromptData, setDuplicatePromptData] = useState<DuplicatePromptData | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<UserSubscriptionInfo | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check if viewing a public shared client tender link (e.g. /share/:token)
  const [sharedToken, setSharedToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/share\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }
    return null;
  });

  const navigateView = (view: AppGlobalView, subView?: string) => {
    setCurrentView(view);
    if (subView) {
      setActiveSubView(subView);
    }
    if (typeof window !== 'undefined') {
      if (view === 'landing') {
        window.location.hash = '#home';
      } else {
        window.location.hash = '#' + view;
      }
    }
  };

  // Sync with browser hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase().replace('#', '');
      if (hash === 'landing' || hash === 'home' || hash === 'pricing') {
        setCurrentView('landing');
      } else if (hash === 'dashboard' || hash === 'workspace') {
        setCurrentView('dashboard');
      } else if (hash === 'projects') {
        setCurrentView('projects');
      } else if (hash === 'calculators') {
        setCurrentView('calculators');
      } else if (hash === 'estimating') {
        setCurrentView('estimating');
      } else if (hash === 'controls') {
        setCurrentView('controls');
      } else if (hash === 'documents') {
        setCurrentView('documents');
      } else if (hash === 'team') {
        setCurrentView('team');
      } else if (hash === 'settings') {
        setCurrentView('settings');
      } else if (hash === 'help') {
        setCurrentView('help');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch all projects & subscription status on mount & whenever auth token changes
  useEffect(() => {
    loadProjects();
    loadSubscription();
  }, [token]);

  const loadSubscription = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const { ok, data } = await safeFetchJson<{ subscription: UserSubscriptionInfo }>('/api/subscription/status', { headers });
      if (ok && data?.subscription) {
        setSubscriptionInfo(data.subscription);
      }
    } catch {
      // Gracefully continue with local defaults
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const { ok, data } = await safeFetchJson<{ projects: Project[] }>('/api/projects', { headers });
      if (ok && data?.projects) {
        const safeProjects = data.projects.map((p) => ({
          ...p,
          items: Array.isArray(p.items) ? p.items : []
        }));
        setProjects(safeProjects);
        if (!activeProject.id && safeProjects.length > 0) {
          const first = safeProjects[0];
          setActiveProject({
            ...first,
            status: first.status || 'Draft',
            po_percent: first.po_percent ?? 15,
            vat_percent: first.vat_percent ?? 7.5,
            swamp_premium_percent: first.swamp_premium_percent ?? 0,
            items: first.items || [],
          });
        }
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoadingProjects(false);
    }
  };

  // Open modal to create a new project
  const handleNewProject = () => {
    setIsCreateProjectModalOpen(true);
  };

  // Handle creating project from detailed QS parameters modal
  const handleCreateProjectFromModal = async (projectData: Partial<Project>) => {
    try {
      const newId = 'proj-' + Date.now();
      const newProj: Project = {
        ...DEFAULT_NEW_PROJECT,
        ...projectData,
        id: newId,
        items: [],
      };
      setActiveProject(newProj);
      setProjects((prev) => [newProj, ...prev]);
      setHasUnsavedChanges(false);
      setIsCreateProjectModalOpen(false);
      navigateView('project-workspace');
      showToast(`Created new project workspace: "${newProj.title}".`);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const { ok, data } = await safeFetchJson<{ project: Project; error?: string }>('/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify(newProj),
      });
      if (ok && data?.project) {
        setActiveProject(data.project);
        setProjects(prev => prev.map(p => p.id === newId ? data.project : p));
      }
      loadProjects();
      refreshStats();
    } catch (e: any) {
      console.warn('Initial project persist failed:', e);
      showToast('Error persisting project: ' + (e?.message || 'Network error'));
    }
  };

  // Handle importing BOQ items to an existing project
  const handleImportToProject = async (targetProjectId: string, items: BoqItem[], mode: 'replace' | 'append') => {
    try {
      const target = projects.find(p => p.id === targetProjectId) || (activeProject.id === targetProjectId ? activeProject : null);
      if (!target) {
        showToast('Target project not found.');
        return;
      }

      const existingItems = mode === 'append' ? (target.items || []) : [];
      const startIndex = existingItems.length;
      const mappedNewItems: BoqItem[] = items.map((it, idx) => ({
        ...it,
        id: `imported-${Date.now()}-${startIndex + idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
        project_id: targetProjectId,
        item_number: startIndex + idx + 1,
        verification_status: it.verification_status || 'Imported'
      }));

      const finalItems = [...existingItems, ...mappedNewItems];
      const po_percent = target.po_percent ?? 15.0;
      const vat_percent = target.vat_percent ?? 7.5;
      const swamp_percent = target.swamp_premium_percent ?? 0.0;
      const totals = calculateBoqTotals(finalItems, po_percent, vat_percent, swamp_percent);

      const updatedProject: Project = {
        ...target,
        items: finalItems,
        subtotal: totals.subtotal,
        po_amount: totals.poAmount,
        vat_amount: totals.vatAmount,
        grand_total: totals.grandTotal,
      };

      setProjects(prev => prev.map(p => p.id === targetProjectId ? updatedProject : p));
      setActiveProject(updatedProject);
      setHasUnsavedChanges(false);
      navigateView('project-workspace');

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await safeFetchJson(`/api/projects/${targetProjectId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ 
          items: finalItems,
          subtotal: totals.subtotal,
          po_amount: totals.poAmount,
          vat_amount: totals.vatAmount,
          grand_total: totals.grandTotal
        })
      });

      showToast(`Successfully imported ${items.length} items to "${target.title}" for manual review.`);
      loadProjects();
      refreshStats();
    } catch (err: any) {
      console.error('Import error:', err);
      showToast('Error importing items: ' + (err?.message || 'Unknown error'));
    }
  };

  // Handle creating a brand new project with imported BOQ
  const handleCreateProjectWithBoq = async (projectData: Partial<Project>, items: BoqItem[]) => {
    try {
      const newId = 'proj-' + Date.now();
      const mappedItems: BoqItem[] = items.map((it, idx) => ({
        ...it,
        id: `imported-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
        project_id: newId,
        item_number: idx + 1,
        verification_status: it.verification_status || 'Imported'
      }));

      const po_percent = projectData.po_percent ?? 15.0;
      const vat_percent = projectData.vat_percent ?? 7.5;
      const swamp_percent = projectData.swamp_premium_percent ?? 0.0;
      const totals = calculateBoqTotals(mappedItems, po_percent, vat_percent, swamp_percent);

      const newProj: Project = {
        ...DEFAULT_NEW_PROJECT,
        ...projectData,
        id: newId,
        title: projectData.title || 'Imported Bill of Quantities',
        items: mappedItems,
        subtotal: totals.subtotal,
        po_amount: totals.poAmount,
        vat_amount: totals.vatAmount,
        grand_total: totals.grandTotal,
      };

      setActiveProject(newProj);
      setProjects(prev => [newProj, ...prev]);
      setHasUnsavedChanges(false);
      navigateView('project-workspace');

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await safeFetchJson('/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify(newProj),
      });

      showToast(`Created new project "${newProj.title}" with ${items.length} imported items ready for review.`);
      loadProjects();
      refreshStats();
    } catch (err: any) {
      console.error('Error creating project with BOQ:', err);
      showToast('Failed to create project: ' + (err?.message || 'Unknown error'));
    }
  };

  // Open an existing project by ID
  const handleOpenProject = async (projectId: string) => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const { ok, data, error } = await safeFetchJson<{ project: Project; error?: string }>(`/api/projects/${projectId}`, { headers });
      if (ok && data?.project) {
        setActiveProject({
          ...data.project,
          status: data.project.status || 'Draft',
          po_percent: data.project.po_percent ?? 15,
          vat_percent: data.project.vat_percent ?? 7.5,
          swamp_premium_percent: data.project.swamp_premium_percent ?? 0,
          items: data.project.items || [],
        });
        setHasUnsavedChanges(false);
        navigateView('project-workspace');
      } else {
        alert(error || 'Could not open project.');
      }
    } catch (err: any) {
      alert('Could not open project: ' + (err?.message || 'Network error'));
    }
  };

  // Delete project
  const handleDeleteProject = async (projectId: string, title: string) => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const { ok, data, error } = await safeFetchJson<{ success?: boolean; error?: string }>(`/api/projects/${projectId}`, { 
        method: 'DELETE',
        headers
      });
      if (ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        if (activeProject.id === projectId) {
          setActiveProject(DEFAULT_NEW_PROJECT);
          navigateView('projects');
        }
        showToast(`Project "${title}" deleted successfully.`);
        refreshStats();
        loadProjects();
      } else {
        showToast(data?.error || error || 'Failed to delete project.');
      }
    } catch (err: any) {
      console.error('Delete failed:', err);
      showToast('Error deleting project: ' + (err?.message || 'Network error'));
    }
  };

  // Edit project details
  const handleEditProject = async (updatedFields: Partial<Project>) => {
    if (!updatedFields.id) return;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const { ok, data, error } = await safeFetchJson<{ project: Project; error?: string }>(`/api/projects/${updatedFields.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatedFields),
      });
      if (ok && data?.project) {
        setProjects((prev) => {
          const exists = prev.some(p => p.id === updatedFields.id);
          if (exists) {
            return prev.map((p) => p.id === updatedFields.id ? { ...p, ...data.project } : p);
          } else {
            return [data.project, ...prev];
          }
        });
        if (activeProject.id === updatedFields.id) {
          setActiveProject((prev) => ({ ...prev, ...data.project }));
        }
        showToast(`Project "${data.project.title}" details updated.`);
        loadProjects();
        refreshStats();
      } else {
        showToast(data?.error || error || 'Failed to update project details.');
      }
    } catch (err: any) {
      console.error('Update failed:', err);
      showToast('Error updating project: ' + (err?.message || 'Network error'));
    }
  };

  // Duplicate an estimate
  const handleDuplicateProject = async (projectId: string, title: string) => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const { ok, data, error } = await safeFetchJson<{ project: Project; error?: string }>(`/api/projects/${projectId}/duplicate`, {
        method: 'POST',
        headers
      });
      if (ok) {
        showToast(`Cloned "${title}" as a new draft estimate!`);
        loadProjects();
        refreshStats();
      } else {
        alert(data?.error || error || 'Could not duplicate project');
      }
    } catch (err: any) {
      alert('Error duplicating estimate: ' + err.message);
    }
  };

  // Rename a project
  const handleRenameProject = async (projectId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const { ok, data, error } = await safeFetchJson<{ project: Project; error?: string }>(`/api/projects/${projectId}/rename`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (ok) {
        setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, title: newTitle.trim() } : p));
        if (activeProject.id === projectId) {
          setActiveProject((prev) => ({ ...prev, title: newTitle.trim() }));
        }
        showToast(`Project renamed to "${newTitle.trim()}".`);
        loadProjects();
      } else {
        alert(data?.error || error || 'Failed to rename project.');
      }
    } catch (err: any) {
      alert('Error renaming project: ' + (err?.message || 'Network error'));
    }
  };

  // Update status directly from dashboard or editor
  const handleUpdateStatus = async (projectId: string, status: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const { ok } = await safeFetchJson(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      });
      if (ok) {
        showToast(`Project marked as ${status}`);
        loadProjects();
      }
    } catch {
      // Handled cleanly
    }
  };

  // Handle successful AI Takeoff
  const handleTakeoffSuccess = (
    detectedItems: any[],
    filename: string,
    provider: string,
    summary?: string
  ) => {
    const formattedItems: BoqItem[] = detectedItems.map((item, idx) => ({
      id: `item-${Date.now()}-${idx + 1}`,
      project_id: activeProject.id,
      item_number: idx + 1,
      item: item.item,
      description: item.description,
      unit: item.unit,
      qty: Number(item.qty || 0),
      rate: Number(item.rate || 0),
      amount: Number(item.qty || 0) * Number(item.rate || 0),
    }));

    setActiveProject((prev) => ({
      ...prev,
      drawing_filename: filename,
      notes: summary || prev.notes,
      items: formattedItems,
    }));

    setHasUnsavedChanges(true);
    showToast(`AI Takeoff completed using ${provider}! ${formattedItems.length} items detected.`);
  };

  // Handle Questionnaire save and optional deterministic generation
  const handleSaveQuestionnaire = (questionnaire: ProjectQuestionnaire, mode: 'deterministic' | 'save_only') => {
    setActiveProject((prev) => ({
      ...prev,
      questionnaire,
    }));
    setHasUnsavedChanges(true);

    if (mode === 'deterministic') {
      const generated = generateDeterministicBoq(questionnaire);
      const totals = calculateBoqTotals(
        generated, 
        activeProject.po_percent, 
        activeProject.vat_percent, 
        activeProject.swamp_premium_percent
      );
      setActiveProject((prev) => ({
        ...prev,
        questionnaire,
        items: generated,
        subtotal: totals.subtotal,
        po_amount: totals.poAmount,
        vat_amount: totals.vatAmount,
        grand_total: totals.grandTotal,
      }));
      setIsQuestionnaireModalOpen(false);
      showToast(`Generated ${generated.length} BESMM4 standard BOQ items based on your specs!`);
    } else {
      setIsQuestionnaireModalOpen(false);
      showToast('Project specification parameters saved successfully.');
    }
  };

  // Update a line item in the BOQ
  const handleUpdateItem = (index: number, field: keyof BoqItem, value: any) => {
    setActiveProject((prev) => {
      const updated = [...prev.items];
      const target = { ...updated[index], [field]: value };

      if (field === 'qty' || field === 'rate') {
        const q = field === 'qty' ? Number(value || 0) : Number(target.qty || 0);
        const r = field === 'rate' ? Number(value || 0) : Number(target.rate || 0);
        target.amount = q * r;
      }

      updated[index] = target;
      return { ...prev, items: updated };
    });
    setHasUnsavedChanges(true);
  };

  // Add a new row to BOQ (with duplicate item detection)
  const handleAddItem = (customItem?: Partial<BoqItem>) => {
    const q = customItem?.qty !== undefined ? customItem.qty : 0;
    const r = customItem?.rate !== undefined ? customItem.rate : 0;
    const section = customItem?.section || 'Substructure';
    const item = customItem?.item || '';
    const description = customItem?.description || '';
    const unit = customItem?.unit || 'm2';

    const incomingItem: BoqItem = {
      id: `item-${Date.now()}-${activeProject.items.length + 1}`,
      project_id: activeProject.id,
      item_number: activeProject.items.length + 1,
      section,
      item,
      description,
      unit,
      qty: q,
      rate: r,
      amount: q * r,
      is_ai_generated: customItem?.is_ai_generated,
      verification_status: customItem?.verification_status,
      source: customItem?.source,
      evidence: customItem?.evidence,
    };

    // Check if a similar line item already exists (same section, same unit, and matching description/item)
    if (customItem && (customItem.description || customItem.item)) {
      const matchIndex = activeProject.items.findIndex((it) => {
        const sameSection = (it.section || '').trim().toLowerCase() === section.trim().toLowerCase();
        const sameUnit = (it.unit || '').trim().toLowerCase() === unit.trim().toLowerCase();
        const sameDesc = (it.description || '').trim().toLowerCase() === description.trim().toLowerCase() ||
                         (it.item || '').trim().toLowerCase() === item.trim().toLowerCase();
        const sameSource = !customItem.source || !it.source || it.source === customItem.source;
        return sameSection && sameUnit && sameDesc && sameSource;
      });

      if (matchIndex >= 0) {
        const existingItem = activeProject.items[matchIndex];
        setDuplicatePromptData({
          existingItem,
          incomingItem,
          onResolve: (action) => {
            if (action === 'merge') {
              setActiveProject((prev) => {
                const updatedItems = [...prev.items];
                const current = updatedItems[matchIndex];
                const newQty = Math.round(((current.qty || 0) + incomingItem.qty) * 100) / 100;
                const rate = current.rate || incomingItem.rate || 0;
                updatedItems[matchIndex] = {
                  ...current,
                  qty: newQty,
                  rate: rate,
                  amount: Math.round(newQty * rate),
                  evidence: incomingItem.evidence
                    ? `${current.evidence || ''} | ${incomingItem.evidence}`.replace(/^ \| /, '')
                    : current.evidence
                };
                return { ...prev, items: updatedItems };
              });
              setHasUnsavedChanges(true);
              showToast(`Merged ${incomingItem.qty} ${incomingItem.unit} into existing Item #${existingItem.item_number}`);
            } else if (action === 'replace') {
              setActiveProject((prev) => {
                const updatedItems = [...prev.items];
                updatedItems[matchIndex] = {
                  ...incomingItem,
                  item_number: existingItem.item_number,
                  id: existingItem.id
                };
                return { ...prev, items: updatedItems };
              });
              setHasUnsavedChanges(true);
              showToast(`Replaced Item #${existingItem.item_number} with updated measurement`);
            } else if (action === 'keep_both') {
              setActiveProject((prev) => ({
                ...prev,
                items: [...prev.items, incomingItem],
              }));
              setHasUnsavedChanges(true);
              showToast('Added as separate line item in bill');
            }
          }
        });
        return;
      }
    }

    // Direct addition
    setActiveProject((prev) => ({
      ...prev,
      items: [...prev.items, incomingItem],
    }));
    setHasUnsavedChanges(true);
  };

  // Delete a row
  const handleDeleteItem = (index: number) => {
    setActiveProject((prev) => {
      const updated = prev.items.filter((_, i) => i !== index);
      const renumbered = updated.map((it, i) => ({ ...it, item_number: i + 1 }));
      return { ...prev, items: renumbered };
    });
    setHasUnsavedChanges(true);
  };

  // Auto-apply Nigerian standard market rates
  const handleApplyMarketRates = () => {
    const rateMap: Record<string, number> = {
      'slab': 175000,
      'concrete': 175000,
      'blockwork': 14500,
      'block': 14500,
      'walls': 4200,
      'plastering': 4200,
      'door': 75000,
      'window': 65000,
      'roof': 28000,
      'roofing': 28000,
      'excavation': 6500,
    };

    setActiveProject((prev) => {
      const updated = prev.items.map((it) => {
        let matchedRate = it.rate;
        if (!matchedRate || matchedRate === 0) {
          const lower = it.item.toLowerCase();
          for (const [key, rate] of Object.entries(rateMap)) {
            if (lower.includes(key)) {
              matchedRate = rate;
              break;
            }
          }
        }
        const qty = Number(it.qty || 0);
        return {
          ...it,
          rate: matchedRate,
          amount: qty * matchedRate,
        };
      });

      return { ...prev, items: updated };
    });

    setHasUnsavedChanges(true);
    showToast('Applied recommended Nigerian unit rates!');
  };

  // Insert rate from the Nigerian Rates Modal into the active BOQ
  const handleSelectRateFromModal = (rateItem: { item: string; description: string; unit: string; rate: number }) => {
    const selectedRate = rateItem.rate;
    setActiveProject((prev) => {
      const newNum = prev.items.length + 1;
      const newItem: BoqItem = {
        id: `item-${Date.now()}-${newNum}`,
        project_id: prev.id,
        item_number: newNum,
        item: rateItem.item,
        description: rateItem.description,
        unit: rateItem.unit,
        qty: 1,
        rate: selectedRate,
        amount: selectedRate,
      };
      return { ...prev, items: [...prev.items, newItem] };
    });
    setHasUnsavedChanges(true);
    showToast(`Added ${rateItem.item} (₦${selectedRate.toLocaleString()}) to BOQ.`);
  };

  // Save Project to SQLite
  const handleSaveProject = async () => {
    if (!activeProject.title) {
      alert('Please enter a project title.');
      return;
    }

    setIsSaving(true);
    try {
      const totals = calculateBoqTotals(
        activeProject.items,
        activeProject.po_percent,
        activeProject.vat_percent,
        activeProject.swamp_premium_percent
      );

      const payload = {
        ...activeProject,
        id: activeProject.id || `proj-${Date.now()}`,
        subtotal: totals.subtotal,
        po_amount: totals.poAmount,
        vat_amount: totals.vatAmount,
        grand_total: totals.grandTotal,
      };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const { ok, data, error } = await safeFetchJson<{ project: Project; error?: string }>('/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!ok || !data?.project) {
        throw new Error(data?.error || error || 'Failed to save project');
      }

      setActiveProject({
        ...data.project,
        items: data.project.items || activeProject.items || []
      });
      setHasUnsavedChanges(false);
      showToast('Project saved successfully to SQLite database!');
      loadProjects();
      refreshStats();
    } catch (err: any) {
      alert('Failed to save project: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Transfer takeoff template items directly to a project BOQ and persist to SQLite
  const handleApplyBulkToBoq = async (
    items: TemplateBoqItem[],
    options?: {
      targetProjectId?: string;
      createAsNewProject?: boolean;
      newProjectTitle?: string;
      newProjectLocation?: string;
      newProjectType?: string;
    }
  ) => {
    setIsSaving(true);
    try {
      let targetProject: Project;

      if (options?.createAsNewProject) {
        const newProjId = `proj-${Date.now()}`;
        const newItems: BoqItem[] = items.map((it, idx) => ({
          id: `item-${Date.now()}-${idx + 1}`,
          project_id: newProjId,
          item_number: idx + 1,
          section: it.section,
          item: it.item,
          description: it.description,
          unit: it.unit,
          qty: it.qty,
          rate: it.rate,
          amount: it.qty * it.rate,
          verification_status: 'QS Verified',
          source: 'Takeoff Template Library'
        }));

        const totals = calculateBoqTotals(newItems, 10, 7.5, 0);

        targetProject = {
          id: newProjId,
          user_id: '',
          title: options.newProjectTitle || (options.newProjectType === 'Community' ? 'Community Health Outreach' : 'New Takeoff Project'),
          location: options.newProjectLocation || 'Lagos, Nigeria',
          project_type: options.newProjectType || 'Commercial',
          client_name: 'Takeoff Template Import',
          subtotal: totals.subtotal,
          po_percent: 10,
          po_amount: totals.poAmount,
          vat_percent: 7.5,
          vat_amount: totals.vatAmount,
          swamp_premium_percent: 0,
          grand_total: totals.grandTotal,
          items: newItems,
          status: 'In Progress',
          drawing_filename: '',
          active_version: 'V1',
          created_at: new Date().toISOString()
        };
      } else {
        const projToUpdate = (options?.targetProjectId && projects.find(p => p.id === options.targetProjectId)) || activeProject;
        const currentItems = projToUpdate.items || [];
        const startNum = currentItems.length + 1;

        const newItems: BoqItem[] = items.map((it, idx) => ({
          id: `item-${Date.now()}-${startNum + idx}`,
          project_id: projToUpdate.id,
          item_number: startNum + idx,
          section: it.section,
          item: it.item,
          description: it.description,
          unit: it.unit,
          qty: it.qty,
          rate: it.rate,
          amount: it.qty * it.rate,
          verification_status: 'QS Verified',
          source: 'Takeoff Template Library'
        }));

        const combinedItems = [...currentItems, ...newItems];
        const totals = calculateBoqTotals(
          combinedItems,
          projToUpdate.po_percent || 15,
          projToUpdate.vat_percent || 7.5,
          projToUpdate.swamp_premium_percent || 0
        );

        targetProject = {
          ...projToUpdate,
          items: combinedItems,
          subtotal: totals.subtotal,
          po_amount: totals.poAmount,
          vat_amount: totals.vatAmount,
          grand_total: totals.grandTotal
        };
      }

      // Persist to SQLite Database via POST /api/projects
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const { ok, data, error } = await safeFetchJson<{ project: Project; error?: string }>('/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify(targetProject),
      });

      if (!ok || !data?.project) {
        throw new Error(data?.error || error || 'Failed to persist transferred project to database');
      }

      const savedProject = {
        ...data.project,
        items: data.project.items || targetProject.items
      };

      setActiveProject(savedProject);
      setHasUnsavedChanges(false);

      // Refresh project list and stats
      await loadProjects();
      await refreshStats();

      // Navigate immediately to the project BOQ workspace
      navigateView('project-workspace');

      showToast(`Successfully transferred ${items.length} item(s) to "${savedProject.title}" and saved to database!`);
    } catch (err: any) {
      alert('Transfer to BOQ failed: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Export Excel (.xlsx) trigger - Generates genuine multi-tab workbook
  const handleExportExcel = async () => {
    if (!activeProject.items || activeProject.items.length === 0) {
      alert('Please add or detect at least one BOQ item before exporting to Excel.');
      return;
    }
    try {
      showToast('Generating official 3-Tab Excel (.xlsx) workbook...');
      await exportProjectToExcel(activeProject);
      showToast(`Downloaded "${activeProject.title || 'Project'}" (.xlsx) successfully!`);
    } catch (err: any) {
      console.error('Excel export error:', err);
      alert(err.message || 'Failed to export Excel file.');
    }
  };

  // Export PDF trigger - Generates stamped tender Bill of Quantities
  const handleExportPdf = async () => {
    if (!activeProject.items || activeProject.items.length === 0) {
      alert('Please add or detect at least one BOQ item before exporting to PDF.');
      return;
    }
    try {
      showToast('Generating official certified PDF Bill of Quantities...');
      await exportProjectToPdf(activeProject);
      showToast(`Downloaded "${activeProject.title || 'Project'}" (.pdf) successfully!`);
    } catch (err: any) {
      console.error('PDF export error:', err);
      alert(err.message || 'Failed to export PDF file.');
    }
  };

  // Calculate dynamic totals for active project
  const calculatedTotals = calculateBoqTotals(
    activeProject?.items,
    activeProject?.po_percent,
    activeProject?.vat_percent,
    activeProject?.swamp_premium_percent
  );

  // If user navigated to a public shared client tender link (e.g. /share/:token)
  if (sharedToken) {
    return (
      <SharedTenderView
        shareToken={sharedToken}
        onBackToApp={() => {
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/');
          }
          setSharedToken(null);
        }}
      />
    );
  }

  // If user navigated to public marketing landing page
  if (currentView === 'landing') {
    return (
      <LandingPage
        onOpenApp={() => navigateView('dashboard')}
        onOpenAuth={(mode) => openAuthModal(mode)}
        onOpenQuestionnaireDemo={() => {
          navigateView('project-workspace');
          setIsQuestionnaireModalOpen(true);
        }}
      />
    );
  }

  // RENDER APP VIEW CONTENT
  const renderCurrentViewContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            projects={projects}
            onOpenProject={handleOpenProject}
            onNewProject={handleNewProject}
            onNavigate={navigateView}
            onOpenTakeoff={() => {
              navigateView('estimating', 'takeoff');
            }}
            onOpenRates={() => setIsRatesModalOpen(true)}
            onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
            onImportBoq={() => setIsBoqImportModalOpen(true)}
          />
        );

      case 'projects':
        return (
          <ProjectsView
            projects={projects}
            loading={loadingProjects}
            onOpenProject={handleOpenProject}
            onNewProject={handleNewProject}
            onRenameProject={handleRenameProject}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
            onUpdateStatus={handleUpdateStatus}
            onImportBoq={() => setIsBoqImportModalOpen(true)}
          />
        );

      case 'project-workspace':
      case 'editor':
        return (
          <ProjectWorkspaceView
            project={activeProject}
            onUpdateProject={(upd) => {
              setActiveProject((prev) => ({ ...prev, ...upd }));
              setHasUnsavedChanges(true);
            }}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            onUpdateBoqItem={handleUpdateItem}
            onAddBoqItem={handleAddItem}
            onDeleteBoqItem={handleDeleteItem}
            onApplyMarketRates={handleApplyMarketRates}
            onOpenAiTakeoff={() => navigateView('estimating', 'takeoff')}
            onOpenRateLibrary={() => setIsRatesModalOpen(true)}
            onOpenQuestionnaire={() => setIsQuestionnaireModalOpen(true)}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            onOpenDossier={() => setIsExecutiveDossierModalOpen(true)}
            onBackToProjects={() => navigateView('projects')}
            onOpenVersionsModal={() => setIsVersionsModalOpen(true)}
            onOpenAuditDrawer={() => setIsAuditDrawerOpen(true)}
            onImportBoq={() => setIsBoqImportModalOpen(true)}
          />
        );

      case 'calculators':
        return (
          <CalculatorsHubView
            activeProject={activeProject}
            projects={projects}
            onApplyBulkToBoq={handleApplyBulkToBoq}
            onApplyToBoq={(calcItem) => {
              const r = calcItem.rate || 16500;
              handleAddItem({
                item: calcItem.item,
                description: calcItem.description,
                qty: calcItem.qty,
                unit: calcItem.unit,
                rate: r,
                amount: calcItem.amount || (calcItem.qty * r),
                section: calcItem.section || 'Superstructure'
              });
              showToast(`Applied ${calcItem.item} to active BOQ!`);
            }}
          />
        );

      case 'suppliers':
        return (
          <SuppliersView
            onNavigateToMaterials={() => navigateView('materials')}
            onSelectSupplierForEstimate={(supplier) => {
              showToast(`Selected ${supplier.name} (${supplier.category}) for procurement RFQ.`);
            }}
          />
        );

      case 'materials':
        return (
          <MaterialsView
            activeProject={activeProject}
            onNavigateToSuppliers={() => navigateView('suppliers')}
            onApplyRateToBoq={(matRate) => {
              handleAddItem({
                item: matRate.item,
                description: matRate.description,
                unit: matRate.unit,
                rate: matRate.rate,
                qty: 1,
                amount: matRate.rate,
                section: matRate.section || 'General Materials',
                source: 'Market Material Index'
              });
              showToast(`Applied Nigerian benchmark rate for ${matRate.item} (${matRate.unit}) to active BOQ!`);
            }}
          />
        );

      case 'estimating':
        return (
          <div className="space-y-6">
            {activeSubView === 'takeoff' && (
              <DrawingUploader
                onTakeoffSuccess={handleTakeoffSuccess}
                isProcessing={isProcessingTakeoff}
                setIsProcessing={setIsProcessingTakeoff}
                questionnaire={activeProject.questionnaire}
                onOpenQuestionnaire={() => setIsQuestionnaireModalOpen(true)}
              />
            )}
            <EstimatingHubView
              project={activeProject}
              projects={projects}
              initialSubView={(activeSubView as EstimatingSubView) || 'boq'}
              onOpenAiTakeoff={() => {
                setActiveSubView('takeoff');
              }}
              onOpenRateLibrary={() => setIsRatesModalOpen(true)}
              onUpdateBoqItem={handleUpdateItem}
              onUpdateProject={(upd) => {
                setActiveProject((prev) => ({ ...prev, ...upd }));
                setHasUnsavedChanges(true);
              }}
              onAddBoqItem={handleAddItem}
              onDeleteBoqItem={handleDeleteItem}
              onApplyMarketRates={handleApplyMarketRates}
              onExportExcel={handleExportExcel}
              onImportBoq={() => setIsBoqImportModalOpen(true)}
            />
          </div>
        );

      case 'controls':
        return (
          <ProjectControlsView
            project={activeProject}
            projects={projects}
            initialSubView={(activeSubView as ProjectControlsSubView) || 'budget'}
            onSelectProject={handleOpenProject}
            onEditProject={handleEditProject}
            onNewProject={handleNewProject}
            onDeleteProject={handleDeleteProject}
            token={token}
          />
        );

      case 'documents':
        return (
          <DocumentsReportsView
            projects={projects}
            activeProject={activeProject}
            onOpenDossier={() => setIsExecutiveDossierModalOpen(true)}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
          />
        );

      case 'team':
        return (
          <TeamClientsView
            onOpenTenderPortal={() => setIsTenderModalOpen(true)}
          />
        );

      case 'settings':
        return (
          <SettingsView
            onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
          />
        );

      case 'help':
        return (
          <HelpSupportView
            onNavigate={navigateView}
          />
        );

      default:
        return (
          <DashboardView
            projects={projects}
            onOpenProject={handleOpenProject}
            onNewProject={handleNewProject}
            onNavigate={navigateView}
            onOpenTakeoff={() => navigateView('estimating', 'takeoff')}
            onOpenRates={() => setIsRatesModalOpen(true)}
            onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
            onImportBoq={() => setIsBoqImportModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. Global Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={navigateView}
        activeProject={activeProject}
        projectsCount={projects.length}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        pendingActionsCount={2}
        unreadNotificationsCount={1}
      />

      {/* 2. Main Content Layout Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <AppHeader
          currentView={currentView}
          onNavigate={navigateView}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          projects={projects}
          activeProject={activeProject}
          onSelectProject={handleOpenProject}
          onNewProject={handleNewProject}
          onNewBoq={() => {
            handleNewProject();
            navigateView('estimating', 'boq');
          }}
          onNewEstimate={() => {
            handleNewProject();
            navigateView('estimating', 'estimate');
          }}
          onAiTakeoff={() => {
            navigateView('estimating', 'takeoff');
          }}
          onNewValuation={() => {
            navigateView('controls', 'valuations');
          }}
          onNewCertificate={() => {
            navigateView('controls', 'certificates');
          }}
          onNewVariation={() => {
            navigateView('controls', 'variations');
          }}
          onNewCalculation={() => {
            navigateView('calculators');
          }}
          onUploadDocument={() => {
            setIsDocumentsModalOpen(true);
          }}
          onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
          onImportBoq={() => setIsBoqImportModalOpen(true)}
        />

        {/* 7-Day Trial & Subscription Notice Bar */}
        {subscriptionInfo && (
          <div className={`border-b text-xs px-4 py-2 transition shrink-0 ${
            subscriptionInfo.trialExpired
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : subscriptionInfo.isTrial
              ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-950'
              : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-950'
          }`}>
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                {subscriptionInfo.trialExpired ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : subscriptionInfo.isTrial ? (
                  <CreditCard className="w-4 h-4 text-amber-700 shrink-0" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>
                  {subscriptionInfo.trialExpired ? (
                    <span><strong>7-Day Trial Expired:</strong> Activate license via bank transfer to <strong>Isaac Emmanuel at Access Bank (081515121)</strong>.</span>
                  ) : subscriptionInfo.isTrial ? (
                    <span><strong>Complimentary 7-Day Trial:</strong> {subscriptionInfo.trialDaysRemaining} days left. Access full features, AI Takeoffs and NIQS reports.</span>
                  ) : (
                    <span><strong>Active Subscription:</strong> {subscriptionInfo.tier === 'lifetime_license' ? 'Enterprise Lifetime License' : subscriptionInfo.tier === 'yearly' ? 'Corporate Annual Plan' : 'Professional Monthly'} &bull; Verified QS Account</span>
                  )}
                </span>
              </div>

              <button
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-bold bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs text-slate-900 shrink-0 transition cursor-pointer"
              >
                <span>{subscriptionInfo.trialExpired ? 'Renew License' : 'Bank Details & Plans'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderCurrentViewContent()}
        </main>

        {/* System Footer */}
        <footer className="border-t border-slate-200 bg-white py-3 px-6 text-xs text-slate-500 shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
            <span>Let&apos;s Estimate &bull; AI Quantity Surveying &amp; Construction Cost Management</span>
            <span className="text-slate-400">NIQS / BESMM4 Standard Compliance</span>
          </div>
        </footer>

      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ALL MODALS PRESERVED & FUNCTIONAL */}
      <NigerianRatesModal
        isOpen={isRatesModalOpen}
        onClose={() => setIsRatesModalOpen(false)}
        activeProjectItems={activeProject.items}
        projectLocation={activeProject.location}
        onSelectRate={handleSelectRateFromModal}
      />

      <MaterialScheduleModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        projectId={activeProject.id}
        projectTitle={activeProject.title}
        items={activeProject.items}
      />

      <ProjectDocumentsModal
        isOpen={isDocumentsModalOpen}
        onClose={() => setIsDocumentsModalOpen(false)}
        projectId={activeProject.id}
        projectTitle={activeProject.title}
        onSelectDrawingForTakeoff={(doc) => {
          setActiveProject(prev => ({
            ...prev,
            drawing_filename: doc.file_name
          }));
          showToast(`Attached drawing "${doc.title}" for AI takeoff.`);
        }}
      />

      <ProjectShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectId={activeProject.id}
        projectTitle={activeProject.title}
      />

      <EstimateVersionsModal
        projectId={activeProject.id}
        activeVersion={activeProject.active_version}
        isOpen={isVersionsModalOpen}
        onClose={() => setIsVersionsModalOpen(false)}
        onRestoreVersion={(restored) => {
          setActiveProject(restored);
          setHasUnsavedChanges(false);
          showToast(`Restored estimate version "${restored.active_version || 'V1'}"`);
        }}
        token={token}
        currentProject={activeProject}
      />

      <ProjectVariationsModal
        projectId={activeProject.id}
        contractSum={calculatedTotals.grandTotal}
        isOpen={isVariationsModalOpen}
        onClose={() => setIsVariationsModalOpen(false)}
        token={token}
      />

      <ProjectValuationsModal
        project={activeProject}
        isOpen={isValuationsModalOpen}
        onClose={() => setIsValuationsModalOpen(false)}
        token={token}
      />

      <CashFlowModal
        isOpen={isCashFlowModalOpen}
        onClose={() => setIsCashFlowModalOpen(false)}
        projectId={activeProject.id}
        projectName={activeProject.title}
        projectTotal={calculatedTotals.grandTotal}
      />

      <TenderComparisonModal
        isOpen={isTenderModalOpen}
        onClose={() => setIsTenderModalOpen(false)}
        projectId={activeProject.id}
        projectName={activeProject.title}
        projectSubtotal={calculatedTotals.subtotal}
        boqItems={activeProject.items}
      />

      <RiskAuditModal
        isOpen={isRiskAuditModalOpen}
        onClose={() => setIsRiskAuditModalOpen(false)}
        projectId={activeProject.id}
        projectName={activeProject.title}
        projectLocation={activeProject.location}
        projectTotal={calculatedTotals.grandTotal}
        boqItems={activeProject.items}
      />

      <SubscriptionBillingModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => {
          setIsSubscriptionModalOpen(false);
          loadSubscription();
        }}
      />

      <FinalAccountModal
        isOpen={isFinalAccountModalOpen}
        onClose={() => setIsFinalAccountModalOpen(false)}
        project={activeProject}
        token={token}
      />

      <ExecutiveDossierModal
        isOpen={isExecutiveDossierModalOpen}
        onClose={() => setIsExecutiveDossierModalOpen(false)}
        projectId={activeProject.id}
        projectName={activeProject.title}
        token={token}
      />

      <ProjectAuditDrawer
        projectId={activeProject.id}
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
      />

      <ProjectQuestionnaireModal
        isOpen={isQuestionnaireModalOpen}
        onClose={() => setIsQuestionnaireModalOpen(false)}
        onSaveAndGenerate={handleSaveQuestionnaire}
        initialData={activeProject.questionnaire}
      />

      <DuplicateItemModal
        data={duplicatePromptData}
        onClose={() => setDuplicatePromptData(null)}
      />

      <BoqImportModal
        isOpen={isBoqImportModalOpen}
        onClose={() => setIsBoqImportModalOpen(false)}
        activeProject={activeProject}
        projects={projects}
        onImportToProject={handleImportToProject}
        onCreateProjectWithBoq={handleCreateProjectWithBoq}
      />

      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onCreateProject={handleCreateProjectFromModal}
      />

      <AuthModal />
      <UserProfileModal />

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Let's Estimate Workspace Error">
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}

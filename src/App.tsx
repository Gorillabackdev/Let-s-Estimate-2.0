/**
 * Let's Estimate - AI-Powered BOQ Takeoff Tool for Nigerian Builders
 * Main Application Component
 */

import React, { useState, useEffect } from 'react';
import { Project, BoqItem, StandardRate } from './types';
import { calculateBoqTotals } from './utils/format';
import { Header } from './components/Header';
import { ProjectDashboard } from './components/ProjectDashboard';
import { ProjectMetaCard } from './components/ProjectMetaCard';
import { DrawingUploader } from './components/DrawingUploader';
import { BoqTable } from './components/BoqTable';
import { FinancialSummary } from './components/FinancialSummary';
import { ExportActions } from './components/ExportActions';
import { NigerianRatesModal } from './components/NigerianRatesModal';
import { Sparkles, CheckCircle2 } from 'lucide-react';

/* ========================================================================
   NICE TO HAVE: USER AUTHENTICATION WITH JWT (COMMENTED OUT FOR LATER PHASE)
   ------------------------------------------------------------------------
   interface UserAuth {
     token: string;
     user: { id: string; email: string; fullName: string; company: string };
   }
   const useAuth = () => {
     // Ready for JWT login flow
   };
   ======================================================================== */

const DEFAULT_NEW_PROJECT: Project = {
  id: '',
  title: 'New Building Project Estimate',
  location: 'Lagos, Nigeria',
  client_name: '',
  drawing_filename: '',
  po_percent: 15.0,            // 15% Profit & Overheads
  vat_percent: 7.5,             // 7.5% Nigerian VAT
  swamp_premium_percent: 0.0,   // Swamp / Terrain Multiplier
  subtotal: 0,
  po_amount: 0,
  vat_amount: 0,
  grand_total: 0,
  items: [],
};

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [activeProject, setActiveProject] = useState<Project>(DEFAULT_NEW_PROJECT);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isProcessingTakeoff, setIsProcessingTakeoff] = useState(false);
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch all projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Switch to or create a new project
  const handleNewProject = () => {
    const newId = 'proj-' + Date.now();
    setActiveProject({
      ...DEFAULT_NEW_PROJECT,
      id: newId,
      title: 'New Building Estimate ' + new Date().toLocaleDateString('en-GB'),
      items: [],
    });
    setHasUnsavedChanges(true);
    setCurrentView('editor');
  };

  // Open an existing project by ID
  const handleOpenProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (data.project) {
        setActiveProject({
          ...data.project,
          po_percent: data.project.po_percent ?? 15,
          vat_percent: data.project.vat_percent ?? 7.5,
          swamp_premium_percent: data.project.swamp_premium_percent ?? 0,
          items: data.project.items || [],
        });
        setHasUnsavedChanges(false);
        setCurrentView('editor');
      }
    } catch (err) {
      console.error('Error opening project:', err);
      alert('Could not open project.');
    }
  };

  // Delete project
  const handleDeleteProject = async (projectId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        if (activeProject.id === projectId) {
          setActiveProject(DEFAULT_NEW_PROJECT);
        }
        showToast('Project deleted successfully.');
      }
    } catch (err) {
      console.error('Delete failed:', err);
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

  // Add a new row to BOQ
  const handleAddItem = () => {
    setActiveProject((prev) => {
      const newNumber = prev.items.length + 1;
      const newItem: BoqItem = {
        id: `item-${Date.now()}-${newNumber}`,
        project_id: prev.id,
        item_number: newNumber,
        item: 'Blockwork',
        description: '225mm sandcrete hollow blockwork in cement mortar',
        unit: 'm2',
        qty: 100,
        rate: 14500,
        amount: 1450000,
      };
      return {
        ...prev,
        items: [...prev.items, newItem],
      };
    });
    setHasUnsavedChanges(true);
  };

  // Delete a row
  const handleDeleteItem = (index: number) => {
    setActiveProject((prev) => {
      const updated = prev.items.filter((_, i) => i !== index);
      // Renumber
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
  const handleSelectRateFromModal = (rateItem: StandardRate, region: 'lagos' | 'abuja' | 'ph') => {
    const selectedRate = rateItem[region];
    setActiveProject((prev) => {
      const newNum = prev.items.length + 1;
      const newItem: BoqItem = {
        id: `item-${Date.now()}-${newNum}`,
        project_id: prev.id,
        item_number: newNum,
        item: rateItem.item,
        description: rateItem.spec,
        unit: rateItem.unit,
        qty: 1,
        rate: selectedRate,
        amount: selectedRate,
      };
      return { ...prev, items: [...prev.items, newItem] };
    });
    setHasUnsavedChanges(true);
    showToast(`Added ${rateItem.item} at ${region.toUpperCase()} rate (₦${selectedRate.toLocaleString()}) to BOQ.`);
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

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setActiveProject(data.project);
      setHasUnsavedChanges(false);
      showToast('Project saved successfully to SQLite database!');
      loadProjects();
    } catch (err: any) {
      console.error(err);
      alert('Failed to save project: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate dynamic totals for active project
  const calculatedTotals = calculateBoqTotals(
    activeProject.items,
    activeProject.po_percent,
    activeProject.vat_percent,
    activeProject.swamp_premium_percent
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* App Header with Brand & Navigation */}
      <Header
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onNewProject={handleNewProject}
        onOpenRatesModal={() => setIsRatesModalOpen(true)}
        activeProjectTitle={activeProject.title}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-sm border border-emerald-700 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {currentView === 'dashboard' ? (
          /* Feature 1: Project Dashboard */
          <ProjectDashboard
            projects={projects}
            loading={loadingProjects}
            onOpenProject={handleOpenProject}
            onNewProject={handleNewProject}
            onDeleteProject={handleDeleteProject}
          />
        ) : (
          /* Takeoff & BOQ Editor Workspace */
          <div className="space-y-6">
            
            {/* Project Details Meta Card */}
            <ProjectMetaCard
              project={activeProject}
              onChange={(field, val) => {
                setActiveProject((prev) => ({ ...prev, [field]: val }));
                setHasUnsavedChanges(true);
              }}
            />

            {/* Feature 2 & 3: Drawing Upload & AI Takeoff Engine */}
            <DrawingUploader
              onTakeoffSuccess={handleTakeoffSuccess}
              isProcessing={isProcessingTakeoff}
              setIsProcessing={setIsProcessingTakeoff}
            />

            {/* Feature 4 & 5: Editable BOQ Spreadsheet Table */}
            <BoqTable
              items={activeProject.items}
              onUpdateItem={handleUpdateItem}
              onAddItem={handleAddItem}
              onDeleteItem={handleDeleteItem}
              onApplyMarketRates={handleApplyMarketRates}
            />

            {/* Feature 6: Subtotal, 15% P&O, 7.5% VAT, Terrain Multiplier & Grand Total */}
            <FinancialSummary
              subtotal={calculatedTotals.subtotal}
              poPercent={activeProject.po_percent}
              setPoPercent={(val) => {
                setActiveProject((prev) => ({ ...prev, po_percent: val }));
                setHasUnsavedChanges(true);
              }}
              vatPercent={activeProject.vat_percent}
              setVatPercent={(val) => {
                setActiveProject((prev) => ({ ...prev, vat_percent: val }));
                setHasUnsavedChanges(true);
              }}
              swampPremiumPercent={activeProject.swamp_premium_percent}
              setSwampPremiumPercent={(val) => {
                setActiveProject((prev) => ({ ...prev, swamp_premium_percent: val }));
                setHasUnsavedChanges(true);
              }}
              grandTotal={calculatedTotals.grandTotal}
            />

            {/* Feature 7 & 8: Export Excel, Export PDF, Save to SQLite */}
            <ExportActions
              project={activeProject}
              items={activeProject.items}
              onSaveProject={handleSaveProject}
              isSaving={isSaving}
              hasUnsavedChanges={hasUnsavedChanges}
            />

          </div>
        )}

      </main>

      {/* NICE TO HAVE: Standard Nigerian Cost & Rate Index Modal */}
      <NigerianRatesModal
        isOpen={isRatesModalOpen}
        onClose={() => setIsRatesModalOpen(false)}
        onSelectRate={handleSelectRateFromModal}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Let's Estimate - AI Bill of Quantities (BOQ) Tool for Builders in Nigeria</span>
          <span className="text-slate-400">Powered by Google Gemini 2.5 Flash Vision & SQLite</span>
        </div>
      </footer>

    </div>
  );
}

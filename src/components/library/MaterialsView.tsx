import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Building2, 
  Package, 
  Truck, 
  Calculator, 
  ExternalLink, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Coins,
  ShieldCheck,
  Calendar,
  Upload,
  Download,
  Plus,
  Edit3,
  Trash2,
  SlidersHorizontal,
  Users,
  Wrench,
  Percent,
  Check,
  FileText,
  Sparkles
} from 'lucide-react';
import { Project, LibraryRateItem, MaterialMarketItem } from '../../types';
import { safeFetchJson } from '../../utils/api';
import { formatNaira, formatNumber } from '../../utils/format';
import { RateBuilderCalculator } from './RateBuilderCalculator';

interface MaterialsViewProps {
  activeProject?: Project;
  onNavigateToSuppliers?: () => void;
  onApplyRateToBoq?: (item: { item: string; description: string; unit: string; rate: number; section: string }) => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  activeProject,
  onNavigateToSuppliers,
  onApplyRateToBoq
}) => {
  const [activeTab, setActiveTab] = useState<'rates_library' | 'rate_builder' | 'project_requirements' | 'mix_calculator'>('rates_library');
  
  // Rate items and filters
  const [rates, setRates] = useState<LibraryRateItem[]>([]);
  const [loadingRates, setLoadingRates] = useState(true);
  const [activeResourceTab, setActiveResourceTab] = useState<'All' | 'Material' | 'Plant' | 'Labour' | 'Preliminaries'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [benchmarkDate, setBenchmarkDate] = useState(new Date().toISOString().split('T')[0]);

  // Bulk Import Modal State
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkImportParsed, setBulkImportParsed] = useState<any[]>([]);
  const [bulkImportError, setBulkImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  // Bulk Adjust Modal State
  const [isBulkAdjustOpen, setIsBulkAdjustOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<'All' | 'Material' | 'Plant' | 'Labour' | 'Preliminaries'>('All');
  const [adjustCategory, setAdjustCategory] = useState('');
  const [adjustPercent, setAdjustPercent] = useState<number>(5);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState('');

  // Single Rate Modal State (Small Scale Edit / Add)
  const [isSingleRateModalOpen, setIsSingleRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<LibraryRateItem | null>(null);
  const [singleRateForm, setSingleRateForm] = useState({
    item: '',
    type: 'Material' as 'Material' | 'Plant' | 'Labour' | 'Preliminaries',
    category: 'General Building',
    specification: '',
    unit: 'm²',
    lagosRate: 0,
    abujaRate: 0,
    portHarcourtRate: 0,
    northernRate: 0
  });
  const [isSavingSingleRate, setIsSavingSingleRate] = useState(false);

  // Project Materials Takeoff State
  const [projectMaterials, setProjectMaterials] = useState<any>(null);
  const [loadingProjectMats, setLoadingProjectMats] = useState(false);

  // Constituent Calculator State
  const [calcVolume, setCalcVolume] = useState<number>(10);
  const [calcGrade, setCalcGrade] = useState<'1:2:4' | '1:1.5:3' | '1:3:6'>('1:2:4');
  const [calcWastage, setCalcWastage] = useState<number>(5);

  // Fetch Rates from backend
  const loadRates = async () => {
    setLoadingRates(true);
    try {
      const { ok, data } = await safeFetchJson<{
        success: boolean;
        rates: LibraryRateItem[];
      }>('/api/rates');

      if (ok && data?.rates) {
        setRates(data.rates);
        setBenchmarkDate(new Date().toISOString().split('T')[0]);
      }
    } catch (e) {
      console.error('Failed to load library rates:', e);
    } finally {
      setLoadingRates(false);
    }
  };

  // Fetch Project Material Takeoff
  const loadProjectMaterials = async () => {
    if (!activeProject?.id) return;
    setLoadingProjectMats(true);
    try {
      const { ok, data } = await safeFetchJson<{
        success: boolean;
        summary: any;
      }>(`/api/projects/${activeProject.id}/materials`);

      if (ok && data?.summary) {
        setProjectMaterials(data.summary);
      }
    } catch (e) {
      console.error('Failed to load project materials schedule:', e);
    } finally {
      setLoadingProjectMats(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  useEffect(() => {
    if (activeTab === 'project_requirements') {
      loadProjectMaterials();
    }
  }, [activeTab, activeProject?.id]);

  // Categories list extracted from current rates
  const availableCategories = ['All', ...Array.from(new Set(
    rates
      .filter(r => activeResourceTab === 'All' || r.type === activeResourceTab)
      .map(r => r.category)
      .filter(Boolean)
  ))];

  // Filtered rates
  const filteredRates = rates.filter(item => {
    const matchesSearch = 
      item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.specification || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.keySuppliers || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesResource = activeResourceTab === 'All' || item.type === activeResourceTab;
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

    return matchesSearch && matchesResource && matchesCategory;
  });

  // Calculate concrete constituents
  const calculateConstituents = () => {
    const vol = Number(calcVolume) || 0;
    const wasteFactor = 1 + (calcWastage / 100);
    
    let cementBagsPerM3 = 6.4;
    let sandTonnesPerM3 = 0.65;
    let graniteTonnesPerM3 = 1.35;

    if (calcGrade === '1:1.5:3') {
      cementBagsPerM3 = 7.6;
      sandTonnesPerM3 = 0.60;
      graniteTonnesPerM3 = 1.30;
    } else if (calcGrade === '1:3:6') {
      cementBagsPerM3 = 4.4;
      sandTonnesPerM3 = 0.72;
      graniteTonnesPerM3 = 1.40;
    }

    const totalCementBags = Math.ceil(vol * cementBagsPerM3 * wasteFactor);
    const totalSandTonnes = Number((vol * sandTonnesPerM3 * wasteFactor).toFixed(2));
    const totalGraniteTonnes = Number((vol * graniteTonnesPerM3 * wasteFactor).toFixed(2));

    const cementCost = totalCementBags * 9500;
    const sandCost = totalSandTonnes * 6500;
    const graniteCost = totalGraniteTonnes * 11500;
    const totalCost = cementCost + sandCost + graniteCost;

    return {
      totalCementBags,
      totalSandTonnes,
      totalGraniteTonnes,
      sandTippers20t: (totalSandTonnes / 20).toFixed(1),
      graniteTippers30t: (totalGraniteTonnes / 30).toFixed(1),
      cementCost,
      sandCost,
      graniteCost,
      totalCost,
      costPerM3: vol > 0 ? Math.round(totalCost / vol) : 0
    };
  };

  const mixSummary = calculateConstituents();

  // =========================================================================
  // SINGLE RATE (SMALL SCALE) HANDLERS
  // =========================================================================
  const openAddRateModal = () => {
    setEditingRate(null);
    setSingleRateForm({
      item: '',
      type: activeResourceTab === 'All' ? 'Material' : activeResourceTab,
      category: 'General Building',
      specification: '',
      unit: 'm²',
      lagosRate: 0,
      abujaRate: 0,
      portHarcourtRate: 0,
      northernRate: 0
    });
    setIsSingleRateModalOpen(true);
  };

  const openEditRateModal = (rate: LibraryRateItem) => {
    setEditingRate(rate);
    setSingleRateForm({
      item: rate.item,
      type: rate.type,
      category: rate.category,
      specification: rate.specification || '',
      unit: rate.unit,
      lagosRate: rate.lagosRate || 0,
      abujaRate: rate.abujaRate || 0,
      portHarcourtRate: rate.portHarcourtRate || 0,
      northernRate: rate.northernRate || 0
    });
    setIsSingleRateModalOpen(true);
  };

  const handleSaveSingleRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleRateForm.item.trim() || !singleRateForm.unit.trim()) {
      alert('Please provide an item title and unit of measurement.');
      return;
    }

    setIsSavingSingleRate(true);
    try {
      const url = editingRate ? `/api/rates/${editingRate.id}` : '/api/rates';
      const method = editingRate ? 'PUT' : 'POST';
      
      const payload = {
        ...singleRateForm,
        id: editingRate?.id,
        trend: editingRate?.trend || 'stable',
        trendPercent: editingRate?.trendPercent || 0,
        isCustom: true
      };

      const { ok, error } = await safeFetchJson(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!ok) {
        throw new Error(error || 'Failed to save rate');
      }

      await loadRates();
      setIsSingleRateModalOpen(false);
    } catch (e: any) {
      alert('Failed to save rate: ' + e.message);
    } finally {
      setIsSavingSingleRate(false);
    }
  };

  const handleDeleteRate = async (rateId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to remove "${itemName}" from the rates library?`)) {
      return;
    }

    try {
      const { ok, error } = await safeFetchJson(`/api/rates/${rateId}`, {
        method: 'DELETE'
      });

      if (!ok) {
        throw new Error(error || 'Failed to delete rate');
      }

      setRates(prev => prev.filter(r => r.id !== rateId));
    } catch (e: any) {
      alert('Failed to delete rate: ' + e.message);
    }
  };

  // =========================================================================
  // BULK IMPORT (LARGE SCALE) PARSER & HANDLER
  // =========================================================================
  const parseCsvText = (text: string) => {
    setBulkImportError('');
    if (!text.trim()) {
      setBulkImportParsed([]);
      return;
    }

    try {
      const lines = text.trim().split(/\r?\n/);
      if (lines.length === 0) return;

      const parsedItems: any[] = [];
      const firstLine = lines[0].toLowerCase();
      const hasHeader = 
        firstLine.includes('item') || 
        firstLine.includes('type') || 
        firstLine.includes('rate') || 
        firstLine.includes('category');

      const dataLines = hasHeader ? lines.slice(1) : lines;

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue;

        // Split by comma or tab
        const delimiter = line.includes('\t') ? '\t' : ',';
        const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));

        if (cols.length < 2) continue;

        // Supported column structure:
        // Type, Category, Item, Specification, Unit, LagosRate, AbujaRate, PortHarcourtRate, NorthernRate
        // OR:
        // Item, Unit, LagosRate, Category, Type, Specification
        let itemType: 'Material' | 'Plant' | 'Labour' | 'Preliminaries' = 'Material';
        let category = 'General';
        let itemName = '';
        let specification = '';
        let unit = 'Nr';
        let lagos = 0;
        let abuja = 0;
        let portHarcourt = 0;
        let northern = 0;

        if (['material', 'plant', 'labour', 'preliminaries', 'preliminary'].includes(cols[0].toLowerCase())) {
          // Format 1: Type, Category, Item, Specification, Unit, LagosRate, AbujaRate, PortHarcourtRate, NorthernRate
          const rawType = cols[0].toLowerCase();
          if (rawType.startsWith('plant')) itemType = 'Plant';
          else if (rawType.startsWith('labour') || rawType.startsWith('labor')) itemType = 'Labour';
          else if (rawType.startsWith('prelim')) itemType = 'Preliminaries';
          else itemType = 'Material';

          category = cols[1] || 'General';
          itemName = cols[2] || '';
          specification = cols[3] || '';
          unit = cols[4] || 'Nr';
          lagos = parseFloat((cols[5] || '0').replace(/[^0-9.]/g, '')) || 0;
          abuja = parseFloat((cols[6] || '0').replace(/[^0-9.]/g, '')) || Math.round(lagos * 1.05);
          portHarcourt = parseFloat((cols[7] || '0').replace(/[^0-9.]/g, '')) || Math.round(lagos * 1.08);
          northern = parseFloat((cols[8] || '0').replace(/[^0-9.]/g, '')) || Math.round(lagos * 0.98);
        } else {
          // Format 2: Item, Category, Unit, LagosRate, [AbujaRate], [Type], [Specification]
          itemName = cols[0];
          category = cols[1] || 'General';
          unit = cols[2] || 'm²';
          lagos = parseFloat((cols[3] || '0').replace(/[^0-9.]/g, '')) || 0;
          abuja = cols[4] ? parseFloat(cols[4].replace(/[^0-9.]/g, '')) || Math.round(lagos * 1.05) : Math.round(lagos * 1.05);
          portHarcourt = cols[5] ? parseFloat(cols[5].replace(/[^0-9.]/g, '')) || Math.round(lagos * 1.08) : Math.round(lagos * 1.08);
          northern = cols[6] ? parseFloat(cols[6].replace(/[^0-9.]/g, '')) || Math.round(lagos * 0.98) : Math.round(lagos * 0.98);
          
          if (cols[7]) {
            const rawType = cols[7].toLowerCase();
            if (rawType.startsWith('plant')) itemType = 'Plant';
            else if (rawType.startsWith('labour') || rawType.startsWith('labor')) itemType = 'Labour';
            else if (rawType.startsWith('prelim')) itemType = 'Preliminaries';
            else itemType = 'Material';
          }
          specification = cols[8] || '';
        }

        if (itemName) {
          parsedItems.push({
            type: itemType,
            category,
            item: itemName,
            specification,
            unit,
            lagosRate: lagos,
            abujaRate: abuja || Math.round(lagos * 1.05),
            portHarcourtRate: portHarcourt || Math.round(lagos * 1.08),
            northernRate: northern || Math.round(lagos * 0.98),
            trend: 'stable',
            trendPercent: 0,
            isCustom: true
          });
        }
      }

      setBulkImportParsed(parsedItems);
    } catch (err: any) {
      setBulkImportError('Failed to parse data: ' + err.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setBulkImportText(content);
        parseCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  const loadSampleBulkData = () => {
    const sample = `Type,Category,Item,Specification,Unit,LagosRate,AbujaRate,PortHarcourtRate,NorthernRate
Material,Concrete & Aggregates,Dangote 42.5R Portland Cement,50kg bag standard delivery to site,Bag,9500,9800,10200,9200
Material,Masonry & Blocks,225mm Vibrated Hollow Sandcrete Block,Machine-vibrated 9-inch loadbearing block,Nr,850,900,920,800
Plant,Plant & Equipment Hire,500L Winget Concrete Mixer,Diesel powered mixer with batch skip wet lease,Day,45000,48000,52000,44000
Plant,Plant & Equipment Hire,50mm Honda Poker Vibrator,Internal immersion concrete poker with 5m needle,Day,12000,13500,14000,11500
Labour,Labour & Subcontractors,Master Iron Bender / Steel Fixer,Daily trade rate cutting and fixing reinforcement,Day,9000,9500,10500,8500
Labour,Labour & Subcontractors,General Construction Laborer / Helper,Site assistant mixing wheeling and placing concrete,Day,5000,5500,6000,4500
Preliminaries,Site Facilities & Setup,Temporary Site Security Gate & Hoarding,2.4m profiled steel sheet fencing per linear metre,m,18500,19500,21000,17500
Preliminaries,Water & Dewatering,Submersible Dewatering Pump 3-inch,3-inch dirty water dewatering pump with hoses,Day,15000,16000,18000,14500`;

    setBulkImportText(sample);
    parseCsvText(sample);
  };

  const executeBulkImport = async () => {
    if (bulkImportParsed.length === 0) {
      alert('No valid rates to import. Please paste or upload CSV data first.');
      return;
    }

    setIsImporting(true);
    try {
      const { ok, data, error } = await safeFetchJson<{
        success: boolean;
        saved: number;
        message: string;
      }>('/api/rates/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates: bulkImportParsed })
      });

      if (!ok) {
        throw new Error(error || 'Failed to import rates');
      }

      setImportSuccessMsg(`Successfully imported and individually indexed ${data?.saved || bulkImportParsed.length} rates into the database!`);
      await loadRates();
      setTimeout(() => {
        setIsBulkImportOpen(false);
        setImportSuccessMsg('');
        setBulkImportText('');
        setBulkImportParsed([]);
      }, 2500);
    } catch (e: any) {
      alert('Bulk import failed: ' + e.message);
    } finally {
      setIsImporting(false);
    }
  };

  // =========================================================================
  // BULK ADJUST (LARGE SCALE) HANDLER
  // =========================================================================
  const executeBulkAdjust = async () => {
    if (typeof adjustPercent !== 'number' || adjustPercent === 0) {
      alert('Please specify a non-zero percentage adjustment.');
      return;
    }

    setIsAdjusting(true);
    try {
      const { ok, data, error } = await safeFetchJson<{
        success: boolean;
        count: number;
        message: string;
      }>('/api/rates/bulk-adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          percentChange: adjustPercent,
          type: adjustType === 'All' ? undefined : adjustType,
          category: adjustCategory || undefined
        })
      });

      if (!ok) {
        throw new Error(error || 'Failed to apply bulk adjustment');
      }

      setAdjustSuccessMsg(`Adjusted ${data?.count || 0} rates by ${adjustPercent > 0 ? '+' : ''}${adjustPercent}%.`);
      await loadRates();
      setTimeout(() => {
        setIsBulkAdjustOpen(false);
        setAdjustSuccessMsg('');
      }, 2000);
    } catch (e: any) {
      alert('Bulk adjust failed: ' + e.message);
    } finally {
      setIsAdjusting(false);
    }
  };

  // =========================================================================
  // EXPORT CURRENT RATES TO CSV
  // =========================================================================
  const handleExportCsv = () => {
    const headers = ['Type', 'Category', 'Item', 'Specification', 'Unit', 'LagosRate', 'AbujaRate', 'PortHarcourtRate', 'NorthernRate', 'Trend'];
    const rows = rates.map(r => [
      `"${r.type}"`,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      `"${(r.item || '').replace(/"/g, '""')}"`,
      `"${(r.specification || '').replace(/"/g, '""')}"`,
      `"${r.unit}"`,
      r.lagosRate,
      r.abujaRate,
      r.portHarcourtRate,
      r.northernRate,
      r.trend || 'stable'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nigerian_Library_Rates_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="materials-library-view" className="max-w-7xl mx-auto space-y-6 pb-16">
      
      {/* 1. Header & Explanatory Context */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                Library Intelligence
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                Nigerian Geopolitical Zone Benchmarks
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2.5">
              <Layers className="w-7 h-7 text-blue-700" />
              National Construction Rates &amp; Market Intelligence
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              <strong>Supply &amp; Market Resource Center:</strong> Access verified building rates across <strong>Materials</strong>, <strong>Plant &amp; Heavy Equipment</strong>, <strong>Labour &amp; Trades</strong>, and <strong>Preliminaries</strong> for Nigerian zones (Lagos, Abuja FCT, Port Harcourt Niger Delta, and Northern Hub). Import or adjust rates in large scale, edit individual rates, and synthesize unit rates with the built-in Rate Calculator.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {onNavigateToSuppliers && (
              <button
                type="button"
                onClick={onNavigateToSuppliers}
                className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>Suppliers &amp; Vendors Directory</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Main View Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('rates_library')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'rates_library'
                ? 'bg-blue-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Rates &amp; Prices Library</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rate_builder')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'rate_builder'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Rate Builder &amp; Analysis Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('project_requirements')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'project_requirements'
                ? 'bg-blue-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Project Material Takeoff</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mix_calculator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'mix_calculator'
                ? 'bg-blue-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Mix Ratios &amp; Constituents</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: RATES & PRICES LIBRARY (With Bulk & Small Scale Operations)  */}
      {/* =================================================================== */}
      {activeTab === 'rates_library' && (
        <div className="space-y-4">
          
          {/* Top Bar: Resource Tabs + Large/Small Scale Action Buttons */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Resource Type Tabs (Materials, Plants, Labour, Preliminaries) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {(['All', 'Material', 'Plant', 'Labour', 'Preliminaries'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setActiveResourceTab(tab);
                      setSelectedCategory('All');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                      activeResourceTab === tab
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'All' && <Coins className="w-3.5 h-3.5" />}
                    {tab === 'Material' && <Package className="w-3.5 h-3.5 text-blue-400" />}
                    {tab === 'Plant' && <Truck className="w-3.5 h-3.5 text-amber-400" />}
                    {tab === 'Labour' && <Users className="w-3.5 h-3.5 text-emerald-400" />}
                    {tab === 'Preliminaries' && <Wrench className="w-3.5 h-3.5 text-purple-400" />}
                    <span>{tab === 'All' ? 'All Resources' : tab === 'Material' ? 'Materials' : tab === 'Plant' ? 'Plant & Equipment' : tab === 'Labour' ? 'Labour & Trades' : 'Preliminaries'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15 text-inherit font-mono">
                      {tab === 'All' 
                        ? rates.length 
                        : rates.filter(r => r.type === tab).length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Action Buttons: Bulk Import, Bulk Adjust, Add Single Rate, Export */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsBulkImportOpen(true)}
                  className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Import large scale rates from CSV / Excel"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Bulk Import Rates</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBulkAdjustOpen(true)}
                  className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Apply percentage adjustment across rates"
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Bulk Adjust (%)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Export rates table to CSV / Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={openAddRateModal}
                  className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Single Rate</span>
                </button>
              </div>
            </div>

            {/* Search & Category Filter Pills */}
            <div className="flex flex-col md:flex-row gap-3 pt-3 border-t border-slate-100">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeResourceTab === 'All' ? 'rates' : activeResourceTab.toLowerCase() + ' items'} by trade name, specification, unit, or category...`}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-500 shrink-0">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Zone Benchmark: <strong>{benchmarkDate}</strong></span>
              </div>
            </div>

            {/* Category Filter Pills */}
            {availableCategories.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1">Category:</span>
                {availableCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer text-[11px] ${
                      selectedCategory === cat 
                        ? 'bg-blue-800 text-white font-bold shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rates Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loadingRates ? (
              <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-medium">Loading Nigerian construction rate library...</p>
              </div>
            ) : filteredRates.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No matching rates found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try clearing your search query or add a new rate using the buttons above.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setActiveResourceTab('All'); }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-700"
                  >
                    Reset Filters
                  </button>
                  <button
                    type="button"
                    onClick={openAddRateModal}
                    className="px-3 py-1.5 rounded-lg bg-emerald-800 text-xs font-bold text-white"
                  >
                    + Add Rate
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Item &amp; Specification</th>
                      <th className="py-3 px-3">Type / Category</th>
                      <th className="py-3 px-3">Unit</th>
                      <th className="py-3 px-3 text-right">Lagos Benchmark</th>
                      <th className="py-3 px-3 text-right">Abuja (FCT)</th>
                      <th className="py-3 px-3 text-right">Port Harcourt</th>
                      <th className="py-3 px-3 text-right">Northern Hub</th>
                      <th className="py-3 px-3 text-center">Trend</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredRates.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{item.item}</span>
                            {item.isCustom && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                Custom
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{item.specification}</div>
                          {item.keySuppliers && item.keySuppliers.length > 0 && (
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              <span className="text-[9px] font-bold text-slate-400">Key Vendors:</span>
                              {item.keySuppliers.slice(0, 2).map((s, i) => (
                                <span key={i} className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.type === 'Material' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                            item.type === 'Plant' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            item.type === 'Labour' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            'bg-purple-50 text-purple-800 border border-purple-200'
                          }`}>
                            <span>{item.type}</span>
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5">{item.category}</div>
                        </td>

                        <td className="py-3 px-3 text-slate-700 font-mono font-bold whitespace-nowrap">
                          {item.unit}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatNaira(item.lagosRate)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatNaira(item.abujaRate)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatNaira(item.portHarcourtRate)}
                          <span className="block text-[9px] text-amber-700 font-sans font-medium">+Swamp Log</span>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatNaira(item.northernRate)}
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {item.trend === 'up' && (
                            <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700">
                              <TrendingUp className="w-3 h-3" />
                              <span>+{item.trendPercent || 4}%</span>
                            </span>
                          )}
                          {item.trend === 'down' && (
                            <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              <TrendingDown className="w-3 h-3" />
                              <span>-{item.trendPercent || 3}%</span>
                            </span>
                          )}
                          {(!item.trend || item.trend === 'stable') && (
                            <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              <Minus className="w-3 h-3" />
                              <span>Stable</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {onApplyRateToBoq && (
                              <button
                                type="button"
                                onClick={() => onApplyRateToBoq({
                                  item: item.item,
                                  description: item.specification,
                                  unit: item.unit,
                                  rate: item.lagosRate,
                                  section: item.category
                                })}
                                className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-bold transition cursor-pointer"
                                title="Add this item to active project BOQ"
                              >
                                + Use
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => openEditRateModal(item)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                              title="Edit rate (small scale)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteRate(item.id, item.item)}
                              className="p-1 rounded text-slate-400 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                              title="Delete rate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: RATE BUILDER & ANALYSIS CALCULATOR                           */}
      {/* =================================================================== */}
      {activeTab === 'rate_builder' && (
        <RateBuilderCalculator 
          onSaveRateToLibrary={async (rateData) => {
            const { ok, error } = await safeFetchJson('/api/rates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(rateData)
            });
            if (!ok) {
              throw new Error(error || 'Failed to save rate to library');
            }
            await loadRates();
          }}
          onApplyRateToBoq={onApplyRateToBoq}
          availableLibraryRates={rates}
        />
      )}

      {/* =================================================================== */}
      {/* TAB 3: ACTIVE PROJECT MATERIAL TAKEOFF                              */}
      {/* =================================================================== */}
      {activeTab === 'project_requirements' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Material Takeoff Schedule for: <span className="text-blue-800">{activeProject?.title || 'Active Project'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Algorithmic bill analysis extracting aggregate bags, rebar tonnage, sand tippers, and masonry blocks from your line items.
                </p>
              </div>

              <button
                type="button"
                onClick={loadProjectMaterials}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingProjectMats ? 'animate-spin' : ''}`} />
                <span>Recalculate Schedule</span>
              </button>
            </div>

            {loadingProjectMats ? (
              <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-medium">Computing bill material takeoff requirements...</p>
              </div>
            ) : projectMaterials ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                {/* Cement */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ordinary Portland Cement</span>
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {formatNumber(projectMaterials.cement?.totalBags || 0)} <span className="text-xs font-normal text-slate-500">Bags (50kg)</span>
                  </div>
                  <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                    Trailer Loads (600/load): <strong>{Math.ceil((projectMaterials.cement?.totalBags || 0) / 600)} Trailers</strong>
                  </div>
                  <div className="text-xs font-bold text-emerald-800">
                    Est: {formatNaira((projectMaterials.cement?.totalBags || 0) * 9500)}
                  </div>
                </div>

                {/* River Sand */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sharp Concrete Sand</span>
                    <Truck className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {formatNumber(projectMaterials.sand?.totalTonnes || 0)} <span className="text-xs font-normal text-slate-500">Tonnes</span>
                  </div>
                  <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                    20t Tipper Trips: <strong>{Math.ceil((projectMaterials.sand?.totalTonnes || 0) / 20)} Tippers</strong>
                  </div>
                  <div className="text-xs font-bold text-emerald-800">
                    Est: {formatNaira((projectMaterials.sand?.totalTonnes || 0) * 6500)}
                  </div>
                </div>

                {/* Granite */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Crushed Granite (20mm)</span>
                    <Layers className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {formatNumber(projectMaterials.granite?.totalTonnes || 0)} <span className="text-xs font-normal text-slate-500">Tonnes</span>
                  </div>
                  <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                    30t Tipper Trips: <strong>{Math.ceil((projectMaterials.granite?.totalTonnes || 0) / 30)} Tippers</strong>
                  </div>
                  <div className="text-xs font-bold text-emerald-800">
                    Est: {formatNaira((projectMaterials.granite?.totalTonnes || 0) * 11500)}
                  </div>
                </div>

                {/* Rebar */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">High-Yield Rebars (TMT)</span>
                    <Coins className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {formatNumber(projectMaterials.rebar?.totalTonnes || 0)} <span className="text-xs font-normal text-slate-500">Tonnes</span>
                  </div>
                  <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                    Estimated 12m Bars: <strong>~{Math.round((projectMaterials.rebar?.totalTonnes || 0) * 105)} Bars</strong>
                  </div>
                  <div className="text-xs font-bold text-emerald-800">
                    Est: {formatNaira((projectMaterials.rebar?.totalTonnes || 0) * 1420000)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                No material requirements computed yet for this project.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: CONSTITUENT MIX CALCULATOR                                   */}
      {/* =================================================================== */}
      {activeTab === 'mix_calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-700" />
              Concrete Batch Mix Estimator
            </h3>
            <p className="text-xs text-slate-500">
              Calculate raw constituent materials (cement, sharp sand, aggregate) required for wet cast structural concrete according to Nigerian BS 8110 standards.
            </p>

            <div className="space-y-3.5 pt-2 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Concrete Volume (m³)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={calcVolume}
                  onChange={(e) => setCalcVolume(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold font-mono focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Structural Concrete Mix Ratio</label>
                <select
                  value={calcGrade}
                  onChange={(e) => setCalcGrade(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="1:2:4">1:2:4 (Grade 20) - Standard Slabs, Beams &amp; Columns</option>
                  <option value="1:1.5:3">1:1.5:3 (Grade 25) - Heavy Columns &amp; Raft Foundations</option>
                  <option value="1:3:6">1:3:6 (Grade 15) - Blinding &amp; Mass Concrete Fill</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Site Wastage &amp; Compaction Factor: <span className="text-blue-700">{calcWastage}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={calcWastage}
                  onChange={(e) => setCalcWastage(parseInt(e.target.value) || 0)}
                  className="w-full accent-blue-700 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Constituent Requirements for {calcVolume} m³</span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Concrete Mix Bill &amp; Tipper Logistics
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 block">Cement Required:</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {mixSummary.totalCementBags} <span className="text-xs font-normal text-slate-500">Bags</span>
                </div>
                <div className="text-xs font-bold text-emerald-800 mt-2">
                  {formatNaira(mixSummary.cementCost)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 block">Sharp Sand Required:</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {mixSummary.totalSandTonnes} <span className="text-xs font-normal text-slate-500">Tonnes</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">~{mixSummary.sandTippers20t} Tippers (20t)</div>
                <div className="text-xs font-bold text-emerald-800 mt-1">
                  {formatNaira(mixSummary.sandCost)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 block">Crushed Granite:</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {mixSummary.totalGraniteTonnes} <span className="text-xs font-normal text-slate-500">Tonnes</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">~{mixSummary.graniteTippers30t} Tippers (30t)</div>
                <div className="text-xs font-bold text-emerald-800 mt-1">
                  {formatNaira(mixSummary.graniteCost)}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-emerald-800 block">Estimated Materials Only Rate</span>
                <span className="text-xl font-black text-emerald-950 font-mono">
                  {formatNaira(mixSummary.totalCost)} Total ({formatNaira(mixSummary.costPerM3)} / m³)
                </span>
              </div>

              {onApplyRateToBoq && (
                <button
                  type="button"
                  onClick={() => onApplyRateToBoq({
                    item: `In-situ Concrete ${calcGrade} Mix`,
                    description: `Batch mix concrete constituent rate: ${mixSummary.totalCementBags} bags cement, ${mixSummary.totalSandTonnes}t sand, ${mixSummary.totalGraniteTonnes}t granite`,
                    unit: 'm³',
                    rate: mixSummary.costPerM3,
                    section: 'Concrete Works'
                  })}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Use Concrete Rate in BOQ</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: BULK IMPORT RATES (LARGE SCALE IMPORT)                     */}
      {/* =================================================================== */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-700" />
                  Bulk Import Rates (Large Scale)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Import dozens or hundreds of rates for Materials, Plants, Labour, or Preliminaries. Each rate is individually indexed and saved into your database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkImportOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {importSuccessMsg ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-emerald-900">{importSuccessMsg}</h3>
                <p className="text-xs text-slate-500">Closing window and refreshing rate tables...</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                
                {/* File Upload or Text Paste Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800 block">Upload CSV File</span>
                    <span className="text-[11px] text-slate-500">Choose a .csv file exported from Excel or Google Sheets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold cursor-pointer shadow-xs">
                      <span>Browse CSV</span>
                      <input 
                        type="file" 
                        accept=".csv,.txt" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </label>

                    <button
                      type="button"
                      onClick={loadSampleBulkData}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Load Sample Template</span>
                    </button>
                  </div>
                </div>

                {/* Paste Text Area */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Or Paste CSV / Tab-Separated Data from Excel:
                  </label>
                  <textarea
                    rows={6}
                    value={bulkImportText}
                    onChange={(e) => {
                      setBulkImportText(e.target.value);
                      parseCsvText(e.target.value);
                    }}
                    placeholder={`Type,Category,Item,Specification,Unit,LagosRate,AbujaRate,PortHarcourtRate,NorthernRate\nMaterial,Concrete,Portland Cement 42.5R,50kg bag,Bag,9500,9800,10200,9200\nPlant,Hire,500L Concrete Mixer,Diesel mixer wet lease,Day,45000,48000,52000,44000\nLabour,Masonry,Master Blocklayer,Laying blocks,Day,9000,9500,10500,8500`}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] focus:bg-white focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Supported format: <strong>Type</strong> (Material, Plant, Labour, Preliminaries), <strong>Category</strong>, <strong>Item Title</strong>, <strong>Specification</strong>, <strong>Unit</strong>, <strong>Lagos Rate</strong>, <strong>Abuja Rate</strong>, <strong>Port Harcourt Rate</strong>, <strong>Northern Rate</strong>.
                  </span>
                </div>

                {bulkImportError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
                    {bulkImportError}
                  </div>
                )}

                {/* Parsed Preview Table */}
                {bulkImportParsed.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">
                        Parsed Preview ({bulkImportParsed.length} rates ready to import):
                      </span>
                      <span className="text-[11px] text-emerald-700 font-bold">
                        ✓ All fields validated
                      </span>
                    </div>

                    <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                          <tr>
                            <th className="p-2">Type</th>
                            <th className="p-2">Category</th>
                            <th className="p-2">Item Title</th>
                            <th className="p-2">Unit</th>
                            <th className="p-2 text-right">Lagos</th>
                            <th className="p-2 text-right">Abuja</th>
                            <th className="p-2 text-right">PH</th>
                            <th className="p-2 text-right">North</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {bulkImportParsed.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 font-bold text-slate-700">{item.type}</td>
                              <td className="p-2 text-slate-500">{item.category}</td>
                              <td className="p-2 font-bold text-slate-900">{item.item}</td>
                              <td className="p-2 font-mono text-slate-600">{item.unit}</td>
                              <td className="p-2 text-right font-mono font-bold text-slate-900">{formatNaira(item.lagosRate)}</td>
                              <td className="p-2 text-right font-mono text-slate-700">{formatNaira(item.abujaRate)}</td>
                              <td className="p-2 text-right font-mono text-slate-700">{formatNaira(item.portHarcourtRate)}</td>
                              <td className="p-2 text-right font-mono text-slate-700">{formatNaira(item.northernRate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer buttons */}
                <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBulkImportOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={isImporting || bulkImportParsed.length === 0}
                    onClick={executeBulkImport}
                    className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isImporting ? 'Importing Rates...' : `Import & Save ${bulkImportParsed.length} Rates Individually`}</span>
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: BULK ADJUST RATES (LARGE SCALE ADJUSTMENT)                 */}
      {/* =================================================================== */}
      {isBulkAdjustOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Percent className="w-5 h-5 text-amber-700" />
                  Bulk Adjust Rates (Large Scale)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Apply a percentage increase or decrease across rates to account for inflation, diesel, or currency shifts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkAdjustOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {adjustSuccessMsg ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-emerald-900">{adjustSuccessMsg}</h3>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Resource Type</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                  >
                    <option value="All">All Resources (Materials, Plants, Labour, Preliminaries)</option>
                    <option value="Material">Building Materials Only</option>
                    <option value="Plant">Plant &amp; Equipment Only</option>
                    <option value="Labour">Labour &amp; Subcontractors Only</option>
                    <option value="Preliminaries">Preliminaries &amp; Site Services Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Category (Optional)</label>
                  <select
                    value={adjustCategory}
                    onChange={(e) => setAdjustCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                  >
                    <option value="">All Categories in selected type</option>
                    {availableCategories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">Percentage Adjustment (%):</label>
                    <span className={`font-mono font-bold text-sm ${adjustPercent > 0 ? 'text-red-700' : adjustPercent < 0 ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {adjustPercent > 0 ? `+${adjustPercent}%` : `${adjustPercent}%`}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    value={adjustPercent}
                    onChange={(e) => setAdjustPercent(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 7.5 or -5"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900"
                  />
                  <div className="flex gap-2 mt-2">
                    {[+2.5, +5, +7.5, +10, -5].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAdjustPercent(p)}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700"
                      >
                        {p > 0 ? `+${p}%` : `${p}%`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                  <strong>Warning:</strong> This will adjust rates across Lagos, Abuja, Port Harcourt, and Northern zones by {adjustPercent > 0 ? `+${adjustPercent}%` : `${adjustPercent}%`}.
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBulkAdjustOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isAdjusting || adjustPercent === 0}
                    onClick={executeBulkAdjust}
                    className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Percent className="w-4 h-4" />
                    <span>{isAdjusting ? 'Applying Adjustment...' : 'Apply Bulk Adjustment'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: ADD / EDIT SINGLE RATE (SMALL SCALE OPERATION)             */}
      {/* =================================================================== */}
      {isSingleRateModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-700" />
                  {editingRate ? 'Edit Rate (Small Scale)' : 'Add Single Custom Rate'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define specific benchmark pricing across Nigerian geopolitical commercial centers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSingleRateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSingleRate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Title / Name *</label>
                <input
                  type="text"
                  required
                  value={singleRateForm.item}
                  onChange={(e) => setSingleRateForm({ ...singleRateForm, item: e.target.value })}
                  placeholder="e.g. 500L Concrete Mixer Hire or Grade 20 Concrete"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Resource Type *</label>
                  <select
                    value={singleRateForm.type}
                    onChange={(e) => setSingleRateForm({ ...singleRateForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                  >
                    <option value="Material">Material</option>
                    <option value="Plant">Plant &amp; Equipment</option>
                    <option value="Labour">Labour &amp; Trades</option>
                    <option value="Preliminaries">Preliminaries</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit of Measure *</label>
                  <input
                    type="text"
                    required
                    value={singleRateForm.unit}
                    onChange={(e) => setSingleRateForm({ ...singleRateForm, unit: e.target.value })}
                    placeholder="e.g. m³, m², Tonne, Day, Nr"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trade Category</label>
                <input
                  type="text"
                  value={singleRateForm.category}
                  onChange={(e) => setSingleRateForm({ ...singleRateForm, category: e.target.value })}
                  placeholder="e.g. Concrete Works or Masonry"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Specification / Description</label>
                <textarea
                  rows={2}
                  value={singleRateForm.specification}
                  onChange={(e) => setSingleRateForm({ ...singleRateForm, specification: e.target.value })}
                  placeholder="Technical standards, equipment horsepower, gang productivity, or delivery terms..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 resize-none"
                />
              </div>

              {/* Regional Pricing */}
              <div className="pt-2 border-t border-slate-100">
                <span className="font-extrabold text-slate-900 block mb-2">Regional Pricing (₦)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Lagos Benchmark (₦)</label>
                    <input
                      type="number"
                      required
                      value={singleRateForm.lagosRate}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setSingleRateForm({
                          ...singleRateForm,
                          lagosRate: val,
                          abujaRate: singleRateForm.abujaRate === 0 ? Math.round(val * 1.05) : singleRateForm.abujaRate,
                          portHarcourtRate: singleRateForm.portHarcourtRate === 0 ? Math.round(val * 1.08) : singleRateForm.portHarcourtRate,
                          northernRate: singleRateForm.northernRate === 0 ? Math.round(val * 0.98) : singleRateForm.northernRate,
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Abuja FCT (₦)</label>
                    <input
                      type="number"
                      value={singleRateForm.abujaRate}
                      onChange={(e) => setSingleRateForm({ ...singleRateForm, abujaRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Port Harcourt (₦)</label>
                    <input
                      type="number"
                      value={singleRateForm.portHarcourtRate}
                      onChange={(e) => setSingleRateForm({ ...singleRateForm, portHarcourtRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Northern Hub (₦)</label>
                    <input
                      type="number"
                      value={singleRateForm.northernRate}
                      onChange={(e) => setSingleRateForm({ ...singleRateForm, northernRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSingleRateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSingleRate}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingSingleRate ? 'Saving...' : editingRate ? 'Update Rate' : 'Save Rate'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  Plus, 
  X, 
  FileText, 
  MapPin, 
  Clock, 
  Layers, 
  HardHat, 
  Truck, 
  Wrench, 
  Package, 
  Edit3, 
  Lock, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  Sparkles
} from 'lucide-react';
import { 
  MarketRegion, 
  MarketRateItem, 
  RegionalRatesDataset, 
  REGIONAL_FACTORS,
  loadSavedRegionalRates, 
  saveRegionalRatesToStorage, 
  resetRegionalRatesInStorage
} from '../../data/marketRatesData';
import { BoqItem, Project } from '../../types';

interface MarketRatesEngineProps {
  project?: Project | null;
  onUpdateBoqItem?: (index: number, field: keyof BoqItem, value: any) => void;
  onUpdateProject?: (updated: Partial<Project>) => void;
  onSelectRateItem?: (item: { item: string; description: string; unit: string; rate: number }) => void;
}

export const MarketRatesEngine: React.FC<MarketRatesEngineProps> = ({
  project,
  onUpdateBoqItem,
  onUpdateProject
}) => {
  // Region state
  const [selectedRegion, setSelectedRegion] = useState<MarketRegion>('Lagos');

  // Edit Mode toggle: OFF = locked, ON = editable
  const [editMode, setEditMode] = useState<boolean>(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active filter category (from Sliders icon or chips)
  const [activeCategorySection, setActiveCategorySection] = useState<'all' | 'materials' | 'labour' | 'trades' | 'plant'>('all');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  // Expand state for each section (default shows featured, can expand to show all 40+ items)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    materials: false,
    labour: false,
    trades: false,
    plant: false
  });

  // Loaded dataset for current region
  const [dataset, setDataset] = useState<RegionalRatesDataset>(() => 
    loadSavedRegionalRates('Lagos')
  );

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Modal state for "+ Add Custom Rate"
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addModalTargetSection, setAddModalTargetSection] = useState<'materials' | 'labour' | 'trades' | 'plant'>('materials');
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemUnit, setNewItemUnit] = useState<string>('m²');
  const [newItemPrice, setNewItemPrice] = useState<string>('');
  const [newItemSpec, setNewItemSpec] = useState<string>('');

  // On region change, load data from localStorage or regional baseline JSON
  useEffect(() => {
    const loaded = loadSavedRegionalRates(selectedRegion);
    setDataset(loaded);
    setHasUnsavedChanges(false);
  }, [selectedRegion]);

  // Handle price change for an item
  const handlePriceChange = (
    section: 'materials' | 'labour' | 'plant' | 'trades',
    itemId: string,
    rawInput: string
  ) => {
    const cleanNumber = parseInt(rawInput.replace(/[^0-9]/g, ''), 10) || 0;

    setDataset((prev) => {
      const updateList = (list: MarketRateItem[]) =>
        list.map((item) => (item.id === itemId ? { ...item, price: cleanNumber } : item));

      let updated: RegionalRatesDataset = { ...prev };
      if (section === 'materials') {
        updated.coreMaterials = updateList(prev.coreMaterials);
      } else if (section === 'labour') {
        updated.labourWages = updateList(prev.labourWages);
      } else if (section === 'plant') {
        updated.plantHire = updateList(prev.plantHire);
      } else if (section === 'trades') {
        updated.compositeTrades = updateList(prev.compositeTrades);
      }

      return updated;
    });

    setHasUnsavedChanges(true);
  };

  // Save rates to localStorage under key: rates_{region}
  const handleSaveRates = () => {
    saveRegionalRatesToStorage(selectedRegion, dataset);
    setHasUnsavedChanges(false);
    setSaveSuccessMessage(`Successfully saved ${selectedRegion} market rates to local storage!`);
    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 3500);
  };

  // Reset to NIQS default
  const handleResetDefaults = () => {
    if (window.confirm(`Are you sure you want to reset ${selectedRegion} rates to the official NIQS baseline? Any custom edits for ${selectedRegion} will be cleared.`)) {
      const reset = resetRegionalRatesInStorage(selectedRegion);
      setDataset(reset);
      setHasUnsavedChanges(false);
      setSaveSuccessMessage(`Reset ${selectedRegion} rates to official NIQS benchmark.`);
      setTimeout(() => {
        setSaveSuccessMessage(null);
      }, 3500);
    }
  };

  // Apply to BOQ items in active project
  const handleApplyToBoq = () => {
    if (!project || !project.items || project.items.length === 0) {
      alert(`No active project BOQ items found to update. Open a project with BOQ items, and this engine will automatically calibrate rates to current ${selectedRegion} prices.`);
      return;
    }

    if (!onUpdateProject && !onUpdateBoqItem) {
      alert('BOQ update handler is not attached.');
      return;
    }

    let updatedCount = 0;
    const trades = dataset.compositeTrades || [];

    const updatedItems = project.items.map((item, index) => {
      const desc = (item.description || item.item || '').toLowerCase();
      let matchedRate: MarketRateItem | undefined;

      // Match composite trades
      if (desc.includes('excavat') || desc.includes('trench')) {
        matchedRate = trades.find(r => r.id === 'trd-d-01');
      } else if (desc.includes('laterite') || (desc.includes('filling') && desc.includes('earth'))) {
        matchedRate = trades.find(r => r.id === 'trd-d-02');
      } else if (desc.includes('hardcore')) {
        matchedRate = trades.find(r => r.id === 'trd-d-03');
      } else if (desc.includes('blinding')) {
        matchedRate = trades.find(r => r.id === 'trd-e-01');
      } else if (desc.includes('slab') && (desc.includes('concrete') || desc.includes('grade 25') || desc.includes('1:2:4'))) {
        matchedRate = trades.find(r => r.id === 'trd-e-04');
      } else if ((desc.includes('column') || desc.includes('beam')) && desc.includes('concrete')) {
        matchedRate = trades.find(r => r.id === 'trd-e-03');
      } else if (desc.includes('foundation') && desc.includes('concrete')) {
        matchedRate = trades.find(r => r.id === 'trd-e-02');
      } else if (desc.includes('150mm') && (desc.includes('block') || desc.includes('wall'))) {
        matchedRate = trades.find(r => r.id === 'trd-f-01');
      } else if (desc.includes('225mm') && (desc.includes('block') || desc.includes('wall'))) {
        matchedRate = trades.find(r => r.id === 'trd-f-02');
      } else if (desc.includes('formwork') && (desc.includes('column') || desc.includes('beam'))) {
        matchedRate = trades.find(r => r.id === 'trd-m-02');
      } else if (desc.includes('formwork') && desc.includes('slab')) {
        matchedRate = trades.find(r => r.id === 'trd-m-03');
      } else if (desc.includes('formwork') && desc.includes('foundation')) {
        matchedRate = trades.find(r => r.id === 'trd-m-01');
      } else if (desc.includes('plaster') || desc.includes('render')) {
        matchedRate = trades.find(r => r.id === 'trd-fin-01');
      } else if (desc.includes('screed')) {
        matchedRate = trades.find(r => r.id === 'trd-fin-02');
      } else if (desc.includes('floor tile') || desc.includes('vitrified')) {
        matchedRate = trades.find(r => r.id === 'trd-fin-03');
      } else if (desc.includes('wall tile')) {
        matchedRate = trades.find(r => r.id === 'trd-fin-04');
      } else if (desc.includes('paint') || desc.includes('emulsion')) {
        matchedRate = trades.find(r => r.id === 'trd-fin-05');
      } else if (desc.includes('longspan') || desc.includes('aluminium sheet')) {
        matchedRate = trades.find(r => r.id === 'trd-rof-02');
      } else if (desc.includes('roof carcass') || (desc.includes('timber') && desc.includes('roof'))) {
        matchedRate = trades.find(r => r.id === 'trd-rof-01');
      } else if (desc.includes('electrical') || desc.includes('lighting point')) {
        matchedRate = trades.find(r => r.id === 'trd-sve-01');
      } else if (desc.includes('plumbing') || desc.includes('sanitary point')) {
        matchedRate = trades.find(r => r.id === 'trd-sve-02');
      }

      if (matchedRate && matchedRate.price > 0) {
        updatedCount++;
        const qty = Number(item.qty || 0);
        return {
          ...item,
          rate: matchedRate.price,
          amount: Math.round(qty * matchedRate.price),
        };
      }

      return item;
    });

    if (onUpdateProject) {
      onUpdateProject({ items: updatedItems });
    } else if (onUpdateBoqItem) {
      updatedItems.forEach((it, idx) => {
        if (it.rate !== project.items[idx]?.rate) {
          onUpdateBoqItem(idx, 'rate', it.rate);
        }
      });
    }

    if (updatedCount === 0) {
      setSaveSuccessMessage(`No matching items found in active project to calibrate.`);
    } else {
      setSaveSuccessMessage(`Applied current ${selectedRegion} market rates to ${updatedCount} matching BOQ items in ${project.title || 'Project'}!`);
    }
    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 4500);
  };

  // Add custom rate item
  const handleAddCustomRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice) {
      alert('Please provide an item name and rate price.');
      return;
    }

    const price = parseInt(newItemPrice.replace(/[^0-9]/g, ''), 10) || 0;
    const customItem: MarketRateItem = {
      id: `custom-${Date.now()}`,
      category: 'Custom Rates',
      name: newItemName.trim(),
      unit: newItemUnit.trim() || 'item',
      price: price,
      niqsDefault: price,
      spec: newItemSpec.trim() || 'Custom localized construction rate',
      isCustom: true
    };

    setDataset(prev => {
      let updated = { ...prev };
      if (addModalTargetSection === 'materials') {
        updated.coreMaterials = [customItem, ...prev.coreMaterials];
      } else if (addModalTargetSection === 'labour') {
        updated.labourWages = [customItem, ...prev.labourWages];
      } else if (addModalTargetSection === 'plant') {
        updated.plantHire = [customItem, ...prev.plantHire];
      } else if (addModalTargetSection === 'trades') {
        updated.compositeTrades = [customItem, ...prev.compositeTrades];
      }
      return updated;
    });

    setHasUnsavedChanges(true);
    setIsAddModalOpen(false);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemSpec('');
  };

  // Toggle expand/collapse
  const toggleSectionExpand = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Filter items helper
  const filterList = (list: MarketRateItem[] | undefined) => {
    if (!list || !Array.isArray(list)) return [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item => 
      item && (
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.unit && item.unit.toLowerCase().includes(q)) ||
        (item.spec && item.spec.toLowerCase().includes(q))
      )
    );
  };

  const filteredMaterials = useMemo(() => filterList(dataset?.coreMaterials), [dataset?.coreMaterials, searchQuery]);
  const filteredLabour = useMemo(() => filterList(dataset?.labourWages), [dataset?.labourWages, searchQuery]);
  const filteredTrades = useMemo(() => filterList(dataset?.compositeTrades), [dataset?.compositeTrades, searchQuery]);
  const filteredPlant = useMemo(() => filterList(dataset?.plantHire), [dataset?.plantHire, searchQuery]);

  // Regional code for materials label e.g. "Lagos/SW", "Port Harcourt/SS", "Abuja/NC"
  const regionalSubCode = useMemo(() => {
    switch (selectedRegion) {
      case 'Lagos': return 'Lagos/SW';
      case 'Port Harcourt': return 'Port Harcourt/SS';
      case 'Abuja': return 'Abuja/NC';
      case 'Kano': return 'Kano/NW';
      case 'Enugu': return 'Enugu/SE';
      default: return `${selectedRegion}/NG`;
    }
  }, [selectedRegion]);

  // Render Item Row exactly as designed in screenshot
  const renderItemRow = (
    item: MarketRateItem,
    section: 'materials' | 'labour' | 'plant' | 'trades'
  ) => {
    const displayPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
    return (
      <div 
        key={item.id} 
        className="py-3 px-1 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition border-b border-slate-100 last:border-b-0"
      >
        {/* Left: Item Name + / unit in grey */}
        <div className="min-w-0 flex-1 pr-2">
          <div className="font-bold text-slate-900 text-[13px] sm:text-sm leading-snug">
            {item.name}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 font-medium">
            / {item.unit}
          </div>
        </div>

        {/* Right: Soft Mint Green Pill Box with N price + pencil icon */}
        <div className="shrink-0 flex items-center">
          <div className="bg-[#eaf6ee] border border-emerald-200/90 rounded-lg px-3 py-1.5 flex items-center justify-between min-w-[118px] sm:min-w-[130px] transition shadow-2xs">
            {editMode ? (
              <div className="flex items-center w-full space-x-1">
                <span className="font-bold text-slate-800 text-xs sm:text-sm">N</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayPrice.toLocaleString('en-US')}
                  onChange={(e) => handlePriceChange(section, item.id, e.target.value)}
                  className="w-full bg-white px-1.5 py-0.5 text-xs sm:text-sm font-bold text-slate-900 rounded border border-emerald-500 text-right focus:outline-hidden ring-1 ring-emerald-500/20"
                />
                <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0 ml-1" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="w-full flex items-center justify-between cursor-pointer group text-left"
                title="Click to enable edit mode"
              >
                <span className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-800 transition">
                  N{displayPrice.toLocaleString('en-US')}
                </span>
                <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0 ml-1.5 group-hover:scale-110 transition" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="market-rates-engine-container" className="space-y-4 max-w-xl mx-auto pb-28">
      
      {/* Toast confirmation */}
      {saveSuccessMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#137a43] text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-600 flex items-center space-x-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs font-bold">{saveSuccessMessage}</span>
        </div>
      )}

      {/* 1. TOP GREEN HEADER BANNER */}
      <div className="bg-[#137a43] rounded-3xl p-5 sm:p-6 text-white shadow-sm">
        <div className="flex items-center justify-between gap-3">
          
          {/* Left: Building icon inside badge + 2-line title */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
                Nigerian Construction<br />
                Market Rates Engine
              </h1>
            </div>
          </div>

          {/* Right: Edit Mode Toggle */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs font-semibold text-white/90">Edit Mode</span>
            <button
              type="button"
              id="edit-mode-toggle-pill"
              onClick={() => setEditMode(!editMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                editMode ? 'bg-emerald-400' : 'bg-white/40'
              }`}
              role="switch"
              aria-checked={editMode}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  editMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-[11px] font-bold text-white tracking-wide">
              {editMode ? 'ON' : 'OFF'}
            </span>
          </div>

        </div>
      </div>

      {/* 2. SEARCH BAR & FILTER ROW */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="market-rates-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search materials, labour, trades..."
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#137a43] focus:border-transparent transition shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sliders filter button with light green background */}
        <button
          type="button"
          id="filter-drawer-toggle-button"
          onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition cursor-pointer ${
            isFilterDrawerOpen || activeCategorySection !== 'all'
              ? 'bg-[#137a43] text-white border-[#137a43]'
              : 'bg-[#e6f4ea] text-emerald-800 border-emerald-200 hover:bg-[#d8eedf]'
          }`}
          title="Filter sections"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Drawer / Quick Selection Tabs if opened */}
      {isFilterDrawerOpen && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700">Filter Section Display</span>
            <button
              type="button"
              onClick={() => {
                setActiveCategorySection('all');
                setIsFilterDrawerOpen(false);
              }}
              className="text-[11px] font-semibold text-[#137a43] hover:underline"
            >
              Reset to All
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { id: 'all', label: 'All Sections' },
              { id: 'materials', label: 'Core Materials' },
              { id: 'labour', label: 'Labour Wages' },
              { id: 'trades', label: 'Composite Trades' },
              { id: 'plant', label: 'Plant Hire' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveCategorySection(tab.id as any);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeCategorySection === tab.id
                    ? 'bg-[#137a43] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. REGION CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Region:</span>
            <div className="relative">
              <select
                id="market-rates-region-dropdown"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value as MarketRegion)}
                className="appearance-none bg-transparent pr-7 text-sm font-extrabold text-[#137a43] focus:outline-hidden cursor-pointer"
              >
                <option value="Lagos">Lagos - Nigeria</option>
                <option value="Port Harcourt">Port Harcourt - Nigeria</option>
                <option value="Abuja">Abuja - Nigeria</option>
                <option value="Kano">Kano - Nigeria</option>
                <option value="Enugu">Enugu - Nigeria</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {hasUnsavedChanges && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Unsaved edits
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Last updated: 21 Aug 2025 • 09:32 AM</span>
        </div>
      </div>

      {/* 4. SECTION CARD 1: CORE MATERIALS */}
      {(activeCategorySection === 'all' || activeCategorySection === 'materials') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
          
          {/* Card Header with Icon */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#e6f4ea] text-[#137a43] flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-[#137a43] tracking-tight">
                Core Materials ({regionalSubCode})
              </h2>
            </div>

            <button
              type="button"
              onClick={() => toggleSectionExpand('materials')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              <span>{expandedSections.materials ? 'Show less' : `View all (${filteredMaterials.length})`}</span>
              {expandedSections.materials ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {(expandedSections.materials ? filteredMaterials : filteredMaterials.slice(0, 3)).map((item) =>
              renderItemRow(item, 'materials')
            )}
          </div>

          {/* Add custom rate link */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setAddModalTargetSection('materials');
                setIsAddModalOpen(true);
              }}
              className="font-bold text-[#137a43] hover:underline inline-flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Custom Material</span>
            </button>
            <span className="text-[11px] text-slate-400">
              NIQS Baseline
            </span>
          </div>

        </div>
      )}

      {/* 5. SECTION CARD 2: DIRECT DAILY LABOUR WAGES */}
      {(activeCategorySection === 'all' || activeCategorySection === 'labour') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
          
          {/* Card Header with HardHat Icon */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#e6f4ea] text-[#137a43] flex items-center justify-center shrink-0">
                <HardHat className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-[#137a43] tracking-tight">
                Direct Daily Labour Wages
              </h2>
            </div>

            <button
              type="button"
              onClick={() => toggleSectionExpand('labour')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              <span>{expandedSections.labour ? 'Show less' : `View all (${filteredLabour.length})`}</span>
              {expandedSections.labour ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {(expandedSections.labour ? filteredLabour : filteredLabour.slice(0, 3)).map((item) =>
              renderItemRow(item, 'labour')
            )}
          </div>

          {/* Add custom rate link */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setAddModalTargetSection('labour');
                setIsAddModalOpen(true);
              }}
              className="font-bold text-[#137a43] hover:underline inline-flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Custom Labour Rate</span>
            </button>
            <span className="text-[11px] text-slate-400">
              Artisan Guild Benchmark
            </span>
          </div>

        </div>
      )}

      {/* 6. SECTION CARD 3: ALL-IN COMPOSITE TRADE RATES */}
      {(activeCategorySection === 'all' || activeCategorySection === 'trades') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
          
          {/* Card Header with Wrench Icon */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#e6f4ea] text-[#137a43] flex items-center justify-center shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-[#137a43] tracking-tight">
                All-in Composite Trade Rates
              </h2>
            </div>

            <button
              type="button"
              onClick={() => toggleSectionExpand('trades')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              <span>{expandedSections.trades ? 'Show less' : `View all (${filteredTrades.length})`}</span>
              {expandedSections.trades ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {(expandedSections.trades ? filteredTrades : filteredTrades.slice(0, 2)).map((item) =>
              renderItemRow(item, 'trades')
            )}
          </div>

          {/* Add custom rate link */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setAddModalTargetSection('trades');
                setIsAddModalOpen(true);
              }}
              className="font-bold text-[#137a43] hover:underline inline-flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Custom Composite Rate</span>
            </button>
            <span className="text-[11px] text-slate-400">
              BESMM4 Calibrated
            </span>
          </div>

        </div>
      )}

      {/* 7. SECTION CARD 4: PLANT HIRE RATES */}
      {(activeCategorySection === 'all' || activeCategorySection === 'plant') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
          
          {/* Card Header with Truck Icon */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#e6f4ea] text-[#137a43] flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-[#137a43] tracking-tight">
                Plant Hire Rates
              </h2>
            </div>

            <button
              type="button"
              onClick={() => toggleSectionExpand('plant')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              <span>{expandedSections.plant ? 'Show less' : `View all (${filteredPlant.length})`}</span>
              {expandedSections.plant ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {(expandedSections.plant ? filteredPlant : filteredPlant.slice(0, 3)).map((item) =>
              renderItemRow(item, 'plant')
            )}
          </div>

          {/* Add custom rate link */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setAddModalTargetSection('plant');
                setIsAddModalOpen(true);
              }}
              className="font-bold text-[#137a43] hover:underline inline-flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Custom Plant Rate</span>
            </button>
            <span className="text-[11px] text-slate-400">
              Commercial Day Lease
            </span>
          </div>

        </div>
      )}

      {/* 8. STICKY BOTTOM ACTION BAR (Exact layout from screenshot) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
          
          {/* Button 1: Reset to NIQS Default (Outline with green border) */}
          <button
            type="button"
            id="bottom-reset-niqs-btn"
            onClick={handleResetDefaults}
            className="flex-1 px-2.5 py-2.5 rounded-xl border border-emerald-600 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate">Reset to NIQS Default</span>
          </button>

          {/* Button 2: Apply to BOQ (Outline with green border) */}
          <button
            type="button"
            id="bottom-apply-boq-btn"
            onClick={handleApplyToBoq}
            className="flex-1 px-2.5 py-2.5 rounded-xl border border-emerald-600 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate">Apply to BOQ</span>
          </button>

          {/* Button 3: Save Rates (Solid dark green) */}
          <button
            type="button"
            id="bottom-save-rates-btn"
            onClick={handleSaveRates}
            className="flex-1 px-3 py-2.5 rounded-xl bg-[#137a43] hover:bg-[#0f6336] text-white text-xs font-extrabold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <Save className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="truncate">Save Rates</span>
          </button>

        </div>
      </div>

      {/* MODAL: ADD CUSTOM RATE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-[#137a43]" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Add Custom Rate ({addModalTargetSection})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomRate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 200mm Heavy Duty Sandcrete Block"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#137a43]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit of Measurement</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. bag, m², tonne, day"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#137a43]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price in Naira (N)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">N</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="e.g. 12,500"
                      value={newItemPrice}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^0-9]/g, '');
                        const num = parseInt(digits, 10);
                        setNewItemPrice(isNaN(num) ? '' : num.toLocaleString('en-US'));
                      }}
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#137a43]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Technical Specification (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Machine compacted 200mm hollow sandcrete block..."
                  value={newItemSpec}
                  onChange={(e) => setNewItemSpec(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#137a43]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#137a43] text-white text-xs font-bold hover:bg-[#0f6336] shadow-2xs cursor-pointer"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

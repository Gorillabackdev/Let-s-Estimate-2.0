import React, { useState, useEffect } from 'react';
import { StandardRate, UserCustomRate, BoqItem } from '../types';
import { formatNaira } from '../utils/format';
import { safeFetchJson } from '../utils/api';
import { 
  X, Search, Database, Calculator, Bookmark, Plus, Trash2, Check, 
  ArrowRight, Sparkles, Download, RefreshCw, Layers, ShieldCheck
} from 'lucide-react';

interface NigerianRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectItems?: BoqItem[];
  projectLocation?: string;
  onSelectRate?: (rateItem: { item: string; description: string; unit: string; rate: number }) => void;
}

// Preset rate build-up templates for Nigerian construction
const RATE_BUILDUP_PRESETS = [
  {
    title: 'Grade 25 Concrete in Suspended Slabs/Beams (m³)',
    trade: 'Reinforced Concrete Frame',
    unit: 'm3',
    materialCost: 135000,
    materialWastePercent: 5,
    labourDailyGangWage: 28000, // 1 Mason, 1 Steel fixer, 4 Labourers
    dailyGangOutput: 3.5, // 3.5 m3 placed per day
    plantCostPerUnit: 12000, // Mixer & Poker vibrator fuel/hire
    overheadProfitPercent: 15,
  },
  {
    title: '225mm Vibrated Sandcrete Blockwork (m²)',
    trade: 'Blockwork & Partitioning',
    unit: 'm2',
    materialCost: 9200, // 10 blocks + mortar cement & sharp sand
    materialWastePercent: 7.5,
    labourDailyGangWage: 20000, // 1 Bricklayer + 2 Helpers
    dailyGangOutput: 14, // 14 m2 laid per day
    plantCostPerUnit: 500, // Scaffolding & wheelbarrows
    overheadProfitPercent: 15,
  },
  {
    title: '15mm Cement-Sand Plastering to Walls (m²)',
    trade: 'Finishes (Plastering, Tiling & Screed)',
    unit: 'm2',
    materialCost: 2600, // Cement + screened sand
    materialWastePercent: 10,
    labourDailyGangWage: 18000, // 1 Plasterer + 1 Labourer
    dailyGangOutput: 20, // 20 m2 plastered per day
    plantCostPerUnit: 300,
    overheadProfitPercent: 15,
  },
  {
    title: '0.55mm Step-tile Longspan Roofing (m²)',
    trade: 'Roofing & Rainwater Goods',
    unit: 'm2',
    materialCost: 21500, // Coils, ridge caps, self-tapping screws
    materialWastePercent: 5,
    labourDailyGangWage: 32000, // Specialist roofing carpenter team
    dailyGangOutput: 30,
    plantCostPerUnit: 1000,
    overheadProfitPercent: 15,
  },
  {
    title: 'High-Yield Deformed Rebars Cut, Bent & Fixed (kg)',
    trade: 'Reinforced Concrete Frame',
    unit: 'kg',
    materialCost: 1450, // Steel rebar + 25kg binding wire
    materialWastePercent: 5,
    labourDailyGangWage: 24000, // Steel fixing gang
    dailyGangOutput: 120, // kg fixed per day
    plantCostPerUnit: 50,
    overheadProfitPercent: 15,
  }
];

export const NigerianRatesModal: React.FC<NigerianRatesModalProps> = ({
  isOpen,
  onClose,
  activeProjectItems = [],
  projectLocation = 'Lagos, Nigeria',
  onSelectRate,
}) => {
  const [activeTab, setActiveTab] = useState<'market' | 'buildup' | 'myrates'>('market');
  const [rates, setRates] = useState<StandardRate[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<'lagos' | 'abuja' | 'ph'>('lagos');
  const [search, setSearch] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Rate Build-up State
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [buildItemTitle, setBuildItemTitle] = useState(RATE_BUILDUP_PRESETS[0].title);
  const [buildTrade, setBuildTrade] = useState(RATE_BUILDUP_PRESETS[0].trade);
  const [buildUnit, setBuildUnit] = useState(RATE_BUILDUP_PRESETS[0].unit);
  const [materialCost, setMaterialCost] = useState(RATE_BUILDUP_PRESETS[0].materialCost);
  const [materialWaste, setMaterialWaste] = useState(RATE_BUILDUP_PRESETS[0].materialWastePercent);
  const [gangDailyWage, setGangDailyWage] = useState(RATE_BUILDUP_PRESETS[0].labourDailyGangWage);
  const [gangDailyOutput, setGangDailyOutput] = useState(RATE_BUILDUP_PRESETS[0].dailyGangOutput);
  const [plantCost, setPlantCost] = useState(RATE_BUILDUP_PRESETS[0].plantCostPerUnit);
  const [overheadProfit, setOverheadProfit] = useState(RATE_BUILDUP_PRESETS[0].overheadProfitPercent);
  const [isSavingCustomRate, setIsSavingCustomRate] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // My Custom Rates State
  const [myRates, setMyRates] = useState<UserCustomRate[]>([]);
  const [isLoadingMyRates, setIsLoadingMyRates] = useState(false);
  const [isImportingBoq, setIsImportingBoq] = useState(false);
  const [importNotice, setImportNotice] = useState('');

  // New Custom Rate Form
  const [isAddingRate, setIsAddingRate] = useState(false);
  const [newRateForm, setNewRateForm] = useState({
    category: 'General Works',
    item: '',
    description: '',
    unit: 'm2',
    rate: 0,
    location: 'Lagos, Nigeria'
  });

  // Fetch standard benchmark rates
  useEffect(() => {
    if (isOpen && rates.length === 0) {
      safeFetchJson<{ rates: StandardRate[] }>('/api/rates/standard')
        .then(({ ok, data }) => {
          if (ok && data?.rates) setRates(data.rates);
        })
        .catch(() => {});
    }
  }, [isOpen, rates.length]);

  // Fetch user custom rates
  const fetchMyRates = () => {
    setIsLoadingMyRates(true);
    safeFetchJson<{ rates: UserCustomRate[] }>('/api/rates/my')
      .then(({ ok, data }) => {
        if (ok && data?.rates) setMyRates(data.rates);
        setIsLoadingMyRates(false);
      })
      .catch(() => {
        setIsLoadingMyRates(false);
      });
  };

  useEffect(() => {
    if (isOpen && activeTab === 'myrates') {
      fetchMyRates();
    }
  }, [isOpen, activeTab]);

  // Handle Preset Selection
  const applyPreset = (idx: number) => {
    setSelectedPreset(idx);
    const p = RATE_BUILDUP_PRESETS[idx];
    setBuildItemTitle(p.title);
    setBuildTrade(p.trade);
    setBuildUnit(p.unit);
    setMaterialCost(p.materialCost);
    setMaterialWaste(p.materialWastePercent);
    setGangDailyWage(p.labourDailyGangWage);
    setGangDailyOutput(p.dailyGangOutput);
    setPlantCost(p.plantCostPerUnit);
    setOverheadProfit(p.overheadProfitPercent);
  };

  // Live Unit Rate Calculations
  const netMaterial = Number(materialCost) * (1 + Number(materialWaste) / 100);
  const labourUnit = Number(gangDailyOutput) > 0 ? Number(gangDailyWage) / Number(gangDailyOutput) : 0;
  const plantUnit = Number(plantCost);
  const primeCost = netMaterial + labourUnit + plantUnit;
  const poAmount = primeCost * (Number(overheadProfit) / 100);
  const compositeRate = Math.round(primeCost + poAmount);

  // Save Built-up rate to My Rates
  const handleSaveBuildUpToMyRates = async () => {
    setIsSavingCustomRate(true);
    try {
      const { ok, data } = await safeFetchJson<{ success: boolean }>('/api/rates/my', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: buildTrade,
          item: buildItemTitle,
          description: `Rate analysis build-up: Material (₦${Math.round(netMaterial)}), Labour (₦${Math.round(labourUnit)}), Plant (₦${Math.round(plantUnit)}), + ${overheadProfit}% P&O`,
          unit: buildUnit,
          rate: compositeRate,
          location: projectLocation
        })
      });
      if (ok && data?.success) {
        setSaveSuccessMsg('Rate saved to "My Rates" library!');
        setTimeout(() => setSaveSuccessMsg(''), 3000);
        fetchMyRates();
      }
    } catch {
      // Handled cleanly
    } finally {
      setIsSavingCustomRate(false);
    }
  };

  // Import Active BOQ to My Rates
  const handleImportFromBoq = async () => {
    if (activeProjectItems.length === 0) {
      setImportNotice('No items in the active project to import.');
      setTimeout(() => setImportNotice(''), 3000);
      return;
    }

    setIsImportingBoq(true);
    try {
      const { ok, data } = await safeFetchJson<{ success: boolean; count: number }>('/api/rates/import-from-boq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: activeProjectItems.map(it => ({
            item: it.item,
            description: it.description,
            unit: it.unit,
            rate: it.rate,
            section: it.section
          })),
          location: projectLocation
        })
      });
      if (ok && data?.success) {
        setImportNotice(`Imported ${data.count} items into your library!`);
        setTimeout(() => setImportNotice(''), 3500);
        fetchMyRates();
      }
    } catch {
      setImportNotice('Failed to import items.');
      setTimeout(() => setImportNotice(''), 3000);
    } finally {
      setIsImportingBoq(false);
    }
  };

  // Delete custom rate
  const handleDeleteCustomRate = async (id: string) => {
    try {
      const { ok } = await safeFetchJson(`/api/rates/my/${id}`, { method: 'DELETE' });
      if (ok) {
        setMyRates(prev => prev.filter(r => r.id !== id));
      }
    } catch {
      // Handled cleanly
    }
  };

  // Create custom rate manually
  const handleCreateManualRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRateForm.item || newRateForm.rate <= 0) return;

    try {
      const { ok, data } = await safeFetchJson<{ success: boolean }>('/api/rates/my', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRateForm)
      });
      if (ok && data?.success) {
        setIsAddingRate(false);
        setNewRateForm({
          category: 'General Works',
          item: '',
          description: '',
          unit: 'm2',
          rate: 0,
          location: 'Lagos, Nigeria'
        });
        fetchMyRates();
      }
    } catch {
      // Handled cleanly
    }
  };

  if (!isOpen) return null;

  const filteredRates = rates.filter(
    (r) =>
      r.item.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      r.spec.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center shadow-inner">
              <Database className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Nigerian Cost Intelligence & Rate Analysis Hub
                <span className="text-[10px] bg-emerald-700/80 text-emerald-100 font-semibold px-2 py-0.5 rounded-full border border-emerald-600/50">
                  NIQS / BESMM4
                </span>
              </h3>
              <p className="text-xs text-emerald-200">
                Market benchmarks, scientific unit rate build-up & custom price libraries in Nigerian Naira (₦)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-2 rounded-lg hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('market')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition border-b-2 ${
                activeTab === 'market'
                  ? 'bg-white text-emerald-900 border-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Nigerian Market Index</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                {rates.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('buildup')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition border-b-2 ${
                activeTab === 'buildup'
                  ? 'bg-white text-emerald-900 border-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
              }`}
            >
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Rate Analysis Calculator</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-semibold">
                Build-up
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('myrates')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition border-b-2 ${
                activeTab === 'myrates'
                  ? 'bg-white text-emerald-900 border-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
              }`}
            >
              <Bookmark className="w-4 h-4 text-emerald-600" />
              <span>My Saved Rates</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                {myRates.length}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium hidden md:block">
            Project Hub: <span className="font-semibold text-slate-700">{projectLocation}</span>
          </div>
        </div>

        {/* ================= TAB 1: NIGERIAN MARKET INDEX ================= */}
        {activeTab === 'market' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter & Controls */}
            <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Region Tabs */}
              <div className="flex items-center space-x-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSelectedRegion('lagos')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    selectedRegion === 'lagos' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lagos (Island & Mainland)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRegion('abuja')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    selectedRegion === 'abuja' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Abuja FCT
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRegion('ph')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    selectedRegion === 'ph' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Port Harcourt (Rivers)
                </button>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by item or specification..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Trade / Item</th>
                    <th className="py-2.5 px-3">Specification</th>
                    <th className="py-2.5 px-2 text-center w-16">Unit</th>
                    <th className="py-2.5 px-3 text-right w-32">
                      {selectedRegion === 'lagos' ? 'Lagos ₦' : selectedRegion === 'abuja' ? 'Abuja ₦' : 'Port Harcourt ₦'}
                    </th>
                    {onSelectRate && <th className="py-2.5 px-3 text-center w-28">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRates.map((r, idx) => {
                    const regionalRate = r[selectedRegion];
                    return (
                      <tr key={idx} className="hover:bg-emerald-50/40 transition">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          <div>{r.item}</div>
                          <span className="text-[10px] text-emerald-700 font-medium px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                            {r.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-sm">{r.spec}</td>
                        <td className="py-3 px-2 text-center font-mono font-medium text-slate-800">{r.unit}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 text-sm">
                          {formatNaira(regionalRate)}
                        </td>
                        {onSelectRate && (
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectRate({
                                  item: r.item,
                                  description: r.spec,
                                  unit: r.unit,
                                  rate: regionalRate
                                });
                                setCopiedIdx(idx);
                                setTimeout(() => setCopiedIdx(null), 1500);
                              }}
                              className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-[11px] shadow-xs transition flex items-center gap-1 mx-auto"
                            >
                              {copiedIdx === idx ? <Check className="w-3.5 h-3.5" /> : 'Use Rate'}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 2: RATE ANALYSIS CALCULATOR ================= */}
        {activeTab === 'buildup' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Preset Templates & Input Breakdown */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Presets Bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Standard Trade Preset:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {RATE_BUILDUP_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyPreset(idx)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${
                          selectedPreset === idx
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {p.title.split(' ')[0]} {p.title.split(' ')[1]} ({p.unit})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Build-up Parameter Inputs */}
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Rate Analysis Parameters (BESMM4 Formula)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Item Description</label>
                      <input
                        type="text"
                        value={buildItemTitle}
                        onChange={(e) => setBuildItemTitle(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Trade Section</label>
                        <input
                          type="text"
                          value={buildTrade}
                          onChange={(e) => setBuildTrade(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                        <input
                          type="text"
                          value={buildUnit}
                          onChange={(e) => setBuildUnit(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 1. Material Component */}
                  <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200/60 space-y-2">
                    <span className="text-xs font-bold text-emerald-900 block">1. Material Supply & Waste</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-0.5">Net Material Cost (₦/{buildUnit})</label>
                        <input
                          type="number"
                          value={materialCost}
                          onChange={(e) => setMaterialCost(Number(e.target.value))}
                          className="w-full text-xs p-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-0.5">Waste Allowance (%)</label>
                        <input
                          type="number"
                          value={materialWaste}
                          onChange={(e) => setMaterialWaste(Number(e.target.value))}
                          className="w-full text-xs p-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Labour Component */}
                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/60 space-y-2">
                    <span className="text-xs font-bold text-amber-900 block">2. Labour Gang & Daily Output</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-0.5">Daily Gang Wage (₦/day)</label>
                        <input
                          type="number"
                          value={gangDailyWage}
                          onChange={(e) => setGangDailyWage(Number(e.target.value))}
                          className="w-full text-xs p-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-0.5">Daily Gang Output ({buildUnit}/day)</label>
                        <input
                          type="number"
                          value={gangDailyOutput}
                          onChange={(e) => setGangDailyOutput(Number(e.target.value))}
                          className="w-full text-xs p-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Plant & Profit */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Plant / Machinery (₦/{buildUnit})</label>
                      <input
                        type="number"
                        value={plantCost}
                        onChange={(e) => setPlantCost(Number(e.target.value))}
                        className="w-full text-xs p-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Contractor P&O (%)</label>
                      <input
                        type="number"
                        value={overheadProfit}
                        onChange={(e) => setOverheadProfit(Number(e.target.value))}
                        className="w-full text-xs p-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column: Dynamic Calculation Receipt & Actions */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Result Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Calculated Unit Rate</span>
                      <h4 className="text-xl font-bold font-mono text-emerald-800">
                        {formatNaira(compositeRate)} <span className="text-xs font-normal text-slate-500">/ {buildUnit}</span>
                      </h4>
                    </div>
                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                  </div>

                  {/* Breakdown Table */}
                  <div className="text-xs space-y-2.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Gross Materials (+{materialWaste}% waste):</span>
                      <span className="font-mono font-medium text-slate-800">{formatNaira(netMaterial)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Labour (₦{gangDailyWage.toLocaleString()} ÷ {gangDailyOutput} {buildUnit}):</span>
                      <span className="font-mono font-medium text-slate-800">{formatNaira(labourUnit)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Plant & Equipment Hire:</span>
                      <span className="font-mono font-medium text-slate-800">{formatNaira(plantUnit)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-900 pt-2 border-t border-slate-100">
                      <span>Prime Cost per {buildUnit}:</span>
                      <span className="font-mono text-slate-900">{formatNaira(primeCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Profit & Overheads ({overheadProfit}%):</span>
                      <span className="font-mono font-medium text-emerald-700">+{formatNaira(poAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-900 pt-2 border-t border-emerald-100 text-sm bg-emerald-50/60 p-2 rounded">
                      <span>COMPOSITE UNIT RATE:</span>
                      <span className="font-mono">{formatNaira(compositeRate)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    {onSelectRate && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRate({
                            item: buildItemTitle,
                            description: `Built-up rate analysis (${buildTrade})`,
                            unit: buildUnit,
                            rate: compositeRate
                          });
                          onClose();
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Apply Rate to Active BOQ</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveBuildUpToMyRates}
                      disabled={isSavingCustomRate}
                      className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition flex items-center justify-center gap-2"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{isSavingCustomRate ? 'Saving...' : 'Save to "My Rates" Library'}</span>
                    </button>

                    {saveSuccessMsg && (
                      <p className="text-center text-xs font-semibold text-emerald-700 animate-fade-in">
                        {saveSuccessMsg}
                      </p>
                    )}
                  </div>
                </div>

                {/* Educational Note */}
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                  <p className="font-semibold text-slate-800 mb-1">Quantity Surveying Standard Note:</p>
                  Unit rates in the Nigerian building sector fluctuate based on Dangote/BUA cement depot prices, foreign exchange rates on rebar/roofing, and regional haulage costs. Adjust gang outputs according to local craft output.
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ================= TAB 3: MY CUSTOM PRICE BOOK ================= */}
        {activeTab === 'myrates' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top Bar with Actions */}
            <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRate(true)}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Rate</span>
                </button>

                <button
                  type="button"
                  onClick={handleImportFromBoq}
                  disabled={isImportingBoq}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{isImportingBoq ? 'Importing...' : 'Import from Current Project'}</span>
                </button>

                <button
                  type="button"
                  onClick={fetchMyRates}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition"
                  title="Refresh my rates"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {importNotice && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 animate-fade-in">
                  {importNotice}
                </span>
              )}
            </div>

            {/* Modal for adding rate manually */}
            {isAddingRate && (
              <form onSubmit={handleCreateManualRate} className="p-4 bg-emerald-50/50 border-b border-emerald-200 text-xs">
                <div className="font-bold text-emerald-900 mb-2">Create New Custom Rate</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
                  <div>
                    <label className="block text-slate-600 mb-0.5">Item Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 225mm Blockwork"
                      value={newRateForm.item}
                      onChange={(e) => setNewRateForm({ ...newRateForm, item: e.target.value })}
                      className="w-full p-1.5 bg-white rounded border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Trade Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Substructure"
                      value={newRateForm.category}
                      onChange={(e) => setNewRateForm({ ...newRateForm, category: e.target.value })}
                      className="w-full p-1.5 bg-white rounded border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Unit</label>
                    <input
                      type="text"
                      placeholder="m2, m3, No"
                      value={newRateForm.unit}
                      onChange={(e) => setNewRateForm({ ...newRateForm, unit: e.target.value })}
                      className="w-full p-1.5 bg-white rounded border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Rate in ₦</label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={newRateForm.rate || ''}
                      onChange={(e) => setNewRateForm({ ...newRateForm, rate: Number(e.target.value) })}
                      className="w-full p-1.5 bg-white rounded border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingRate(false)}
                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded font-bold"
                  >
                    Save Custom Rate
                  </button>
                </div>
              </form>
            )}

            {/* List of custom rates */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {isLoadingMyRates ? (
                <div className="py-12 text-center text-slate-400 text-xs">Loading custom rate library...</div>
              ) : myRates.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <Bookmark className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No custom rates saved yet.</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click "Import from Current Project" to save your project items, or use the Rate Analysis Calculator to build and save custom rates.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">Item / Trade</th>
                      <th className="py-2.5 px-3">Description / Source</th>
                      <th className="py-2.5 px-2 text-center w-16">Unit</th>
                      <th className="py-2.5 px-3 text-right w-32">Rate (₦)</th>
                      <th className="py-2.5 px-3 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {myRates.map((mr) => (
                      <tr key={mr.id} className="hover:bg-emerald-50/40 transition">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          <div>{mr.item}</div>
                          <span className="text-[10px] text-slate-500 font-normal">{mr.category}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-sm">{mr.description || mr.source || 'Custom Rate'}</td>
                        <td className="py-3 px-2 text-center font-mono font-medium text-slate-800">{mr.unit}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 text-sm">
                          {formatNaira(mr.rate)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {onSelectRate && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectRate({
                                    item: mr.item,
                                    description: mr.description,
                                    unit: mr.unit,
                                    rate: mr.rate
                                  });
                                  onClose();
                                }}
                                className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-[11px]"
                              >
                                Use
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomRate(mr.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition"
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
              )}
            </div>

          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Rates calibrated for Nigerian civil & structural building specifications (BESMM4 / NIQS).</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

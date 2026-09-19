import React, { useState, useEffect } from 'react';
import { StandardRate, UserCustomRate, BoqItem } from '../types';
import { formatNaira } from '../utils/format';
import { FormattedNumberInput } from './common/FormattedNumberInput';
import { safeFetchJson } from '../utils/api';
import { 
  X, Search, Database, Calculator, Bookmark, Plus, Trash2, Check, 
  ArrowRight, Sparkles, Download, RefreshCw, Layers, ShieldCheck,
  Edit3, Save, Info, AlertTriangle, AlertCircle, RotateCcw, Zap, HelpCircle
} from 'lucide-react';

interface NigerianRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectItems?: BoqItem[];
  projectLocation?: string;
  onSelectRate?: (rateItem: { item: string; description: string; unit: string; rate: number }) => void;
}

// Preset rate build-up templates for Nigerian construction
export interface BuildupMaterialRow {
  id: string;
  name: string;
  unit: string;
  qty: number | '';
  rate: number | '';
  wastePercent: number | '';
  marketRef?: string;
  marketRate?: number;
  marketLocation?: string;
  marketDate?: string;
}

export interface BuildupPreset {
  title: string;
  trade: string;
  unit: string;
  materials: {
    name: string;
    unit: string;
    qty: number;
    rate: number;
    wastePercent: number;
    marketRef?: string;
    marketRate?: number;
    marketLocation?: string;
    marketDate?: string;
  }[];
  labourGangDesc: string;
  labourDailyGangWage: number;
  dailyGangOutput: number;
  directLabourOverride?: number;
  useDirectLabour?: boolean;
  plantDesc: string;
  plantDailyHire: number;
  plantDailyOutput: number;
  directPlantOverride?: number;
  useDirectPlant?: boolean;
  noPlantRequired?: boolean;
  includePrelim?: boolean;
  prelimDesc?: string;
  prelimTotalCost?: number;
  prelimTotalUnits?: number;
  overheadPercent: number;
  profitPercent: number;
  poFormula?: 'markup' | 'sequential' | 'margin' | 'fixed';
  fixedMarkupAmount?: number;
}

const RATE_BUILDUP_PRESETS: BuildupPreset[] = [
  {
    title: '225mm Vibrated Sandcrete Blockwork (m²)',
    trade: 'Blockwork & Partitioning',
    unit: 'm2',
    materials: [
      {
        name: '9" Vibrated Hollow Sandcrete Block',
        unit: 'Nr',
        qty: 10,
        rate: 800,
        wastePercent: 5,
        marketRef: 'NIS 87 Machine-vibrated 9-inch block',
        marketRate: 550,
        marketLocation: 'PH',
        marketDate: '18/09/26'
      },
      {
        name: 'Grade 42.5R Portland Cement (Mortar)',
        unit: 'Bag',
        qty: 0.25,
        rate: 11500,
        wastePercent: 5,
        marketRef: 'Dangote / BUA 42.5R 50kg bag',
        marketRate: 9500,
        marketLocation: 'PH',
        marketDate: '18/09/26'
      },
      {
        name: 'Clean Sharp River Sand (Screened)',
        unit: 'm3',
        qty: 0.04,
        rate: 10000,
        wastePercent: 10,
        marketRef: 'Clean riverbed coarse sharp sand',
        marketRate: 7000,
        marketLocation: 'PH',
        marketDate: '18/09/26'
      }
    ],
    labourGangDesc: 'Gang 1 mason + 2 labour (Bricklaying & Mixing)',
    labourDailyGangWage: 15000,
    dailyGangOutput: 7,
    directLabourOverride: 2500,
    useDirectLabour: false,
    plantDesc: 'Water supply bowser / mortar board & wheelbarrow',
    plantDailyHire: 10000,
    plantDailyOutput: 7,
    directPlantOverride: 1428,
    useDirectPlant: false,
    noPlantRequired: false,
    includePrelim: true,
    prelimDesc: 'Borehole water supply & site power setup',
    prelimTotalCost: 350000,
    prelimTotalUnits: 5400,
    overheadPercent: 10,
    profitPercent: 15,
    poFormula: 'markup'
  },
  {
    title: 'Grade 25 In-situ Concrete in Slabs & Beams (m³)',
    trade: 'Reinforced Concrete Frame',
    unit: 'm3',
    materials: [
      {
        name: 'Grade 42.5R Portland Cement',
        unit: 'Bag',
        qty: 6.4,
        rate: 9500,
        wastePercent: 5,
        marketRef: 'Dangote 42.5R Cement 50kg',
        marketRate: 9500,
        marketLocation: 'Lagos',
        marketDate: '18/09/26'
      },
      {
        name: 'Clean Sharp River Sand',
        unit: 'Tonne',
        qty: 0.65,
        rate: 6500,
        wastePercent: 7.5,
        marketRef: 'River sharp sand per tonne',
        marketRate: 6500,
        marketLocation: 'Lagos',
        marketDate: '18/09/26'
      },
      {
        name: 'Crushed Granite Aggregate (20mm / 3/4")',
        unit: 'Tonne',
        qty: 1.35,
        rate: 11500,
        wastePercent: 5,
        marketRef: 'Quarry crushed granite aggregate',
        marketRate: 11500,
        marketLocation: 'Lagos',
        marketDate: '18/09/26'
      }
    ],
    labourGangDesc: 'Batch casting gang (1 Mason + 1 Mixer Operator + 6 Labourers)',
    labourDailyGangWage: 58000,
    dailyGangOutput: 8,
    useDirectLabour: false,
    plantDesc: '500L Diesel Concrete Mixer & High-Frequency Poker Vibrator',
    plantDailyHire: 37000,
    plantDailyOutput: 8,
    useDirectPlant: false,
    noPlantRequired: false,
    includePrelim: false,
    prelimDesc: 'Curing water & test cubes',
    prelimTotalCost: 80000,
    prelimTotalUnits: 150,
    overheadPercent: 10,
    profitPercent: 15,
    poFormula: 'markup'
  },
  {
    title: 'High-Yield Deformed Rebars Cut, Bent & Fixed (kg)',
    trade: 'Reinforced Concrete Frame',
    unit: 'kg',
    materials: [
      {
        name: 'High-Yield TMT Steel Rebars Y12/Y16',
        unit: 'kg',
        qty: 1.05,
        rate: 1430,
        wastePercent: 5,
        marketRef: 'TMT High Yield Rebar fy 460',
        marketRate: 1430,
        marketLocation: 'Lagos',
        marketDate: '18/09/26'
      },
      {
        name: '20-Gauge Black Annealed Binding Wire',
        unit: 'kg',
        qty: 0.02,
        rate: 2500,
        wastePercent: 5,
        marketRef: 'Tying wire 25kg bundle',
        marketRate: 2500,
        marketLocation: 'Lagos',
        marketDate: '18/09/26'
      }
    ],
    labourGangDesc: 'Iron Bender & Steel Fixer Gang (1 Master Bender + 1 Mate)',
    labourDailyGangWage: 24000,
    dailyGangOutput: 120,
    useDirectLabour: false,
    plantDesc: 'Bar bending bench, manual cutter & lever keys',
    plantDailyHire: 2500,
    plantDailyOutput: 120,
    useDirectPlant: false,
    noPlantRequired: false,
    includePrelim: false,
    overheadPercent: 10,
    profitPercent: 15,
    poFormula: 'markup'
  },
  {
    title: '15mm Cement-Sand Plastering to Walls (m²)',
    trade: 'Finishes (Plastering, Tiling & Screed)',
    unit: 'm2',
    materials: [
      {
        name: 'Grade 42.5R Portland Cement',
        unit: 'Bag',
        qty: 0.20,
        rate: 9500,
        wastePercent: 7,
        marketRef: 'Dangote 42.5R',
        marketRate: 9500,
        marketLocation: 'Lagos',
        marketDate: '18/09/26'
      },
      {
        name: 'Fine Plaster Sand (Screened)',
        unit: 'Tonne',
        qty: 0.03,
        rate: 8500,
        wastePercent: 10,
        marketRef: 'Fine screened plaster sand',
        marketRate: 8500,
        marketLocation: 'Lagos',
        marketDate: '18/09/26'
      }
    ],
    labourGangDesc: '1 Master Plasterer + 1 Assistant Labourer',
    labourDailyGangWage: 18000,
    dailyGangOutput: 20,
    useDirectLabour: false,
    plantDesc: 'Scaffolding boards, H-frames & hawk boards',
    plantDailyHire: 3000,
    plantDailyOutput: 20,
    useDirectPlant: false,
    noPlantRequired: false,
    includePrelim: false,
    overheadPercent: 10,
    profitPercent: 15,
    poFormula: 'markup'
  },
  {
    title: '0.55mm Step-tile Longspan Aluminium Roofing (m²)',
    trade: 'Roofing & Rainwater Goods',
    unit: 'm2',
    materials: [
      {
        name: '0.55mm Aluminium Longspan Step-tile Sheet',
        unit: 'm2',
        qty: 1.15,
        rate: 7500,
        wastePercent: 5,
        marketRef: '0.55mm aluminium gauge coil',
        marketRate: 7500,
        marketLocation: 'Lagos',
        marketDate: '18/09/26'
      },
      {
        name: 'Self-tapping Screws with Neoprene Washers',
        unit: 'Nr',
        qty: 8,
        rate: 85,
        wastePercent: 5,
        marketRef: 'Hex-head roofing fixings',
        marketRate: 85,
        marketLocation: 'Lagos',
        marketDate: '18/09/26'
      }
    ],
    labourGangDesc: 'Specialist Roofing Carpenter & Fixer Gang',
    labourDailyGangWage: 32000,
    dailyGangOutput: 30,
    useDirectLabour: false,
    plantDesc: 'Hoisting ropes, safety harnesses & cordless drivers',
    plantDailyHire: 5000,
    plantDailyOutput: 30,
    useDirectPlant: false,
    noPlantRequired: false,
    includePrelim: false,
    overheadPercent: 10,
    profitPercent: 15,
    poFormula: 'markup'
  },
  {
    title: 'Excavation of Foundation Trenches depth ≤ 1.50m (m³)',
    trade: 'Substructure Works',
    unit: 'm3',
    materials: [],
    labourGangDesc: 'Manual Trench Excavation Gang (2 Unskilled Labourers)',
    labourDailyGangWage: 12000,
    dailyGangOutput: 3.5,
    useDirectLabour: false,
    plantDesc: 'Dewatering pump & timber trench shoring hire',
    plantDailyHire: 6000,
    plantDailyOutput: 3.5,
    useDirectPlant: false,
    noPlantRequired: false,
    includePrelim: false,
    overheadPercent: 10,
    profitPercent: 15,
    poFormula: 'markup'
  },
  {
    title: 'Precast Concrete Kerbs 125x250mm Bedded & Jointed (m)',
    trade: 'External Works & Paving',
    unit: 'm',
    materials: [
      {
        name: '125x250mm Precast Concrete Kerb (1m length)',
        unit: 'm',
        qty: 1.03,
        rate: 4200,
        wastePercent: 3,
        marketRef: 'Standard hydraulic pressed kerb',
        marketRate: 4200,
        marketLocation: 'Lagos',
        marketDate: '18/09/26'
      },
      {
        name: 'Grade 15 (1:3:6) Concrete Bedding & Haunching',
        unit: 'm3',
        qty: 0.035,
        rate: 120000,
        wastePercent: 5,
        marketRef: 'Lean bedding mix',
        marketRate: 120000,
        marketLocation: 'Lagos',
        marketDate: '18/09/26'
      }
    ],
    labourGangDesc: '1 Kerb Mason + 1 Helper',
    labourDailyGangWage: 17000,
    dailyGangOutput: 15,
    useDirectLabour: false,
    plantDesc: 'Hand tamper & string-line alignment set',
    plantDailyHire: 2500,
    plantDailyOutput: 15,
    useDirectPlant: false,
    noPlantRequired: false,
    includePrelim: false,
    overheadPercent: 10,
    profitPercent: 15,
    poFormula: 'markup'
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

  // Rate Build-up State - Dynamic & QS Fully Editable
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [buildItemTitle, setBuildItemTitle] = useState(RATE_BUILDUP_PRESETS[0].title);
  const [buildTrade, setBuildTrade] = useState(RATE_BUILDUP_PRESETS[0].trade);
  const [buildUnit, setBuildUnit] = useState(RATE_BUILDUP_PRESETS[0].unit);

  // 1. Material Rows (Dynamic array)
  const [materials, setMaterials] = useState<BuildupMaterialRow[]>(() => 
    RATE_BUILDUP_PRESETS[0].materials.map((m, idx) => ({
      id: `mat-${Date.now()}-${idx}`,
      name: m.name,
      unit: m.unit,
      qty: m.qty,
      rate: m.rate,
      wastePercent: m.wastePercent,
      marketRef: m.marketRef,
      marketRate: m.marketRate,
      marketLocation: m.marketLocation,
      marketDate: m.marketDate,
    }))
  );

  // 2. Labour Parameters
  const [labourGangDesc, setLabourGangDesc] = useState(RATE_BUILDUP_PRESETS[0].labourGangDesc);
  const [labourDailyGangWage, setLabourDailyGangWage] = useState<number | ''>(RATE_BUILDUP_PRESETS[0].labourDailyGangWage);
  const [dailyGangOutput, setDailyGangOutput] = useState<number | ''>(RATE_BUILDUP_PRESETS[0].dailyGangOutput);
  const [useDirectLabour, setUseDirectLabour] = useState(RATE_BUILDUP_PRESETS[0].useDirectLabour || false);
  const [directLabourOverride, setDirectLabourOverride] = useState<number | ''>(RATE_BUILDUP_PRESETS[0].directLabourOverride || 2500);

  // 3. Plant & Equipment Parameters (Stored as Daily Hire / Output, with direct toggle)
  const [plantDesc, setPlantDesc] = useState(RATE_BUILDUP_PRESETS[0].plantDesc);
  const [noPlantRequired, setNoPlantRequired] = useState(RATE_BUILDUP_PRESETS[0].noPlantRequired || false);
  const [useDirectPlant, setUseDirectPlant] = useState(RATE_BUILDUP_PRESETS[0].useDirectPlant || false);
  const [plantDailyHire, setPlantDailyHire] = useState<number | ''>(RATE_BUILDUP_PRESETS[0].plantDailyHire);
  const [plantDailyOutput, setPlantDailyOutput] = useState<number | ''>(RATE_BUILDUP_PRESETS[0].plantDailyOutput);
  const [directPlantOverride, setDirectPlantOverride] = useState<number | ''>(RATE_BUILDUP_PRESETS[0].directPlantOverride || 1428);

  // 4. Preliminaries / Site Water / Haulage Component (Optional)
  const [includePrelim, setIncludePrelim] = useState(RATE_BUILDUP_PRESETS[0].includePrelim || false);
  const [prelimDesc, setPrelimDesc] = useState(RATE_BUILDUP_PRESETS[0].prelimDesc || 'Borehole water supply & site power setup');
  const [prelimTotalCost, setPrelimTotalCost] = useState<number | ''>(RATE_BUILDUP_PRESETS[0].prelimTotalCost || 350000);
  const [prelimTotalUnits, setPrelimTotalUnits] = useState<number | ''>(RATE_BUILDUP_PRESETS[0].prelimTotalUnits || 5400);

  // 5. Contractor Overheads & Profit
  const [overheadPercent, setOverheadPercent] = useState<number | ''>(RATE_BUILDUP_PRESETS[0].overheadPercent);
  const [profitPercent, setProfitPercent] = useState<number | ''>(RATE_BUILDUP_PRESETS[0].profitPercent);
  const [poFormula, setPoFormula] = useState<'markup' | 'sequential' | 'margin' | 'fixed'>(RATE_BUILDUP_PRESETS[0].poFormula || 'markup');
  const [fixedMarkupAmount, setFixedMarkupAmount] = useState<number | ''>(0);

  // UI helpers
  const [activeTooltipRowId, setActiveTooltipRowId] = useState<string | null>(null);
  const [isSavingCustomRate, setIsSavingCustomRate] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  // My Custom Rates State
  const [myRates, setMyRates] = useState<UserCustomRate[]>([]);
  const [isLoadingMyRates, setIsLoadingMyRates] = useState(false);
  const [isImportingBoq, setIsImportingBoq] = useState(false);
  const [importNotice, setImportNotice] = useState('');
  
  // Custom Rates Inline Edit State
  const [editingCustomRateId, setEditingCustomRateId] = useState<string | null>(null);
  const [editingRatesForm, setEditingRatesForm] = useState({
    lagosRate: 0,
    abujaRate: 0,
    portHarcourtRate: 0,
    northernRate: 0
  });

  // New Custom Rate Form
  const [isAddingRate, setIsAddingRate] = useState(false);
  const [newRateForm, setNewRateForm] = useState({
    category: 'General Works',
    item: '',
    description: '',
    unit: 'm2',
    rate: 0,
    lagosRate: 0,
    abujaRate: 0,
    portHarcourtRate: 0,
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

  // Unit suggestion placeholders based on Nigerian QS practice
  const getUnitQtyPlaceholder = (unit: string) => {
    const u = (unit || '').toLowerCase().trim();
    if (u.includes('m2') || u.includes('m²') || u.includes('sqm')) return '10 (e.g. blocks/m²)';
    if (u.includes('m3') || u.includes('m³') || u.includes('cum')) return '6 (e.g. bags cement/m³)';
    if (u.includes('kg') || u.includes('tonne') || u.includes('ton')) return '1.05 (kg per kg)';
    if (u === 'm' || u.includes('lm') || u.includes('lin')) return '1.05 (m per m)';
    return '1 (item/unit)';
  };

  const getLabourOutputPlaceholder = (unit: string) => {
    const u = (unit || '').toLowerCase().trim();
    if (u.includes('m2') || u.includes('m²') || u.includes('sqm')) return '7 or 14 (m²/day)';
    if (u.includes('m3') || u.includes('m³') || u.includes('cum')) return '3.5 or 8 (m³/day)';
    if (u.includes('kg')) return '120 (kg/day)';
    if (u === 'm' || u.includes('lm') || u.includes('lin')) return '15 or 25 (m/day)';
    return '5 (nr/day)';
  };

  const getPlantOutputPlaceholder = (unit: string) => {
    const u = (unit || '').toLowerCase().trim();
    if (u.includes('m2') || u.includes('m²') || u.includes('sqm')) return '7 or 14 (m²/day)';
    if (u.includes('m3') || u.includes('m³') || u.includes('cum')) return '3.5 or 8 (m³/day)';
    if (u.includes('kg')) return '120 (kg/day)';
    if (u === 'm' || u.includes('lm') || u.includes('lin')) return '15 or 25 (m/day)';
    return '5 (nr/day)';
  };

  // Handle Preset Selection
  const applyPreset = (idx: number) => {
    setSelectedPreset(idx);
    const p = RATE_BUILDUP_PRESETS[idx];
    setBuildItemTitle(p.title);
    setBuildTrade(p.trade);
    setBuildUnit(p.unit);
    setMaterials(p.materials.map((m, mIdx) => ({
      id: `mat-${Date.now()}-${mIdx}`,
      name: m.name,
      unit: m.unit,
      qty: m.qty,
      rate: m.rate,
      wastePercent: m.wastePercent,
      marketRef: m.marketRef,
      marketRate: m.marketRate,
      marketLocation: m.marketLocation,
      marketDate: m.marketDate,
    })));
    setLabourGangDesc(p.labourGangDesc);
    setLabourDailyGangWage(p.labourDailyGangWage);
    setDailyGangOutput(p.dailyGangOutput);
    setUseDirectLabour(p.useDirectLabour || false);
    setDirectLabourOverride(p.directLabourOverride || 2500);
    setPlantDesc(p.plantDesc);
    setPlantDailyHire(p.plantDailyHire);
    setPlantDailyOutput(p.plantDailyOutput);
    setUseDirectPlant(p.useDirectPlant || false);
    setDirectPlantOverride(p.directPlantOverride || 1428);
    setNoPlantRequired(p.noPlantRequired || false);
    setIncludePrelim(p.includePrelim || false);
    setPrelimDesc(p.prelimDesc || 'Borehole water supply & site power setup');
    setPrelimTotalCost(p.prelimTotalCost || 350000);
    setPrelimTotalUnits(p.prelimTotalUnits || 5400);
    setOverheadPercent(p.overheadPercent);
    setProfitPercent(p.profitPercent);
    setPoFormula(p.poFormula || 'markup');
  };

  // Material Table Row Actions
  const handleAddMaterialRow = () => {
    const newRow: BuildupMaterialRow = {
      id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      unit: buildUnit || 'Nr',
      qty: '',
      rate: '',
      wastePercent: 5,
    };
    setMaterials(prev => [...prev, newRow]);
  };

  const handleUpdateMaterialRow = (id: string, field: keyof BuildupMaterialRow, value: any) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleRemoveMaterialRow = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleSyncToMarket = (id: string, marketRate: number) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, rate: marketRate } : m));
  };

  // Reset to current preset defaults
  const handleResetMaterials = () => {
    const p = RATE_BUILDUP_PRESETS[selectedPreset];
    setMaterials(p.materials.map((m, mIdx) => ({
      id: `mat-${Date.now()}-${mIdx}`,
      name: m.name,
      unit: m.unit,
      qty: m.qty,
      rate: m.rate,
      wastePercent: m.wastePercent,
      marketRef: m.marketRef,
      marketRate: m.marketRate,
      marketLocation: m.marketLocation,
      marketDate: m.marketDate,
    })));
  };

  const handleResetLabour = () => {
    const p = RATE_BUILDUP_PRESETS[selectedPreset];
    setLabourGangDesc(p.labourGangDesc);
    setLabourDailyGangWage(p.labourDailyGangWage);
    setDailyGangOutput(p.dailyGangOutput);
    setUseDirectLabour(p.useDirectLabour || false);
    setDirectLabourOverride(p.directLabourOverride || 2500);
  };

  const handleResetPlant = () => {
    const p = RATE_BUILDUP_PRESETS[selectedPreset];
    setPlantDesc(p.plantDesc);
    setPlantDailyHire(p.plantDailyHire);
    setPlantDailyOutput(p.plantDailyOutput);
    setUseDirectPlant(p.useDirectPlant || false);
    setDirectPlantOverride(p.directPlantOverride || 1428);
    setNoPlantRequired(p.noPlantRequired || false);
  };

  // Find if user has a previously saved rate for this trade
  const matchingSavedTradeRate = myRates.find(r => 
    (r.category && buildTrade && r.category.toLowerCase().trim() === buildTrade.toLowerCase().trim()) ||
    (r.category && buildTrade && r.category.toLowerCase().includes(buildTrade.toLowerCase())) ||
    (r.item && buildItemTitle && r.item.toLowerCase().includes(buildItemTitle.toLowerCase()))
  );

  const handleUseMyLastRate = (savedRate: UserCustomRate) => {
    if (savedRate.category) setBuildTrade(savedRate.category);
    if (savedRate.item) setBuildItemTitle(savedRate.item);
    if (savedRate.unit) setBuildUnit(savedRate.unit);
  };

  // Live Calculations (100% dynamic, live reacting to QS edits)
  const totalNetMaterialBase = materials.reduce((acc, m) => {
    const q = Number(m.qty) || 0;
    const r = Number(m.rate) || 0;
    return acc + (q * r);
  }, 0);

  const totalGrossMaterials = materials.reduce((acc, m) => {
    const q = Number(m.qty) || 0;
    const r = Number(m.rate) || 0;
    const w = Number(m.wastePercent) || 0;
    return acc + (q * r * (1 + w / 100));
  }, 0);

  const totalMaterialWasteAmount = totalGrossMaterials - totalNetMaterialBase;

  const labourUnitCost = useDirectLabour
    ? (Number(directLabourOverride) || 0)
    : ((Number(dailyGangOutput) > 0) ? ((Number(labourDailyGangWage) || 0) / Number(dailyGangOutput)) : 0);

  const plantUnitCost = noPlantRequired
    ? 0
    : (useDirectPlant
        ? (Number(directPlantOverride) || 0)
        : ((Number(plantDailyOutput) > 0) ? ((Number(plantDailyHire) || 0) / Number(plantDailyOutput)) : 0));

  const prelimUnitCost = (includePrelim && Number(prelimTotalUnits) > 0)
    ? ((Number(prelimTotalCost) || 0) / Number(prelimTotalUnits))
    : 0;

  const primeCost = totalGrossMaterials + labourUnitCost + plantUnitCost + prelimUnitCost;

  const ovh = Number(overheadPercent) || 0;
  const prf = Number(profitPercent) || 0;
  let poAmount = 0;
  if (poFormula === 'markup') {
    poAmount = primeCost * ((ovh + prf) / 100);
  } else if (poFormula === 'sequential') {
    poAmount = primeCost * (1 + ovh / 100) * (1 + prf / 100) - primeCost;
  } else if (poFormula === 'margin') {
    const marginFraction = (ovh + prf) / 100;
    poAmount = marginFraction < 0.99 ? (primeCost / (1 - marginFraction)) - primeCost : 0;
  } else if (poFormula === 'fixed') {
    poAmount = Number(fixedMarkupAmount) || 0;
  }

  const compositeRate = Math.round(primeCost + poAmount);
  const compositeAbuja = Math.round(compositeRate * 1.05);
  const compositePH = Math.round(compositeRate * 1.09);
  const compositeNorthern = Math.round(compositeRate * 0.96);

  // Soft Warning / Market Benchmark Reference (Requirement 6)
  const benchmarkMatch = rates.find(r => 
    (r.item && buildItemTitle && (
      r.item.toLowerCase().includes(buildItemTitle.toLowerCase()) || 
      buildItemTitle.toLowerCase().includes(r.item.toLowerCase())
    )) ||
    (r.category && buildTrade && r.category.toLowerCase() === buildTrade.toLowerCase())
  );

  const benchmarkVal = benchmarkMatch
    ? (selectedRegion === 'ph' 
        ? benchmarkMatch.ph 
        : selectedRegion === 'abuja' 
          ? benchmarkMatch.abuja 
          : benchmarkMatch.lagos)
    : null;

  const percentAboveBenchmark = (benchmarkVal && benchmarkVal > 0 && compositeRate > benchmarkVal * 1.25)
    ? Math.round(((compositeRate - benchmarkVal) / benchmarkVal) * 100)
    : null;

  // Save Built-up rate preserving exact QS inputs (Requirement 6)
  const handleSaveBuildUpToMyRates = async () => {
    setIsSavingCustomRate(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');
    try {
      const currentPreset = RATE_BUILDUP_PRESETS[selectedPreset];
      const isQsCustom = (
        buildItemTitle !== currentPreset?.title ||
        Math.round(totalGrossMaterials) !== Math.round(currentPreset?.materials.reduce((a, b) => a + (b.qty * b.rate * (1 + b.wastePercent / 100)), 0)) ||
        labourDailyGangWage !== currentPreset?.labourDailyGangWage ||
        dailyGangOutput !== currentPreset?.dailyGangOutput ||
        useDirectLabour !== (currentPreset?.useDirectLabour || false) ||
        plantDailyHire !== currentPreset?.plantDailyHire ||
        plantDailyOutput !== currentPreset?.plantDailyOutput ||
        noPlantRequired !== (currentPreset?.noPlantRequired || false) ||
        includePrelim !== (currentPreset?.includePrelim || false) ||
        overheadPercent !== currentPreset?.overheadPercent ||
        profitPercent !== currentPreset?.profitPercent
      );

      const labourSummary = useDirectLabour 
        ? `Direct ₦${Number(directLabourOverride).toLocaleString()}/${buildUnit}` 
        : `Gang ₦${Number(labourDailyGangWage).toLocaleString()}/day ÷ ${dailyGangOutput} ${buildUnit}/day`;
      const plantSummary = noPlantRequired 
        ? 'No Plant Required' 
        : useDirectPlant 
          ? `Direct ₦${Number(directPlantOverride).toLocaleString()}/${buildUnit}` 
          : `Plant ₦${Number(plantDailyHire).toLocaleString()}/day ÷ ${plantDailyOutput} ${buildUnit}/day`;
      const prelimSummary = includePrelim ? `Prelims (₦${Number(prelimTotalCost).toLocaleString()} ÷ ${prelimTotalUnits} = ₦${Math.round(prelimUnitCost).toLocaleString()})` : '';
      const auditMarketRef = benchmarkVal ? `Benchmark Ref: ₦${benchmarkVal.toLocaleString()} (${selectedRegion.toUpperCase()})` : 'Market Index Ref';

      const payload = {
        category: buildTrade,
        item: buildItemTitle,
        description: `Rate Analysis [${isQsCustom ? 'QS Custom' : 'Preset'}]: Materials (₦${Math.round(totalGrossMaterials).toLocaleString()}), Labour (${labourSummary}), Plant (${plantSummary})${prelimSummary ? `, ${prelimSummary}` : ''} + ${overheadPercent}% Ovh & ${profitPercent}% Prf [${poFormula}]. ${auditMarketRef}`,
        unit: buildUnit,
        rate: compositeRate,
        lagosRate: compositeRate,
        abujaRate: compositeAbuja,
        portHarcourtRate: compositePH,
        northernRate: compositeNorthern,
        location: projectLocation,
        source: isQsCustom ? 'QS Custom Rate Analysis' : 'Preset Rate Analysis',
        tag: isQsCustom ? 'QS Custom' : 'Preset'
      };

      const { ok, data, error } = await safeFetchJson<{ success: boolean }>('/api/rates/my', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Also persist to master catalog table
      await safeFetchJson('/api/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          type: 'Material',
          materialComponent: totalGrossMaterials,
          labourComponent: labourUnitCost,
          plantComponent: plantUnitCost,
          overheadProfitPercent: (Number(overheadPercent) || 0) + (Number(profitPercent) || 0),
          isCustom: true,
          tag: isQsCustom ? 'QS Custom' : 'Standard'
        })
      });

      if (ok && data?.success) {
        setSaveSuccessMsg(`Rate saved as "${isQsCustom ? 'QS Custom' : 'Preset'}"! Lagos: ₦${compositeRate.toLocaleString()}, Abuja: ₦${compositeAbuja.toLocaleString()}, PH: ₦${compositePH.toLocaleString()}`);
        setTimeout(() => setSaveSuccessMsg(''), 5000);
        fetchMyRates();
      } else {
        setSaveErrorMsg(error || 'Failed to save rate to database.');
        setTimeout(() => setSaveErrorMsg(''), 4000);
      }
    } catch (e: any) {
      setSaveErrorMsg(e?.message || 'Error communicating with server.');
      setTimeout(() => setSaveErrorMsg(''), 4000);
    } finally {
      setIsSavingCustomRate(false);
    }
  };

  // Inline edit handlers for custom rates table
  const handleStartInlineEdit = (mr: UserCustomRate) => {
    setEditingCustomRateId(mr.id);
    const lRate = Number(mr.lagosRate || mr.rate || 0);
    setEditingRatesForm({
      lagosRate: lRate,
      abujaRate: Number(mr.abujaRate || Math.round(lRate * 1.05)),
      portHarcourtRate: Number(mr.portHarcourtRate || Math.round(lRate * 1.09)),
      northernRate: Number(mr.northernRate || Math.round(lRate * 0.96))
    });
  };

  const handleSaveInlineEdit = async (id: string) => {
    try {
      const { ok } = await safeFetchJson(`/api/rates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lagosRate: editingRatesForm.lagosRate,
          abujaRate: editingRatesForm.abujaRate,
          portHarcourtRate: editingRatesForm.portHarcourtRate,
          northernRate: editingRatesForm.northernRate,
          rate: editingRatesForm.lagosRate
        })
      });
      if (ok) {
        setMyRates(prev => prev.map(r => r.id === id ? {
          ...r,
          rate: editingRatesForm.lagosRate,
          lagosRate: editingRatesForm.lagosRate,
          abujaRate: editingRatesForm.abujaRate,
          portHarcourtRate: editingRatesForm.portHarcourtRate,
          northernRate: editingRatesForm.northernRate
        } : r));
        setEditingCustomRateId(null);
      }
    } catch (e) {
      console.error('Failed to save rate inline:', e);
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
          lagosRate: 0,
          abujaRate: 0,
          portHarcourtRate: 0,
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

        {/* ================= TAB 2: RATE ANALYSIS CALCULATOR (QS FULL DISCRETION) ================= */}
        {activeTab === 'buildup' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Column: Editable Parameters & Granular Tables */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Presets & Trade Selection Bar */}
                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Standard Nigerian Trade Presets:</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => applyPreset(selectedPreset)}
                      className="text-[11px] text-slate-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition"
                      title="Reset all fields to the currently selected preset"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to Preset Default</span>
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {RATE_BUILDUP_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyPreset(idx)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                          selectedPreset === idx
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {p.title.split(' ')[0]} {p.title.split(' ')[1]} ({p.unit})
                      </button>
                    ))}
                  </div>

                  {/* "Use My Last Rate for this Trade" quick button */}
                  {matchingSavedTradeRate && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Found saved rate in your custom price book:</span>
                      <button
                        type="button"
                        onClick={() => handleUseMyLastRate(matchingSavedTradeRate)}
                        className="text-xs px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-semibold flex items-center gap-1.5 transition"
                      >
                        <Zap className="w-3 h-3 text-emerald-600" />
                        <span>Use My Last Rate for this Trade ({formatNaira(matchingSavedTradeRate.rate)}/{matchingSavedTradeRate.unit})</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Soft Benchmark Warning (Requirement 6 - Never blocks saving) */}
                {percentAboveBenchmark !== null && benchmarkVal && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 shadow-xs animate-fade-in">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-amber-950">
                        Soft Market Benchmark Notice: This rate {formatNaira(compositeRate)} is {percentAboveBenchmark}% above {selectedRegion.toUpperCase()} average ({formatNaira(benchmarkVal)} for &ldquo;{benchmarkMatch?.item}&rdquo;)
                      </p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Check Plant hire or Material quantities if this was unintentional. 
                        <strong>QS sole discretion applies:</strong> this is advisory only and rate can be saved freely without restriction.
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Rate Header: Item Title, Trade & Unit */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Item Description <span className="text-slate-400 font-normal">(Editable)</span>
                      </label>
                      <input
                        type="text"
                        value={buildItemTitle}
                        onChange={(e) => setBuildItemTitle(e.target.value)}
                        placeholder="e.g. 225mm Vibrated Sandcrete Blockwork"
                        className="w-full text-xs p-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 placeholder:italic focus:ring-2 focus:ring-emerald-500 shadow-xs"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Trade Section
                      </label>
                      <input
                        type="text"
                        value={buildTrade}
                        onChange={(e) => setBuildTrade(e.target.value)}
                        placeholder="e.g. Blockwork & Partitioning"
                        className="w-full text-xs p-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 placeholder:italic focus:ring-2 focus:ring-emerald-500 shadow-xs"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Unit <span className="text-emerald-700 font-bold">({buildUnit})</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={buildUnit}
                          onChange={(e) => setBuildUnit(e.target.value)}
                          placeholder="m2, m3, kg, nr"
                          className="w-full text-xs p-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold uppercase placeholder:text-slate-400 placeholder:italic focus:ring-2 focus:ring-emerald-500 shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Unit Selector */}
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                    <span>Quick Unit:</span>
                    {['m2', 'm3', 'kg', 'm', 'nr'].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setBuildUnit(u)}
                        className={`px-2 py-0.5 rounded font-mono font-medium transition ${
                          buildUnit.toLowerCase() === u
                            ? 'bg-emerald-800 text-white font-bold'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {u === 'm2' ? 'm²' : u === 'm3' ? 'm³' : u}
                      </button>
                    ))}
                    <span className="text-slate-400 italic ml-2">Labels & suggested output update automatically</span>
                  </div>
                </div>

                {/* 1. MATERIAL TABLE - QS EDITS ALL (Requirement 2) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">1</span>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Materials Supply & Waste Allowance <span className="font-normal text-slate-500 lowercase">(per {buildUnit})</span>
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetMaterials}
                        className="text-[11px] text-slate-500 hover:text-emerald-700 font-medium transition flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Materials</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAddMaterialRow}
                        className="text-xs px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-semibold flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Material Line</span>
                      </button>
                    </div>
                  </div>

                  {/* Materials Expandable Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                          <th className="py-2 px-2">Material Description</th>
                          <th className="py-2 px-2 w-20">Unit</th>
                          <th className="py-2 px-2 w-24">Qty / {buildUnit}</th>
                          <th className="py-2 px-2 w-32">Rate (₦)</th>
                          <th className="py-2 px-2 w-20">Waste %</th>
                          <th className="py-2 px-2 w-28 text-right">Cost (₦)</th>
                          <th className="py-2 px-1 w-8 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {materials.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-4 text-center text-slate-400 italic">
                              No materials required for this item (e.g. manual excavation). Click &ldquo;Add Material Line&rdquo; to introduce supplies.
                            </td>
                          </tr>
                        ) : (
                          materials.map((mat) => {
                            const q = Number(mat.qty) || 0;
                            const r = Number(mat.rate) || 0;
                            const w = Number(mat.wastePercent) || 0;
                            const lineCost = q * r * (1 + w / 100);
                            const hasMarketRef = mat.marketRate && mat.marketRate > 0;
                            const isDifferentFromMarket = hasMarketRef && Number(mat.rate) !== Number(mat.marketRate);

                            return (
                              <tr key={mat.id} className="hover:bg-slate-50/70 transition">
                                <td className="py-2 px-2">
                                  <input
                                    type="text"
                                    value={mat.name}
                                    onChange={(e) => handleUpdateMaterialRow(mat.id, 'name', e.target.value)}
                                    placeholder="e.g. 9-inch Sandcrete block"
                                    className="w-full text-xs p-1.5 rounded bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                                  />
                                  {mat.marketRef && (
                                    <div className="mt-0.5 text-[10px] text-slate-500 flex items-center gap-1">
                                      <span className="truncate">{mat.marketRef}</span>
                                    </div>
                                  )}
                                </td>

                                <td className="py-2 px-2">
                                  <input
                                    type="text"
                                    value={mat.unit}
                                    onChange={(e) => handleUpdateMaterialRow(mat.id, 'unit', e.target.value)}
                                    placeholder="Nr, bag"
                                    className="w-full text-xs p-1.5 rounded bg-white border border-slate-300 text-slate-900 font-mono text-center placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                                  />
                                </td>

                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    step="any"
                                    value={mat.qty}
                                    onChange={(e) => handleUpdateMaterialRow(mat.id, 'qty', e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder={getUnitQtyPlaceholder(buildUnit)}
                                    className="w-full text-xs p-1.5 rounded bg-white border border-slate-300 text-slate-900 font-mono text-right placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                                  />
                                </td>

                                <td className="py-2 px-2 relative">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="any"
                                      value={mat.rate}
                                      onChange={(e) => handleUpdateMaterialRow(mat.id, 'rate', e.target.value === '' ? '' : Number(e.target.value))}
                                      placeholder={mat.marketRate ? String(mat.marketRate) : '0'}
                                      onFocus={() => setActiveTooltipRowId(mat.id)}
                                      onBlur={() => setTimeout(() => setActiveTooltipRowId(null), 300)}
                                      className="w-full text-xs p-1.5 rounded bg-white border border-slate-300 text-slate-900 font-mono text-right placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                                    />
                                    {hasMarketRef && (
                                      <button
                                        type="button"
                                        onClick={() => setActiveTooltipRowId(activeTooltipRowId === mat.id ? null : mat.id)}
                                        className="text-slate-400 hover:text-emerald-700 transition shrink-0"
                                        title={`Market Index Ref: ₦${mat.marketRate?.toLocaleString()} (${mat.marketLocation || 'PH'}, ${mat.marketDate || '18/09/26'})`}
                                      >
                                        <Info className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>

                                  {/* Market Index Tooltip & QS Overwrite Button */}
                                  {activeTooltipRowId === mat.id && hasMarketRef && (
                                    <div className="absolute z-20 left-0 top-full mt-1 w-64 p-2 bg-slate-900 text-white rounded-lg shadow-xl text-[10px] space-y-1">
                                      <p className="font-semibold text-emerald-300">
                                        Market Index: ₦{mat.marketRate?.toLocaleString()} ({mat.marketLocation || 'PH'}, {mat.marketDate || '18/09/26'})
                                      </p>
                                      <p className="text-slate-300 leading-tight">
                                        QS has sole discretion to enter any supplier rate. System saves your typed price.
                                      </p>
                                      {isDifferentFromMarket && (
                                        <button
                                          type="button"
                                          onMouseDown={() => handleSyncToMarket(mat.id, mat.marketRate!)}
                                          className="mt-1 px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-medium text-[10px] transition block w-full text-center"
                                        >
                                          Update to Market Price (₦{mat.marketRate?.toLocaleString()})
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  {isDifferentFromMarket && (
                                    <div className="mt-0.5 flex items-center justify-between text-[10px]">
                                      <span className="text-emerald-700 font-semibold">QS Custom</span>
                                      <button
                                        type="button"
                                        onClick={() => handleSyncToMarket(mat.id, mat.marketRate!)}
                                        className="text-slate-500 hover:text-emerald-700 underline text-[10px]"
                                        title="Click if you wish to sync back to market index price"
                                      >
                                        Mkt: ₦{mat.marketRate?.toLocaleString()}
                                      </button>
                                    </div>
                                  )}
                                </td>

                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    step="any"
                                    value={mat.wastePercent}
                                    onChange={(e) => handleUpdateMaterialRow(mat.id, 'wastePercent', e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="5%"
                                    className="w-full text-xs p-1.5 rounded bg-white border border-slate-300 text-slate-900 font-mono text-center placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                                  />
                                </td>

                                <td className="py-2 px-2 text-right font-mono font-bold text-slate-800">
                                  {formatNaira(Math.round(lineCost))}
                                </td>

                                <td className="py-2 px-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMaterialRow(mat.id)}
                                    className="text-slate-300 hover:text-red-600 p-1 transition"
                                    title="Delete row"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Materials Subtotal Footer */}
                  <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="text-emerald-900">
                      <span>Net Supply: </span>
                      <span className="font-mono font-semibold">{formatNaira(Math.round(totalNetMaterialBase))}</span>
                      <span className="text-slate-400 mx-2">|</span>
                      <span>Waste Cost: </span>
                      <span className="font-mono font-semibold text-amber-800">+{formatNaira(Math.round(totalMaterialWasteAmount))}</span>
                    </div>
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>Total Gross Material Cost:</span>
                      <span className="font-mono text-sm text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-300">
                        {formatNaira(Math.round(totalGrossMaterials))} / {buildUnit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. LABOUR COMPONENT - QS EDITS ALL (Requirement 3) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">2</span>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Labour Gang & Daily Output <span className="font-normal text-slate-500 lowercase">(per {buildUnit})</span>
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetLabour}
                        className="text-[11px] text-slate-500 hover:text-emerald-700 font-medium transition flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Labour</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseDirectLabour(!useDirectLabour)}
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold transition border ${
                          useDirectLabour
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {useDirectLabour ? '✓ Using Direct ₦/' + buildUnit : 'Enter Direct ₦/' + buildUnit}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gang Description <span className="text-slate-400 font-normal">(Editable)</span>
                    </label>
                    <input
                      type="text"
                      value={labourGangDesc}
                      onChange={(e) => setLabourGangDesc(e.target.value)}
                      placeholder="e.g. Gang 1 mason + 2 labour"
                      className="w-full text-xs p-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                    />
                  </div>

                  {!useDirectLabour ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/40 rounded-lg border border-amber-200/50">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          Daily Gang Wage (₦/day)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={labourDailyGangWage}
                          onChange={(e) => setLabourDailyGangWage(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g. 15000"
                          className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Suggestion from NIQS craftsman guide</span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          Daily Gang Output ({buildUnit}/day)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={dailyGangOutput}
                          onChange={(e) => setDailyGangOutput(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder={getLabourOutputPlaceholder(buildUnit)}
                          className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Output unit matches main unit ({buildUnit})</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-amber-950">
                          Direct Labour Rate (₦/{buildUnit}) <span className="text-slate-400 font-normal">— Sole QS Override</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setUseDirectLabour(false)}
                          className="text-[11px] text-amber-700 hover:underline"
                        >
                          Switch back to Wage ÷ Output
                        </button>
                      </div>
                      <input
                        type="number"
                        step="any"
                        value={directLabourOverride}
                        onChange={(e) => setDirectLabourOverride(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 2500"
                        className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs px-2 text-slate-700">
                    <span>Computed Labour Component:</span>
                    <span className="font-mono font-bold text-amber-900">
                      {formatNaira(Math.round(labourUnitCost))} / {buildUnit}
                    </span>
                  </div>
                </div>

                {/* 3. PLANT COMPONENT - STORED AS HIRE/OUTPUT (Requirement 4) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">3</span>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Plant, Tools & Equipment <span className="font-normal text-slate-500 lowercase">(Stored as Hire ÷ Output)</span>
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetPlant}
                        className="text-[11px] text-slate-500 hover:text-emerald-700 font-medium transition flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Plant</span>
                      </button>
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={noPlantRequired}
                          onChange={(e) => setNoPlantRequired(e.target.checked)}
                          className="rounded text-emerald-700 focus:ring-emerald-500"
                        />
                        <span>No Plant Required</span>
                      </label>
                    </div>
                  </div>

                  {!noPlantRequired ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Plant Description <span className="text-slate-400 font-normal">(Editable)</span>
                        </label>
                        <input
                          type="text"
                          value={plantDesc}
                          onChange={(e) => setPlantDesc(e.target.value)}
                          placeholder="e.g. 500L Concrete Mixer & Poker Vibrator"
                          className="w-full text-xs p-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Plant Cost Calculation Method:</span>
                        <button
                          type="button"
                          onClick={() => setUseDirectPlant(!useDirectPlant)}
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold transition border ${
                            useDirectPlant
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {useDirectPlant ? '✓ Direct ₦/' + buildUnit : 'Enter per Unit directly'}
                        </button>
                      </div>

                      {!useDirectPlant ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/40 rounded-lg border border-blue-200/50">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Daily Hire / Operation (₦/day)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={plantDailyHire}
                              onChange={(e) => setPlantDailyHire(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="e.g. 10000"
                              className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                            />
                            <span className="text-[10px] text-slate-500 mt-0.5 block">Stored as N/day ÷ Output (not fixed N/m2)</span>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Daily Plant Output ({buildUnit}/day)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={plantDailyOutput}
                              onChange={(e) => setPlantDailyOutput(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder={getPlantOutputPlaceholder(buildUnit)}
                              className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                            />
                            <span className="text-[10px] text-slate-500 mt-0.5 block">Output matches unit ({buildUnit})</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 space-y-2">
                          <label className="text-xs font-semibold text-blue-950 block">
                            Direct Plant Rate (₦/{buildUnit}) <span className="text-slate-400 font-normal">— QS Override</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={directPlantOverride}
                            onChange={(e) => setDirectPlantOverride(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="e.g. 1428"
                            className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs px-2 text-slate-700">
                        <span>Computed Plant Component:</span>
                        <span className="font-mono font-bold text-blue-900">
                          {formatNaira(Math.round(plantUnitCost))} / {buildUnit}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 italic text-center">
                      No plant cost assigned for this item. Uncheck &ldquo;No Plant Required&rdquo; to add mixer, scaffolding or equipment hire.
                    </p>
                  )}
                </div>

                {/* 4. PRELIMINARIES / WATER / HAULAGE APPORTIONMENT (User Example: Borehole 350,000 / 5400) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold">4</span>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Site Preliminaries, Water & Haulage Apportionment <span className="font-normal text-slate-500 lowercase">(Optional)</span>
                      </h4>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includePrelim}
                        onChange={(e) => setIncludePrelim(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-500"
                      />
                      <span>Include Prelims</span>
                    </label>
                  </div>

                  {includePrelim ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Apportionment Description
                        </label>
                        <input
                          type="text"
                          value={prelimDesc}
                          onChange={(e) => setPrelimDesc(e.target.value)}
                          placeholder="e.g. Site borehole drilling & water supply setup"
                          className="w-full text-xs p-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 placeholder:italic focus:ring-2 focus:ring-emerald-500 shadow-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-purple-50/40 rounded-lg border border-purple-200/50">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">
                            Lump Sum Cost (₦)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={prelimTotalCost}
                            onChange={(e) => setPrelimTotalCost(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="e.g. 350000"
                            className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">
                            Total Project Apportioned Output ({buildUnit})
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={prelimTotalUnits}
                            onChange={(e) => setPrelimTotalUnits(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="e.g. 5400"
                            className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs px-2 text-slate-700">
                        <span>
                          Apportioned Prelim ({Number(prelimTotalCost).toLocaleString()} ÷ {prelimTotalUnits} {buildUnit}):
                        </span>
                        <span className="font-mono font-bold text-purple-900">
                          {formatNaira(Math.round(prelimUnitCost * 100) / 100)} / {buildUnit}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Check &ldquo;Include Prelims&rdquo; to amortize borehole water, generator hire or site haulage over the project volume.
                    </p>
                  )}
                </div>

                {/* 5. CONTRACTOR P&O - QS SOLE DISCRETION (Requirement 5) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">5</span>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Overheads & Profit (P&O) Formula Selection
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Overheads Allowance (%)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={overheadPercent}
                        onChange={(e) => setOverheadPercent(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="10%"
                        className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Contractor Profit (%)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={profitPercent}
                        onChange={(e) => setProfitPercent(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="15%"
                        className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Formula Method
                      </label>
                      <select
                        value={poFormula}
                        onChange={(e) => setPoFormula(e.target.value as any)}
                        className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900 focus:ring-1 focus:ring-emerald-500 shadow-xs"
                      >
                        <option value="markup">Prime × (1 + O% + P%) [Standard]</option>
                        <option value="sequential">Prime × (1 + O%) × (1 + P%) [Compounded]</option>
                        <option value="margin">Prime ÷ [1 - (O% + P%)] [Selling Margin]</option>
                        <option value="fixed">Fixed Lump Sum ₦/unit</option>
                      </select>
                    </div>
                  </div>

                  {poFormula === 'fixed' && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Fixed P&O Addition (₦/{buildUnit})
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={fixedMarkupAmount}
                        onChange={(e) => setFixedMarkupAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 3500"
                        className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono shadow-xs"
                      />
                    </div>
                  )}

                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <span>
                      Prime Cost: <strong className="font-mono text-slate-800">{formatNaira(Math.round(primeCost))}</strong> + P&O ({overheadPercent}% Ovh + {profitPercent}% Prf):
                    </span>
                    <span className="font-mono font-bold text-emerald-800">
                      +{formatNaira(Math.round(poAmount))} / {buildUnit}
                    </span>
                  </div>
                </div>

              </div>

              {/* Right Column: Dynamic Calculation Receipt, Multi-City Rates & Save Actions */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Result Summary Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-md space-y-4 sticky top-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                        Final Calculated Unit Rate
                      </span>
                      <h4 className="text-2xl font-bold font-mono text-emerald-800">
                        {formatNaira(compositeRate)} <span className="text-xs font-normal text-slate-500">/ {buildUnit}</span>
                      </h4>
                    </div>
                    <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
                      <ShieldCheck className="w-6 h-6" />
                    </span>
                  </div>

                  {/* Scientific Breakdown Receipt */}
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Gross Materials ({materials.length} line items):</span>
                      <span className="font-mono font-medium text-slate-800">{formatNaira(Math.round(totalGrossMaterials))}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Labour ({useDirectLabour ? 'Direct Override' : `${Number(labourDailyGangWage).toLocaleString()}/day ÷ ${dailyGangOutput} ${buildUnit}`}):</span>
                      <span className="font-mono font-medium text-slate-800">{formatNaira(Math.round(labourUnitCost))}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Plant ({noPlantRequired ? 'None' : useDirectPlant ? 'Direct Override' : `${Number(plantDailyHire).toLocaleString()}/day ÷ ${plantDailyOutput} ${buildUnit}`}):</span>
                      <span className="font-mono font-medium text-slate-800">{formatNaira(Math.round(plantUnitCost))}</span>
                    </div>

                    {includePrelim && prelimUnitCost > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Preliminaries Apportionment:</span>
                        <span className="font-mono font-medium text-purple-800">+{formatNaira(Math.round(prelimUnitCost * 100) / 100)}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                      <span>Total Prime Cost per {buildUnit}:</span>
                      <span className="font-mono text-slate-900">{formatNaira(Math.round(primeCost))}</span>
                    </div>

                    <div className="flex justify-between text-slate-700">
                      <span>Contractor P&O ({overheadPercent}% Ovh + {profitPercent}% Prf):</span>
                      <span className="font-mono font-bold text-emerald-700">+{formatNaira(Math.round(poAmount))}</span>
                    </div>

                    <div className="flex justify-between font-bold text-emerald-950 pt-2 border-t border-emerald-200 text-sm bg-emerald-50/70 p-2.5 rounded-lg">
                      <span>COMPOSITE UNIT RATE:</span>
                      <span className="font-mono text-base">{formatNaira(compositeRate)} / {buildUnit}</span>
                    </div>

                    {/* Regional Multi-City Breakdown */}
                    <div className="pt-3 border-t border-slate-100 space-y-1.5 bg-slate-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Geopolitical Multi-City Index
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold">Auto-calculated</span>
                      </div>

                      <div className="flex justify-between text-xs text-slate-700">
                        <span className="font-medium">Lagos Base (Primary):</span>
                        <span className="font-mono font-bold text-slate-900">{formatNaira(compositeRate)}</span>
                      </div>

                      <div className="flex justify-between text-xs text-slate-700">
                        <span className="font-medium">Abuja FCT (+5% logistics):</span>
                        <span className="font-mono font-bold text-blue-700">{formatNaira(compositeAbuja)}</span>
                      </div>

                      <div className="flex justify-between text-xs text-slate-700">
                        <span className="font-medium">Port Harcourt (+9% maritime):</span>
                        <span className="font-mono font-bold text-emerald-700">{formatNaira(compositePH)}</span>
                      </div>

                      <div className="flex justify-between text-xs text-slate-700">
                        <span className="font-medium">Northern Hub (-4% craft wage):</span>
                        <span className="font-mono font-bold text-amber-700">{formatNaira(compositeNorthern)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Saving Buttons (Requirement 6) */}
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
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Apply Rate to Active BOQ</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveBuildUpToMyRates}
                      disabled={isSavingCustomRate}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{isSavingCustomRate ? 'Saving Rate...' : 'Save Rate with Lagos, Abuja & Port Harcourt Rates'}</span>
                    </button>

                    {saveSuccessMsg && (
                      <p className="text-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg animate-fade-in">
                        ✓ {saveSuccessMsg}
                      </p>
                    )}

                    {saveErrorMsg && (
                      <p className="text-center text-xs font-bold text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg animate-fade-in">
                        ⚠ {saveErrorMsg}
                      </p>
                    )}
                  </div>

                  {/* QS Professional Discretion Notice */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Quantity Surveying Sole Discretion:</span>
                    </p>
                    <p className="leading-relaxed">
                      All inputs in white boxes are 100% editable. Market Index data acts as reference only. 
                      Your custom prices and production outputs are preserved exactly as typed without forced overrides.
                    </p>
                  </div>

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
                    <FormattedNumberInput
                      placeholder="0"
                      value={newRateForm.rate === 0 ? '' : newRateForm.rate}
                      onChange={(val) => setNewRateForm({ ...newRateForm, rate: val })}
                      className="w-full p-1.5 bg-white rounded border border-slate-300 focus:ring-1 focus:ring-emerald-500 font-mono"
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
                      <th className="py-2.5 px-2 text-center w-16">Unit</th>
                      <th className="py-2.5 px-3 text-right w-28">Lagos (₦)</th>
                      <th className="py-2.5 px-3 text-right w-28">Abuja (₦)</th>
                      <th className="py-2.5 px-3 text-right w-32">Port Harcourt (₦)</th>
                      <th className="py-2.5 px-3 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {myRates.map((mr) => {
                      const isEditing = editingCustomRateId === mr.id;
                      const lagosVal = mr.lagosRate || mr.rate || 0;
                      const abujaVal = mr.abujaRate || (lagosVal > 0 ? Math.round(lagosVal * 1.05) : 0);
                      const phVal = mr.portHarcourtRate || (lagosVal > 0 ? Math.round(lagosVal * 1.09) : 0);

                      return (
                        <tr key={mr.id} className="hover:bg-emerald-50/40 transition">
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            <div>{mr.item}</div>
                            <span className="text-[10px] text-slate-500 font-normal">{mr.category || mr.description}</span>
                          </td>
                          <td className="py-3 px-2 text-center font-mono font-medium text-slate-800">{mr.unit}</td>

                          {/* Lagos Benchmark Rate */}
                          <td className="py-2 px-3 text-right font-mono text-xs">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editingRatesForm.lagosRate}
                                onChange={(e) => setEditingRatesForm(prev => ({
                                  ...prev,
                                  lagosRate: Number(e.target.value)
                                }))}
                                className="w-24 p-1 text-right font-mono bg-white border border-emerald-400 rounded focus:ring-1 focus:ring-emerald-500 text-xs"
                              />
                            ) : (
                              <span 
                                onClick={() => handleStartInlineEdit(mr)} 
                                className="font-bold text-slate-900 hover:text-emerald-700 hover:underline cursor-pointer"
                                title="Click to edit Lagos rate"
                              >
                                {lagosVal > 0 ? formatNaira(lagosVal) : <span className="text-amber-600 text-[11px] font-normal">Set Rate</span>}
                              </span>
                            )}
                          </td>

                          {/* Abuja Rate */}
                          <td className="py-2 px-3 text-right font-mono text-xs">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editingRatesForm.abujaRate}
                                onChange={(e) => setEditingRatesForm(prev => ({
                                  ...prev,
                                  abujaRate: Number(e.target.value)
                                }))}
                                className="w-24 p-1 text-right font-mono bg-white border border-blue-400 rounded focus:ring-1 focus:ring-blue-500 text-xs"
                              />
                            ) : (
                              <span 
                                onClick={() => handleStartInlineEdit(mr)} 
                                className="font-bold text-blue-800 hover:text-blue-600 hover:underline cursor-pointer"
                                title="Click to edit Abuja rate"
                              >
                                {abujaVal > 0 ? formatNaira(abujaVal) : <span className="text-amber-600 text-[11px] font-normal">Set Rate</span>}
                              </span>
                            )}
                          </td>

                          {/* Port Harcourt Rate */}
                          <td className="py-2 px-3 text-right font-mono text-xs">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editingRatesForm.portHarcourtRate}
                                onChange={(e) => setEditingRatesForm(prev => ({
                                  ...prev,
                                  portHarcourtRate: Number(e.target.value)
                                }))}
                                className="w-24 p-1 text-right font-mono bg-white border border-emerald-400 rounded focus:ring-1 focus:ring-emerald-500 text-xs"
                              />
                            ) : (
                              <span 
                                onClick={() => handleStartInlineEdit(mr)} 
                                className="font-bold text-emerald-800 hover:text-emerald-600 hover:underline cursor-pointer"
                                title="Click to edit Port Harcourt rate"
                              >
                                {phVal > 0 ? formatNaira(phVal) : <span className="text-amber-600 text-[11px] font-normal">Set Rate</span>}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveInlineEdit(mr.id)}
                                    className="p-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white transition cursor-pointer"
                                    title="Save rates"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCustomRateId(null)}
                                    className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  {onSelectRate && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onSelectRate({
                                          item: mr.item,
                                          description: mr.description,
                                          unit: mr.unit,
                                          rate: lagosVal
                                        });
                                        onClose();
                                      }}
                                      className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-[11px] cursor-pointer"
                                    >
                                      Use
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleStartInlineEdit(mr)}
                                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                                    title="Edit Port Harcourt, Lagos, Abuja rates"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomRate(mr.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                                    title="Delete rate"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

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

export interface BuildupPlantRow {
  id: string;
  name: string;
  dailyHire: number | '';
  dailyOutput: number | '';
}

export const CATEGORY_MATERIAL_DEFAULTS: Record<string, {
  categoryName: string;
  title: string;
  trade: string;
  unit: string;
  materials: { name: string; unit: string; qty: number; rate: number; wastePercent: number }[];
  numSkilled: number;
  wageSkilled: number;
  numUnskilled: number;
  wageUnskilled: number;
  dailyGangOutput: number;
  plantRows: { name: string; dailyHire: number; dailyOutput: number }[];
}> = {
  Blockwork: {
    categoryName: 'Blockwork',
    title: '225mm Vibrated Sandcrete Blockwork',
    trade: 'Blockwork & Partitioning',
    unit: 'm2',
    materials: [
      { name: '9" Vibrated Hollow Sandcrete Block', unit: 'Nr', qty: 10, rate: 850, wastePercent: 5 },
      { name: 'Grade 42.5R Portland Cement (Mortar)', unit: 'Bag', qty: 0.25, rate: 9500, wastePercent: 5 },
      { name: 'Clean Sharp Sand (Screened)', unit: 'm3', qty: 0.04, rate: 7000, wastePercent: 10 },
    ],
    numSkilled: 1,
    wageSkilled: 8000,
    numUnskilled: 1,
    wageUnskilled: 4000,
    dailyGangOutput: 35,
    plantRows: [
      { name: 'Mortar mixing board, buckets & staging', dailyHire: 2000, dailyOutput: 35 }
    ]
  },
  Concrete: {
    categoryName: 'Concrete',
    title: 'Grade 25 Ready / In-situ Mixed Concrete',
    trade: 'Concrete Works',
    unit: 'm3',
    materials: [
      { name: 'Dangote 42.5R Portland Cement', unit: 'Bag', qty: 6.4, rate: 9500, wastePercent: 5 },
      { name: 'Clean Screened Sharp Sand', unit: 'm3', qty: 0.44, rate: 7500, wastePercent: 5 },
      { name: '3/4" Crushed Granite Aggregate', unit: 'm3', qty: 0.88, rate: 11500, wastePercent: 5 },
      { name: 'Clean Mixing & Curing Water', unit: 'Litre', qty: 180, rate: 15, wastePercent: 2 },
    ],
    numSkilled: 1,
    wageSkilled: 9000,
    numUnskilled: 3,
    wageUnskilled: 4500,
    dailyGangOutput: 8,
    plantRows: [
      { name: '500L Mechanical Concrete Mixer (Diesel)', dailyHire: 15000, dailyOutput: 8 },
      { name: 'Poker Vibrator with Flexible Shaft', dailyHire: 5000, dailyOutput: 8 }
    ]
  },
  Rebar: {
    categoryName: 'Rebar',
    title: 'High Tensile Ribbed Reinforcement (Cut & Bent)',
    trade: 'Reinforcement & Steelwork',
    unit: 'kg',
    materials: [
      { name: 'High Tensile Ribbed Bar (12mm - 25mm)', unit: 'kg', qty: 1.05, rate: 1300, wastePercent: 5 },
      { name: '16-Gauge Annealed Black Binding Wire', unit: 'kg', qty: 0.02, rate: 1200, wastePercent: 3 },
    ],
    numSkilled: 1,
    wageSkilled: 9000,
    numUnskilled: 1,
    wageUnskilled: 4000,
    dailyGangOutput: 120,
    plantRows: [
      { name: 'Manual rebar bender, cutter & bench', dailyHire: 3000, dailyOutput: 120 }
    ]
  },
  Plaster: {
    categoryName: 'Plaster',
    title: '15mm Cement Sand Internal Plaster (1:4 Mix)',
    trade: 'Finishes & Plastering',
    unit: 'm2',
    materials: [
      { name: 'Grade 42.5R Portland Cement', unit: 'Bag', qty: 0.20, rate: 9500, wastePercent: 7 },
      { name: 'Fine Screened Plastering Sand', unit: 'Tonne', qty: 0.03, rate: 8500, wastePercent: 10 },
    ],
    numSkilled: 1,
    wageSkilled: 8500,
    numUnskilled: 1,
    wageUnskilled: 4000,
    dailyGangOutput: 25,
    plantRows: [
      { name: 'Plastering hawk, floats & mobile scaffold', dailyHire: 2500, dailyOutput: 25 }
    ]
  },
  Painting: {
    categoryName: 'Painting',
    title: 'Two Coats Premium Acrylic Emulsion Paint on Walls',
    trade: 'Painting & Decorating',
    unit: 'm2',
    materials: [
      { name: 'Premium Acrylic Emulsion Paint', unit: 'Litre', qty: 0.25, rate: 3200, wastePercent: 5 },
      { name: 'Alkali Resisting Primer / Undercoat', unit: 'Litre', qty: 0.15, rate: 2800, wastePercent: 5 },
      { name: 'Mineral Turpentine / Thinner', unit: 'Litre', qty: 0.05, rate: 1800, wastePercent: 2 },
    ],
    numSkilled: 1,
    wageSkilled: 8000,
    numUnskilled: 1,
    wageUnskilled: 4000,
    dailyGangOutput: 45,
    plantRows: [
      { name: 'Ladders, roller trays & drop cloths', dailyHire: 1500, dailyOutput: 45 }
    ]
  }
};

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

  // Category Preset Selector
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('Blockwork');

  // 1. Material Rows (Dynamic array)
  const [materials, setMaterials] = useState<BuildupMaterialRow[]>(() => 
    CATEGORY_MATERIAL_DEFAULTS.Blockwork.materials.map((m, idx) => ({
      id: `mat-${Date.now()}-${idx}`,
      name: m.name,
      unit: m.unit,
      qty: m.qty,
      rate: m.rate,
      wastePercent: m.wastePercent,
      marketRef: 'NIQS Lagos/PH Benchmark',
      marketRate: m.rate,
      marketLocation: 'Lagos',
      marketDate: 'Latest',
    }))
  );

  // 2. Labour Parameters - Gang Composition (Requirement 3)
  const [labourGangDesc, setLabourGangDesc] = useState('Gang 1 mason + 1 labour');
  const [numSkilled, setNumSkilled] = useState<number | ''>(1);
  const [wageSkilled, setWageSkilled] = useState<number | ''>(8000);
  const [numUnskilled, setNumUnskilled] = useState<number | ''>(1);
  const [wageUnskilled, setWageUnskilled] = useState<number | ''>(4000);
  const [labourDailyGangWage, setLabourDailyGangWage] = useState<number | ''>(12000);
  const [overrideGangCost, setOverrideGangCost] = useState<number | ''>('');
  const [dailyGangOutput, setDailyGangOutput] = useState<number | ''>(35);
  const [useDirectLabour, setUseDirectLabour] = useState(false);
  const [directLabourOverride, setDirectLabourOverride] = useState<number | ''>(2500);

  // 3. Plant & Equipment Parameters - Multi-row Equipment + % Toggle (Requirement 4)
  const [plantRows, setPlantRows] = useState<BuildupPlantRow[]>([
    { id: 'plant-1', name: 'Mortar mixing board, buckets & staging', dailyHire: 2000, dailyOutput: 35 }
  ]);
  const [usePlantPercentOfLabour, setUsePlantPercentOfLabour] = useState(false);
  const [plantPercentOfLabour, setPlantPercentOfLabour] = useState<number | ''>(5);
  const [plantDesc, setPlantDesc] = useState(RATE_BUILDUP_PRESETS[0].plantDesc);
  const [noPlantRequired, setNoPlantRequired] = useState(false);
  const [useDirectPlant, setUseDirectPlant] = useState(false);
  const [plantDailyHire, setPlantDailyHire] = useState<number | ''>(2000);
  const [plantDailyOutput, setPlantDailyOutput] = useState<number | ''>(35);
  const [directPlantOverride, setDirectPlantOverride] = useState<number | ''>(1428);

  // 4. Preliminaries / Site Water / Haulage Component (Optional)
  const [includePrelim, setIncludePrelim] = useState(false);
  const [prelimDesc, setPrelimDesc] = useState('Borehole water supply & site power setup');
  const [prelimTotalCost, setPrelimTotalCost] = useState<number | ''>(350000);
  const [prelimTotalUnits, setPrelimTotalUnits] = useState<number | ''>(5400);

  // 5. Markup - Overheads, Profit, Contingency & VAT (Requirement 5)
  const [overheadPercent, setOverheadPercent] = useState<number | ''>(10);
  const [profitPercent, setProfitPercent] = useState<number | ''>(10);
  const [contingencyPercent, setContingencyPercent] = useState<number | ''>(5);
  const [isVatEnabled, setIsVatEnabled] = useState(true);
  const [vatPercent, setVatPercent] = useState<number | ''>(7.5);
  const [poFormula, setPoFormula] = useState<'markup' | 'sequential' | 'margin' | 'fixed'>('markup');
  const [fixedMarkupAmount, setFixedMarkupAmount] = useState<number | ''>(0);

  // Market Fetch Notification & UI feedback
  const [marketFetchNotice, setMarketFetchNotice] = useState<string | null>(null);

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

  // Unit suggestion placeholders based on Nigerian QS practice (Requirement 1)
  const getUnitQtyPlaceholder = (unit: string) => {
    const u = (unit || '').toLowerCase().trim();
    if (u.includes('m2') || u.includes('m²') || u.includes('sqm')) return '10 (e.g. blocks per m²)';
    if (u.includes('m3') || u.includes('m³') || u.includes('cum')) return '6 (e.g. bags cement per m³)';
    if (u.includes('kg') || u.includes('tonne') || u.includes('ton')) return '1.05 (kg per kg)';
    if (u === 'm' || u.includes('lm') || u.includes('lin')) return '1.05 (m per m)';
    return '1 (nr per nr)';
  };

  const getLabourOutputPlaceholder = (unit: string) => {
    const u = (unit || '').toLowerCase().trim();
    if (u.includes('m2') || u.includes('m²') || u.includes('sqm')) return '35 (m²/day)';
    if (u.includes('m3') || u.includes('m³') || u.includes('cum')) return '8 (m³/day)';
    if (u.includes('kg')) return '120 (kg/day)';
    if (u === 'm' || u.includes('lm') || u.includes('lin')) return '25 (m/day)';
    return '5 (nr/day)';
  };

  const getPlantOutputPlaceholder = (unit: string) => {
    const u = (unit || '').toLowerCase().trim();
    if (u.includes('m2') || u.includes('m²') || u.includes('sqm')) return '35 (m²/day)';
    if (u.includes('m3') || u.includes('m³') || u.includes('cum')) return '8 (m³/day)';
    if (u.includes('kg')) return '120 (kg/day)';
    if (u === 'm' || u.includes('lm') || u.includes('lin')) return '25 (m/day)';
    return '5 (nr/day)';
  };

  // Dynamic unit change handler (Requirement 1)
  const handleUnitChange = (newUnit: string) => {
    setBuildUnit(newUnit);
    const u = newUnit.toLowerCase().trim();
    if (u === 'm2' || u === 'm²') {
      if (dailyGangOutput === '' || dailyGangOutput === 7 || dailyGangOutput === 8 || dailyGangOutput === 120) {
        setDailyGangOutput(35);
      }
    } else if (u === 'm3' || u === 'm³') {
      if (dailyGangOutput === '' || dailyGangOutput === 35 || dailyGangOutput === 120) {
        setDailyGangOutput(8);
      }
    } else if (u === 'kg') {
      if (dailyGangOutput === '' || dailyGangOutput === 35 || dailyGangOutput === 8) {
        setDailyGangOutput(120);
      }
    } else if (u === 'm' || u === 'lm') {
      if (dailyGangOutput === '' || dailyGangOutput === 35 || dailyGangOutput === 8 || dailyGangOutput === 120) {
        setDailyGangOutput(25);
      }
    } else if (u === 'nr') {
      if (dailyGangOutput === '' || dailyGangOutput === 35 || dailyGangOutput === 8 || dailyGangOutput === 120) {
        setDailyGangOutput(5);
      }
    }
  };

  // Apply Category Defaults (Blockwork, Concrete, Rebar, Plaster, Painting)
  const applyCategoryPreset = (categoryKey: string) => {
    setSelectedCategoryKey(categoryKey);
    const cat = CATEGORY_MATERIAL_DEFAULTS[categoryKey];
    if (!cat) return;
    setBuildItemTitle(cat.title);
    setBuildTrade(cat.trade);
    setBuildUnit(cat.unit);
    setMaterials(cat.materials.map((m, mIdx) => ({
      id: `mat-${Date.now()}-${mIdx}`,
      name: m.name,
      unit: m.unit,
      qty: m.qty,
      rate: m.rate,
      wastePercent: m.wastePercent,
      marketRef: `NIQS ${m.name} Benchmark`,
      marketRate: m.rate,
      marketLocation: selectedRegion.toUpperCase(),
      marketDate: 'Latest',
    })));
    setNumSkilled(cat.numSkilled);
    setWageSkilled(cat.wageSkilled);
    setNumUnskilled(cat.numUnskilled);
    setWageUnskilled(cat.wageUnskilled);
    setDailyGangOutput(cat.dailyGangOutput);
    setOverrideGangCost('');
    setLabourGangDesc(`Gang ${cat.numSkilled} skilled + ${cat.numUnskilled} unskilled`);
    setPlantRows(cat.plantRows.map((p, pIdx) => ({
      id: `plant-${Date.now()}-${pIdx}`,
      name: p.name,
      dailyHire: p.dailyHire,
      dailyOutput: p.dailyOutput,
    })));
    setNoPlantRequired(false);
    setUseDirectPlant(false);
    setUsePlantPercentOfLabour(false);
    setMarketFetchNotice(`Loaded default smart templates for ${categoryKey}. All fields are 100% unlocked for your sole discretion.`);
    setTimeout(() => setMarketFetchNotice(null), 4000);
  };

  // Handle Preset Selection from full presets
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

  // Fetch current market price suggestion (Requirement 2)
  const handleFetchCurrentMarketPrice = (rowId: string, itemName: string) => {
    if (!itemName) {
      setMarketFetchNotice('Please enter a material name first (e.g. Sandcrete block, Cement, Sharp Sand).');
      setTimeout(() => setMarketFetchNotice(null), 3500);
      return;
    }
    const clean = itemName.toLowerCase();
    const found = rates.find(r => 
      r.item.toLowerCase().includes(clean) || 
      clean.includes(r.item.toLowerCase()) ||
      (clean.includes('block') && r.item.toLowerCase().includes('block')) ||
      (clean.includes('cement') && r.item.toLowerCase().includes('cement')) ||
      (clean.includes('sand') && r.item.toLowerCase().includes('sand')) ||
      (clean.includes('granite') && r.item.toLowerCase().includes('granite')) ||
      (clean.includes('rebar') && (r.item.toLowerCase().includes('rebar') || r.item.toLowerCase().includes('steel') || r.item.toLowerCase().includes('rod'))) ||
      (clean.includes('wire') && r.item.toLowerCase().includes('wire')) ||
      (clean.includes('paint') && r.item.toLowerCase().includes('paint')) ||
      (clean.includes('water') && r.item.toLowerCase().includes('water'))
    );

    if (found) {
      const price = selectedRegion === 'ph' 
        ? (found.ph || found.portHarcourtRate || found.rate) 
        : selectedRegion === 'abuja' 
          ? (found.abuja || found.abujaRate || found.rate) 
          : (found.lagos || found.lagosRate || found.rate);

      if (price > 0) {
        setMaterials(prev => prev.map(m => m.id === rowId ? {
          ...m,
          rate: price,
          marketRef: found.item,
          marketRate: price,
          marketLocation: selectedRegion.toUpperCase(),
          marketDate: new Date().toLocaleDateString('en-GB')
        } : m));
        setMarketFetchNotice(`Market price filled for "${itemName}": ₦${price.toLocaleString()} (${selectedRegion.toUpperCase()} index). Unlocked & fully editable.`);
        setTimeout(() => setMarketFetchNotice(null), 4000);
        return;
      }
    }
    setMarketFetchNotice(`No direct market index match for "${itemName}". You have 100% discretion to type any quotation.`);
    setTimeout(() => setMarketFetchNotice(null), 4000);
  };

  const handleFetchAllMarketPrices = () => {
    let updatedCount = 0;
    setMaterials(prev => prev.map(m => {
      if (!m.name) return m;
      const clean = m.name.toLowerCase();
      const found = rates.find(r => 
        r.item.toLowerCase().includes(clean) || 
        clean.includes(r.item.toLowerCase()) ||
        (clean.includes('block') && r.item.toLowerCase().includes('block')) ||
        (clean.includes('cement') && r.item.toLowerCase().includes('cement')) ||
        (clean.includes('sand') && r.item.toLowerCase().includes('sand')) ||
        (clean.includes('granite') && r.item.toLowerCase().includes('granite')) ||
        (clean.includes('rebar') && (r.item.toLowerCase().includes('rebar') || r.item.toLowerCase().includes('steel') || r.item.toLowerCase().includes('rod'))) ||
        (clean.includes('wire') && r.item.toLowerCase().includes('wire')) ||
        (clean.includes('paint') && r.item.toLowerCase().includes('paint')) ||
        (clean.includes('water') && r.item.toLowerCase().includes('water'))
      );
      if (found) {
        const price = selectedRegion === 'ph' 
          ? (found.ph || found.portHarcourtRate || found.rate) 
          : selectedRegion === 'abuja' 
            ? (found.abuja || found.abujaRate || found.rate) 
            : (found.lagos || found.lagosRate || found.rate);
        if (price > 0) {
          updatedCount++;
          return {
            ...m,
            rate: price,
            marketRef: found.item,
            marketRate: price,
            marketLocation: selectedRegion.toUpperCase(),
            marketDate: new Date().toLocaleDateString('en-GB')
          };
        }
      }
      return m;
    }));
    setMarketFetchNotice(`Populated market suggestions for ${updatedCount} material row(s). All inputs remain 100% editable.`);
    setTimeout(() => setMarketFetchNotice(null), 4000);
  };

  // Plant Table Row Actions (Requirement 4)
  const handleAddPlantRow = () => {
    const newRow: BuildupPlantRow = {
      id: `plant-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      dailyHire: '',
      dailyOutput: dailyGangOutput || 35,
    };
    setPlantRows(prev => [...prev, newRow]);
  };

  const handleUpdatePlantRow = (id: string, field: keyof BuildupPlantRow, value: any) => {
    setPlantRows(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleRemovePlantRow = (id: string) => {
    setPlantRows(prev => prev.filter(p => p.id !== id));
  };

  // Reset to current preset defaults
  const handleResetMaterials = () => {
    const cat = CATEGORY_MATERIAL_DEFAULTS[selectedCategoryKey];
    if (cat) {
      setMaterials(cat.materials.map((m, mIdx) => ({
        id: `mat-${Date.now()}-${mIdx}`,
        name: m.name,
        unit: m.unit,
        qty: m.qty,
        rate: m.rate,
        wastePercent: m.wastePercent,
        marketRef: `NIQS ${m.name} Benchmark`,
        marketRate: m.rate,
        marketLocation: selectedRegion.toUpperCase(),
        marketDate: 'Latest',
      })));
    } else {
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
    }
  };

  const handleResetLabour = () => {
    const cat = CATEGORY_MATERIAL_DEFAULTS[selectedCategoryKey];
    if (cat) {
      setNumSkilled(cat.numSkilled);
      setWageSkilled(cat.wageSkilled);
      setNumUnskilled(cat.numUnskilled);
      setWageUnskilled(cat.wageUnskilled);
      setDailyGangOutput(cat.dailyGangOutput);
      setOverrideGangCost('');
      setUseDirectLabour(false);
    } else {
      const p = RATE_BUILDUP_PRESETS[selectedPreset];
      setLabourGangDesc(p.labourGangDesc);
      setLabourDailyGangWage(p.labourDailyGangWage);
      setDailyGangOutput(p.dailyGangOutput);
      setUseDirectLabour(p.useDirectLabour || false);
      setDirectLabourOverride(p.directLabourOverride || 2500);
      setOverrideGangCost('');
    }
  };

  const handleResetPlant = () => {
    const cat = CATEGORY_MATERIAL_DEFAULTS[selectedCategoryKey];
    if (cat) {
      setPlantRows(cat.plantRows.map((p, pIdx) => ({
        id: `plant-${Date.now()}-${pIdx}`,
        name: p.name,
        dailyHire: p.dailyHire,
        dailyOutput: p.dailyOutput,
      })));
      setNoPlantRequired(false);
      setUseDirectPlant(false);
      setUsePlantPercentOfLabour(false);
    } else {
      const p = RATE_BUILDUP_PRESETS[selectedPreset];
      setPlantDesc(p.plantDesc);
      setPlantDailyHire(p.plantDailyHire);
      setPlantDailyOutput(p.plantDailyOutput);
      setUseDirectPlant(p.useDirectPlant || false);
      setDirectPlantOverride(p.directPlantOverride || 1428);
      setNoPlantRequired(p.noPlantRequired || false);
      setUsePlantPercentOfLabour(false);
    }
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

  // Live Calculations (100% dynamic, live reacting to QS edits on every keystroke)
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

  // Labour Gang Cost (Skilled + Unskilled with optional QS Override)
  const calculatedDailyGangCost = (Number(numSkilled) || 0) * (Number(wageSkilled) || 0) + (Number(numUnskilled) || 0) * (Number(wageUnskilled) || 0);
  const effectiveDailyGangCost = (overrideGangCost !== '' && overrideGangCost !== null && overrideGangCost !== undefined)
    ? Number(overrideGangCost)
    : (calculatedDailyGangCost > 0 ? calculatedDailyGangCost : (Number(labourDailyGangWage) || 0));

  const labourUnitCost = useDirectLabour
    ? (Number(directLabourOverride) || 0)
    : ((Number(dailyGangOutput) > 0) ? (effectiveDailyGangCost / Number(dailyGangOutput)) : 0);

  // Plant & Equipment Unit Cost (Multi-row Equipment or % of Labour or Direct)
  const plantRowsTotalUnitCost = plantRows.reduce((acc, p) => {
    const hire = Number(p.dailyHire) || 0;
    const out = Number(p.dailyOutput) || 0;
    return acc + (out > 0 ? hire / out : 0);
  }, 0);

  const plantUnitCost = noPlantRequired
    ? 0
    : useDirectPlant
      ? (Number(directPlantOverride) || 0)
      : usePlantPercentOfLabour
        ? (labourUnitCost * ((Number(plantPercentOfLabour) || 0) / 100))
        : (plantRows.length > 0 ? plantRowsTotalUnitCost : ((Number(plantDailyOutput) > 0) ? (Number(plantDailyHire) || 0) / Number(plantDailyOutput) : 0));

  const prelimUnitCost = (includePrelim && Number(prelimTotalUnits) > 0)
    ? ((Number(prelimTotalCost) || 0) / Number(prelimTotalUnits))
    : 0;

  const primeCost = totalGrossMaterials + labourUnitCost + plantUnitCost + prelimUnitCost;

  // Markup: Overheads, Profit, Contingency, VAT (Requirement 5)
  const ovh = Number(overheadPercent) || 0;
  const prf = Number(profitPercent) || 0;
  const cont = Number(contingencyPercent) || 0;

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

  const overheadsAmount = primeCost * (ovh / 100);
  const profitAmount = primeCost * (prf / 100);
  const contingencyAmount = primeCost * (cont / 100);

  const subtotalBeforeVat = primeCost + poAmount + contingencyAmount;
  const vatRate = isVatEnabled ? (Number(vatPercent) || 0) : 0;
  const vatAmount = subtotalBeforeVat * (vatRate / 100);

  const compositeRate = Math.round(subtotalBeforeVat + vatAmount);
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
        ? (benchmarkMatch.ph || benchmarkMatch.portHarcourtRate || benchmarkMatch.rate || 0) 
        : selectedRegion === 'abuja' 
          ? (benchmarkMatch.abuja || benchmarkMatch.abujaRate || benchmarkMatch.rate || 0) 
          : (benchmarkMatch.lagos || benchmarkMatch.lagosRate || benchmarkMatch.rate || 0))
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
                    const regionalRate = (r[selectedRegion] ?? (
                      selectedRegion === 'ph' ? (r.ph || r.portHarcourtRate) :
                      selectedRegion === 'abuja' ? (r.abuja || r.abujaRate) :
                      (r.lagos || r.lagosRate)
                    )) || 0;
                    const specText = r.spec || r.description || '';
                    return (
                      <tr key={idx} className="hover:bg-emerald-50/40 transition">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          <div>{r.item}</div>
                          <span className="text-[10px] text-emerald-700 font-medium px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                            {r.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-sm">{specText}</td>
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
                                  description: specText,
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
                
                {/* Category Quick Pre-populates & Trade Presets (Requirement 1 & 2) */}
                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Quick Trade Pre-populate <span className="font-normal text-slate-400 lowercase">(Click to pre-fill smart defaults — all fields remain 100% editable)</span>:</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => applyPreset(selectedPreset)}
                      className="text-[11px] text-slate-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition"
                      title="Reset all fields to the currently selected preset"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to Defaults</span>
                    </button>
                  </div>
                  
                  {/* Category Quick Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(CATEGORY_MATERIAL_DEFAULTS).map((catKey) => {
                      const cat = CATEGORY_MATERIAL_DEFAULTS[catKey];
                      const isSelected = selectedCategoryKey === catKey;
                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => applyCategoryPreset(catKey)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                            isSelected
                              ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                          }`}
                        >
                          <span>{cat.categoryName}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-600'}`}>
                            {cat.unit}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Standard NIQS Presets Dropdown/Row */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                    <span className="text-[11px] font-semibold text-slate-500">More Presets:</span>
                    {RATE_BUILDUP_PRESETS.slice(0, 5).map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyPreset(idx)}
                        className={`text-[11px] px-2 py-1 rounded font-medium transition cursor-pointer ${
                          selectedPreset === idx
                            ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
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

                {/* Feedback Notification Banner */}
                {marketFetchNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center justify-between shadow-xs animate-fade-in">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{marketFetchNotice}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMarketFetchNotice(null)}
                      className="text-emerald-700 hover:text-emerald-900 font-bold ml-3"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Soft Benchmark Warning (Requirement 6 - Never blocks saving) */}
                {percentAboveBenchmark !== null && benchmarkVal && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 shadow-xs animate-fade-in">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-amber-950">
                        Advisory Market Index Notice: Computed rate {formatNaira(compositeRate)} is {percentAboveBenchmark}% above {selectedRegion.toUpperCase()} benchmark ({formatNaira(benchmarkVal)} for &ldquo;{benchmarkMatch?.item}&rdquo;)
                      </p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Market Index is for reference only, not enforcement. <strong>QS has 100% sole discretion:</strong> this rate is fully approved and can be saved freely without restriction.
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
                          onChange={(e) => handleUnitChange(e.target.value)}
                          placeholder="m2, m3, kg, nr"
                          className="w-full text-xs p-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold uppercase placeholder:text-slate-400 placeholder:italic focus:ring-2 focus:ring-emerald-500 shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Unit Selector (Requirement 1 - Updates labels and output suggestions dynamically) */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-600">Quick Unit Switch:</span>
                    {['m2', 'm3', 'kg', 'm', 'nr'].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => handleUnitChange(u)}
                        className={`px-2.5 py-1 rounded-md font-mono font-bold transition cursor-pointer ${
                          buildUnit.toLowerCase() === u
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {u === 'm2' ? 'm²' : u === 'm3' ? 'm³' : u}
                      </button>
                    ))}
                    <span className="text-slate-400 italic ml-2">Labels & output suggestions adapt live</span>
                  </div>
                </div>

                {/* 1. MATERIAL TABLE - QS EDITS ALL (Requirement 2) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">1</span>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Materials Supply & Waste Allowance <span className="font-normal text-slate-500 lowercase">(per {buildUnit})</span>
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleFetchAllMarketPrices}
                        className="text-[11px] text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded font-medium transition flex items-center gap-1"
                        title="Look up all material prices against current Nigerian market index suggestions"
                      >
                        <Zap className="w-3 h-3 text-blue-600" />
                        <span>Auto-Fetch Market Suggestions</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetMaterials}
                        className="text-[11px] text-slate-500 hover:text-emerald-700 font-medium transition flex items-center gap-1 px-1.5 py-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAddMaterialRow}
                        className="text-xs px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-semibold flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Row</span>
                      </button>
                    </div>
                  </div>

                  {/* Materials Expandable Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                          <th className="py-2 px-2">Material Description</th>
                          <th className="py-2 px-2 w-16">Unit</th>
                          <th className="py-2 px-2 w-28">Qty per {buildUnit}</th>
                          <th className="py-2 px-2 w-36">Rate (₦)</th>
                          <th className="py-2 px-2 w-20">Waste %</th>
                          <th className="py-2 px-2 w-28 text-right">Cost (₦)</th>
                          <th className="py-2 px-1 w-8 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {materials.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-4 text-center text-slate-400 italic">
                              No materials required for this item. Click &ldquo;Add Row&rdquo; to introduce supplies.
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
                                      className="w-full text-xs p-1.5 rounded bg-white border border-slate-300 text-slate-900 font-mono text-right placeholder:text-slate-400 placeholder:italic focus:ring-1 focus:ring-emerald-500 shadow-xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleFetchCurrentMarketPrice(mat.id, mat.name)}
                                      className="px-1.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold shrink-0 transition"
                                      title="Fetch current market price suggestion into this editable input"
                                    >
                                      ⚡ Fetch
                                    </button>
                                  </div>

                                  {isDifferentFromMarket && (
                                    <div className="mt-0.5 flex items-center justify-between text-[10px]">
                                      <span className="text-emerald-700 font-semibold">QS Custom</span>
                                      <button
                                        type="button"
                                        onClick={() => handleSyncToMarket(mat.id, mat.marketRate!)}
                                        className="text-slate-500 hover:text-emerald-700 underline text-[10px]"
                                        title="Click to fill market index suggestion"
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
                                    className="text-slate-300 hover:text-red-600 p-1 transition cursor-pointer"
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

                {/* 2. LABOUR COMPONENT - GANG COMPOSITION (Requirement 3) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">2</span>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Labour Gang Composition & Output <span className="font-normal text-slate-500 lowercase">(per {buildUnit})</span>
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
                        {useDirectLabour ? '✓ Direct Subcontract Rate' : 'Direct ₦/' + buildUnit}
                      </button>
                    </div>
                  </div>

                  {!useDirectLabour ? (
                    <div className="space-y-3">
                      {/* Gang Breakdown: Skilled + Unskilled */}
                      <div className="p-3 bg-amber-50/40 rounded-lg border border-amber-200/50 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Skilled Artisans (Nr)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={numSkilled}
                              onChange={(e) => setNumSkilled(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="1"
                              className="w-full text-xs p-1.5 rounded bg-white border border-slate-300 text-slate-900 font-mono text-center shadow-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Skilled Daily Wage (₦)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={wageSkilled}
                              onChange={(e) => setWageSkilled(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="8000"
                              className="w-full text-xs p-1.5 rounded bg-white border border-slate-300 text-slate-900 font-mono text-right shadow-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Unskilled Labour (Nr)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={numUnskilled}
                              onChange={(e) => setNumUnskilled(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="1"
                              className="w-full text-xs p-1.5 rounded bg-white border border-slate-300 text-slate-900 font-mono text-center shadow-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Unskilled Wage (₦)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={wageUnskilled}
                              onChange={(e) => setWageUnskilled(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="4000"
                              className="w-full text-xs p-1.5 rounded bg-white border border-slate-300 text-slate-900 font-mono text-right shadow-xs"
                            />
                          </div>
                        </div>

                        {/* Daily Gang Cost (Live Calculated with Direct Override) */}
                        <div className="pt-2 border-t border-amber-200/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-700 font-medium">Daily Gang Total:</span>
                            <span className="font-mono font-bold text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-300">
                              ₦{calculatedDailyGangCost.toLocaleString()}/day
                            </span>
                            <span className="text-[10px] text-slate-500 italic">({numSkilled} skilled @ ₦{Number(wageSkilled).toLocaleString()} + {numUnskilled} unskilled @ ₦{Number(wageUnskilled).toLocaleString()})</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-600">Gang Cost Override:</span>
                            <input
                              type="number"
                              step="any"
                              value={overrideGangCost}
                              onChange={(e) => setOverrideGangCost(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="Auto"
                              className="w-24 text-xs p-1 rounded bg-white border border-slate-300 text-slate-900 font-mono text-right placeholder:text-slate-400 placeholder:italic shadow-xs"
                              title="Leave empty to use computed skilled + unskilled gang total"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Gang Output */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Gang Description
                          </label>
                          <input
                            type="text"
                            value={labourGangDesc}
                            onChange={(e) => setLabourGangDesc(e.target.value)}
                            placeholder="e.g. Gang 1 mason + 1 labour"
                            className="w-full text-xs p-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 placeholder:italic shadow-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Daily Gang Output ({buildUnit}/day)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={dailyGangOutput}
                            onChange={(e) => setDailyGangOutput(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder={getLabourOutputPlaceholder(buildUnit)}
                            className="w-full text-xs p-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono placeholder:text-slate-400 placeholder:italic shadow-xs"
                          />
                          <span className="text-[10px] text-slate-500 mt-0.5 block">Formula: Daily Gang Cost (₦{effectiveDailyGangCost.toLocaleString()}) ÷ Output ({dailyGangOutput} {buildUnit})</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-amber-950">
                          Direct Subcontract Labour Rate (₦/{buildUnit}) <span className="text-slate-400 font-normal">— Sole QS Override</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setUseDirectLabour(false)}
                          className="text-[11px] text-amber-700 hover:underline"
                        >
                          Switch back to Gang Wage ÷ Output
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

                {/* 3. PLANT & EQUIPMENT - MULTI-ROW WITH % TOGGLE (Requirement 4) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">3</span>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Plant, Tools & Equipment <span className="font-normal text-slate-500 lowercase">(Hire ÷ Output or % of Labour)</span>
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
                          className="rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>No Plant Required</span>
                      </label>
                    </div>
                  </div>

                  {!noPlantRequired ? (
                    <div className="space-y-3">
                      {/* Toggle: Multi-row Equipment vs. % of Labour */}
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setUsePlantPercentOfLabour(false)}
                            className={`px-2.5 py-1 rounded font-semibold text-xs transition cursor-pointer ${
                              !usePlantPercentOfLabour
                                ? 'bg-blue-800 text-white shadow-xs'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            Equipment Hire Table ({plantRows.length} items)
                          </button>
                          <button
                            type="button"
                            onClick={() => setUsePlantPercentOfLabour(true)}
                            className={`px-2.5 py-1 rounded font-semibold text-xs transition cursor-pointer ${
                              usePlantPercentOfLabour
                                ? 'bg-blue-800 text-white shadow-xs'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            Use % of Labour Instead
                          </button>
                        </div>

                        {!usePlantPercentOfLabour && (
                          <button
                            type="button"
                            onClick={handleAddPlantRow}
                            className="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded font-semibold flex items-center gap-1 transition"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Equipment Line</span>
                          </button>
                        )}
                      </div>

                      {usePlantPercentOfLabour ? (
                        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Plant & Small Tools as % of Labour Component
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="any"
                                value={plantPercentOfLabour}
                                onChange={(e) => setPlantPercentOfLabour(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="5"
                                className="w-24 text-xs p-1.5 rounded bg-white border border-slate-300 text-slate-900 font-mono shadow-xs text-right"
                              />
                              <span className="font-bold text-slate-700">% of Labour Cost (₦{Math.round(labourUnitCost).toLocaleString()})</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">Computed Plant:</span>
                            <span className="font-mono font-bold text-blue-900 text-sm">
                              {formatNaira(Math.round(plantUnitCost))} / {buildUnit}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                                <th className="py-2 px-2">Equipment Description</th>
                                <th className="py-2 px-2 w-32">Daily Hire (₦/day)</th>
                                <th className="py-2 px-2 w-28">Output ({buildUnit}/day)</th>
                                <th className="py-2 px-2 w-28 text-right">Cost / {buildUnit}</th>
                                <th className="py-2 px-1 w-8 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {plantRows.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-3 text-center text-slate-400 italic">
                                    No equipment rows added. Click &ldquo;Add Equipment Line&rdquo; to add mixers, scaffolding or tools.
                                  </td>
                                </tr>
                              ) : (
                                plantRows.map((p) => {
                                  const hire = Number(p.dailyHire) || 0;
                                  const out = Number(p.dailyOutput) || 0;
                                  const unitCost = out > 0 ? hire / out : 0;
                                  return (
                                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                                      <td className="py-2 px-2">
                                        <input
                                          type="text"
                                          value={p.name}
                                          onChange={(e) => handleUpdatePlantRow(p.id, 'name', e.target.value)}
                                          placeholder="e.g. 500L Concrete Mixer"
                                          className="w-full text-xs p-1.5 rounded bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 shadow-xs"
                                        />
                                      </td>
                                      <td className="py-2 px-2">
                                        <input
                                          type="number"
                                          step="any"
                                          value={p.dailyHire}
                                          onChange={(e) => handleUpdatePlantRow(p.id, 'dailyHire', e.target.value === '' ? '' : Number(e.target.value))}
                                          placeholder="15000"
                                          className="w-full text-xs p-1.5 rounded bg-white border border-slate-300 text-slate-900 font-mono text-right shadow-xs"
                                        />
                                      </td>
                                      <td className="py-2 px-2">
                                        <input
                                          type="number"
                                          step="any"
                                          value={p.dailyOutput}
                                          onChange={(e) => handleUpdatePlantRow(p.id, 'dailyOutput', e.target.value === '' ? '' : Number(e.target.value))}
                                          placeholder={getPlantOutputPlaceholder(buildUnit)}
                                          className="w-full text-xs p-1.5 rounded bg-white border border-slate-300 text-slate-900 font-mono text-right shadow-xs"
                                        />
                                      </td>
                                      <td className="py-2 px-2 text-right font-mono font-bold text-blue-900">
                                        {formatNaira(Math.round(unitCost))}
                                      </td>
                                      <td className="py-2 px-1 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleRemovePlantRow(p.id)}
                                          className="text-slate-300 hover:text-red-600 p-1 transition cursor-pointer"
                                          title="Delete plant row"
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

                {/* 4. PRELIMINARIES / WATER / HAULAGE APPORTIONMENT (Optional) */}
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

                {/* 5. CONTRACTOR P&O, CONTINGENCY & VAT - QS SOLE DISCRETION (Requirement 5) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">5</span>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Overheads, Profit, Contingency & VAT <span className="font-normal text-slate-500 lowercase">(QS 100% Discretion)</span>
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Overheads (%)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={overheadPercent}
                        onChange={(e) => setOverheadPercent(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="10%"
                        className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono shadow-xs text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Profit (%)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={profitPercent}
                        onChange={(e) => setProfitPercent(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="10%"
                        className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono shadow-xs text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Contingency (%)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={contingencyPercent}
                        onChange={(e) => setContingencyPercent(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="5%"
                        className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono shadow-xs text-right"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          VAT (7.5%)
                        </label>
                        <input
                          type="checkbox"
                          checked={isVatEnabled}
                          onChange={(e) => setIsVatEnabled(e.target.checked)}
                          className="rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                          title="Toggle VAT on/off"
                        />
                      </div>
                      <input
                        type="number"
                        step="any"
                        disabled={!isVatEnabled}
                        value={vatPercent}
                        onChange={(e) => setVatPercent(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="7.5%"
                        className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono shadow-xs text-right disabled:opacity-40"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Prime Cost: <strong className="font-mono text-slate-800">{formatNaira(Math.round(primeCost))}</strong> + O&P ({overheadPercent}% + {profitPercent}%) + Cont ({contingencyPercent}%):
                    </span>
                    <span className="font-mono font-bold text-emerald-800">
                      Subtotal: {formatNaira(Math.round(subtotalBeforeVat))} {isVatEnabled && `+ VAT: ₦${Math.round(vatAmount).toLocaleString()}`}
                    </span>
                  </div>
                </div>

              </div>

              {/* Right Column: Dynamic Real-Time Calculation Receipt & City Multipliers */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Result Summary Card - Real-Time Updates On Every Keystroke (Requirement 6) */}
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

                  {/* Real-Time Breakdown Receipt with Proportions */}
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Materials Component:</span>
                      <div className="text-right">
                        <span className="font-mono font-medium text-slate-800">{formatNaira(Math.round(totalGrossMaterials))}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          ({compositeRate > 0 ? Math.round((totalGrossMaterials / compositeRate) * 100) : 0}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Labour Component:</span>
                      <div className="text-right">
                        <span className="font-mono font-medium text-slate-800">{formatNaira(Math.round(labourUnitCost))}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          ({compositeRate > 0 ? Math.round((labourUnitCost / compositeRate) * 100) : 0}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Plant & Equipment:</span>
                      <div className="text-right">
                        <span className="font-mono font-medium text-slate-800">{formatNaira(Math.round(plantUnitCost))}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          ({compositeRate > 0 ? Math.round((plantUnitCost / compositeRate) * 100) : 0}%)
                        </span>
                      </div>
                    </div>

                    {includePrelim && prelimUnitCost > 0 && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Preliminaries:</span>
                        <span className="font-mono font-medium text-purple-800">+{formatNaira(Math.round(prelimUnitCost * 100) / 100)}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                      <span>Total Prime Cost:</span>
                      <span className="font-mono text-slate-900">{formatNaira(Math.round(primeCost))}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-700">
                      <span>Overhead & Profit ({overheadPercent}% + {profitPercent}%):</span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-700">+{formatNaira(Math.round(poAmount))}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          ({compositeRate > 0 ? Math.round((poAmount / compositeRate) * 100) : 0}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-slate-700">
                      <span>Contingency ({contingencyPercent}%):</span>
                      <div className="text-right">
                        <span className="font-mono font-semibold text-slate-700">+{formatNaira(Math.round(contingencyAmount))}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          ({compositeRate > 0 ? Math.round((contingencyAmount / compositeRate) * 100) : 0}%)
                        </span>
                      </div>
                    </div>

                    {isVatEnabled && (
                      <div className="flex justify-between items-center text-slate-700">
                        <span>VAT ({vatPercent}%):</span>
                        <div className="text-right">
                          <span className="font-mono font-semibold text-slate-700">+{formatNaira(Math.round(vatAmount))}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            ({compositeRate > 0 ? Math.round((vatAmount / compositeRate) * 100) : 0}%)
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between font-bold text-emerald-950 pt-2 border-t border-emerald-200 text-sm bg-emerald-50/70 p-2.5 rounded-lg">
                      <span>ALL-IN COMPOSITE RATE:</span>
                      <span className="font-mono text-base">{formatNaira(compositeRate)} / {buildUnit}</span>
                    </div>

                    {/* Comparison with Market Index Benchmark (Advisory Only) */}
                    {benchmarkVal && (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Market Benchmark ({selectedRegion.toUpperCase()}):</span>
                          <span className="font-mono font-semibold text-slate-800">{formatNaira(benchmarkVal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Difference:</span>
                          <span className={`font-mono font-bold ${compositeRate > benchmarkVal ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {compositeRate >= benchmarkVal ? '+' : ''}{formatNaira(compositeRate - benchmarkVal)} ({compositeRate >= benchmarkVal ? '+' : ''}{benchmarkVal > 0 ? Math.round(((compositeRate - benchmarkVal) / benchmarkVal) * 100) : 0}%)
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 italic block">
                          Advisory benchmark only — QS sole discretion applies.
                        </span>
                      </div>
                    )}

                    {/* Regional Multi-City Breakdown */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5 bg-slate-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Geopolitical Multi-City Index
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold">Live Multipliers</span>
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

                  {/* Actions & Saving Buttons */}
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

import React, { useState } from 'react';
import { 
  Calculator, 
  Layers, 
  Truck, 
  Users, 
  Wrench, 
  Plus, 
  Check, 
  Download, 
  Save, 
  Sparkles, 
  Info, 
  ArrowRight,
  RefreshCw,
  Coins,
  Percent,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { formatNaira, formatNumber } from '../../utils/format';
import { LibraryRateItem } from '../../types';
import { safeFetchJson } from '../../utils/api';

interface RateBuilderCalculatorProps {
  onSaveRateToLibrary?: (rateItem: Partial<LibraryRateItem>) => Promise<void> | void;
  onApplyRateToBoq?: (item: { item: string; description: string; unit: string; rate: number; section: string }) => void;
  availableLibraryRates?: LibraryRateItem[];
}

export type CalcMode = 'composite' | 'material' | 'plant' | 'labour';

interface RatePreset {
  name: string;
  category: string;
  type: 'Material' | 'Plant' | 'Labour' | 'Preliminaries';
  unit: string;
  description: string;
  materialCost: number;
  materialDetails: string;
  plantCost: number;
  plantDetails: string;
  labourCost: number;
  labourDetails: string;
  overheadsPercent: number;
  profitPercent: number;
}

const PRESET_TEMPLATES: RatePreset[] = [
  {
    name: 'Reinforced Concrete Grade 20 (1:2:4) in Suspended Slabs',
    category: 'Concrete Works',
    type: 'Material',
    unit: 'm³',
    description: 'Vibrated reinforced in-situ concrete 1:2:4 mix (320kg Dangote 42.5R, 0.44m³ sharp sand, 0.88m³ crushed granite) placed in formwork',
    materialCost: 78500,
    materialDetails: '6.4 bags cement @ ₦9,500 + 0.65t sand @ ₦6,500 + 1.35t granite @ ₦11,500 with 5% wastage',
    plantCost: 6500,
    plantDetails: '500L concrete mixer & poker vibrator hire amortized over 25m³/day output',
    labourCost: 11000,
    labourDetails: 'Concreting gang: 1 Mason + 4 Helpers mixing, wheeling, placing and vibrating',
    overheadsPercent: 10,
    profitPercent: 10
  },
  {
    name: '225mm (9-inch) Vibrated Hollow Sandcrete Blockwork in Stretcher Bond',
    category: 'Masonry & Blockwork',
    type: 'Material',
    unit: 'm²',
    description: '225mm machine-vibrated hollow sandcrete blocks bedded and jointed in cement-sand mortar (1:4), raked out for plastering',
    materialCost: 11800,
    materialDetails: '10.5 blocks @ ₦850 + 0.35 bag cement @ ₦9,500 + 0.05m³ sand @ ₦6,500 with 5% waste',
    plantCost: 800,
    plantDetails: 'Wheelbarrows, mortar boards, tubular staging & hoisting buckets',
    labourCost: 3800,
    labourDetails: 'Mason gang: 1 Mason + 1 Helper laying ~30m²/day',
    overheadsPercent: 8,
    profitPercent: 10
  },
  {
    name: 'High Tensile Ribbed Rebar (12mm - 25mm) Cut, Bend & Fix in Position',
    category: 'Reinforcement & Steel',
    type: 'Material',
    unit: 'Tonne',
    description: 'High yield deformed steel reinforcement BS 4449 grade 500, cutting, cold bending, hoisting and securing with 16-gauge binding wire',
    materialCost: 1380000,
    materialDetails: '1.05 tonnes prime billet rebar @ ₦1,300,000 + 20kg binding wire + 5% cutting laps/waste',
    plantCost: 28000,
    plantDetails: 'Mechanical bar bender/cutter electric hire + generator fuel share',
    labourCost: 85000,
    labourDetails: 'Iron bender guild: 1 Master bender + 2 Apprentices handling 1.2 tonnes/day',
    overheadsPercent: 8,
    profitPercent: 10
  },
  {
    name: 'Mechanical Bulk Excavation in Foundation Trenches (Depth not exceeding 1.50m)',
    category: 'Excavation & Earthworks',
    type: 'Plant',
    unit: 'm³',
    description: 'Excavating foundation trenches and column base pits in firm cohesive laterite clay using crawler excavator, carting spoil to heaps',
    materialCost: 0,
    materialDetails: 'No direct material incorporated into permanent works',
    plantCost: 3200,
    plantDetails: 'CAT 320 excavator wet lease (₦380,000/day) operating at 140m³/day production capacity',
    labourCost: 950,
    labourDetails: '1 Banksman / levels surveyor + 2 manual trim helpers clearing trench bottoms',
    overheadsPercent: 10,
    profitPercent: 12
  },
  {
    name: 'Marine Board Wrot Formwork to Soffits of Suspended Slabs & Beams',
    category: 'Formwork & Falsework',
    type: 'Material',
    unit: 'm²',
    description: '18mm wrot phenolic marine film-faced plywood supported on adjustable steel prop falsework, including release agent and dismantling',
    materialCost: 9200,
    materialDetails: '18mm marine board (3-use amortization) + 2x3 & 2x4 softwood runners + nails/mould oil',
    plantCost: 1800,
    plantDetails: 'Adjustable steel prop rental (Acrow props) & telescopic joist hire',
    labourCost: 4500,
    labourDetails: 'Carpenter gang: 1 Formwork carpenter + 1 Assistant fabricating and striking',
    overheadsPercent: 10,
    profitPercent: 10
  }
];

export const RateBuilderCalculator: React.FC<RateBuilderCalculatorProps> = ({
  onSaveRateToLibrary,
  onApplyRateToBoq,
  availableLibraryRates = []
}) => {
  const [calcMode, setCalcMode] = useState<CalcMode>('composite');

  // Rate Identification
  const [rateName, setRateName] = useState('Reinforced Concrete Grade 20 (1:2:4) in Suspended Slabs');
  const [rateCategory, setRateCategory] = useState('Concrete Works');
  const [rateType, setRateType] = useState<'Material' | 'Plant' | 'Labour' | 'Preliminaries'>('Material');
  const [rateUnit, setRateUnit] = useState('m³');
  const [rateDescription, setRateDescription] = useState('Vibrated reinforced in-situ concrete 1:2:4 mix (320kg Dangote 42.5R, 0.44m³ sharp sand, 0.88m³ crushed granite)');

  // 1. Material Sub-calculation
  const [matBasicCost, setMatBasicCost] = useState<number>(72000);
  const [matHaulage, setMatHaulage] = useState<number>(3500);
  const [matOffloading, setMatOffloading] = useState<number>(1200);
  const [matWastagePercent, setMatWastagePercent] = useState<number>(5);
  const [matNotes, setMatNotes] = useState('6.4 bags cement @ ₦9,500 + 0.65t sand @ ₦6,500 + 1.35t granite @ ₦11,500');

  // Calculated Net Material Cost
  const computedMaterialCost = Math.round((matBasicCost + matHaulage + matOffloading) * (1 + matWastagePercent / 100));

  // 2. Plant Sub-calculation
  const [plantDailyHire, setPlantDailyHire] = useState<number>(75000); // e.g. 500L mixer + poker vibrator
  const [plantFuelPerDay, setPlantFuelPerDay] = useState<number>(22000); // 18L diesel @ ₦1,250
  const [plantOperatorPerDay, setPlantOperatorPerDay] = useState<number>(12000); // skilled plant driver
  const [plantMobilizationShared, setPlantMobilizationShared] = useState<number>(5000); // daily share
  const [plantDailyOutput, setPlantDailyOutput] = useState<number>(18); // 18 m3 per day
  const [plantNotes, setPlantNotes] = useState('500L Winget diesel mixer + 50mm Honda poker vibrator');

  // Calculated Net Plant Cost per unit output
  const totalPlantDailyCost = plantDailyHire + plantFuelPerDay + plantOperatorPerDay + plantMobilizationShared;
  const computedPlantCost = plantDailyOutput > 0 ? Math.round(totalPlantDailyCost / plantDailyOutput) : 0;

  // 3. Labour Sub-calculation
  const [craftsmanWage, setCraftsmanWage] = useState<number>(9000); // Mason / Craftsman daily wage
  const [craftsmenCount, setCraftsmenCount] = useState<number>(1);
  const [helperWage, setHelperWage] = useState<number>(5000); // Laborer daily wage
  const [helpersCount, setHelpersCount] = useState<number>(4);
  const [gangDailyOutput, setGangDailyOutput] = useState<number>(18); // 18 m3 per day
  const [labourLevyPercent, setLabourLevyPercent] = useState<number>(5); // Union, safety PPE & supervision
  const [labourNotes, setLabourNotes] = useState('1 Mason + 4 Helpers mixing, wheeling, placing and tamping');

  // Calculated Net Labour Cost per unit output
  const totalDailyGangWage = (craftsmanWage * craftsmenCount) + (helperWage * helpersCount);
  const totalDailyGangCostWithLevy = totalDailyGangWage * (1 + labourLevyPercent / 100);
  const computedLabourCost = gangDailyOutput > 0 ? Math.round(totalDailyGangCostWithLevy / gangDailyOutput) : 0;

  // 4. Overheads and Profit
  const [overheadsPercent, setOverheadsPercent] = useState<number>(10);
  const [profitPercent, setProfitPercent] = useState<number>(10);

  // Overall Direct Cost
  const directCost = computedMaterialCost + computedPlantCost + computedLabourCost;
  const overheadsAmount = Math.round(directCost * (overheadsPercent / 100));
  const subtotalWithOverheads = directCost + overheadsAmount;
  const profitAmount = Math.round(subtotalWithOverheads * (profitPercent / 100));
  const finalBuiltRate = directCost + overheadsAmount + profitAmount;

  // Regional Projections based on established indices
  const regionalRates = {
    lagos: finalBuiltRate,
    abuja: Math.round(finalBuiltRate * 1.05), // +5% logistics into FCT
    portHarcourt: Math.round(finalBuiltRate * 1.09), // +9% Niger delta terrain
    northern: Math.round(finalBuiltRate * 0.96) // -4% northern sand/aggregate access
  };

  // State for notification
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Load a preset template
  const handleSelectPreset = (preset: RatePreset) => {
    setRateName(preset.name);
    setRateCategory(preset.category);
    setRateType(preset.type);
    setRateUnit(preset.unit);
    setRateDescription(preset.description);
    
    // Set material
    setMatBasicCost(Math.round(preset.materialCost * 0.90));
    setMatHaulage(Math.round(preset.materialCost * 0.06));
    setMatOffloading(Math.round(preset.materialCost * 0.02));
    setMatWastagePercent(preset.materialCost > 0 ? 5 : 0);
    setMatNotes(preset.materialDetails);

    // Set plant
    const estPlantOutput = 20;
    setPlantDailyOutput(estPlantOutput);
    setPlantDailyHire(Math.round(preset.plantCost * estPlantOutput * 0.65));
    setPlantFuelPerDay(Math.round(preset.plantCost * estPlantOutput * 0.25));
    setPlantOperatorPerDay(Math.round(preset.plantCost * estPlantOutput * 0.10));
    setPlantNotes(preset.plantDetails);

    // Set labour
    const estLabourOutput = 20;
    setGangDailyOutput(estLabourOutput);
    setCraftsmenCount(1);
    setHelpersCount(3);
    setCraftsmanWage(Math.round(preset.labourCost * estLabourOutput * 0.40));
    setHelperWage(Math.round((preset.labourCost * estLabourOutput * 0.60) / 3));
    setLabourNotes(preset.labourDetails);

    setOverheadsPercent(preset.overheadsPercent);
    setProfitPercent(preset.profitPercent);
  };

  // Handle saving rate to the database
  const handleSaveRate = async () => {
    if (!rateName.trim()) {
      setSaveError('Please provide a name for the rate item.');
      return;
    }
    setIsSaving(true);
    setSaveError('');
    try {
      const ratePayload: Partial<LibraryRateItem> = {
        item: rateName,
        category: rateCategory,
        type: rateType,
        specification: rateDescription,
        unit: rateUnit,
        lagosRate: regionalRates.lagos,
        abujaRate: regionalRates.abuja,
        portHarcourtRate: regionalRates.portHarcourt,
        northernRate: regionalRates.northern,
        materialComponent: computedMaterialCost,
        labourComponent: computedLabourCost,
        plantComponent: computedPlantCost,
        overheadProfitPercent: overheadsPercent + profitPercent,
        trend: 'stable',
        trendPercent: 0,
        isCustom: true
      };

      if (onSaveRateToLibrary) {
        await onSaveRateToLibrary(ratePayload);
      } else {
        const { ok, error } = await safeFetchJson('/api/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ratePayload)
        });
        if (!ok) throw new Error(error || 'Failed to save rate to database');
        await safeFetchJson('/api/rates/my', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ratePayload)
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (e: any) {
      console.error('Failed to save built rate:', e);
      setSaveError(e?.message || 'Failed to save rate. Please try again.');
      setTimeout(() => setSaveError(''), 6000);
    } finally {
      setIsSaving(false);
    }
  };

  // Export Rate Build-up as text sheet
  const handleExportAnalysis = () => {
    const lines = [
      `=============================================================`,
      `UNIT RATE ANALYSIS & BUILD-UP SCHEDULE`,
      `LET'S ESTIMATE QUANTITY SURVEYING INTELLIGENCE`,
      `=============================================================`,
      `Item Description: ${rateName}`,
      `Trade Category:   ${rateCategory} (${rateType})`,
      `Specification:    ${rateDescription}`,
      `Measured Unit:    ${rateUnit}`,
      `Calculated Date:  ${new Date().toLocaleDateString('en-GB')}`,
      `-------------------------------------------------------------`,
      `1. DIRECT MATERIAL CONSTITUENT PER ${rateUnit}:`,
      `   - Basic Delivery Invoice:   ${formatNaira(matBasicCost)}`,
      `   - Haulage & Cartage:        ${formatNaira(matHaulage)}`,
      `   - Offloading & Stacking:    ${formatNaira(matOffloading)}`,
      `   - Site Wastage Factor:      ${matWastagePercent}%`,
      `   => Net Material Rate:       ${formatNaira(computedMaterialCost)} / ${rateUnit}`,
      `   Notes: ${matNotes}`,
      `-------------------------------------------------------------`,
      `2. PLANT & MECHANICAL FLEET COST PER ${rateUnit}:`,
      `   - Daily Wet Lease / Hire:   ${formatNaira(plantDailyHire)}`,
      `   - Daily Diesel / Fuel:      ${formatNaira(plantFuelPerDay)}`,
      `   - Certified Operator Wage:  ${formatNaira(plantOperatorPerDay)}`,
      `   - Mobilization Share:       ${formatNaira(plantMobilizationShared)}`,
      `   - Daily Output Capacity:    ${plantDailyOutput} ${rateUnit}/day`,
      `   => Net Plant Rate:          ${formatNaira(computedPlantCost)} / ${rateUnit}`,
      `   Notes: ${plantNotes}`,
      `-------------------------------------------------------------`,
      `3. LABOUR & TRADE ARTISAN COST PER ${rateUnit}:`,
      `   - Craftsmen:                ${craftsmenCount} @ ${formatNaira(craftsmanWage)}/day`,
      `   - Assistants / Helpers:     ${helpersCount} @ ${formatNaira(helperWage)}/day`,
      `   - Statutory Levy / PPE:     ${labourLevyPercent}%`,
      `   - Daily Gang Productivity:  ${gangDailyOutput} ${rateUnit}/day`,
      `   => Net Labour Rate:         ${formatNaira(computedLabourCost)} / ${rateUnit}`,
      `   Notes: ${labourNotes}`,
      `-------------------------------------------------------------`,
      `4. RATE SUMMARY & COMMERCIAL MARKUP:`,
      `   - Prime Cost (M + P + L):   ${formatNaira(directCost)}`,
      `   - Overheads (${overheadsPercent}%):         ${formatNaira(overheadsAmount)}`,
      `   - Contractor Profit (${profitPercent}%):   ${formatNaira(profitAmount)}`,
      `   ==========================================================`,
      `   => ALL-IN UNIT RATE:        ${formatNaira(finalBuiltRate)} / ${rateUnit}`,
      `   ==========================================================`,
      `5. GEOPOLITICAL ZONE BENCHMARKS:`,
      `   - Lagos Commercial Hub:     ${formatNaira(regionalRates.lagos)}`,
      `   - Abuja (FCT):              ${formatNaira(regionalRates.abuja)} (+5%)`,
      `   - Port Harcourt (Delta):    ${formatNaira(regionalRates.portHarcourt)} (+9%)`,
      `   - Northern Hub (Kano):      ${formatNaira(regionalRates.northern)} (-4%)`,
      `=============================================================`
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rate_Analysis_${rateName.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="rate-builder-calculator" className="space-y-6">
      
      {/* Top Banner & Preset Selector */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                QS Rate Engineering
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                NIQS / BESMM4 First-Principles Analysis
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-700" />
              Unit Rate Builder &amp; Analysis Calculator
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Build accurate, all-in unit rates for building materials, plant machinery hire, and artisan labour gangs. Synthesize composite unit rates with customizable commercial markups.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportAnalysis}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Download detailed rate build-up calculation breakdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Analysis</span>
            </button>

            {onApplyRateToBoq && (
              <button
                type="button"
                onClick={() => onApplyRateToBoq({
                  item: rateName,
                  description: rateDescription,
                  unit: rateUnit,
                  rate: regionalRates.lagos,
                  section: rateCategory
                })}
                className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Apply to BOQ</span>
              </button>
            )}

            {onSaveRateToLibrary && (
              <button
                type="button"
                onClick={handleSaveRate}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Saved to Library!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save to Library'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quick Presets Carousel */}
        <div className="pt-3 border-t border-slate-100">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
            Load Nigerian Standard Rate Template Presets:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {PRESET_TEMPLATES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 text-slate-700 text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>{preset.name.split(' (')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Item Basic Info */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 text-xs">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-700" />
          Item Specification &amp; Unit Classification
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">Item Title / Description *</label>
            <input
              type="text"
              value={rateName}
              onChange={(e) => setRateName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. Reinforced Concrete Grade 20 in Suspended Slabs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Trade Category</label>
            <input
              type="text"
              value={rateCategory}
              onChange={(e) => setRateCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
              placeholder="e.g. Concrete Works"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Unit of Measurement</label>
            <select
              value={rateUnit}
              onChange={(e) => setRateUnit(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-800 cursor-pointer"
            >
              <option value="m³">m³ (Cubic Metre)</option>
              <option value="m²">m² (Square Metre)</option>
              <option value="m">m (Linear Metre)</option>
              <option value="Tonne">Tonne (Metric Ton)</option>
              <option value="Kg">Kg (Kilogram)</option>
              <option value="Nr">Nr (Number / Item)</option>
              <option value="Day">Day (Operational Day)</option>
              <option value="Item">Item (Lump Sum / Prelim)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Full Technical Specification</label>
          <textarea
            rows={2}
            value={rateDescription}
            onChange={(e) => setRateDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 resize-none"
            placeholder="Detailed material mix, standards, code compliance and method statement..."
          />
        </div>
      </div>

      {/* 3 Component Cards (Material, Plant, Labour) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* 1. MATERIAL COST ANALYSIS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">1. Materials Cost</h4>
                  <span className="text-[10px] text-slate-500 font-medium">Delivered to site</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 px-2 py-0.5 rounded-md bg-emerald-50">
                {formatNaira(computedMaterialCost)}
              </span>
            </div>

            <div className="space-y-3 pt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Basic Depot Invoice (₦/{rateUnit})</label>
                <input
                  type="number"
                  value={matBasicCost}
                  onChange={(e) => setMatBasicCost(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Haulage (₦/{rateUnit})</label>
                  <input
                    type="number"
                    value={matHaulage}
                    onChange={(e) => setMatHaulage(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Offloading (₦)</label>
                  <input
                    type="number"
                    value={matOffloading}
                    onChange={(e) => setMatOffloading(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 font-medium mb-1">
                  <span>Site Wastage / Handling Loss:</span>
                  <span className="font-bold text-slate-900 font-mono">{matWastagePercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={matWastagePercent}
                  onChange={(e) => setMatWastagePercent(Number(e.target.value))}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Constituent Breakdown Notes</label>
                <input
                  type="text"
                  value={matNotes}
                  onChange={(e) => setMatNotes(e.target.value)}
                  placeholder="e.g. 6.4 bags cement, 0.44m3 sand, 0.88m3 stone"
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Net Material Rate:</span>
            <span className="font-mono font-bold text-emerald-800 text-sm">
              {formatNaira(computedMaterialCost)} <span className="text-[10px] text-slate-400 font-normal">/{rateUnit}</span>
            </span>
          </div>
        </div>

        {/* 2. PLANT & EQUIPMENT COST ANALYSIS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">2. Plant &amp; Machinery</h4>
                  <span className="text-[10px] text-slate-500 font-medium">Mechanical fleet wet lease</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-800 px-2 py-0.5 rounded-md bg-amber-50">
                {formatNaira(computedPlantCost)}
              </span>
            </div>

            <div className="space-y-3 pt-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Daily Hire (₦/day)</label>
                  <input
                    type="number"
                    value={plantDailyHire}
                    onChange={(e) => setPlantDailyHire(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Daily Fuel / Diesel (₦)</label>
                  <input
                    type="number"
                    value={plantFuelPerDay}
                    onChange={(e) => setPlantFuelPerDay(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Operator Daily (₦)</label>
                  <input
                    type="number"
                    value={plantOperatorPerDay}
                    onChange={(e) => setPlantOperatorPerDay(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Mob/Demob Share (₦)</label>
                  <input
                    type="number"
                    value={plantMobilizationShared}
                    onChange={(e) => setPlantMobilizationShared(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Daily Production Output ({rateUnit}/day) *</label>
                <input
                  type="number"
                  min="1"
                  value={plantDailyOutput}
                  onChange={(e) => setPlantDailyOutput(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Plant Fleet Description</label>
                <input
                  type="text"
                  value={plantNotes}
                  onChange={(e) => setPlantNotes(e.target.value)}
                  placeholder="e.g. 500L mixer + poker vibrator"
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Net Plant Rate:</span>
            <span className="font-mono font-bold text-amber-800 text-sm">
              {formatNaira(computedPlantCost)} <span className="text-[10px] text-slate-400 font-normal">/{rateUnit}</span>
            </span>
          </div>
        </div>

        {/* 3. LABOUR GANG COST ANALYSIS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">3. Labour &amp; Artisans</h4>
                  <span className="text-[10px] text-slate-500 font-medium">Gang output rate</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-blue-800 px-2 py-0.5 rounded-md bg-blue-50">
                {formatNaira(computedLabourCost)}
              </span>
            </div>

            <div className="space-y-3 pt-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Craftsman Daily (₦)</label>
                  <input
                    type="number"
                    value={craftsmanWage}
                    onChange={(e) => setCraftsmanWage(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Number of Craftsmen</label>
                  <input
                    type="number"
                    min="0"
                    value={craftsmenCount}
                    onChange={(e) => setCraftsmenCount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Helper Wage (₦/day)</label>
                  <input
                    type="number"
                    value={helperWage}
                    onChange={(e) => setHelperWage(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Number of Helpers</label>
                  <input
                    type="number"
                    min="0"
                    value={helpersCount}
                    onChange={(e) => setHelpersCount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Daily Output ({rateUnit}) *</label>
                  <input
                    type="number"
                    min="1"
                    value={gangDailyOutput}
                    onChange={(e) => setGangDailyOutput(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Union / PPE Levy (%)</label>
                  <input
                    type="number"
                    value={labourLevyPercent}
                    onChange={(e) => setLabourLevyPercent(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Labour Gang Composition</label>
                <input
                  type="text"
                  value={labourNotes}
                  onChange={(e) => setLabourNotes(e.target.value)}
                  placeholder="e.g. 1 Mason + 4 Helpers mixing and placing"
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Net Labour Rate:</span>
            <span className="font-mono font-bold text-blue-800 text-sm">
              {formatNaira(computedLabourCost)} <span className="text-[10px] text-slate-400 font-normal">/{rateUnit}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4. RATE SYNTHESIS & COMMERCIAL MARKUP BAR */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-700" />
              Composite Rate Synthesis &amp; Regional Benchmarks
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Prime direct cost plus head office overheads and contractor profit margin.
            </p>
          </div>

          {/* Markups Inputs */}
          <div className="flex items-center gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Overheads (%):</label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={overheadsPercent}
                  onChange={(e) => setOverheadsPercent(Number(e.target.value) || 0)}
                  className="w-16 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-center"
                />
                <span className="font-bold text-slate-400">%</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Profit Margin (%):</label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={profitPercent}
                  onChange={(e) => setProfitPercent(Number(e.target.value) || 0)}
                  className="w-16 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-center"
                />
                <span className="font-bold text-slate-400">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Component Share Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Constituent Composition:</span>
            <span>Prime Cost: {formatNaira(directCost)} / {rateUnit}</span>
          </div>
          <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${directCost > 0 ? (computedMaterialCost / directCost) * 100 : 33}%` }} 
              className="bg-emerald-600 h-full transition-all"
              title={`Material: ${directCost > 0 ? Math.round((computedMaterialCost / directCost) * 100) : 0}%`}
            />
            <div 
              style={{ width: `${directCost > 0 ? (computedPlantCost / directCost) * 100 : 33}%` }} 
              className="bg-amber-500 h-full transition-all"
              title={`Plant: ${directCost > 0 ? Math.round((computedPlantCost / directCost) * 100) : 0}%`}
            />
            <div 
              style={{ width: `${directCost > 0 ? (computedLabourCost / directCost) * 100 : 34}%` }} 
              className="bg-blue-600 h-full transition-all"
              title={`Labour: ${directCost > 0 ? Math.round((computedLabourCost / directCost) * 100) : 0}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              Materials ({directCost > 0 ? Math.round((computedMaterialCost / directCost) * 100) : 0}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Plant &amp; Equipment ({directCost > 0 ? Math.round((computedPlantCost / directCost) * 100) : 0}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              Labour &amp; Artisans ({directCost > 0 ? Math.round((computedLabourCost / directCost) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* 4 Nigerian Regional Zones Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Lagos */}
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
              Lagos (Commercial Base)
            </span>
            <div className="text-xl font-black font-mono text-emerald-950 mt-1">
              {formatNaira(regionalRates.lagos)}
            </div>
            <span className="text-[11px] text-emerald-700 block mt-0.5">
              Standard depot baseline
            </span>
          </div>

          {/* Abuja */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
              Abuja (Federal Capital)
            </span>
            <div className="text-xl font-black font-mono text-slate-900 mt-1">
              {formatNaira(regionalRates.abuja)}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              +5.0% FCT haulage loading
            </span>
          </div>

          {/* Port Harcourt */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
              Port Harcourt (Niger Delta)
            </span>
            <div className="text-xl font-black font-mono text-slate-900 mt-1">
              {formatNaira(regionalRates.portHarcourt)}
            </div>
            <span className="text-[11px] text-amber-700 block mt-0.5 font-medium">
              +9.0% swamp/river logistics
            </span>
          </div>

          {/* Northern Hub */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
              Northern Hub (Kano / Kaduna)
            </span>
            <div className="text-xl font-black font-mono text-slate-900 mt-1">
              {formatNaira(regionalRates.northern)}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              -4.0% aggregate accessibility
            </span>
          </div>
        </div>

        {/* Action Bar for Saving and Applying Built Rate */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>Ready to persist built rate: <strong>{rateName}</strong></span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                {formatNaira(regionalRates.lagos)} / {rateUnit}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Saves across Lagos, Abuja (₦{regionalRates.abuja.toLocaleString()}), and Port Harcourt (₦{regionalRates.portHarcourt.toLocaleString()}) to your library.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onApplyRateToBoq && (
              <button
                type="button"
                onClick={() => {
                  onApplyRateToBoq({
                    item: rateName,
                    description: `${rateDescription} (Built-up rate)`,
                    unit: rateUnit,
                    rate: regionalRates.lagos,
                    section: rateCategory
                  });
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-700" />
                <span>Apply to BOQ</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveRate}
              disabled={isSaving}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving to Database...' : 'Save Rate to Library'}</span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>✓ Rate "{rateName}" successfully saved to your library with Lagos (₦{regionalRates.lagos.toLocaleString()}), Abuja (₦{regionalRates.abuja.toLocaleString()}), and Port Harcourt (₦{regionalRates.portHarcourt.toLocaleString()}) rates!</span>
          </div>
        )}

        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>⚠ {saveError}</span>
          </div>
        )}
      </div>

    </div>
  );
};

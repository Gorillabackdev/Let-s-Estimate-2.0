import React, { useState, useMemo } from 'react';
import {
  Shovel,
  Layers,
  Box,
  Home,
  Grid,
  Activity,
  Brush,
  Trees,
  Plus,
  Trash2,
  Download,
  FileSpreadsheet,
  CheckCircle,
  Copy,
  ChevronRight,
  TrendingUp,
  MapPin,
  Sparkles,
  Info,
  DollarSign
} from 'lucide-react';
import { Project, BoqItem } from '../../types';
import { formatNaira, formatNumber } from '../../utils/format';
import { LAGOS_BASE_RATES, REGIONAL_FACTORS, MarketRegion } from '../../data/marketRatesData';
import { WORK_SECTIONS, WorkSectionKey, DeductionItem, CalculatedSectionResult, MaterialCostSummary } from './takeoffData';

interface MeasuredWorksTakeOffProps {
  activeProject?: Project;
  projects?: Project[];
  onApplyToBoq?: (item: Partial<BoqItem>) => void;
  onApplyBulkToBoq?: (
    items: Array<{
      item: string;
      description: string;
      qty: number;
      unit: string;
      rate: number;
      amount: number;
      section: string;
    }>,
    options?: {
      targetProjectId?: string;
      createAsNewProject?: boolean;
      newProjectTitle?: string;
      newProjectLocation?: string;
      newProjectType?: string;
    }
  ) => Promise<void> | void;
  onClose?: () => void;
}

export const MeasuredWorksTakeOff: React.FC<MeasuredWorksTakeOffProps> = ({
  activeProject,
  projects = [],
  onApplyToBoq,
  onApplyBulkToBoq,
  onClose
}) => {
  // Selected Work Section
  const [activeSection, setActiveSection] = useState<WorkSectionKey>('blockwork');
  const [selectedRegion, setSelectedRegion] = useState<MarketRegion>('Lagos');

  // Modal / Toast Notification states
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isNewBoqModalOpen, setIsNewBoqModalOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectLocation, setNewProjectLocation] = useState('Lagos, Nigeria');
  const [targetProjectId, setTargetProjectId] = useState<string>(activeProject?.id || '');

  // Global Waste percentage slider (applies across calculations)
  const [wastePercent, setWastePercent] = useState<number>(5);

  // Regional Price Multipliers
  const regFactor = REGIONAL_FACTORS[selectedRegion] || REGIONAL_FACTORS['Lagos'];

  // Base Lagos Market Prices
  const getMatPrice = (id: string, fallback: number) => {
    const item = LAGOS_BASE_RATES.coreMaterials.find(m => m.id === id);
    const base = item ? item.price : fallback;
    return Math.round(base * regFactor.materialsMultiplier);
  };

  const getLabPrice = (id: string, fallback: number) => {
    const item = LAGOS_BASE_RATES.labourWages.find(m => m.id === id);
    const base = item ? item.price : fallback;
    return Math.round(base * regFactor.labourMultiplier);
  };

  // Live prices
  const priceCement = getMatPrice('mat-cem-01', 9800); // 50kg bag
  const priceSharpSandTon = getMatPrice('mat-agg-01', 85000); // 20-tonne
  const priceSharpSandTipper = Math.round(priceSharpSandTon * 0.25); // ~5m3 tipper ~ ₦21,250
  const priceSandM3 = Math.round(priceSharpSandTipper / 5); // ₦4,250 / m3
  const priceGraniteTon = getMatPrice('mat-agg-03', 310000); // 30-tonne
  const priceGraniteTipper = Math.round(priceGraniteTon * (5 / 19)); // ~5m3 tipper ~ ₦81,500
  const priceGraniteM3 = Math.round(priceGraniteTipper / 5);
  const priceLateriteM3 = getMatPrice('mat-agg-06', 4500);
  const priceHardcoreM3 = getMatPrice('mat-agg-07', 8000);
  const priceBlock150 = getMatPrice('mat-blk-01', 550);
  const priceBlock225 = getMatPrice('mat-blk-02', 650);
  const priceSteelPerKg = Math.round(getMatPrice('mat-stl-03', 485000) / 1000); // ~₦485/kg
  const priceBindingWireKg = getMatPrice('mat-stl-07', 1200);
  const priceTimber50x50 = getMatPrice('mat-tmb-01', 800);
  const priceMarineBoard = getMatPrice('mat-tmb-04', 45000);
  const priceRoofSheet045 = getMatPrice('mat-rof-01', 6500);
  const priceRoofSheet055 = getMatPrice('mat-rof-02', 8500);
  const priceTilesM2 = getMatPrice('mat-fin-01', 8500);
  const priceTileAdhesive = getMatPrice('mat-fin-03', 6000);
  const pricePaintDrum = getMatPrice('mat-fin-04', 45000);
  const priceInterlockingM2 = getMatPrice('mat-blk-04', 4800);

  // Labour Rates
  const wageMason = getLabPrice('lab-01', 8000);
  const wageCarpenter = getLabPrice('lab-02', 7500);
  const wageLabourer = getLabPrice('lab-03', 4500);
  const wageSteelFixer = getLabPrice('lab-04', 8500);
  const wageTiler = getLabPrice('lab-07', 8500);
  const wagePainter = getLabPrice('lab-06', 7500);

  // ----------------------------------------------------
  // 1. [D] GROUNDWORK STATE
  // ----------------------------------------------------
  const [gwLandLength, setGwLandLength] = useState<number>(30); // 30m
  const [gwLandWidth, setGwLandWidth] = useState<number>(15);  // 15m
  const [gwTopsoilDepthMm, setGwTopsoilDepthMm] = useState<number>(150); // 150mm
  const [gwTrenchLength, setGwTrenchLength] = useState<number>(65); // 65m
  const [gwTrenchWidth, setGwTrenchWidth] = useState<number>(0.675); // 675mm
  const [gwTrenchDepth, setGwTrenchDepth] = useState<number>(1.0); // 1.0m
  const [gwTrenchQty, setGwTrenchQty] = useState<number>(1);
  const [gwFillingType, setGwFillingType] = useState<'Laterite' | 'Hardcore'>('Laterite');
  const [gwFillingLength, setGwFillingLength] = useState<number>(18); // 18m
  const [gwFillingWidth, setGwFillingWidth] = useState<number>(10);  // 10m
  const [gwFillingDepth, setGwFillingDepth] = useState<number>(0.3); // 300mm

  // ----------------------------------------------------
  // 2. [F] BLOCKWORK STATE
  // ----------------------------------------------------
  const [bwInputMode, setBwInputMode] = useState<'LxH' | 'SQM'>('LxH');
  const [bwLength, setBwLength] = useState<number>(35);
  const [bwHeight, setBwHeight] = useState<number>(3.0);
  const [bwWallQty, setBwWallQty] = useState<number>(1);
  const [bwDirectSqm, setBwDirectSqm] = useState<number>(105);
  const [bwThickness, setBwThickness] = useState<'150mm' | '225mm'>('225mm');
  const [bwLabourPerBlock, setBwLabourPerBlock] = useState<number>(200);
  const [bwDeductions, setBwDeductions] = useState<DeductionItem[]>([
    { id: 'd-1', name: 'Standard Door (D1)', type: 'door', width: 0.9, height: 2.1, qty: 3 },
    { id: 'd-2', name: 'Living Room Window (W1)', type: 'window', width: 1.5, height: 1.2, qty: 4 },
  ]);

  // ----------------------------------------------------
  // 3. [E] CONCRETE STATE
  // ----------------------------------------------------
  const [ccElementType, setCcElementType] = useState<'Strip Foundation' | 'Pad Footing' | 'Column' | 'Beam' | 'Slab'>('Strip Foundation');
  const [ccLength, setCcLength] = useState<number>(65);
  const [ccWidth, setCcWidth] = useState<number>(0.675);
  const [ccThickness, setCcThickness] = useState<number>(0.225); // 225mm
  const [ccQty, setCcQty] = useState<number>(1);
  const [ccGrade, setCcGrade] = useState<'Grade 15 Blinding (1:3:6)' | 'Grade 25 (1:2:4)' | 'Grade 30 (1:1.5:3)'>('Grade 25 (1:2:4)');

  // ----------------------------------------------------
  // 4. [J] REINFORCEMENT STATE
  // ----------------------------------------------------
  const [rfMemberLength, setRfMemberLength] = useState<number>(12); // 12m
  const [rfBarCount, setRfBarCount] = useState<number>(4);
  const [rfBarDiameter, setRfBarDiameter] = useState<number>(16); // 16mm
  const [rfLinksDiameter, setRfLinksDiameter] = useState<number>(8); // 8mm
  const [rfLinksSpacingMm, setRfLinksSpacingMm] = useState<number>(200); // 200mm c/c
  const [rfHookLengthMm, setRfHookLengthMm] = useState<number>(300); // 300mm
  const [rfLappingPercent, setRfLappingPercent] = useState<number>(10); // 10%
  const [rfLabourPerKg, setRfLabourPerKg] = useState<number>(75); // ₦75 per kg

  // ----------------------------------------------------
  // 5. [M] FORMWORK STATE
  // ----------------------------------------------------
  const [fwElement, setFwElement] = useState<'Foundation sides' | 'Column' | 'Beam' | 'Slab'>('Beam');
  const [fwLength, setFwLength] = useState<number>(40); // 40m
  const [fwHeight, setFwHeight] = useState<number>(0.45); // 450mm
  const [fwQty, setFwQty] = useState<number>(1);
  const [fwSides, setFwSides] = useState<number>(2); // 2 sides

  // ----------------------------------------------------
  // 6. [G] ROOFING STATE
  // ----------------------------------------------------
  const [rfBuildingLength, setRfBuildingLength] = useState<number>(18);
  const [rfBuildingWidth, setRfBuildingWidth] = useState<number>(12);
  const [rfRoofType, setRfRoofType] = useState<'Gable' | 'Hip'>('Gable');
  const [rfPitchDeg, setRfPitchDeg] = useState<number>(30); // 30 degrees
  const [rfOverhangMm, setRfOverhangMm] = useState<number>(600); // 600mm
  const [rfSheetType, setRfSheetType] = useState<'0.45mm Aluminium' | '0.55mm Longspan' | 'Steptiles Coated'>('0.55mm Longspan');
  const [rfSheetCoverWidth, setRfSheetCoverWidth] = useState<number>(0.85); // 0.85m

  // ----------------------------------------------------
  // 7. [Q] FINISHES STATE
  // ----------------------------------------------------
  const [fnAreaType, setFnAreaType] = useState<'Plastering' | 'Screeding' | 'Tiling' | 'Painting'>('Plastering');
  const [fnLength, setFnLength] = useState<number>(45);
  const [fnHeight, setFnHeight] = useState<number>(3.0);
  const [fnQty, setFnQty] = useState<number>(2); // e.g. both sides
  const [fnDeductions, setFnDeductions] = useState<DeductionItem[]>([
    { id: 'fn-d1', name: 'Doors', type: 'door', width: 0.9, height: 2.1, qty: 4 },
    { id: 'fn-d2', name: 'Windows', type: 'window', width: 1.2, height: 1.2, qty: 6 },
  ]);

  // ----------------------------------------------------
  // 8. [Ext] EXTERNAL WORKS STATE
  // ----------------------------------------------------
  const [extType, setExtType] = useState<'Interlocking Paving' | 'Concrete Drainage Culvert' | 'Perimeter Fencing'>('Interlocking Paving');
  const [extLength, setExtLength] = useState<number>(25);
  const [extWidth, setExtWidth] = useState<number>(8);

  // Quick Deduction Helpers
  const addDeduction = (target: 'blockwork' | 'finishes', type: 'door' | 'window' | 'void') => {
    const defaultDims = {
      door: { w: 0.9, h: 2.1, name: 'Door (0.9m x 2.1m)' },
      window: { w: 1.2, h: 1.2, name: 'Window (1.2m x 1.2m)' },
      void: { w: 2.0, h: 1.5, name: 'Opening / Void (2m x 1.5m)' },
    }[type];

    const newItem: DeductionItem = {
      id: `ded-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: defaultDims.name,
      type,
      width: defaultDims.w,
      height: defaultDims.h,
      qty: 1
    };

    if (target === 'blockwork') {
      setBwDeductions(prev => [...prev, newItem]);
    } else {
      setFnDeductions(prev => [...prev, newItem]);
    }
  };

  const removeDeduction = (target: 'blockwork' | 'finishes', id: string) => {
    if (target === 'blockwork') {
      setBwDeductions(prev => prev.filter(d => d.id !== id));
    } else {
      setFnDeductions(prev => prev.filter(d => d.id !== id));
    }
  };

  // ----------------------------------------------------
  // CALCULATIONS ENGINE (Client-side Deterministic)
  // ----------------------------------------------------
  const currentResult: CalculatedSectionResult = useMemo(() => {
    const wasteFactor = 1 + (wastePercent / 100);

    switch (activeSection) {
      // ------------------------------------------------
      // 1. GROUNDWORK
      // ------------------------------------------------
      case 'groundwork': {
        const siteClearanceArea = gwLandLength * gwLandWidth;
        const topsoilVol = siteClearanceArea * (gwTopsoilDepthMm / 1000);
        const excavationVol = gwTrenchLength * gwTrenchWidth * gwTrenchDepth * gwTrenchQty;
        const fillingVol = gwFillingLength * gwFillingWidth * gwFillingDepth;
        const tipperTripsFilling = Math.ceil(fillingVol / 5);
        const tipperTripsExcavation = Math.ceil(excavationVol / 5);
        const totalTippers = tipperTripsFilling + tipperTripsExcavation;

        const labourDays = Math.ceil((excavationVol / 3.5) + (siteClearanceArea / 120));
        const labourCost = labourDays * wageLabourer;

        const fillingMatPrice = gwFillingType === 'Hardcore' ? priceHardcoreM3 : priceLateriteM3;
        const fillingCost = Math.round(fillingVol * fillingMatPrice);
        const tipperHaulageCost = totalTippers * 25000;
        const materialsCost = fillingCost + tipperHaulageCost;
        const plantCost = Math.ceil(excavationVol / 40) * 45000; // JCB/backhoe rental allowance
        const totalCost = labourCost + materialsCost + plantCost;

        return {
          sectionKey: 'groundwork',
          itemName: `Groundwork - Site Clearance, Excavation & ${gwFillingType} Filling`,
          besmm4Trade: 'Substructure',
          billDescription: `Site clearance (${formatNumber(siteClearanceArea)} m²), topsoil strip (${gwTopsoilDepthMm}mm), foundation trench excavation (${formatNumber(excavationVol)} m³), and imported ${gwFillingType.toLowerCase()} filling (${formatNumber(fillingVol)} m³) with compaction.`,
          primaryQty: Number(excavationVol.toFixed(2)),
          primaryUnit: 'm3',
          labourDays,
          labourCost,
          materialsCost,
          plantCost,
          totalCost,
          derivedUnitRate: excavationVol > 0 ? Math.round(totalCost / excavationVol) : 0,
          materials: [
            { label: `${gwFillingType} Filling Material`, quantity: Number(fillingVol.toFixed(2)), unit: 'm³', unitRate: fillingMatPrice, totalCost: fillingCost },
            { label: '5m³ Tipper Haulage Trips', quantity: totalTippers, unit: 'trips', unitRate: 25000, totalCost: tipperHaulageCost },
            { label: 'Site Clearance (L×W)', quantity: Number(siteClearanceArea.toFixed(1)), unit: 'm²', unitRate: 350, totalCost: Math.round(siteClearanceArea * 350) }
          ],
          notes: [
            `Topsoil stripping volume: ${formatNumber(topsoilVol)} m³ (${gwTopsoilDepthMm}mm depth)`,
            `Excavated spoil tippers: ${tipperTripsExcavation} trips (5m³ per tipper)`,
            `Filling cartage: ${tipperTripsFilling} tippers of ${gwFillingType.toLowerCase()}`,
            `Estimated labour force: ${labourDays} person-days @ ${formatNaira(wageLabourer)}/day`
          ],
          keyOutputs: [
            { label: 'Site Clearance Area', value: `${formatNumber(siteClearanceArea)} m²` },
            { label: 'Excavation Volume', value: `${formatNumber(excavationVol)} m³` },
            { label: 'Filling Volume', value: `${formatNumber(fillingVol)} m³` },
            { label: 'Number of Tippers', value: `${totalTippers} trips (5m³)` },
            { label: 'Labour Days', value: `${labourDays} days` },
            { label: 'Cost using Market Rates', value: formatNaira(totalCost), highlight: true }
          ]
        };
      }

      // ------------------------------------------------
      // 2. BLOCKWORK
      // ------------------------------------------------
      case 'blockwork': {
        const grossArea = bwInputMode === 'LxH' ? bwLength * bwHeight * bwWallQty : bwDirectSqm;
        const totalDeductions = bwDeductions.reduce((acc, d) => acc + (d.width * d.height * d.qty), 0);
        const netArea = Math.max(0, grossArea - totalDeductions);

        const blocksPerSqm = bwThickness === '225mm' ? 10 : 12.5;
        const rawBlocks = netArea * blocksPerSqm;
        const totalBlocksWithWaste = Math.ceil(rawBlocks * wasteFactor);
        const cementBags = Math.ceil(totalBlocksWithWaste / 60); // 60 blocks laid per bag (1:6 mortar)
        const sandM3 = Number((cementBags * 0.18).toFixed(2));
        const sandTippers = Number((sandM3 / 5).toFixed(2));
        const waterLitres = cementBags * 25;

        const blockPrice = bwThickness === '225mm' ? priceBlock225 : priceBlock150;
        const blocksCost = totalBlocksWithWaste * blockPrice;
        const cementCost = cementBags * priceCement;
        const sandCost = Math.round(sandM3 * priceSandM3);
        const labourCost = totalBlocksWithWaste * bwLabourPerBlock;
        const materialsCost = blocksCost + cementCost + sandCost;
        const totalCost = labourCost + materialsCost;

        return {
          sectionKey: 'blockwork',
          itemName: `${bwThickness} Vibrated Sandcrete Blockwork`,
          besmm4Trade: 'Blockwork & Partitioning',
          billDescription: `Supply and lay ${bwThickness} vibrated hollow sandcrete blocks in 1:6 cement-sand mortar, including jointing, scaffolding and curing (Net Area: ${formatNumber(netArea)} m²).`,
          primaryQty: Number(netArea.toFixed(2)),
          primaryUnit: 'm2',
          labourDays: Math.ceil(totalBlocksWithWaste / 140),
          labourCost,
          materialsCost,
          plantCost: 0,
          totalCost,
          derivedUnitRate: netArea > 0 ? Math.round(totalCost / netArea) : 0,
          materials: [
            { label: `${bwThickness} Sandcrete Blocks (incl. ${wastePercent}% waste)`, quantity: totalBlocksWithWaste, unit: 'pcs', unitRate: blockPrice, totalCost: blocksCost },
            { label: 'Dangote 42.5N Cement', quantity: cementBags, unit: 'bags', unitRate: priceCement, totalCost: cementCost },
            { label: 'Sharp Sand for Mortar', quantity: sandM3, unit: 'm³', unitRate: priceSandM3, totalCost: sandCost },
            { label: 'Clean Water', quantity: waterLitres, unit: 'litres', unitRate: 0, totalCost: 0 }
          ],
          notes: [
            `Gross Area: ${formatNumber(grossArea)} m² | Deductions: ${formatNumber(totalDeductions)} m²`,
            `Net Wall Area: ${formatNumber(netArea)} m²`,
            `Total Blocks: ${formatNumber(totalBlocksWithWaste)} pcs (Rate: ${blocksPerSqm} blocks/m²)`,
            `Mortar Mix 1:6 -> ${cementBags} cement bags & ${sandTippers} tippers (5m³) sand`,
            `Artisan Labour: ${formatNaira(bwLabourPerBlock)} per block laid`
          ],
          keyOutputs: [
            { label: 'Net Wall Area', value: `${formatNumber(netArea)} m²` },
            { label: 'Total Blocks (incl. waste)', value: `${formatNumber(totalBlocksWithWaste)} pcs` },
            { label: 'Cement Bags', value: `${cementBags} bags` },
            { label: 'Sand Volume & Tippers', value: `${sandM3} m³ (${sandTippers} tippers)` },
            { label: 'Water', value: `${waterLitres} litres` },
            { label: 'Labour Cost', value: formatNaira(labourCost) },
            { label: 'Total Cost', value: formatNaira(totalCost), highlight: true }
          ]
        };
      }

      // ------------------------------------------------
      // 3. CONCRETE
      // ------------------------------------------------
      case 'concrete': {
        const volume = ccLength * ccWidth * ccThickness * ccQty;
        const volWithWaste = volume * wasteFactor;

        let cementBagsPerM3 = 6.5;
        let sandM3PerM3 = 0.42;
        let graniteM3PerM3 = 0.82;

        if (ccGrade.includes('Grade 15')) {
          cementBagsPerM3 = 4.5;
          sandM3PerM3 = 0.46;
          graniteM3PerM3 = 0.90;
        } else if (ccGrade.includes('Grade 30')) {
          cementBagsPerM3 = 7.8;
          sandM3PerM3 = 0.38;
          graniteM3PerM3 = 0.76;
        }

        const cementBags = Math.ceil(volWithWaste * cementBagsPerM3);
        const sandM3 = Number((volWithWaste * sandM3PerM3).toFixed(2));
        const graniteM3 = Number((volWithWaste * graniteM3PerM3).toFixed(2));
        const sandTippers = Number((sandM3 / 5).toFixed(2));
        const graniteTippers = Number((graniteM3 / 5).toFixed(2));
        const waterLitres = cementBags * 28;
        const vibratorDays = Math.max(1, Math.ceil(volume / 12));

        const cementCost = cementBags * priceCement;
        const sandCost = Math.round(sandM3 * priceSandM3);
        const graniteCost = Math.round(graniteM3 * priceGraniteM3);
        const materialsCost = cementCost + sandCost + graniteCost;
        const plantCost = (vibratorDays * 8000) + (Math.ceil(volume / 10) * 15000); // vibrator + mixer
        const labourDays = Math.ceil(volume * 1.8);
        const labourCost = labourDays * wageLabourer;
        const totalCost = materialsCost + plantCost + labourCost;

        return {
          sectionKey: 'concrete',
          itemName: `In-situ Concrete (${ccElementType} - ${ccGrade.split(' ')[0]} ${ccGrade.split(' ')[1] || ''})`,
          besmm4Trade: 'Reinforced Concrete Frame',
          billDescription: `Vibrated plain/reinforced in-situ concrete in ${ccElementType.toLowerCase()} (${ccGrade}), batch mixed, placed, compacted with poker vibrator and cured.`,
          primaryQty: Number(volume.toFixed(2)),
          primaryUnit: 'm3',
          labourDays,
          labourCost,
          materialsCost,
          plantCost,
          totalCost,
          derivedUnitRate: volume > 0 ? Math.round(totalCost / volume) : 0,
          materials: [
            { label: 'Dangote 42.5N Cement', quantity: cementBags, unit: 'bags', unitRate: priceCement, totalCost: cementCost },
            { label: 'Screened Sharp Sand', quantity: sandM3, unit: 'm³', unitRate: priceSandM3, totalCost: sandCost },
            { label: 'Crushed Granite 3/4"', quantity: graniteM3, unit: 'm³', unitRate: priceGraniteM3, totalCost: graniteCost },
            { label: 'Poker Vibrator & Mixer Lease', quantity: vibratorDays, unit: 'days', unitRate: 23000, totalCost: plantCost }
          ],
          notes: [
            `Net Concrete Volume: ${formatNumber(volume)} m³`,
            `Total with ${wastePercent}% waste: ${formatNumber(volWithWaste)} m³`,
            `Cement required: ${cementBags} bags (Mix: ${cementBagsPerM3} bags/m³)`,
            `Sand: ${sandTippers} tippers (5m³) | Granite: ${graniteTippers} tippers (5m³)`,
            `Compaction: ${vibratorDays} vibrator day(s) required`
          ],
          keyOutputs: [
            { label: 'Concrete Volume', value: `${formatNumber(volume)} m³` },
            { label: 'Cement Bags', value: `${cementBags} bags` },
            { label: 'Sand Tipper', value: `${sandTippers} tippers (5m³)` },
            { label: 'Granite Tipper', value: `${graniteTippers} tippers (5m³)` },
            { label: 'Water', value: `${waterLitres} litres` },
            { label: 'Vibrator Days', value: `${vibratorDays} days` },
            { label: 'Total Cost', value: formatNaira(totalCost), highlight: true }
          ]
        };
      }

      // ------------------------------------------------
      // 4. REINFORCEMENT
      // ------------------------------------------------
      case 'reinforcement': {
        const hooksM = (rfHookLengthMm / 1000) * 2; // both ends
        const lappingAllowance = 1 + (rfLappingPercent / 100);
        const singleBarTotalLength = (rfMemberLength + hooksM) * lappingAllowance;
        const mainBarTotalLength = singleBarTotalLength * rfBarCount;

        // Weight formula: (D^2 / 162) * L
        const unitWeightKgPerM = (rfBarDiameter * rfBarDiameter) / 162;
        const mainWeightKg = mainBarTotalLength * unitWeightKgPerM;

        // Links calculation
        const linksQty = Math.ceil((rfMemberLength * 1000) / rfLinksSpacingMm) + 1;
        const linkPerimeterM = 2 * (0.225 + 0.225) + 0.15; // standard 225x225 member stirrup
        const linkTotalLength = linksQty * linkPerimeterM;
        const linkWeightKg = linkTotalLength * ((rfLinksDiameter * rfLinksDiameter) / 162);

        const totalSteelWeightKg = Number((mainWeightKg + linkWeightKg).toFixed(2));
        const totalSteelTonnes = Number((totalSteelWeightKg / 1000).toFixed(3));
        const full12mLengths = Math.ceil(mainBarTotalLength / 12);
        const full12mLinks = Math.ceil(linkTotalLength / 12);
        const bindingWireKg = Number((totalSteelWeightKg * 0.015).toFixed(1));

        const steelCost = Math.round(totalSteelWeightKg * priceSteelPerKg);
        const wireCost = Math.round(bindingWireKg * priceBindingWireKg);
        const materialsCost = steelCost + wireCost;
        const labourCost = Math.round(totalSteelWeightKg * rfLabourPerKg);
        const totalCost = materialsCost + labourCost;

        return {
          sectionKey: 'reinforcement',
          itemName: `High-Yield Ribbed Steel Rebar (Y${rfBarDiameter} & Y${rfLinksDiameter} Links)`,
          besmm4Trade: 'Reinforced Concrete Frame',
          billDescription: `High-yield Grade TMT 500 deformed steel reinforcement in straight bars, bends, hooks, lapping, and Y${rfLinksDiameter} helical stirrups/links at ${rfLinksSpacingMm}mm c/c with 16-gauge binding wire.`,
          primaryQty: Number(totalSteelWeightKg.toFixed(1)),
          primaryUnit: 'kg',
          labourDays: Math.ceil(totalSteelWeightKg / 180),
          labourCost,
          materialsCost,
          plantCost: 0,
          totalCost,
          derivedUnitRate: totalSteelWeightKg > 0 ? Math.round(totalCost / totalSteelWeightKg) : 0,
          materials: [
            { label: `Y${rfBarDiameter} Main High-Yield Steel (${full12mLengths} lengths of 12m)`, quantity: Number(mainWeightKg.toFixed(1)), unit: 'kg', unitRate: priceSteelPerKg, totalCost: Math.round(mainWeightKg * priceSteelPerKg) },
            { label: `Y${rfLinksDiameter} Shear Links / Stirrups (${full12mLinks} lengths of 12m)`, quantity: Number(linkWeightKg.toFixed(1)), unit: 'kg', unitRate: priceSteelPerKg, totalCost: Math.round(linkWeightKg * priceSteelPerKg) },
            { label: 'Black Annealed Binding Wire', quantity: bindingWireKg, unit: 'kg', unitRate: priceBindingWireKg, totalCost: wireCost }
          ],
          notes: [
            `Total Weight: ${formatNumber(totalSteelWeightKg)} kg (${totalSteelTonnes} tonnes)`,
            `Main Bars: ${full12mLengths} full lengths (12m each, D²/162 = ${unitWeightKgPerM.toFixed(3)} kg/m)`,
            `Links: ${linksQty} stirrups @ ${rfLinksSpacingMm}mm spacing (${full12mLinks} lengths of 12m)`,
            `Binding wire required (1.5% ratio): ${bindingWireKg} kg`,
            `Steel fixer labour: ${formatNaira(rfLabourPerKg)}/kg (${formatNaira(labourCost)})`
          ],
          keyOutputs: [
            { label: 'Total Bar Length', value: `${formatNumber(mainBarTotalLength + linkTotalLength)} m` },
            { label: 'Total Steel Weight', value: `${formatNumber(totalSteelWeightKg)} kg` },
            { label: 'No. of 12m Lengths', value: `${full12mLengths + full12mLinks} pcs` },
            { label: 'Binding Wire', value: `${bindingWireKg} kg` },
            { label: 'Labour per kg Cost', value: `${formatNaira(rfLabourPerKg)}/kg (${formatNaira(labourCost)})` },
            { label: 'Total Cost', value: formatNaira(totalCost), highlight: true }
          ]
        };
      }

      // ------------------------------------------------
      // 5. FORMWORK
      // ------------------------------------------------
      case 'formwork': {
        const area = (fwLength * fwHeight * fwSides) * fwQty;
        const timber50x50M = Number((area * 0.8).toFixed(1));
        const timber50x100M = Number((area * 0.4).toFixed(1)); // props / stiffeners
        const marineBoardSheets = Number((area / 2.9).toFixed(1));
        const boardWithReuse = Math.ceil(marineBoardSheets / 3); // 3x re-use factor
        const nailsKg = Number((area * 0.25).toFixed(1));

        const boardCost = boardWithReuse * priceMarineBoard;
        const timberCost = Math.round((timber50x50M * priceTimber50x50) + (timber50x100M * 1500));
        const nailsCost = Math.round(nailsKg * 2500);
        const materialsCost = boardCost + timberCost + nailsCost;
        const labourDays = Math.ceil(area / 10);
        const labourCost = labourDays * wageCarpenter;
        const totalCost = materialsCost + labourCost;

        return {
          sectionKey: 'formwork',
          itemName: `Marine Board & Timber Formwork to ${fwElement}`,
          besmm4Trade: 'Carpentry, Doors & Windows',
          billDescription: `Sawn timber and 18mm film-faced marine board shuttering to ${fwElement.toLowerCase()}, complete with props, ledgers, braces, release oil and striking after curing.`,
          primaryQty: Number(area.toFixed(2)),
          primaryUnit: 'm2',
          labourDays,
          labourCost,
          materialsCost,
          plantCost: 0,
          totalCost,
          derivedUnitRate: area > 0 ? Math.round(totalCost / area) : 0,
          materials: [
            { label: '18mm Film-Faced Marine Board (with 3× re-use)', quantity: boardWithReuse, unit: 'sheets', unitRate: priceMarineBoard, totalCost: boardCost },
            { label: '50×50mm Hardwood Runners', quantity: timber50x50M, unit: 'm', unitRate: priceTimber50x50, totalCost: Math.round(timber50x50M * priceTimber50x50) },
            { label: '50×100mm Timber Bracing / Props', quantity: timber50x100M, unit: 'm', unitRate: 1500, totalCost: Math.round(timber50x100M * 1500) },
            { label: 'Assorted Shuttering Nails', quantity: nailsKg, unit: 'kg', unitRate: 2500, totalCost: nailsCost }
          ],
          notes: [
            `Formwork Contact Area: ${formatNumber(area)} m² (${fwSides} sides formed)`,
            `Gross Marine Board needed: ${marineBoardSheets} sheets (purchasing ${boardWithReuse} sheets with 3-cycle re-use)`,
            `Timber runners (50x50mm): ${timber50x50M} m`,
            `Shuttering carpenter team: ${labourDays} days @ ${formatNaira(wageCarpenter)}/day`
          ],
          keyOutputs: [
            { label: 'Formwork Area', value: `${formatNumber(area)} m²` },
            { label: 'Marine Board Sheets', value: `${boardWithReuse} sheets (gross: ${marineBoardSheets})` },
            { label: 'Timber Quantity (50×50)', value: `${timber50x50M} m` },
            { label: 'Timber Props (50×100)', value: `${timber50x100M} m` },
            { label: 'Labour Cost', value: formatNaira(labourCost) },
            { label: 'Total Cost', value: formatNaira(totalCost), highlight: true }
          ]
        };
      }

      // ------------------------------------------------
      // 6. ROOFING
      // ------------------------------------------------
      case 'roofing': {
        const overhangM = rfOverhangMm / 1000;
        const planL = rfBuildingLength + (2 * overhangM);
        const planW = rfBuildingWidth + (2 * overhangM);
        const planArea = planL * planW;

        const pitchRad = (rfPitchDeg * Math.PI) / 180;
        const cosPitch = Math.cos(pitchRad);
        const trueRoofArea = Number((planArea / (cosPitch > 0 ? cosPitch : 1) * (rfRoofType === 'Hip' ? 1.06 : 1.0)).toFixed(2));

        const sheetLength = 3.5; // standard sheet length
        const sheetsCount = Math.ceil(trueRoofArea / (sheetLength * rfSheetCoverWidth));
        const ridgeLength = Number((rfBuildingLength * (rfRoofType === 'Hip' ? 1.35 : 1.0)).toFixed(1));
        const nailsKg = Math.ceil(sheetsCount * 0.18);
        const purlinsM = Number((planArea * 2.2).toFixed(1));

        const sheetPrice = rfSheetType === '0.45mm Aluminium' ? priceRoofSheet045 : priceRoofSheet055;
        const sheetsCost = Math.round(trueRoofArea * sheetPrice);
        const ridgeCost = Math.round(ridgeLength * 3500);
        const purlinCost = Math.round(purlinsM * 1100);
        const nailsCost = nailsKg * 3000;
        const materialsCost = sheetsCost + ridgeCost + purlinCost + nailsCost;
        const labourDays = Math.ceil(trueRoofArea / 18);
        const labourCost = labourDays * wageCarpenter;
        const totalCost = materialsCost + labourCost;

        return {
          sectionKey: 'roofing',
          itemName: `${rfSheetType} Roofing with Hardwood Carcass`,
          besmm4Trade: 'Roofing & Rainwater Goods',
          billDescription: `Supply and fix ${rfSheetType} roofing covering to pitch ${rfPitchDeg}°, including ${ridgeLength}m ridge capping, ${purlinsM}m timber purlins, roofing drive screws/nails, and eaves fascia works.`,
          primaryQty: trueRoofArea,
          primaryUnit: 'm2',
          labourDays,
          labourCost,
          materialsCost,
          plantCost: 0,
          totalCost,
          derivedUnitRate: trueRoofArea > 0 ? Math.round(totalCost / trueRoofArea) : 0,
          materials: [
            { label: `${rfSheetType} Covering`, quantity: trueRoofArea, unit: 'm²', unitRate: sheetPrice, totalCost: sheetsCost },
            { label: 'Flanged Ridge Capping', quantity: ridgeLength, unit: 'm', unitRate: 3500, totalCost: ridgeCost },
            { label: '50×75mm Sawn Hardwood Purlins', quantity: purlinsM, unit: 'm', unitRate: 1100, totalCost: purlinCost },
            { label: 'Galvanized Roofing Nails & Washers', quantity: nailsKg, unit: 'kg', unitRate: 3000, totalCost: nailsCost }
          ],
          notes: [
            `Plan Footprint (with ${rfOverhangMm}mm eaves): ${formatNumber(planArea)} m²`,
            `True Sloping Roof Area (${rfPitchDeg}° slope): ${formatNumber(trueRoofArea)} m²`,
            `Estimated continuous profile sheets: ${sheetsCount} sheets (cover width ${rfSheetCoverWidth}m)`,
            `Total Ridge / Hip length: ${ridgeLength} m`,
            `Hardwood purlins run: ${purlinsM} m`
          ],
          keyOutputs: [
            { label: 'True Roof Area', value: `${formatNumber(trueRoofArea)} m²` },
            { label: 'No. of Profile Sheets', value: `${sheetsCount} sheets` },
            { label: 'Ridge Cap Length', value: `${ridgeLength} m` },
            { label: 'Roofing Nails / Fixings', value: `${nailsKg} kg` },
            { label: 'Timber Purlins Length', value: `${purlinsM} m` },
            { label: 'Labour Cost', value: formatNaira(labourCost) },
            { label: 'Total Cost', value: formatNaira(totalCost), highlight: true }
          ]
        };
      }

      // ------------------------------------------------
      // 7. FINISHES
      // ------------------------------------------------
      case 'finishes': {
        const grossArea = fnLength * fnHeight * fnQty;
        const totalDeductions = fnDeductions.reduce((acc, d) => acc + (d.width * d.height * d.qty), 0);
        const netArea = Math.max(0, grossArea - totalDeductions);
        const netWithWaste = netArea * wasteFactor;

        let materialsCost = 0;
        let labourWage = wageMason;
        let primaryUnit = 'm2';
        const materialsList: MaterialCostSummary[] = [];

        if (fnAreaType === 'Plastering') {
          // 15mm cement-sand render
          const cementBags = Math.ceil(netWithWaste * 0.25);
          const sandM3 = Number((netWithWaste * 0.022).toFixed(2));
          const cementCost = cementBags * priceCement;
          const sandCost = Math.round(sandM3 * priceSandM3);
          materialsCost = cementCost + sandCost;
          labourWage = wageMason;

          materialsList.push(
            { label: 'Dangote 42.5N Cement for Render', quantity: cementBags, unit: 'bags', unitRate: priceCement, totalCost: cementCost },
            { label: 'Plaster Sand (Silt-Free)', quantity: sandM3, unit: 'm³', unitRate: priceSandM3, totalCost: sandCost }
          );
        } else if (fnAreaType === 'Screeding') {
          // 50mm floor screed: Formula: Cement = Area * 0.03 * 2 bags
          const cementBags = Math.ceil(netWithWaste * 0.03 * 2);
          const sandM3 = Number((netWithWaste * 0.055).toFixed(2));
          const cementCost = cementBags * priceCement;
          const sandCost = Math.round(sandM3 * priceSandM3);
          materialsCost = cementCost + sandCost;
          labourWage = wageMason;

          materialsList.push(
            { label: 'Cement for 50mm Screed', quantity: cementBags, unit: 'bags', unitRate: priceCement, totalCost: cementCost },
            { label: 'Sharp Sand / Stone Dust for Screed', quantity: sandM3, unit: 'm³', unitRate: priceSandM3, totalCost: sandCost }
          );
        } else if (fnAreaType === 'Tiling') {
          // 600x600 vitrified tile + adhesive: Formula: Tiles m2 = Net * 1.05 waste, Adhesive bags = Area / 8
          const tilesM2 = Number((netArea * 1.05).toFixed(2));
          const adhesiveBags = Math.ceil(netArea / 8);
          const tilesCost = Math.round(tilesM2 * priceTilesM2);
          const adhesiveCost = adhesiveBags * priceTileAdhesive;
          materialsCost = tilesCost + adhesiveCost;
          labourWage = wageTiler;

          materialsList.push(
            { label: '600×600mm Vitrified Floor Tiles (incl. 5% waste)', quantity: tilesM2, unit: 'm²', unitRate: priceTilesM2, totalCost: tilesCost },
            { label: 'Polymer Tile Adhesive (20kg)', quantity: adhesiveBags, unit: 'bags', unitRate: priceTileAdhesive, totalCost: adhesiveCost }
          );
        } else {
          // Painting: Primer + 2 coats
          const paintDrums20L = Math.max(1, Math.ceil(netArea / 140)); // 140m2 per 20L drum 2 coats
          const paintCost = paintDrums20L * pricePaintDrum;
          materialsCost = paintCost;
          labourWage = wagePainter;

          materialsList.push(
            { label: 'Premium Washable Emulsion (20L Drum)', quantity: paintDrums20L, unit: 'drums', unitRate: pricePaintDrum, totalCost: paintCost }
          );
        }

        const labourDays = Math.ceil(netArea / 15);
        const labourCost = labourDays * labourWage;
        const totalCost = materialsCost + labourCost;

        return {
          sectionKey: 'finishes',
          itemName: `${fnAreaType} Works (Internal / External)`,
          besmm4Trade: 'Finishes (Plastering, Tiling & Screed)',
          billDescription: `Execute ${fnAreaType.toLowerCase()} to wall/floor surfaces including preparation, applying bonding coat, curing and surface cleaning (Net: ${formatNumber(netArea)} m²).`,
          primaryQty: Number(netArea.toFixed(2)),
          primaryUnit,
          labourDays,
          labourCost,
          materialsCost,
          plantCost: 0,
          totalCost,
          derivedUnitRate: netArea > 0 ? Math.round(totalCost / netArea) : 0,
          materials: materialsList,
          notes: [
            `Gross Area: ${formatNumber(grossArea)} m² | Deductions: ${formatNumber(totalDeductions)} m²`,
            `Net Surface Area: ${formatNumber(netArea)} m²`,
            `Trade specification: ${fnAreaType} with ${wastePercent}% cutting waste allowance`,
            `Specialist artisan labour: ${labourDays} days @ ${formatNaira(labourWage)}/day`
          ],
          keyOutputs: [
            { label: 'Net Surface Area', value: `${formatNumber(netArea)} m²` },
            { label: 'Materials Summary', value: materialsList.map(m => `${m.quantity} ${m.unit} ${m.label.split(' ')[0]}`).join(', ') },
            { label: 'Labour Cost', value: formatNaira(labourCost) },
            { label: 'Total Cost', value: formatNaira(totalCost), highlight: true }
          ]
        };
      }

      // ------------------------------------------------
      // 8. EXTERNAL WORKS
      // ------------------------------------------------
      case 'external':
      default: {
        const area = extLength * extWidth;
        const stonesM2 = Number((area * wasteFactor).toFixed(2));
        const stoneDustTonnes = Math.ceil(area * 0.05 * 1.6);
        const kerbsM = Number(((extLength + extWidth) * 2).toFixed(1));

        const stonesCost = Math.round(stonesM2 * priceInterlockingM2);
        const stoneDustCost = stoneDustTonnes * 12000;
        const kerbsCost = Math.round(kerbsM * 2800);
        const materialsCost = stonesCost + stoneDustCost + kerbsCost;
        const labourDays = Math.ceil(area / 20);
        const labourCost = labourDays * wageMason;
        const totalCost = materialsCost + labourCost;

        return {
          sectionKey: 'external',
          itemName: `External Works - 60mm Interlocking Paving Stones & Kerbs`,
          besmm4Trade: 'External Works & Preliminaries',
          billDescription: `Supply and lay 60mm heavy duty zig-zag interlocking paving stones bedded on 50mm compacted stone dust base with precast concrete kerbs along perimeter.`,
          primaryQty: Number(area.toFixed(2)),
          primaryUnit: 'm2',
          labourDays,
          labourCost,
          materialsCost,
          plantCost: 0,
          totalCost,
          derivedUnitRate: area > 0 ? Math.round(totalCost / area) : 0,
          materials: [
            { label: '60mm Vibrated Interlocking Stones', quantity: stonesM2, unit: 'm²', unitRate: priceInterlockingM2, totalCost: stonesCost },
            { label: 'Granite Stone Dust Sub-base', quantity: stoneDustTonnes, unit: 'tonnes', unitRate: 12000, totalCost: stoneDustCost },
            { label: 'Precast Concrete Edge Kerbs', quantity: kerbsM, unit: 'm', unitRate: 2800, totalCost: kerbsCost }
          ],
          notes: [
            `Total Paving Area: ${formatNumber(area)} m² (${extLength}m × ${extWidth}m)`,
            `Interlocking stones with ${wastePercent}% cutting waste: ${stonesM2} m²`,
            `Edge restraining kerbs: ${kerbsM} linear metres`,
            `Sub-base bed: 50mm compacted quarry stone dust`
          ],
          keyOutputs: [
            { label: 'Works / Paving Area', value: `${formatNumber(area)} m²` },
            { label: 'Interlocking Stones', value: `${stonesM2} m²` },
            { label: 'Stone Dust Sub-base', value: `${stoneDustTonnes} tonnes` },
            { label: 'Edge Kerbs', value: `${kerbsM} m` },
            { label: 'Labour Cost', value: formatNaira(labourCost) },
            { label: 'Total Cost', value: formatNaira(totalCost), highlight: true }
          ]
        };
      }
    }
  }, [
    activeSection,
    selectedRegion,
    wastePercent,
    // GW
    gwLandLength, gwLandWidth, gwTopsoilDepthMm, gwTrenchLength, gwTrenchWidth, gwTrenchDepth, gwTrenchQty, gwFillingType, gwFillingLength, gwFillingWidth, gwFillingDepth,
    // BW
    bwInputMode, bwLength, bwHeight, bwWallQty, bwDirectSqm, bwThickness, bwLabourPerBlock, bwDeductions,
    // CC
    ccElementType, ccLength, ccWidth, ccThickness, ccQty, ccGrade,
    // RF
    rfMemberLength, rfBarCount, rfBarDiameter, rfLinksDiameter, rfLinksSpacingMm, rfHookLengthMm, rfLappingPercent, rfLabourPerKg,
    // FW
    fwElement, fwLength, fwHeight, fwQty, fwSides,
    // ROOF
    rfBuildingLength, rfBuildingWidth, rfRoofType, rfPitchDeg, rfOverhangMm, rfSheetType, rfSheetCoverWidth,
    // FIN
    fnAreaType, fnLength, fnHeight, fnQty, fnDeductions,
    // EXT
    extType, extLength, extWidth,
    // Rates
    priceCement, priceSharpSandTipper, priceSandM3, priceGraniteTipper, priceGraniteM3, priceLateriteM3, priceHardcoreM3,
    priceBlock150, priceBlock225, priceSteelPerKg, priceBindingWireKg, priceTimber50x50, priceMarineBoard, priceRoofSheet045,
    priceRoofSheet055, priceTilesM2, priceTileAdhesive, pricePaintDrum, priceInterlockingM2,
    wageMason, wageCarpenter, wageLabourer, wageSteelFixer, wageTiler, wagePainter
  ]);

  // ----------------------------------------------------
  // ACTION HANDLERS: ADD TO BOQ, CREATE NEW BOQ, EXPORT CSV
  // ----------------------------------------------------

  const handleSaveToActiveBoq = () => {
    const destProject = projects.find(p => p.id === targetProjectId) || activeProject;

    if (targetProjectId && targetProjectId !== activeProject?.id && onApplyBulkToBoq) {
      onApplyBulkToBoq([{
        item: currentResult.itemName,
        description: currentResult.billDescription,
        qty: currentResult.primaryQty,
        unit: currentResult.primaryUnit,
        rate: currentResult.derivedUnitRate,
        amount: currentResult.totalCost,
        section: currentResult.besmm4Trade,
      }], {
        targetProjectId: targetProjectId,
        createAsNewProject: false
      });

      setSaveSuccessMsg(`Added "${currentResult.itemName}" to "${destProject?.title || 'Selected Project'}"!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      return;
    }

    if (onApplyToBoq) {
      onApplyToBoq({
        item: currentResult.itemName,
        description: currentResult.billDescription,
        qty: currentResult.primaryQty,
        unit: currentResult.primaryUnit,
        rate: currentResult.derivedUnitRate,
        amount: currentResult.totalCost,
        section: currentResult.besmm4Trade,
      });

      setSaveSuccessMsg(`Added "${currentResult.itemName}" directly to your active BOQ!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } else if (onApplyBulkToBoq) {
      onApplyBulkToBoq([{
        item: currentResult.itemName,
        description: currentResult.billDescription,
        qty: currentResult.primaryQty,
        unit: currentResult.primaryUnit,
        rate: currentResult.derivedUnitRate,
        amount: currentResult.totalCost,
        section: currentResult.besmm4Trade,
      }], {
        targetProjectId: activeProject?.id,
        createAsNewProject: false
      });

      setSaveSuccessMsg(`Saved to ${activeProject?.title || 'active project'}!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  };

  const handleCreateNewBoqFromTakeoff = async () => {
    if (!onApplyBulkToBoq) return;

    const title = newProjectTitle.trim() || `Take-Off - ${currentResult.itemName.slice(0, 30)}`;
    await onApplyBulkToBoq([{
      item: currentResult.itemName,
      description: currentResult.billDescription,
      qty: currentResult.primaryQty,
      unit: currentResult.primaryUnit,
      rate: currentResult.derivedUnitRate,
      amount: currentResult.totalCost,
      section: currentResult.besmm4Trade,
    }], {
      createAsNewProject: true,
      newProjectTitle: title,
      newProjectLocation: newProjectLocation,
      newProjectType: 'Commercial'
    });

    setIsNewBoqModalOpen(false);
    setSaveSuccessMsg(`Created new BOQ project: "${title}"!`);
    setTimeout(() => setSaveSuccessMsg(null), 5000);
  };

  const handleExportCsv = () => {
    const headers = ['Category', 'Item Name', 'BESMM4 Trade', 'Description', 'Quantity', 'Unit', 'Unit Rate (NGN)', 'Total Amount (NGN)', 'Region'];
    const row = [
      `"${WORK_SECTIONS.find(w => w.key === activeSection)?.title || activeSection}"`,
      `"${currentResult.itemName.replace(/"/g, '""')}"`,
      `"${currentResult.besmm4Trade}"`,
      `"${currentResult.billDescription.replace(/"/g, '""')}"`,
      currentResult.primaryQty,
      `"${currentResult.primaryUnit}"`,
      currentResult.derivedUnitRate,
      currentResult.totalCost,
      `"${selectedRegion}"`
    ];

    const materialHeader = ['', 'Material Breakdown', '', '', 'Qty', 'Unit', 'Rate (NGN)', 'Subtotal (NGN)', ''];
    const materialRows = currentResult.materials.map(m => [
      '',
      `"${m.label.replace(/"/g, '""')}"`,
      '',
      '',
      m.quantity,
      `"${m.unit}"`,
      m.unitRate,
      m.totalCost,
      ''
    ]);

    const csvContent = [
      headers.join(','),
      row.join(','),
      '',
      materialHeader.join(','),
      ...materialRows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TakeOff_Measured_${activeSection}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-140px)] p-3 sm:p-6 text-slate-800">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>BESMM4 Calibrated Engineering Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Take-Off Calculator System
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Execute deterministic measured works take-offs across all Nigerian civil & building trades.
            Automatic material breakdown, tipper volumes, artisan labour outputs and live market rate synthesis.
          </p>
        </div>

        {/* Region & Waste Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Market Region */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center space-x-2 shadow-2xs">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <div className="text-left">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Market Region</div>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value as MarketRegion)}
                className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="Lagos">Lagos State (Baseline)</option>
                <option value="Port Harcourt">Port Harcourt (Niger Delta +14%)</option>
                <option value="Abuja">Abuja (FCT +9%)</option>
                <option value="Kano">Kano (North Hub)</option>
                <option value="Enugu">Enugu (South East)</option>
              </select>
            </div>
          </div>

          {/* Waste Slider */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-[130px] shadow-2xs">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              <span>Waste Allowance</span>
              <span className="text-emerald-700 font-extrabold">{wastePercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={wastePercent}
              onChange={(e) => setWastePercent(Number(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center space-x-3 shadow-md animate-fade-in">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE: LEFT NAV + ACTIVE CALCULATOR + RIGHT STICKY RESULTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT SIDEBAR: BESMM4 WORK SECTIONS */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-2">
              BESMM4 Work Sections
            </div>

            <div className="space-y-1">
              {WORK_SECTIONS.map((sec) => {
                const isCurrent = activeSection === sec.key;
                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => setActiveSection(sec.key)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-800 text-white shadow-sm font-bold'
                        : 'bg-white hover:bg-slate-100 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`text-xs font-mono font-black px-1.5 py-0.5 rounded ${isCurrent ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {sec.code}
                      </span>
                      <div>
                        <div className="text-xs font-bold leading-tight">{sec.title}</div>
                        <div className={`text-[10px] truncate max-w-[130px] ${isCurrent ? 'text-emerald-200' : 'text-slate-400'}`}>
                          {sec.shortDesc}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isCurrent ? 'text-emerald-300' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center space-x-2 text-slate-900 font-bold">
              <Info className="w-4 h-4 text-emerald-700" />
              <span>How this Works</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              1. Choose a trade section from the sidebar.
              <br />
              2. Adjust dimensions and deductions.
              <br />
              3. View material quantities (bags, tippers, rebar lengths) on the right card.
              <br />
              4. Transfer directly into your active BOQ or generate a fresh BOQ project.
            </p>
          </div>
        </div>

        {/* MIDDLE COLUMN: ACTIVE SECTION INPUT FORM */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div>
              <span className="text-xs font-bold font-mono text-emerald-700">
                {WORK_SECTIONS.find(w => w.key === activeSection)?.code} BESMM4 Specification
              </span>
              <h2 className="text-lg font-black text-slate-900">
                {WORK_SECTIONS.find(w => w.key === activeSection)?.title} Calculator
              </h2>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-semibold">
              Live Client-Side Math
            </span>
          </div>

          {/* 1. GROUNDWORK FORM */}
          {activeSection === 'groundwork' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">Site Clearance & Topsoil Strip</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Land Length (m)</label>
                    <input
                      type="number"
                      value={gwLandLength}
                      onChange={(e) => setGwLandLength(Math.max(1, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Land Width (m)</label>
                    <input
                      type="number"
                      value={gwLandWidth}
                      onChange={(e) => setGwLandWidth(Math.max(1, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Topsoil (mm)</label>
                    <input
                      type="number"
                      value={gwTopsoilDepthMm}
                      onChange={(e) => setGwTopsoilDepthMm(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">Foundation Trench Excavation</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Length (m)</label>
                    <input
                      type="number"
                      value={gwTrenchLength}
                      onChange={(e) => setGwTrenchLength(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Width (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={gwTrenchWidth}
                      onChange={(e) => setGwTrenchWidth(Math.max(0.1, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Depth (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={gwTrenchDepth}
                      onChange={(e) => setGwTrenchDepth(Math.max(0.1, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Trenches (Qty)</label>
                    <input
                      type="number"
                      value={gwTrenchQty}
                      onChange={(e) => setGwTrenchQty(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">Imported Filling & Compaction</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Filling Type</label>
                    <select
                      value={gwFillingType}
                      onChange={(e) => setGwFillingType(e.target.value as any)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="Laterite">Laterite Earth Fill</option>
                      <option value="Hardcore">Hardcore Stone Fill</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Filling Length (m)</label>
                    <input
                      type="number"
                      value={gwFillingLength}
                      onChange={(e) => setGwFillingLength(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Filling Width (m)</label>
                    <input
                      type="number"
                      value={gwFillingWidth}
                      onChange={(e) => setGwFillingWidth(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Filling Depth (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={gwFillingDepth}
                      onChange={(e) => setGwFillingDepth(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. BLOCKWORK FORM */}
          {activeSection === 'blockwork' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBwInputMode('LxH')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    bwInputMode === 'LxH' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Wall Dimensions [L × H]
                </button>
                <button
                  type="button"
                  onClick={() => setBwInputMode('SQM')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    bwInputMode === 'SQM' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  I have Net Area [SQM]
                </button>
              </div>

              {bwInputMode === 'LxH' ? (
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Wall Length (m)</label>
                    <input
                      type="number"
                      value={bwLength}
                      onChange={(e) => setBwLength(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Wall Height (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={bwHeight}
                      onChange={(e) => setBwHeight(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">No. of Walls</label>
                    <input
                      type="number"
                      value={bwWallQty}
                      onChange={(e) => setBwWallQty(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Gross Wall Area (m²)</label>
                  <input
                    type="number"
                    value={bwDirectSqm}
                    onChange={(e) => setBwDirectSqm(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
              )}

              {/* Block Thickness & Labour */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Block Thickness</label>
                  <select
                    value={bwThickness}
                    onChange={(e) => setBwThickness(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="225mm">225mm (9" Vibrated Block - 10/m²)</option>
                    <option value="150mm">150mm (6" Vibrated Block - 12.5/m²)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Labour per Block (₦)</label>
                  <input
                    type="number"
                    value={bwLabourPerBlock}
                    onChange={(e) => setBwLabourPerBlock(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Deductions Repeater */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Deductions (Doors, Windows, Voids)</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => addDeduction('blockwork', 'door')}
                      className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded border border-emerald-300 transition"
                    >
                      + Add Door
                    </button>
                    <button
                      type="button"
                      onClick={() => addDeduction('blockwork', 'window')}
                      className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded border border-emerald-300 transition"
                    >
                      + Add Window
                    </button>
                    <button
                      type="button"
                      onClick={() => addDeduction('blockwork', 'void')}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded border border-slate-300 transition"
                    >
                      + Add Void
                    </button>
                  </div>
                </div>

                {bwDeductions.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic py-1">No deductions added. Gross wall area will be calculated.</div>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    {bwDeductions.map((ded) => (
                      <div key={ded.id} className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                          {ded.type}
                        </span>
                        <input
                          type="text"
                          value={ded.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBwDeductions(prev => prev.map(d => d.id === ded.id ? { ...d, name: val } : d));
                          }}
                          className="flex-1 text-xs font-semibold border-b border-transparent focus:border-emerald-500 focus:outline-none"
                        />
                        <div className="flex items-center space-x-1 text-slate-600">
                          <input
                            type="number"
                            step="0.05"
                            value={ded.width}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setBwDeductions(prev => prev.map(d => d.id === ded.id ? { ...d, width: val } : d));
                            }}
                            className="w-12 px-1 text-center font-bold border border-slate-200 rounded"
                          />
                          <span>×</span>
                          <input
                            type="number"
                            step="0.05"
                            value={ded.height}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setBwDeductions(prev => prev.map(d => d.id === ded.id ? { ...d, height: val } : d));
                            }}
                            className="w-12 px-1 text-center font-bold border border-slate-200 rounded"
                          />
                          <span>m (Qty:</span>
                          <input
                            type="number"
                            value={ded.qty}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setBwDeductions(prev => prev.map(d => d.id === ded.id ? { ...d, qty: val } : d));
                            }}
                            className="w-10 px-1 text-center font-bold border border-slate-200 rounded"
                          />
                          <span>)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDeduction('blockwork', ded.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. CONCRETE FORM */}
          {activeSection === 'concrete' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">Structural Element & Grade</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Element Type</label>
                    <select
                      value={ccElementType}
                      onChange={(e) => setCcElementType(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="Strip Foundation">Strip Foundation Footing</option>
                      <option value="Pad Footing">Isolated Pad Footing</option>
                      <option value="Column">Reinforced Concrete Column</option>
                      <option value="Beam">Suspended Floor Beam</option>
                      <option value="Slab">Ground or Suspended Slab</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Mix Grade</label>
                    <select
                      value={ccGrade}
                      onChange={(e) => setCcGrade(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="Grade 25 (1:2:4)">Grade 25 (1:2:4 standard - 6.5 bags/m³)</option>
                      <option value="Grade 15 Blinding (1:3:6)">Grade 15 Blinding (1:3:6 - 4.5 bags/m³)</option>
                      <option value="Grade 30 (1:1.5:3)">Grade 30 Heavy Frame (1:1.5:3 - 7.8 bags/m³)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">Dimensions & Quantity</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Length (m)</label>
                    <input
                      type="number"
                      value={ccLength}
                      onChange={(e) => setCcLength(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Width (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={ccWidth}
                      onChange={(e) => setCcWidth(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Thickness (m)</label>
                    <input
                      type="number"
                      step="0.025"
                      value={ccThickness}
                      onChange={(e) => setCcThickness(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Quantity</label>
                    <input
                      type="number"
                      value={ccQty}
                      onChange={(e) => setCcQty(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. REINFORCEMENT FORM */}
          {activeSection === 'reinforcement' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">Member & Main Bar Specifications</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Member Length (m)</label>
                    <input
                      type="number"
                      value={rfMemberLength}
                      onChange={(e) => setRfMemberLength(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">No. of Bars</label>
                    <input
                      type="number"
                      value={rfBarCount}
                      onChange={(e) => setRfBarCount(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Diameter (mm)</label>
                    <select
                      value={rfBarDiameter}
                      onChange={(e) => setRfBarDiameter(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value={8}>Y8 (0.395 kg/m)</option>
                      <option value={10}>Y10 (0.617 kg/m)</option>
                      <option value={12}>Y12 (0.888 kg/m)</option>
                      <option value={16}>Y16 (1.580 kg/m)</option>
                      <option value={20}>Y20 (2.469 kg/m)</option>
                      <option value={25}>Y25 (3.858 kg/m)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">Links, Hooks & Lapping Allowance</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Links Dia</label>
                    <select
                      value={rfLinksDiameter}
                      onChange={(e) => setRfLinksDiameter(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value={8}>Y8</option>
                      <option value={10}>Y10</option>
                      <option value={12}>Y12</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Spacing (mm)</label>
                    <input
                      type="number"
                      step="25"
                      value={rfLinksSpacingMm}
                      onChange={(e) => setRfLinksSpacingMm(Math.max(50, Number(e.target.value) || 200))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Hook (mm)</label>
                    <input
                      type="number"
                      value={rfHookLengthMm}
                      onChange={(e) => setRfHookLengthMm(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Lapping (%)</label>
                    <input
                      type="number"
                      value={rfLappingPercent}
                      onChange={(e) => setRfLappingPercent(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Steel Fixer Labour (₦/kg)</label>
                <input
                  type="number"
                  value={rfLabourPerKg}
                  onChange={(e) => setRfLabourPerKg(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                />
              </div>
            </div>
          )}

          {/* 5. FORMWORK FORM */}
          {activeSection === 'formwork' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">Member Type & Dimensions</span>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Element</label>
                    <select
                      value={fwElement}
                      onChange={(e) => setFwElement(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="Foundation sides">Foundation Trench Sides</option>
                      <option value="Column">Isolated Concrete Column</option>
                      <option value="Beam">Suspended Floor Beam</option>
                      <option value="Slab">Floor Slab Soffit</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Sides to Form</label>
                    <select
                      value={fwSides}
                      onChange={(e) => setFwSides(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value={1}>1 Side (Slab soffit or 1 edge)</option>
                      <option value={2}>2 Sides (Trench sides / Beam sides)</option>
                      <option value={3}>3 Sides (Beam sides + soffit)</option>
                      <option value={4}>4 Sides (Column full box)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Length (m)</label>
                    <input
                      type="number"
                      value={fwLength}
                      onChange={(e) => setFwLength(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Height / Depth (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={fwHeight}
                      onChange={(e) => setFwHeight(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Quantity</label>
                    <input
                      type="number"
                      value={fwQty}
                      onChange={(e) => setFwQty(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. ROOFING FORM */}
          {activeSection === 'roofing' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">Building Plan Footprint</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Length (m)</label>
                    <input
                      type="number"
                      value={rfBuildingLength}
                      onChange={(e) => setRfBuildingLength(Math.max(1, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Width (m)</label>
                    <input
                      type="number"
                      value={rfBuildingWidth}
                      onChange={(e) => setRfBuildingWidth(Math.max(1, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Overhang (mm)</label>
                    <input
                      type="number"
                      value={rfOverhangMm}
                      onChange={(e) => setRfOverhangMm(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">Roof Geometry & Covering Profile</span>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Roof Type</label>
                    <select
                      value={rfRoofType}
                      onChange={(e) => setRfRoofType(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="Gable">Gable Roof (Double Pitch)</option>
                      <option value="Hip">Hip Roof (Four Pitch + Hips)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Pitch Angle (°)</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={rfPitchDeg}
                      onChange={(e) => setRfPitchDeg(Math.max(5, Number(e.target.value) || 30))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Sheet Profile</label>
                    <select
                      value={rfSheetType}
                      onChange={(e) => setRfSheetType(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="0.55mm Longspan">0.55mm Longspan Aluminium</option>
                      <option value="0.45mm Aluminium">0.45mm Standard Aluminium</option>
                      <option value="Steptiles Coated">Step-tiles Stone Coated</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Effective Cover (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={rfSheetCoverWidth}
                      onChange={(e) => setRfSheetCoverWidth(Math.max(0.5, Number(e.target.value) || 0.85))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. FINISHES FORM */}
          {activeSection === 'finishes' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">Finishes Trade Type</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Trade</label>
                    <select
                      value={fnAreaType}
                      onChange={(e) => setFnAreaType(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="Plastering">Plastering (15mm Wall Render)</option>
                      <option value="Screeding">Floor Screeding (50mm Cement-Sand)</option>
                      <option value="Tiling">Floor / Wall Tiling (600×600mm)</option>
                      <option value="Painting">Painting (Primer + 2 Finish Coats)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Quantity / Sides</label>
                    <input
                      type="number"
                      value={fnQty}
                      onChange={(e) => setFnQty(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Length (m)</label>
                  <input
                    type="number"
                    value={fnLength}
                    onChange={(e) => setFnLength(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Height (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={fnHeight}
                    onChange={(e) => setFnHeight(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Finishes Deductions */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Openings Deductions</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => addDeduction('finishes', 'door')}
                      className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded border border-emerald-300"
                    >
                      + Add Door
                    </button>
                    <button
                      type="button"
                      onClick={() => addDeduction('finishes', 'window')}
                      className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded border border-emerald-300"
                    >
                      + Add Window
                    </button>
                  </div>
                </div>

                {fnDeductions.map((ded) => (
                  <div key={ded.id} className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                      {ded.type}
                    </span>
                    <input
                      type="text"
                      value={ded.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFnDeductions(prev => prev.map(d => d.id === ded.id ? { ...d, name: val } : d));
                      }}
                      className="flex-1 text-xs font-semibold border-b border-transparent focus:border-emerald-500 focus:outline-none"
                    />
                    <div className="flex items-center space-x-1 text-slate-600 text-xs">
                      <span>{ded.width}m × {ded.height}m (Qty: {ded.qty})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDeduction('finishes', ded.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. EXTERNAL WORKS FORM */}
          {activeSection === 'external' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">External Works Scope</span>
                <select
                  value={extType}
                  onChange={(e) => setExtType(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white mb-3"
                >
                  <option value="Interlocking Paving">60mm Interlocking Paving Stones & Kerbs</option>
                  <option value="Concrete Drainage Culvert">Reinforced Concrete Perimeter Drainage Line</option>
                  <option value="Perimeter Fencing">Sandcrete Block Perimeter Boundary Wall</option>
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Length (m)</label>
                    <input
                      type="number"
                      value={extLength}
                      onChange={(e) => setExtLength(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Width / Height (m)</label>
                    <input
                      type="number"
                      value={extWidth}
                      onChange={(e) => setExtWidth(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: STICKY RESULTS CARD + MATERIAL BREAKDOWN */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          
          <div className="bg-white rounded-2xl border-2 border-emerald-700/80 p-5 shadow-md">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                  Calculated Take-Off Output
                </span>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  {currentResult.itemName}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-400 block">Unit Rate</span>
                <span className="text-xs font-mono font-black text-emerald-700">
                  {formatNaira(currentResult.derivedUnitRate)}/{currentResult.primaryUnit}
                </span>
              </div>
            </div>

            {/* Primary Quantity & Grand Total */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Net Quantity</span>
                <div className="text-2xl font-black text-emerald-950 font-mono mt-0.5">
                  {formatNumber(currentResult.primaryQty)}{' '}
                  <span className="text-xs font-bold text-emerald-700">{currentResult.primaryUnit}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-900 text-white rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Cost ({selectedRegion})</span>
                <div className="text-xl font-black text-emerald-400 font-mono mt-0.5 truncate">
                  {formatNaira(currentResult.totalCost)}
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Materials Subtotal:</span>
                <span className="font-bold text-slate-900 font-mono">{formatNaira(currentResult.materialsCost)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Artisan Labour Subtotal:</span>
                <span className="font-bold text-slate-900 font-mono">{formatNaira(currentResult.labourCost)}</span>
              </div>
              {currentResult.plantCost > 0 && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Plant & Equipment:</span>
                  <span className="font-bold text-slate-900 font-mono">{formatNaira(currentResult.plantCost)}</span>
                </div>
              )}
            </div>

            {/* Key Outputs Quick Grid */}
            {currentResult.keyOutputs && currentResult.keyOutputs.length > 0 && (
              <div className="mb-4 bg-emerald-50/80 border border-emerald-200 rounded-xl p-3">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 mb-2 flex items-center justify-between">
                  <span>Calculated Outputs</span>
                  <span className="text-[10px] font-bold text-emerald-700 font-mono">BESMM4 Calibrated</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {currentResult.keyOutputs.map((out, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg bg-white border ${
                        out.highlight
                          ? 'border-emerald-500 font-bold bg-emerald-50 col-span-2 flex justify-between items-center'
                          : 'border-emerald-100 shadow-2xs'
                      }`}
                    >
                      <div className="text-[10px] text-slate-500 font-semibold">{out.label}</div>
                      <div className={`font-mono ${out.highlight ? 'text-sm font-extrabold text-emerald-900' : 'font-bold text-slate-900 text-xs'}`}>
                        {out.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Material Requirements Breakdown */}
            <div className="mb-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                Material Requirements Breakdown
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {currentResult.materials.map((mat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <div className="font-bold text-slate-800 leading-tight">{mat.label}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {formatNumber(mat.quantity)} {mat.unit} @ {formatNaira(mat.unitRate)}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-right">
                      {formatNaira(mat.totalCost)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Engineering Notes & Formulas */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl mb-4 text-[11px] text-amber-900 space-y-1">
              <span className="font-bold block text-amber-950">Take-Off Measurement Notes:</span>
              {currentResult.notes.map((n, idx) => (
                <div key={idx} className="flex items-start space-x-1.5">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>{n}</span>
                </div>
              ))}
            </div>

            {/* Destination Project Selection if multiple projects exist */}
            {projects && projects.length > 1 && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 mb-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Target Project Destination
                </label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} {p.id === activeProject?.id ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ACTION BUTTONS: Add to BOQ / Create New BOQ / Export CSV */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              
              <button
                type="button"
                onClick={handleSaveToActiveBoq}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  Add to BOQ ({projects.find(p => p.id === targetProjectId)?.title?.slice(0, 18) || activeProject?.title?.slice(0, 18) || 'Project'})
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewBoqModalOpen(true)}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-300 shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Create New BOQ</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Export CSV</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* MODAL: CREATE NEW BOQ FROM TAKEOFF */}
      {isNewBoqModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Create New Project BOQ</h3>
            <p className="text-xs text-slate-500 mb-4">
              Initialize a new project Bill of Quantities containing this calculated measured works item.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Project Title</label>
                <input
                  type="text"
                  placeholder="e.g. 4-Bedroom Duplex Measured Works"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Lekki Phase 1, Lagos"
                  value={newProjectLocation}
                  onChange={(e) => setNewProjectLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800">Initial Line Item:</span>
                <div className="text-emerald-800 font-bold">{currentResult.itemName}</div>
                <div className="text-slate-500 font-mono">
                  {formatNumber(currentResult.primaryQty)} {currentResult.primaryUnit} @ {formatNaira(currentResult.derivedUnitRate)} = {formatNaira(currentResult.totalCost)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setIsNewBoqModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewBoqFromTakeoff}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 shadow-sm"
              >
                Create BOQ Project
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

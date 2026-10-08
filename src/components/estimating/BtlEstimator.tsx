import React, { useState, useMemo } from 'react';
import {
  Shovel,
  Building2,
  Home,
  Layers,
  Brush,
  Trees,
  Search,
  Calculator,
  Edit2,
  Info,
  Check,
  Plus,
  Trash2,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle,
  X,
  MapPin,
  HelpCircle,
  TrendingUp,
  Download,
  ShieldCheck,
  FileText,
  Clock,
  Briefcase,
  FolderPlus,
  Box,
  Filter
} from 'lucide-react';
import { Project, BoqItem } from '../../types';
import { formatNaira, formatNumber } from '../../utils/format';
import { LAGOS_BASE_RATES, REGIONAL_FACTORS, MarketRegion } from '../../data/marketRatesData';

// Types for BTL Estimator
export type BtlRegion = 'Lagos' | 'PH' | 'Abuja';

export type BtlSectionKey = 
  | 'preliminaries'
  | 'substructure'
  | 'superstructure'
  | 'roofing'
  | 'staircase'
  | 'finishing'
  | 'external_works';

export type BtlFormulaType = 
  | 'area' 
  | 'linear' 
  | 'volume' 
  | 'blockwork' 
  | 'concrete' 
  | 'rebar' 
  | 'formwork';

export interface BtlMeasurementInputs {
  length: number;
  width?: number;
  height?: number;
  qty: number;
  wallThickness?: '150' | '225';
  concreteMix?: 'M20' | 'M25';
  rebarDia?: string;
  rebarLapPercent?: number;
  sides?: number;
  [key: string]: any;
}

export interface BtlMaterialBreakdown {
  cementBags?: number;
  sandTippers?: number;
  graniteTippers?: number;
  rebarKg?: number;
  blocks?: number;
  [key: string]: any;
}

export interface BtlDeduction {
  id: string;
  name: string;
  type: 'door' | 'window' | 'void';
  width: number;
  height: number;
  qty: number;
}

export interface BtlMaterialRequirement {
  label: string;
  quantity: number;
  unit: string;
  rate: number;
  cost: number;
}

export interface BtlChecklistItem {
  id: string;
  sectionKey: BtlSectionKey;
  
  // Traceable Item Definition
  title?: string;
  name: string; // sync with title
  description: string;
  unit: 'm' | 'm2' | 'm3' | 'kg' | 'nos' | 'pcs' | 'lm' | 'pc' | 'item' | 'sum' | 'month' | 'ls' | 'day' | 'wk' | string;
  waste?: number;
  wastePercent: number; // sync with waste
  formulaType?: BtlFormulaType;
  inputs?: BtlMeasurementInputs;
  deductions: BtlDeduction[];
  netQty?: number;
  grossQty?: number;
  materials?: any;
  materialBreakdown?: BtlMaterialBreakdown;
  rate?: number;
  unitRate: number; // sync with rate
  amount?: number;
  totalCost: number; // sync with amount

  checked: boolean;
  
  // Custom Selector fields (e.g. Roofing, Blockwork, Rebar, Formwork)
  woodType?: 'Alaska' | 'Hardwood';
  sheetType?: '0.45mm Aluzinc' | '0.55mm Longspan' | 'Metcoppo' | 'Stone Coated';
  blockThickness?: '150mm' | '225mm';
  rodDiameter?: number; // 8, 10, 12, 16, 20, 25mm
  sides?: number; // 1, 2, 3, 4
  
  // Input dimensions for calculator
  length: number;
  width: number;
  height: number;
  qty: number;
  
  // Calculated Results
  isCalculated: boolean;
  calculatedQty: number;
  cementBags: number;
  sandTipper: number;
  graniteTipper: number;
  rebarKg: number;
  labourCost: number;

  // Manual creation flag
  isManual?: boolean;
}

export interface BtlSectionDef {
  key: BtlSectionKey;
  number: number;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  besmmTrade: string;
}

export const BTL_SECTIONS: BtlSectionDef[] = [
  { key: 'preliminaries', number: 1, name: 'PRELIMINARIES & SITE SETUP', icon: ShieldCheck, tagline: 'Statutory bonds, insurance, site supervision, temporary sheds, water, power & security', besmmTrade: 'Bill No. 1: Preliminaries & General Conditions' },
  { key: 'substructure', number: 2, name: 'SUBSTRUCTURE', icon: Shovel, tagline: 'Earthworks, trenches, column bases & ground floor slab', besmmTrade: 'Substructure' },
  { key: 'superstructure', number: 3, name: 'SUPERSTRUCTURE', icon: Building2, tagline: 'Reinforced columns, beams, lintels & upper blockwork', besmmTrade: 'Reinforced Concrete Frame' },
  { key: 'roofing', number: 4, name: 'ROOFING', icon: Home, tagline: 'Timber carcass, covering sheets, gutters & ridge caps', besmmTrade: 'Roofing & Rainwater Goods' },
  { key: 'staircase', number: 5, name: 'STAIRCASE', icon: TrendingUp, tagline: 'Waist slab, landings, rebar, formwork & balustrades', besmmTrade: 'Reinforced Concrete Frame' },
  { key: 'finishing', number: 6, name: 'FINISHING', icon: Brush, tagline: 'Plastering, screed, tiling, painting & joinery', besmmTrade: 'Finishes (Plastering, Tiling & Screed)' },
  { key: 'external_works', number: 7, name: 'EXTERNAL WORKS', icon: Trees, tagline: 'Fencing, septic, paving, drains & water infrastructure', besmmTrade: 'External Works & Preliminaries' },
];

export interface BtlEstimatorProps {
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

// Initial Standard Checklist Factory (Comprehensive NIQS / BESMM4 Bill of Quantities)
const createInitialChecklist = (): BtlChecklistItem[] => {
  return [
    // -------------------------------------------------------------------------
    // 1. BILL NO 1: PRELIMINARIES & GENERAL CONDITIONS (16 standard BESMM4 items)
    // -------------------------------------------------------------------------
    { id: 'prelim-1', sectionKey: 'preliminaries', name: 'Performance Bond & Advance Payment Guarantee (APG)', description: 'Bank/Insurance guarantee charges for 10% performance security & advance payment compliance under standard conditions', unit: 'item', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 1, deductions: [], isCalculated: true, calculatedQty: 1, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 0, totalCost: 750000, unitRate: 750000, materials: [] },
    { id: 'prelim-2', sectionKey: 'preliminaries', name: "Contractor's All Risks (CAR) & Third-Party Insurance", description: 'Comprehensive insurance policy covering works, materials against fire/theft, public liability & ECA', unit: 'item', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 1, deductions: [], isCalculated: true, calculatedQty: 1, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 0, totalCost: 650000, unitRate: 650000, materials: [] },
    { id: 'prelim-3', sectionKey: 'preliminaries', name: 'Site Project Management & Resident Supervision', description: 'Monthly allowances & management salaries for Resident Engineer, Site Foreman, QS & Safety Officer', unit: 'month', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 6, deductions: [], isCalculated: true, calculatedQty: 6, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 2700000, totalCost: 2700000, unitRate: 450000, materials: [] },
    { id: 'prelim-4', sectionKey: 'preliminaries', name: 'Site Survey, Setting Out & Cadastral Benchmarks', description: 'Engaging licensed surveyor to establish permanent concrete datum benchmarks, grid lines & profiles', unit: 'item', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 1, deductions: [], isCalculated: true, calculatedQty: 1, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 80000, totalCost: 180000, unitRate: 180000, materials: [] },
    { id: 'prelim-5', sectionKey: 'preliminaries', name: 'Consultants & Contractor Temporary Site Office', description: 'Mobilization of insulated 20ft/40ft container cabin office with meeting table, drawing rack, AC & lighting', unit: 'item', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 1, deductions: [], isCalculated: true, calculatedQty: 1, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 250000, totalCost: 1200000, unitRate: 1200000, materials: [] },
    { id: 'prelim-6', sectionKey: 'preliminaries', name: 'Secure Weatherproof Storage Sheds & Fabrication Yard', description: 'Weatherproof cement storage shed raised on wooden pallets (min 150mm), rebar bending yard & timber benches', unit: 'item', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 1, deductions: [], isCalculated: true, calculatedQty: 1, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 220000, totalCost: 850000, unitRate: 850000, materials: [] },
    { id: 'prelim-7', sectionKey: 'preliminaries', name: 'Temporary Site Hoarding & Vehicular Security Gate', description: '2.4m high corrugated zinc sheet perimeter hoarding with hardwood posts and lockable double-leaf vehicle gate', unit: 'm', checked: true, wastePercent: 0, length: 110, width: 0, height: 0, qty: 1, deductions: [], isCalculated: true, calculatedQty: 110, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 450000, totalCost: 2035000, unitRate: 18500, materials: [] },
    { id: 'prelim-8', sectionKey: 'preliminaries', name: 'Temporary Water for the Works (Borehole & Overhead Tanks)', description: 'Industrial motorized deep borehole drilling, submersible pump, overhead scaffolding tower & 2x5000L tanks', unit: 'item', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 1, deductions: [], isCalculated: true, calculatedQty: 1, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 350000, totalCost: 2200000, unitRate: 2200000, materials: [] },
    { id: 'prelim-9', sectionKey: 'preliminaries', name: 'Temporary Power & Site Generator Operation', description: 'Site generator mobilization (25-40kVA), monthly diesel fuel supply, distribution board & night security lighting', unit: 'month', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 6, deductions: [], isCalculated: true, calculatedQty: 6, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 180000, totalCost: 1680000, unitRate: 280000, materials: [] },
    { id: 'prelim-10', sectionKey: 'preliminaries', name: '24/7 Site Security Watchmen & Guard Service', description: 'Day & night uniformed security watchmen, visitor logbook control, theft prevention & perimeter patrols', unit: 'month', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 6, deductions: [], isCalculated: true, calculatedQty: 6, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 960000, totalCost: 960000, unitRate: 160000, materials: [] },
    { id: 'prelim-11', sectionKey: 'preliminaries', name: 'Health, Safety, Environment (HSE) & PPE Provisions', description: 'Personal protective equipment (helmets, high-vis vests, steel-toe boots), first aid kits & fire extinguishers', unit: 'item', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 1, deductions: [], isCalculated: true, calculatedQty: 1, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 50000, totalCost: 420000, unitRate: 420000, materials: [] },
    { id: 'prelim-12', sectionKey: 'preliminaries', name: 'Tubular Steel Scaffolding & Hoisting Equipment', description: 'Supply, erection and inspection of tubular steel access scaffolding, working decks, guardrails & builder hoist', unit: 'item', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 1, deductions: [], isCalculated: true, calculatedQty: 1, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 450000, totalCost: 1450000, unitRate: 1450000, materials: [] },
    { id: 'prelim-13', sectionKey: 'preliminaries', name: 'Concrete Cube Testing & Quality Control QA/QC', description: 'Standard 150mm cast iron cube moulds, slump cone, curing tank and certified laboratory 7/28-day crushing tests', unit: 'item', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 1, deductions: [], isCalculated: true, calculatedQty: 1, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 80000, totalCost: 320000, unitRate: 320000, materials: [] },
    { id: 'prelim-14', sectionKey: 'preliminaries', name: 'Site Sanitation & Temporary Workers Washrooms', description: 'Mobile chemical toilet rental or ventilated temporary septic pit latrines with handwashing facilities', unit: 'item', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 1, deductions: [], isCalculated: true, calculatedQty: 1, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 75000, totalCost: 250000, unitRate: 250000, materials: [] },
    { id: 'prelim-15', sectionKey: 'preliminaries', name: 'Progress Documentation & As-Built Drawings', description: 'Monthly high-resolution photographic and drone progress reports, red-line record drawings & As-Built CAD copies', unit: 'item', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 1, deductions: [], isCalculated: true, calculatedQty: 1, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 150000, totalCost: 350000, unitRate: 350000, materials: [] },
    { id: 'prelim-16', sectionKey: 'preliminaries', name: 'Cleaning & Clearing Site on Completion', description: 'Dismantling all temporary sheds, carting away hoarding & waste, deep window/floor post-construction cleaning', unit: 'item', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 1, deductions: [], isCalculated: true, calculatedQty: 1, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 200000, totalCost: 280000, unitRate: 280000, materials: [] },

    // -------------------------------------------------------------------------
    // 2. SUBSTRUCTURE (24 comprehensive items)
    // -------------------------------------------------------------------------
    { id: 'sub-1', sectionKey: 'substructure', name: 'Site Clearance & Cartaway', description: 'Clear site of shrubs, small trees, and debris; cart away topsoil', unit: 'm2', checked: true, wastePercent: 0, length: 30, width: 15, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 450, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 45000, totalCost: 180000, unitRate: 400, materials: [] },
    { id: 'sub-2', sectionKey: 'substructure', name: 'Setting Out', description: 'Setting out the building lines with profile boards, pegs and lines', unit: 'm2', checked: true, wastePercent: 0, length: 22, width: 12, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 264, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 65000, totalCost: 95000, unitRate: 360, materials: [] },
    { id: 'sub-3', sectionKey: 'substructure', name: 'Excavation Foundation Trench', description: 'Excavate foundation trenches to firm soil strata (min 1000mm deep)', unit: 'm3', checked: true, wastePercent: 0, length: 70, width: 0.675, height: 1.0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 47.25, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 140000, totalCost: 260000, unitRate: 5500, materials: [] },
    { id: 'sub-4', sectionKey: 'substructure', name: 'Excavation Column Base/Pad', description: 'Excavate isolated pad footings for reinforced concrete columns', unit: 'm3', checked: true, wastePercent: 0, length: 1.2, width: 1.2, height: 1.2, qty: 12, deductions: [], isCalculated: false, calculatedQty: 20.74, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 65000, totalCost: 125000, unitRate: 6027, materials: [] },
    { id: 'sub-5', sectionKey: 'substructure', name: 'Hardcore Filling', description: '300mm broken rock hardcore filling to floor bed, hand packed and blinded', unit: 'm3', checked: true, wastePercent: 5, length: 20, width: 11, height: 0.3, qty: 1, deductions: [], isCalculated: false, calculatedQty: 66, cementBags: 0, sandTipper: 0, graniteTipper: 13.2, rebarKg: 0, labourCost: 85000, totalCost: 613000, unitRate: 9288, materials: [] },
    { id: 'sub-6', sectionKey: 'substructure', name: 'Anti-Termite', description: 'Chemical anti-termite treatment solution applied to compacted filling', unit: 'm2', checked: true, wastePercent: 0, length: 20, width: 11, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 220, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 25000, totalCost: 145000, unitRate: 659, materials: [] },
    { id: 'sub-7', sectionKey: 'substructure', name: 'Blinding 50mm', description: '50mm thick plain concrete (1:3:6) blinding layer under footings', unit: 'm3', checked: true, wastePercent: 3, length: 70, width: 0.675, height: 0.05, qty: 1, deductions: [], isCalculated: false, calculatedQty: 2.36, cementBags: 11, sandTipper: 0.22, graniteTipper: 0.42, rebarKg: 0, labourCost: 28000, totalCost: 172000, unitRate: 72881, materials: [] },
    { id: 'sub-8', sectionKey: 'substructure', name: 'Reinforcement Column Base', description: 'High yield ribbed steel rebar Y12 in mesh mats for pad footings', unit: 'kg', checked: true, wastePercent: 5, rodDiameter: 12, length: 1.1, width: 0, height: 0, qty: 144, deductions: [], isCalculated: false, calculatedQty: 140.6, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 140.6, labourCost: 18000, totalCost: 187000, unitRate: 1330, materials: [] },
    { id: 'sub-9', sectionKey: 'substructure', name: 'Formwork Column Base', description: 'Sawn timber formwork to sides of column base foundations', unit: 'm2', checked: true, wastePercent: 5, sides: 2, length: 1.2, width: 0, height: 0.4, qty: 48, deductions: [], isCalculated: false, calculatedQty: 23.04, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 45000, totalCost: 175000, unitRate: 7595, materials: [] },
    { id: 'sub-10', sectionKey: 'substructure', name: 'Concrete Column Base', description: 'Grade 25 (1:2:4) vibrated reinforced concrete in pad footings', unit: 'm3', checked: true, wastePercent: 3, length: 1.2, width: 1.2, height: 0.4, qty: 12, deductions: [], isCalculated: false, calculatedQty: 6.91, cementBags: 45, sandTipper: 0.58, graniteTipper: 1.13, rebarKg: 0, labourCost: 75000, totalCost: 590000, unitRate: 85383, materials: [] },
    { id: 'sub-11', sectionKey: 'substructure', name: 'Foundation Blockwork 225mm (Waste 5%)', description: '225mm vibrated hollow sandcrete blocks laid in 1:4 cement-sand mortar', unit: 'm2', checked: true, wastePercent: 5, blockThickness: '225mm', length: 70, width: 0, height: 1.2, qty: 1, deductions: [], isCalculated: false, calculatedQty: 84, cementBags: 15, sandTipper: 0.54, graniteTipper: 0, rebarKg: 0, labourCost: 176400, totalCost: 845000, unitRate: 10060, materials: [] },
    { id: 'sub-12', sectionKey: 'substructure', name: 'Backfilling', description: 'Backfilling selected excavated earth around foundation walls with tamping', unit: 'm3', checked: true, wastePercent: 5, length: 70, width: 0.35, height: 1.0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 24.5, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 65000, totalCost: 95000, unitRate: 3878, materials: [] },
    { id: 'sub-13', sectionKey: 'substructure', name: 'BRC Mesh A142', description: 'BRC welded fabric wire mesh reinforcement A142 in ground floor slab', unit: 'm2', checked: true, wastePercent: 5, length: 20, width: 11, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 220, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 35000, totalCost: 485000, unitRate: 2205, materials: [] },
    { id: 'sub-14', sectionKey: 'substructure', name: 'DPM', description: 'Heavy-duty 500-gauge polythene damp proof membrane with 150mm laps', unit: 'm2', checked: true, wastePercent: 5, length: 20, width: 11, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 220, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 25000, totalCost: 195000, unitRate: 886, materials: [] },
    { id: 'sub-15', sectionKey: 'substructure', name: 'Ground Floor Slab Concrete', description: '150mm Grade 25 (1:2:4) vibrated concrete oversite ground slab', unit: 'm3', checked: true, wastePercent: 3, length: 20, width: 11, height: 0.15, qty: 1, deductions: [], isCalculated: false, calculatedQty: 33, cementBags: 215, sandTipper: 2.77, graniteTipper: 5.41, rebarKg: 0, labourCost: 280000, totalCost: 2820000, unitRate: 85455, materials: [] },
    { id: 'sub-16', sectionKey: 'substructure', name: 'Ground Floor Slab Rebar', description: 'Starter bars and perimeter edge trimming rebar Y12 in slab', unit: 'kg', checked: true, wastePercent: 5, rodDiameter: 12, length: 12, width: 0, height: 0, qty: 24, deductions: [], isCalculated: false, calculatedQty: 255.7, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 255.7, labourCost: 32000, totalCost: 345000, unitRate: 1349, materials: [] },
    { id: 'sub-17', sectionKey: 'substructure', name: 'Ground Floor Slab Formwork', description: 'Timber edge forms 150mm high to perimeter edge of ground slab', unit: 'm2', checked: true, wastePercent: 5, sides: 1, length: 62, width: 0, height: 0.15, qty: 1, deductions: [], isCalculated: false, calculatedQty: 9.3, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 20000, totalCost: 75000, unitRate: 8065, materials: [] },
    // Newly Added Substructure Trade Omissions:
    { id: 'sub-18', sectionKey: 'substructure', name: 'Damp Proof Course (DPC)', description: 'Heavy-duty bituminous felt DPC (225mm wide) laid on foundation walls at slab level', unit: 'm', checked: true, wastePercent: 5, length: 70, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 70, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 25000, totalCost: 136000, unitRate: 1942, materials: [] },
    { id: 'sub-19', sectionKey: 'substructure', name: 'Bituminous Waterproofing to Foundation Walls', description: '2 coats cold-applied bituminous emulsion to external foundation wall faces in earth contact', unit: 'm2', checked: true, wastePercent: 5, length: 70, width: 0, height: 1.0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 70, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 35000, totalCost: 176400, unitRate: 2520, materials: [] },
    { id: 'sub-20', sectionKey: 'substructure', name: 'Column Starter Bars / Starter Rebar', description: 'High-yield deformed steel rebar Y16 projecting from pad footings into ground columns', unit: 'kg', checked: true, wastePercent: 5, rodDiameter: 16, length: 1.8, width: 0, height: 0, qty: 64, deductions: [], isCalculated: false, calculatedQty: 182, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 182, labourCost: 32000, totalCost: 245000, unitRate: 1346, materials: [] },
    { id: 'sub-21', sectionKey: 'substructure', name: 'Dewatering / Pumping Out Ground Water', description: 'Mobilization and continuous pumping out of water from foundation trenches during rainy/waterlogged conditions', unit: 'nos', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 1, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 55000, totalCost: 95000, unitRate: 95000, materials: [] },
    { id: 'sub-22', sectionKey: 'substructure', name: 'Sharp Sand Blinding to Hardcore (50mm)', description: '50mm thick sharp sand bed spread over coarse rock hardcore before laying polythene DPM', unit: 'm3', checked: true, wastePercent: 5, length: 20, width: 11, height: 0.05, qty: 1, deductions: [], isCalculated: false, calculatedQty: 11, cementBags: 0, sandTipper: 2.2, graniteTipper: 0, rebarKg: 0, labourCost: 25000, totalCost: 106000, unitRate: 9636, materials: [] },
    { id: 'sub-23', sectionKey: 'substructure', name: 'Cartaway of Surplus Excavated Spoil', description: 'Haulage and disposal off-site of surplus excavated soil via 5m³ tipper trips', unit: 'm3', checked: true, wastePercent: 5, length: 70, width: 0.675, height: 0.5, qty: 1, deductions: [], isCalculated: false, calculatedQty: 23.6, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 40000, totalCost: 86800, unitRate: 3677, materials: [] },
    { id: 'sub-24', sectionKey: 'substructure', name: 'Under-Slab Plumbing & Electrical Sleeves', description: 'Heavy-gauge PVC pipe sleeves and conduits cast through foundation walls and floor slab', unit: 'nos', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 24, deductions: [], isCalculated: false, calculatedQty: 24, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 24000, totalCost: 84000, unitRate: 3500, materials: [] },

    // -------------------------------------------------------------------------
    // 2. SUPERSTRUCTURE (17 comprehensive items)
    // -------------------------------------------------------------------------
    { id: 'sup-1', sectionKey: 'superstructure', name: 'Ground Floor Blockwork (Waste 5%)', description: '225mm vibrated sandcrete blockwork to ground floor superstructure walls', unit: 'm2', checked: true, wastePercent: 5, blockThickness: '225mm', length: 75, width: 0, height: 3.1, qty: 1, deductions: [{ id: 'd1', name: 'Doors', type: 'door', width: 0.9, height: 2.1, qty: 6 }, { id: 'd2', name: 'Windows', type: 'window', width: 1.5, height: 1.2, qty: 8 }], isCalculated: false, calculatedQty: 206.85, cementBags: 37, sandTipper: 1.33, graniteTipper: 0, rebarKg: 0, labourCost: 434000, totalCost: 2420000, unitRate: 11699, materials: [] },
    { id: 'sup-2', sectionKey: 'superstructure', name: 'Columns Rebar', description: 'High-yield ribbed steel rebar Y16 & Y8 stirrups for columns (H=3.1m)', unit: 'kg', checked: true, wastePercent: 5, rodDiameter: 16, length: 3.6, width: 0, height: 0, qty: 64, deductions: [], isCalculated: false, calculatedQty: 480, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 480, labourCost: 55000, totalCost: 650000, unitRate: 1354, materials: [] },
    { id: 'sup-3', sectionKey: 'superstructure', name: 'Columns Formwork', description: 'Marine board film-faced shuttering to 4 sides of rectangular columns', unit: 'm2', checked: true, wastePercent: 5, sides: 4, length: 0.225, width: 0, height: 3.1, qty: 64, deductions: [], isCalculated: false, calculatedQty: 44.64, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 85000, totalCost: 380000, unitRate: 8513, materials: [] },
    { id: 'sup-4', sectionKey: 'superstructure', name: 'Columns Concrete (Waste 3%)', description: 'Grade 25 vibrated reinforced in-situ concrete in 225x225mm columns', unit: 'm3', checked: true, wastePercent: 3, length: 0.225, width: 0.225, height: 3.1, qty: 16, deductions: [], isCalculated: false, calculatedQty: 2.51, cementBags: 17, sandTipper: 0.21, graniteTipper: 0.41, rebarKg: 0, labourCost: 35000, totalCost: 225000, unitRate: 89641, materials: [] },
    { id: 'sup-5', sectionKey: 'superstructure', name: 'Beams/Lintel Rebar', description: 'High-yield deformed steel rebar Y16 longitudinal & Y8 links for beams', unit: 'kg', checked: true, wastePercent: 5, rodDiameter: 16, length: 12, width: 0, height: 0, qty: 28, deductions: [], isCalculated: false, calculatedQty: 580, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 580, labourCost: 65000, totalCost: 785000, unitRate: 1353, materials: [] },
    { id: 'sup-6', sectionKey: 'superstructure', name: 'Beams/Lintel Formwork', description: 'Marine board & timber prop supports to 3 sides of floor beams', unit: 'm2', checked: true, wastePercent: 5, sides: 3, length: 70, width: 0, height: 0.45, qty: 2, deductions: [], isCalculated: false, calculatedQty: 63, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 110000, totalCost: 510000, unitRate: 8095, materials: [] },
    { id: 'sup-7', sectionKey: 'superstructure', name: 'Beams/Lintel Concrete (Waste 3%)', description: 'Grade 25 (1:2:4) in-situ vibrated concrete in suspended floor beams', unit: 'm3', checked: true, wastePercent: 3, length: 70, width: 0.225, height: 0.45, qty: 1, deductions: [], isCalculated: false, calculatedQty: 7.09, cementBags: 46, sandTipper: 0.60, graniteTipper: 1.16, rebarKg: 0, labourCost: 78000, totalCost: 615000, unitRate: 86742, materials: [] },
    { id: 'sup-8', sectionKey: 'superstructure', name: 'First Floor Slab Rebar', description: 'Top & bottom mats of high yield steel rebar Y12 in suspended slab', unit: 'kg', checked: true, wastePercent: 5, rodDiameter: 12, length: 12, width: 0, height: 0, qty: 110, deductions: [], isCalculated: false, calculatedQty: 1230, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 1230, labourCost: 140000, totalCost: 1680000, unitRate: 1366, materials: [] },
    { id: 'sup-9', sectionKey: 'superstructure', name: 'First Floor Slab Formwork', description: 'Marine board shuttering with adjustable steel props to slab soffit', unit: 'm2', checked: true, wastePercent: 5, sides: 1, length: 19.5, width: 10.5, height: 0, qty: 1, deductions: [{ id: 'd3', name: 'Stair Void', type: 'void', width: 3.5, height: 2.2, qty: 1 }], isCalculated: false, calculatedQty: 197.05, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 280000, totalCost: 1540000, unitRate: 7815, materials: [] },
    { id: 'sup-10', sectionKey: 'superstructure', name: 'First Floor Slab Concrete', description: '150mm Grade 25 concrete batch mixed, hoisted, placed and vibrated', unit: 'm3', checked: true, wastePercent: 3, length: 19.5, width: 10.5, height: 0.15, qty: 1, deductions: [], isCalculated: false, calculatedQty: 30.71, cementBags: 200, sandTipper: 2.58, graniteTipper: 5.04, rebarKg: 0, labourCost: 270000, totalCost: 2680000, unitRate: 87268, materials: [] },
    { id: 'sup-11', sectionKey: 'superstructure', name: 'Upper Floor Blockwork (Waste 5%)', description: '225mm & 150mm sandcrete partition walls to first floor level', unit: 'm2', checked: true, wastePercent: 5, blockThickness: '225mm', length: 72, width: 0, height: 3.0, qty: 1, deductions: [{ id: 'd4', name: 'Doors', type: 'door', width: 0.9, height: 2.1, qty: 7 }, { id: 'd5', name: 'Windows', type: 'window', width: 1.5, height: 1.2, qty: 8 }], isCalculated: false, calculatedQty: 188.4, cementBags: 34, sandTipper: 1.22, graniteTipper: 0, rebarKg: 0, labourCost: 395000, totalCost: 2190000, unitRate: 11624, materials: [] },
    // Newly Added Superstructure Trade Omissions:
    { id: 'sup-12', sectionKey: 'superstructure', name: 'Concrete Fascia / Parapet Eaves (Cast in-situ)', description: 'Reinforced Grade 25 concrete fascia cantilever eaves profile around roof perimeter', unit: 'm', checked: true, wastePercent: 3, length: 74, width: 0.45, height: 0.45, qty: 1, deductions: [], isCalculated: false, calculatedQty: 74, cementBags: 96, sandTipper: 1.2, graniteTipper: 2.4, rebarKg: 280, labourCost: 320000, totalCost: 1369000, unitRate: 18500, materials: [] },
    { id: 'sup-13', sectionKey: 'superstructure', name: 'Hoop Iron / Brickforce Reinforcement', description: 'Galvanized hoop iron or welded wire bed joint reinforcement every 2 courses in blockwork', unit: 'm', checked: true, wastePercent: 5, length: 75, width: 0, height: 0, qty: 4, deductions: [], isCalculated: false, calculatedQty: 300, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 35000, totalCost: 141750, unitRate: 472, materials: [] },
    { id: 'sup-14', sectionKey: 'superstructure', name: 'Parapet Wall Blockwork & Coping', description: '225mm parapet wall around roof perimeter with precast weather-throated concrete coping', unit: 'm2', checked: true, wastePercent: 5, blockThickness: '225mm', length: 74, width: 0, height: 0.9, qty: 1, deductions: [], isCalculated: false, calculatedQty: 66.6, cementBags: 12, sandTipper: 0.45, graniteTipper: 0, rebarKg: 0, labourCost: 145000, totalCost: 825000, unitRate: 12387, materials: [] },
    { id: 'sup-15', sectionKey: 'superstructure', name: 'Cantilever / Balcony Slabs & Porch Canopies', description: '150mm Grade 25 reinforced concrete cantilever slab over entrance porch & upper sit-outs', unit: 'm3', checked: true, wastePercent: 3, length: 6, width: 1.8, height: 0.15, qty: 1, deductions: [], isCalculated: false, calculatedQty: 1.62, cementBags: 11, sandTipper: 0.14, graniteTipper: 0.27, rebarKg: 65, labourCost: 25000, totalCost: 143370, unitRate: 88500, materials: [] },
    { id: 'sup-16', sectionKey: 'superstructure', name: 'Precast / Cast-in-situ Window & Door Lintels', description: '225x225mm isolated reinforced concrete lintels over all wall openings', unit: 'm', checked: true, wastePercent: 3, length: 32, width: 0.225, height: 0.225, qty: 1, deductions: [], isCalculated: false, calculatedQty: 32, cementBags: 11, sandTipper: 0.14, graniteTipper: 0.27, rebarKg: 75, labourCost: 45000, totalCost: 272000, unitRate: 8500, materials: [] },
    { id: 'sup-17', sectionKey: 'superstructure', name: 'Balcony Guardrails / Upstand Drop Beams', description: 'Wrought iron / stainless steel safety railings to upper floor balcony and open sit-outs', unit: 'm', checked: true, wastePercent: 2, length: 14, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 14, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 65000, totalCost: 392000, unitRate: 28000, materials: [] },

    // -------------------------------------------------------------------------
    // 3. ROOFING (13 comprehensive items)
    // -------------------------------------------------------------------------
    { id: 'roof-1', sectionKey: 'roofing', name: 'Roof Timber Carcass - Wood Type selector [Alaska/Hardwood]', description: 'Hardwood sawn timber trusses, tie beams, rafters, struts and purlins', unit: 'm2', checked: true, wastePercent: 5, woodType: 'Hardwood', length: 22, width: 13, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 286, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 320000, totalCost: 2150000, unitRate: 7517, materials: [] },
    { id: 'roof-2', sectionKey: 'roofing', name: 'Roof Covering Sheets - Type selector [0.45mm Aluzinc, 0.55mm Longspan, Metcoppo, Stone Coated]', description: '0.55mm aluminium longspan profile roof covering fixed on timber purlins', unit: 'm2', checked: true, wastePercent: 5, sheetType: '0.55mm Longspan', length: 22, width: 13, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 330.2, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 220000, totalCost: 3280000, unitRate: 9933, materials: [] },
    { id: 'roof-3', sectionKey: 'roofing', name: 'Ridge Cap', description: '0.55mm aluminium flanged ridge and hip capping matching roof profile', unit: 'm', checked: true, wastePercent: 5, length: 32, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 32, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 35000, totalCost: 145000, unitRate: 4531, materials: [] },
    { id: 'roof-4', sectionKey: 'roofing', name: 'Fascia Board', description: '25mm x 300mm pre-primed timber or PVC composite eaves fascia board', unit: 'm', checked: true, wastePercent: 5, length: 70, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 70, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 65000, totalCost: 295000, unitRate: 4214, materials: [] },
    { id: 'roof-5', sectionKey: 'roofing', name: 'Rain Gutter', description: 'PVC/Aluminium concealed box gutter with downpipes and brackets', unit: 'm', checked: true, wastePercent: 5, length: 45, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 45, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 45000, totalCost: 225000, unitRate: 5000, materials: [] },
    { id: 'roof-6', sectionKey: 'roofing', name: 'Roof Nails & Accessories', description: 'Neoprene washers, galvanized roofing drive screws, clips and flashing', unit: 'kg', checked: true, wastePercent: 5, length: 35, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 35, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 15000, totalCost: 95000, unitRate: 2714, materials: [] },
    // Newly Added Roofing Trade Omissions:
    { id: 'roof-7', sectionKey: 'roofing', name: 'Ceiling Framing (Timber Noggins / Brandering)', description: '50x50mm timber ceiling noggins/hangers fixed at 600x600mm centers to rafters for ceiling board', unit: 'm2', checked: true, wastePercent: 5, length: 20, width: 11, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 220, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 160000, totalCost: 739200, unitRate: 3360, materials: [] },
    { id: 'roof-8', sectionKey: 'roofing', name: 'Anti-Termite Treatment to Roof Timber', description: 'Chemical wood preservative (Solignum/creosote) brush treatment to all roof structural timber', unit: 'm2', checked: true, wastePercent: 5, length: 22, width: 13, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 286, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 45000, totalCost: 255255, unitRate: 892, materials: [] },
    { id: 'roof-9', sectionKey: 'roofing', name: 'Aluminium Radiant Foil / Heat Insulation (Sisalkraft)', description: 'Double-sided reflective aluminium radiant heat insulation foil barrier laid under roof sheets', unit: 'm2', checked: true, wastePercent: 5, length: 22, width: 13, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 286, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 65000, totalCost: 495500, unitRate: 1732, materials: [] },
    { id: 'roof-10', sectionKey: 'roofing', name: 'Valley Gutters', description: '0.55mm aluminium flanged valley gutters where intersecting roof pitches meet', unit: 'm', checked: true, wastePercent: 5, length: 18, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 18, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 25000, totalCost: 122850, unitRate: 6825, materials: [] },
    { id: 'roof-11', sectionKey: 'roofing', name: 'Wall Flashing / Apron Flashing', description: '0.55mm aluminium flashing with bitumen sealant where roof sheets abut parapet walls', unit: 'm', checked: true, wastePercent: 5, length: 24, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 24, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 28000, totalCost: 120960, unitRate: 5040, materials: [] },
    { id: 'roof-12', sectionKey: 'roofing', name: 'Rainwater Downpipes with Shoes & Swan Necks', description: '100mm heavy-duty PVC/aluminium vertical rainwater downpipes with brackets and shoe outlets', unit: 'm', checked: true, wastePercent: 5, length: 36, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 36, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 35000, totalCost: 143640, unitRate: 3990, materials: [] },
    { id: 'roof-13', sectionKey: 'roofing', name: 'Eaves Soffit Lining (Vented PVC / Fiber-Cement)', description: 'Perforated vented PVC/cement-board eaves soffit cladding to underside of roof overhangs', unit: 'm2', checked: true, wastePercent: 5, length: 70, width: 0.6, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 42, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 45000, totalCost: 198450, unitRate: 4725, materials: [] },

    // -------------------------------------------------------------------------
    // 4. STAIRCASE (11 comprehensive items)
    // -------------------------------------------------------------------------
    { id: 'stair-1', sectionKey: 'staircase', name: 'Staircase Waist Concrete', description: 'Grade 25 in-situ reinforced concrete in 150mm sloping staircase waist slab', unit: 'm3', checked: true, wastePercent: 3, length: 4.8, width: 1.1, height: 0.15, qty: 2, deductions: [], isCalculated: false, calculatedQty: 1.58, cementBags: 11, sandTipper: 0.13, graniteTipper: 0.26, rebarKg: 0, labourCost: 35000, totalCost: 145000, unitRate: 91772, materials: [] },
    { id: 'stair-2', sectionKey: 'staircase', name: 'Staircase Landing Concrete', description: 'Grade 25 reinforced concrete in intermediate staircase landing slab', unit: 'm3', checked: true, wastePercent: 3, length: 2.3, width: 1.2, height: 0.15, qty: 1, deductions: [], isCalculated: false, calculatedQty: 0.41, cementBags: 3, sandTipper: 0.03, graniteTipper: 0.07, rebarKg: 0, labourCost: 15000, totalCost: 45000, unitRate: 109756, materials: [] },
    { id: 'stair-3', sectionKey: 'staircase', name: 'Staircase Rebar', description: 'High yield deformed steel rebar Y12 in waist, steps and landing', unit: 'kg', checked: true, wastePercent: 5, rodDiameter: 12, length: 5.5, width: 0, height: 0, qty: 32, deductions: [], isCalculated: false, calculatedQty: 165, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 165, labourCost: 25000, totalCost: 228000, unitRate: 1381, materials: [] },
    { id: 'stair-4', sectionKey: 'staircase', name: 'Staircase Formwork', description: 'Raking soffit formwork, riser boards and stringers for dog-leg stairs', unit: 'm2', checked: true, wastePercent: 5, sides: 2, length: 5.2, width: 1.1, height: 0, qty: 2, deductions: [], isCalculated: false, calculatedQty: 11.44, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 45000, totalCost: 125000, unitRate: 10926, materials: [] },
    { id: 'stair-5', sectionKey: 'staircase', name: 'Staircase Finishes (Tiling)', description: 'Vitrified granite non-slip step tiles with nosing and risers', unit: 'm2', checked: true, wastePercent: 7, length: 1.1, width: 0.3, height: 0, qty: 36, deductions: [], isCalculated: false, calculatedQty: 12.8, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 48000, totalCost: 195000, unitRate: 15234, materials: [] },
    { id: 'stair-6', sectionKey: 'staircase', name: 'Handrail/Balustrade', description: 'Wrought iron or stainless steel balustrade with top rail to staircase', unit: 'm', checked: true, wastePercent: 2, length: 11, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 11, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 55000, totalCost: 385000, unitRate: 35000, materials: [] },
    // Newly Added Staircase Trade Omissions:
    { id: 'stair-7', sectionKey: 'staircase', name: 'Triangular Steps Concrete (Treads & Risers)', description: 'Grade 25 vibrated concrete forming triangular steps on top of waist slab', unit: 'm3', checked: true, wastePercent: 3, length: 1.1, width: 0.3, height: 0.15, qty: 22, deductions: [], isCalculated: false, calculatedQty: 0.54, cementBags: 4, sandTipper: 0.05, graniteTipper: 0.09, rebarKg: 0, labourCost: 25000, totalCost: 104500, unitRate: 193518, materials: [] },
    { id: 'stair-8', sectionKey: 'staircase', name: 'Staircase Intermediate Landing Beam', description: 'Grade 25 reinforced concrete intermediate floor beam supporting half-landing slab', unit: 'm3', checked: true, wastePercent: 3, length: 2.4, width: 0.225, height: 0.45, qty: 1, deductions: [], isCalculated: false, calculatedQty: 0.24, cementBags: 2, sandTipper: 0.03, graniteTipper: 0.05, rebarKg: 45, labourCost: 35000, totalCost: 213840, unitRate: 891000, materials: [] },
    { id: 'stair-9', sectionKey: 'staircase', name: 'Staircase Soffit Plastering', description: '15mm cement-sand smooth plaster to sloping underside raking soffit of staircase and landing', unit: 'm2', checked: true, wastePercent: 5, length: 5.5, width: 1.1, height: 0, qty: 2, deductions: [], isCalculated: false, calculatedQty: 12.1, cementBags: 3, sandTipper: 0.05, graniteTipper: 0, rebarKg: 0, labourCost: 15000, totalCost: 40656, unitRate: 3360, materials: [] },
    { id: 'stair-10', sectionKey: 'staircase', name: 'Anti-Slip Nosing Strips / Edging', description: 'Heavy-duty ribbed aluminium or brass stair tread nosing strips with non-slip inserts', unit: 'm', checked: true, wastePercent: 2, length: 1.1, width: 0, height: 0, qty: 22, deductions: [], isCalculated: false, calculatedQty: 24.2, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 20000, totalCost: 86240, unitRate: 3563, materials: [] },
    { id: 'stair-11', sectionKey: 'staircase', name: 'Raking Skirting Along Wall', description: '100mm vitrified granite or painted timber raking skirting along staircase wall stringer', unit: 'm', checked: true, wastePercent: 5, length: 14, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 14, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 12000, totalCost: 41160, unitRate: 2940, materials: [] },

    // -------------------------------------------------------------------------
    // 5. FINISHING (20 comprehensive items)
    // -------------------------------------------------------------------------
    { id: 'fin-1', sectionKey: 'finishing', name: 'Doors Supply & Installation', description: 'Solid core hardwood flush & security entrance doors with hardware', unit: 'nos', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 12, deductions: [], isCalculated: false, calculatedQty: 12, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 96000, totalCost: 1250000, unitRate: 104166, materials: [] },
    { id: 'fin-2', sectionKey: 'finishing', name: 'Windows', description: 'Powder-coated aluminium sliding glazed windows with bronze tint & nets', unit: 'nos', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 16, deductions: [], isCalculated: false, calculatedQty: 16, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 80000, totalCost: 1120000, unitRate: 70000, materials: [] },
    { id: 'fin-3', sectionKey: 'finishing', name: 'Internal Plastering', description: '15mm cement-sand render (1:4) to all internal wall surfaces with steel trowel', unit: 'm2', checked: true, wastePercent: 5, length: 180, width: 0, height: 3.0, qty: 1, deductions: [{ id: 'd6', name: 'Openings', type: 'void', width: 1.5, height: 1.5, qty: 14 }], isCalculated: false, calculatedQty: 508.5, cementBags: 134, sandTipper: 2.44, graniteTipper: 0, rebarKg: 0, labourCost: 406000, totalCost: 1980000, unitRate: 3893, materials: [] },
    { id: 'fin-4', sectionKey: 'finishing', name: 'External Rendering', description: '20mm water-repellent cement render with roughcast texture to external walls', unit: 'm2', checked: true, wastePercent: 5, length: 90, width: 0, height: 6.5, qty: 1, deductions: [{ id: 'd7', name: 'Openings', type: 'void', width: 1.5, height: 1.5, qty: 12 }], isCalculated: false, calculatedQty: 558, cementBags: 146, sandTipper: 2.67, graniteTipper: 0, rebarKg: 0, labourCost: 446000, totalCost: 2280000, unitRate: 4086, materials: [] },
    { id: 'fin-5', sectionKey: 'finishing', name: 'Floor Screeding 50mm', description: '50mm thick cement-sand screed (1:3) prepared for tiling/finishes', unit: 'm2', checked: true, wastePercent: 5, length: 19, width: 10, height: 0.05, qty: 2, deductions: [], isCalculated: false, calculatedQty: 380, cementBags: 24, sandTipper: 0.88, graniteTipper: 0, rebarKg: 0, labourCost: 304000, totalCost: 1540000, unitRate: 4052, materials: [] },
    { id: 'fin-6', sectionKey: 'finishing', name: 'Wall Tiling', description: '300x600mm glazed ceramic wall tiles in kitchen & bathrooms up to ceiling', unit: 'm2', checked: true, wastePercent: 7, length: 45, width: 0, height: 2.8, qty: 1, deductions: [{ id: 'd8', name: 'Door', type: 'door', width: 0.9, height: 2.1, qty: 4 }], isCalculated: false, calculatedQty: 118.44, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 190000, totalCost: 1250000, unitRate: 10553, materials: [] },
    { id: 'fin-7', sectionKey: 'finishing', name: 'Floor Tiling (Waste 7%)', description: '600x600mm vitrified porcelain floor tiles bedded on polymer tile adhesive', unit: 'm2', checked: true, wastePercent: 7, length: 18.5, width: 10, height: 0, qty: 2, deductions: [], isCalculated: false, calculatedQty: 370, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 666000, totalCost: 4625000, unitRate: 12500, materials: [] },
    { id: 'fin-8', sectionKey: 'finishing', name: 'POP Ceiling & Cornice', description: 'Suspended Plaster of Paris (POP) board ceiling with perimeter cove cornices', unit: 'm2', checked: true, wastePercent: 5, length: 18.5, width: 10, height: 0, qty: 2, deductions: [], isCalculated: false, calculatedQty: 370, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 480000, totalCost: 2775000, unitRate: 7500, materials: [] },
    { id: 'fin-9', sectionKey: 'finishing', name: 'Painting Emulsion 3 coats', description: 'Premium washable acrylic emulsion paint in 3 coats on plastered walls & ceiling', unit: 'm2', checked: true, wastePercent: 5, length: 180, width: 0, height: 3.0, qty: 2, deductions: [], isCalculated: false, calculatedQty: 1080, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 432000, totalCost: 1944000, unitRate: 1800, materials: [] },
    { id: 'fin-10', sectionKey: 'finishing', name: 'Painting Gloss/Textcoat', description: 'Weatherproof textcoat exterior wall coating and oil gloss on metal & timber', unit: 'm2', checked: true, wastePercent: 5, length: 90, width: 0, height: 6.5, qty: 1, deductions: [], isCalculated: false, calculatedQty: 585, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 292000, totalCost: 1462000, unitRate: 2499, materials: [] },
    { id: 'fin-11', sectionKey: 'finishing', name: 'Kitchen Cabinets', description: 'High gloss acrylic finish MDF base and wall kitchen cabinet units with granite top', unit: 'm', checked: true, wastePercent: 0, length: 12, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 12, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 150000, totalCost: 1450000, unitRate: 120833, materials: [] },
    { id: 'fin-12', sectionKey: 'finishing', name: 'Wardrobes', description: 'Floor to ceiling fitted bedroom wardrobes with sliding doors and dividers', unit: 'm2', checked: true, wastePercent: 0, length: 14, width: 0, height: 2.8, qty: 1, deductions: [], isCalculated: false, calculatedQty: 39.2, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 160000, totalCost: 1568000, unitRate: 40000, materials: [] },
    // Newly Added Finishing Trade Omissions:
    { id: 'fin-13', sectionKey: 'finishing', name: 'POP Screeding / Wall Putty (Undercoat before painting)', description: 'Two coats acrylic/white cement fine wall putty screeding to plastered walls before paint', unit: 'm2', checked: true, wastePercent: 5, length: 180, width: 0, height: 3.0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 540, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 270000, totalCost: 822150, unitRate: 1522, materials: [] },
    { id: 'fin-14', sectionKey: 'finishing', name: 'Floor & Wall Skirting', description: '75mm-100mm vitrified porcelain tile or hardwood skirting to all room perimeters', unit: 'm', checked: true, wastePercent: 7, length: 160, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 160, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 110000, totalCost: 376640, unitRate: 2354, materials: [] },
    { id: 'fin-15', sectionKey: 'finishing', name: 'Window Burglar-Proofing Grilles', description: 'Heavy-duty welded wrought iron security grilles fixed behind glazed windows', unit: 'nos', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 16, deductions: [], isCalculated: false, calculatedQty: 16, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 80000, totalCost: 512000, unitRate: 32000, materials: [] },
    { id: 'fin-16', sectionKey: 'finishing', name: 'Window Sills & Reveals Finishing', description: 'Precast terrazzo, polished granite, or cement-rendered weather-sloped external window sills', unit: 'm', checked: true, wastePercent: 5, length: 32, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 32, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 45000, totalCost: 151200, unitRate: 4725, materials: [] },
    { id: 'fin-17', sectionKey: 'finishing', name: 'Ironmongery / Hardware & Locks', description: '3-lever/cylinder mortise locks, stainless-steel ball bearing hinges, door stoppers & flush bolts', unit: 'nos', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 12, deductions: [], isCalculated: false, calculatedQty: 12, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 36000, totalCost: 222000, unitRate: 18500, materials: [] },
    { id: 'fin-18', sectionKey: 'finishing', name: 'Sanitary Ware & Bathroom Accessories', description: 'Complete bathroom suites: dual-flush WC, vanity basin, mirrors, towel rails, and floor drains', unit: 'nos', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 5, deductions: [], isCalculated: false, calculatedQty: 5, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 125000, totalCost: 1425000, unitRate: 285000, materials: [] },
    { id: 'fin-19', sectionKey: 'finishing', name: 'Suspended Moisture-Resistant PVC Ceiling', description: 'Tongue-and-groove moisture-resistant PVC ceiling panels in bathrooms, kitchen, and laundry', unit: 'm2', checked: true, wastePercent: 5, length: 8, width: 4, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 32, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 38000, totalCost: 161280, unitRate: 5040, materials: [] },
    { id: 'fin-20', sectionKey: 'finishing', name: 'Shower Cubicles / Glass Partitions', description: '10mm frameless tempered safety glass shower enclosures with stainless steel tracks and handles', unit: 'nos', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 4, deductions: [], isCalculated: false, calculatedQty: 4, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 60000, totalCost: 580000, unitRate: 145000, materials: [] },

    // -------------------------------------------------------------------------
    // 6. EXTERNAL WORKS (17 comprehensive items)
    // -------------------------------------------------------------------------
    { id: 'ext-1', sectionKey: 'external_works', name: 'Fence Blockwork & Capping', description: '225mm perimeter sandcrete block fence 2.4m high with reinforced coping', unit: 'm2', checked: true, wastePercent: 5, blockThickness: '225mm', length: 110, width: 0, height: 2.4, qty: 1, deductions: [], isCalculated: false, calculatedQty: 264, cementBags: 46, sandTipper: 1.66, graniteTipper: 0, rebarKg: 0, labourCost: 554000, totalCost: 2850000, unitRate: 10795, materials: [] },
    { id: 'ext-2', sectionKey: 'external_works', name: 'Gate', description: 'Ornamental steel double sliding vehicle gate (4.5m) and pedestrian swing gate', unit: 'nos', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 2, deductions: [], isCalculated: false, calculatedQty: 2, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 80000, totalCost: 950000, unitRate: 475000, materials: [] },
    { id: 'ext-3', sectionKey: 'external_works', name: 'Septic Tank', description: 'Reinforced concrete & blockwork septic tank chamber (3.6m x 1.8m x 2.1m deep)', unit: 'nos', checked: true, wastePercent: 3, length: 3.6, width: 1.8, height: 2.1, qty: 1, deductions: [], isCalculated: false, calculatedQty: 1, cementBags: 38, sandTipper: 0.65, graniteTipper: 1.10, rebarKg: 120, labourCost: 120000, totalCost: 850000, unitRate: 850000, materials: [] },
    { id: 'ext-4', sectionKey: 'external_works', name: 'Soakaway Pit', description: 'Circular dry rubble lined soakaway percolation pit (2.4m dia x 3.6m deep)', unit: 'nos', checked: true, wastePercent: 3, length: 2.4, width: 2.4, height: 3.6, qty: 1, deductions: [], isCalculated: false, calculatedQty: 1, cementBags: 12, sandTipper: 0.25, graniteTipper: 0.80, rebarKg: 45, labourCost: 75000, totalCost: 450000, unitRate: 450000, materials: [] },
    { id: 'ext-5', sectionKey: 'external_works', name: 'External Drainage', description: '450x450mm reinforced concrete surface drain channels with precast slab covers', unit: 'm', checked: true, wastePercent: 3, length: 85, width: 0.45, height: 0.45, qty: 1, deductions: [], isCalculated: false, calculatedQty: 85, cementBags: 42, sandTipper: 0.55, graniteTipper: 1.05, rebarKg: 180, labourCost: 140000, totalCost: 980000, unitRate: 11529, materials: [] },
    { id: 'ext-6', sectionKey: 'external_works', name: 'German Floor', description: 'Compacted laterite filling, hardcore subbase and concrete floor for compound perimeter', unit: 'm2', checked: true, wastePercent: 3, length: 18, width: 12, height: 0.1, qty: 1, deductions: [], isCalculated: false, calculatedQty: 216, cementBags: 94, sandTipper: 1.25, graniteTipper: 2.45, rebarKg: 0, labourCost: 160000, totalCost: 1420000, unitRate: 6574, materials: [] },
    { id: 'ext-7', sectionKey: 'external_works', name: 'Interlocking Stones', description: '60mm heavy duty zig-zag vibrated paving stones on 50mm compacted stone dust bed', unit: 'm2', checked: true, wastePercent: 5, length: 25, width: 12, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 300, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 360000, totalCost: 2340000, unitRate: 7800, materials: [] },
    { id: 'ext-8', sectionKey: 'external_works', name: 'Borehole & Water Tank', description: 'Industrial motorized deep well borehole, submersible pump, overhead steel stanchion & tanks', unit: 'nos', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 1, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 200000, totalCost: 2850000, unitRate: 2850000, materials: [] },
    { id: 'ext-9', sectionKey: 'external_works', name: 'External Electrical/Generator Slab', description: 'Reinforced concrete plinth foundation slab (150mm thick) for power generator unit', unit: 'm3', checked: true, wastePercent: 3, length: 3.5, width: 2.2, height: 0.2, qty: 1, deductions: [], isCalculated: false, calculatedQty: 1.54, cementBags: 10, sandTipper: 0.13, graniteTipper: 0.25, rebarKg: 40, labourCost: 25000, totalCost: 165000, unitRate: 107142, materials: [] },
    // Newly Added External Works Trade Omissions:
    { id: 'ext-10', sectionKey: 'external_works', name: 'Fence Foundation Footing & Reinforced Columns (Pillars)', description: 'Reinforced strip concrete foundation and stiffener columns spaced every 3.0m along perimeter', unit: 'm3', checked: true, wastePercent: 3, length: 110, width: 0.45, height: 0.3, qty: 1, deductions: [], isCalculated: false, calculatedQty: 14.85, cementBags: 96, sandTipper: 1.25, graniteTipper: 2.44, rebarKg: 240, labourCost: 180000, totalCost: 1300500, unitRate: 87575, materials: [] },
    { id: 'ext-11', sectionKey: 'external_works', name: 'Security Razor Wire & Electric Fence', description: 'Concertina razor wire coil and 6-strand energized electric pulse fence atop perimeter fence', unit: 'm', checked: true, wastePercent: 2, length: 110, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 110, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 180000, totalCost: 953700, unitRate: 8670, materials: [] },
    { id: 'ext-12', sectionKey: 'external_works', name: 'Sewage Inspection Chambers / Manholes', description: '450x450mm blockwork inspection manholes with heavy precast concrete/cast iron covers', unit: 'nos', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 6, deductions: [], isCalculated: false, calculatedQty: 6, cementBags: 6, sandTipper: 0.15, graniteTipper: 0, rebarKg: 0, labourCost: 75000, totalCost: 270000, unitRate: 45000, materials: [] },
    { id: 'ext-13', sectionKey: 'external_works', name: 'Precast Concrete Kerbstones (Road/Compound Edging)', description: 'Heavy-duty precast road kerbs bedded on concrete to restrain interlocking paving stones', unit: 'm', checked: true, wastePercent: 5, length: 80, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 80, cementBags: 8, sandTipper: 0.18, graniteTipper: 0, rebarKg: 0, labourCost: 65000, totalCost: 352800, unitRate: 4410, materials: [] },
    { id: 'ext-14', sectionKey: 'external_works', name: 'Security Gatehouse (Civil Works)', description: 'Complete 1-room security cabin with toilet (2.5m x 2.0m) including masonry, roof, door, window, and plumbing', unit: 'nos', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 1, cementBags: 35, sandTipper: 0.8, graniteTipper: 1.2, rebarKg: 110, labourCost: 350000, totalCost: 1850000, unitRate: 1850000, materials: [] },
    { id: 'ext-15', sectionKey: 'external_works', name: 'Water Supply Pipe Reticulation', description: 'Underground PPR/HDPE pressure pipe runs connecting borehole pump, overhead tank, and house manifold', unit: 'm', checked: true, wastePercent: 5, length: 65, width: 0, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 65, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 45000, totalCost: 238875, unitRate: 3675, materials: [] },
    { id: 'ext-16', sectionKey: 'external_works', name: 'Perimeter Lighting / Gate Pillars Lighting', description: 'External wall-top pillar lamps, perimeter solar/electric floodlights, switches, and armored cable', unit: 'nos', checked: true, wastePercent: 0, length: 0, width: 0, height: 0, qty: 14, deductions: [], isCalculated: false, calculatedQty: 14, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 70000, totalCost: 392000, unitRate: 28000, materials: [] },
    { id: 'ext-17', sectionKey: 'external_works', name: 'Landscaping & Greenery', description: 'Topsoil spreading, planting of natural carpet grass, ornamental shrubs, and flower borders', unit: 'm2', checked: true, wastePercent: 5, length: 20, width: 6, height: 0, qty: 1, deductions: [], isCalculated: false, calculatedQty: 120, cementBags: 0, sandTipper: 0, graniteTipper: 0, rebarKg: 0, labourCost: 95000, totalCost: 315000, unitRate: 2625, materials: [] },
  ];
};

export const BtlEstimator: React.FC<BtlEstimatorProps> = ({
  activeProject,
  projects = [],
  onApplyToBoq,
  onApplyBulkToBoq,
  onClose
}) => {
  // Global States
  const [selectedRegion, setSelectedRegion] = useState<BtlRegion>('Lagos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openRollKey, setOpenRollKey] = useState<BtlSectionKey | null>('preliminaries');
  
  // Checklist State
  const [items, setItems] = useState<BtlChecklistItem[]>(createInitialChecklist);

  // Active Calculator inline row state
  const [calcActiveItemId, setCalcActiveItemId] = useState<string | null>(null);

  // Active Edit Modal state
  const [editingItem, setEditingItem] = useState<BtlChecklistItem | null>(null);

  // Manual Item Creation Modal State
  const [manualModalOpen, setManualModalOpen] = useState<boolean>(false);
  const [manualTargetSection, setManualTargetSection] = useState<BtlSectionKey>('preliminaries');
  const [manualForm, setManualForm] = useState({
    name: '',
    description: '',
    unit: 'item',
    qty: 1,
    unitRate: 250000,
    wastePercent: 0,
    labourCost: 50000,
  });

  // Inline editing row item name
  const [inlineEditingItemId, setInlineEditingItemId] = useState<string | null>(null);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Region factor multiplier
  const regMultiplier = useMemo(() => {
    if (selectedRegion === 'PH') return 1.14;
    if (selectedRegion === 'Abuja') return 1.09;
    return 1.00; // Lagos baseline
  }, [selectedRegion]);

  // Market Rate Helpers calibrated from rates_Lagos
  const baseRates = useMemo(() => {
    const factor = regMultiplier;
    return {
      cementBag: Math.round(9800 * factor),
      sandM3: Math.round(4250 * factor),
      graniteM3: Math.round(10333 * factor),
      tipperTrip: Math.round(25000 * factor),
      block225: Math.round(650 * factor),
      block150: Math.round(550 * factor),
      rebarKg: Math.round(490 * factor),
      bindingWireKg: Math.round(1200 * factor),
      tilesM2: Math.round(8500 * factor),
      masonDay: Math.round(8000 * factor),
      carpenterDay: Math.round(7500 * factor),
      steelFixerDay: Math.round(8500 * factor),
      labourerDay: Math.round(4500 * factor),
    };
  }, [regMultiplier]);

  // Market Rates Lookup Helper according to region and formula type
  const getMarketRate = (
    region: BtlRegion,
    fType: BtlFormulaType,
    unit: string,
    title: string,
    thickness?: '150' | '225',
    mix?: 'M20' | 'M25',
    dia?: string
  ): number => {
    const factor = region === 'PH' ? 1.14 : region === 'Abuja' ? 1.09 : 1.00;
    const lower = title.toLowerCase();

    // 1. Concrete (m3)
    if (fType === 'concrete' || unit === 'm3') {
      if (lower.includes('blinding')) return Math.round(72000 * factor);
      if (mix === 'M25' || lower.includes('column') || lower.includes('beam') || lower.includes('slab')) {
        return Math.round(95000 * factor);
      }
      if (lower.includes('excavation') || lower.includes('trench')) return Math.round(5500 * factor);
      if (lower.includes('filling') || lower.includes('hardcore')) return Math.round(8500 * factor);
      return Math.round(90000 * factor);
    }

    // 2. Blockwork (m2)
    if (fType === 'blockwork' || lower.includes('blockwork') || lower.includes('sandcrete')) {
      if (thickness === '150' || lower.includes('150')) return Math.round(5500 * factor);
      return Math.round(6200 * factor); // 225mm default
    }

    // 3. Rebar (kg or m)
    if (fType === 'rebar' || unit === 'kg' || lower.includes('rebar') || lower.includes('reinforcement')) {
      if (unit === 'kg') return Math.round(1350 * factor);
      const d = dia ? parseInt(dia.replace('Y', '')) || 16 : 16;
      const wtPerM = (d * d) / 162;
      return Math.round(wtPerM * 1350 * factor);
    }

    // 4. Formwork (m2)
    if (fType === 'formwork' || lower.includes('formwork') || lower.includes('shuttering')) {
      if (lower.includes('column') || lower.includes('beam')) return Math.round(6500 * factor);
      return Math.round(6000 * factor);
    }

    // 5. Linear (m or lm)
    if (fType === 'linear' || unit === 'm' || unit === 'lm') {
      if (lower.includes('dpc') || lower.includes('damp proof')) return Math.round(2200 * factor);
      if (lower.includes('fascia')) return Math.round(18500 * factor);
      if (lower.includes('coping')) return Math.round(4500 * factor);
      if (lower.includes('iron') || lower.includes('brickforce')) return Math.round(500 * factor);
      if (lower.includes('pipe') || lower.includes('drain')) return Math.round(4200 * factor);
      return Math.round(4500 * factor);
    }

    // 6. Area (m2)
    if (fType === 'area' || unit === 'm2') {
      if (lower.includes('tile') || lower.includes('tiling')) return Math.round(9500 * factor);
      if (lower.includes('plaster') || lower.includes('render')) return Math.round(2900 * factor);
      if (lower.includes('screed')) return Math.round(3200 * factor);
      if (lower.includes('paint')) return Math.round(2500 * factor);
      if (lower.includes('roof') || lower.includes('covering')) return Math.round(8500 * factor);
      if (lower.includes('brc') || lower.includes('mesh')) return Math.round(2400 * factor);
      if (lower.includes('dpm') || lower.includes('waterproof')) return Math.round(1200 * factor);
      return Math.round(4500 * factor);
    }

    // 7. Piece / Count (nos, pc)
    if (unit === 'nos' || unit === 'pc') {
      if (lower.includes('door')) return Math.round(95000 * factor);
      if (lower.includes('window')) return Math.round(65000 * factor);
      if (lower.includes('block')) return Math.round(650 * factor);
      return Math.round(35000 * factor);
    }

    return Math.round(5000 * factor);
  };

  // ---------------------------------------------------------------------------
  // 2-TAB MEASUREMENT MODAL STATES (Tab 2 Measurement default open)
  // ---------------------------------------------------------------------------
  const [measurementModalOpen, setMeasurementModalOpen] = useState<boolean>(false);
  const [modalActiveTab, setModalActiveTab] = useState<'measurement' | 'details'>('measurement'); // Default open: measurement
  const [modalItem, setModalItem] = useState<BtlChecklistItem | null>(null);

  // Tab 1 Details form states
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalDescription, setModalDescription] = useState<string>('');
  const [modalUnit, setModalUnit] = useState<string>('m2');
  const [modalWaste, setModalWaste] = useState<number>(5);

  // Tab 2 Measurement dynamic inputs based on formula type
  const [activeFormulaType, setActiveFormulaType] = useState<BtlFormulaType>('area');
  const [inputL, setInputL] = useState<number>(10);
  const [inputW, setInputW] = useState<number>(5);
  const [inputH, setInputH] = useState<number>(0.15);
  const [inputQty, setInputQty] = useState<number>(1);
  const [wallThickness, setWallThickness] = useState<'150' | '225'>('225');
  const [concreteMix, setConcreteMix] = useState<'M20' | 'M25'>('M25');
  const [rebarDia, setRebarDia] = useState<string>('Y16');
  const [rebarLapPercent, setRebarLapPercent] = useState<number>(10);
  const [sides, setSides] = useState<number>(2);

  // Deductions repeater state
  const [modalDeductions, setModalDeductions] = useState<BtlDeduction[]>([]);
  // Custom rate override (null means use marketRates benchmark)
  const [customRate, setCustomRate] = useState<number | null>(null);

  // Live calculation of deductions
  const deductionsTotal = useMemo(() => {
    if (modalDeductions.length === 0) return 0;
    if (activeFormulaType === 'linear') {
      return modalDeductions.reduce((sum, d) => sum + ((d.width || 0) * (d.qty || 1)), 0);
    }
    return modalDeductions.reduce((sum, d) => sum + ((d.width || 0) * (d.height || 0) * (d.qty || 1)), 0);
  }, [modalDeductions, activeFormulaType]);

  // Live calculation box computation for Tab 2
  const modalCalculations = useMemo(() => {
    const L = Math.max(0, Number(inputL) || 0);
    const W = Math.max(0, Number(inputW) || 0);
    const H = Math.max(0, Number(inputH) || 0);
    const Q = Math.max(1, Number(inputQty) || 1);
    const waste = Math.max(0, Number(modalWaste) || 0);
    const wasteFactor = 1 + (waste / 100);

    let gross = 0;
    let deductions = 0;
    let net = 0;
    let withWaste = 0;

    let cementBags = 0;
    let sandTippers = 0;
    let graniteTippers = 0;
    let rebarKg = 0;
    let blocks = 0;

    switch (activeFormulaType) {
      case 'area': {
        gross = Number((L * W * Q).toFixed(2));
        deductions = Number(deductionsTotal.toFixed(2));
        net = Number(Math.max(0, gross - deductions).toFixed(2));
        withWaste = Number((net * wasteFactor).toFixed(2));
        break;
      }
      case 'linear': {
        gross = Number((L * Q).toFixed(2));
        deductions = Number(deductionsTotal.toFixed(2));
        net = Number(Math.max(0, gross - deductions).toFixed(2));
        withWaste = Number((net * wasteFactor).toFixed(2));
        break;
      }
      case 'volume': {
        gross = Number((L * W * H * Q).toFixed(2));
        deductions = Number((deductionsTotal * (H > 0 ? H : 1)).toFixed(2));
        net = Number(Math.max(0, gross - deductions).toFixed(2));
        withWaste = Number((net * wasteFactor).toFixed(2));
        // Material breakdown: Cement bags = Volume*6.5, Sand tippers = m3/5, Granite tippers = m3/5
        cementBags = Number((withWaste * 6.5).toFixed(1));
        sandTippers = Number((withWaste / 5).toFixed(2));
        graniteTippers = Number((withWaste / 5).toFixed(2));
        break;
      }
      case 'blockwork': {
        gross = Number((L * H * Q).toFixed(2));
        deductions = Number(deductionsTotal.toFixed(2));
        net = Number(Math.max(0, gross - deductions).toFixed(2));
        withWaste = Number((net * wasteFactor).toFixed(2));
        // User spec: Blocks = Area*10
        blocks = Math.ceil(withWaste * 10);
        cementBags = Math.ceil(blocks / 60);
        sandTippers = Number(((cementBags * 0.18) / 5).toFixed(2));
        break;
      }
      case 'concrete': {
        gross = Number((L * W * H * Q).toFixed(2));
        deductions = Number((deductionsTotal * (H > 0 ? H : 0.15)).toFixed(2));
        net = Number(Math.max(0, gross - deductions).toFixed(2));
        withWaste = Number((net * wasteFactor).toFixed(2));
        // User spec: Cement bags = Volume*6.5, Sand tippers = m3/5, Granite tippers = m3/5
        cementBags = Number((withWaste * (concreteMix === 'M25' ? 7.2 : 6.5)).toFixed(1));
        sandTippers = Number((withWaste / 5).toFixed(2));
        graniteTippers = Number((withWaste / 5).toFixed(2));
        break;
      }
      case 'rebar': {
        const d = parseInt(rebarDia.replace('Y', '')) || 16;
        const wtPerM = (d * d) / 162;
        const grossLength = L * Q * (1 + (rebarLapPercent / 100));
        const grossKg = grossLength * wtPerM;
        const dedLength = deductionsTotal;
        const dedKg = dedLength * wtPerM;
        const netLength = Math.max(0, grossLength - dedLength);
        const netKg = netLength * wtPerM;

        if (modalUnit === 'kg') {
          gross = Number(grossKg.toFixed(1));
          deductions = Number(dedKg.toFixed(1));
          net = Number(netKg.toFixed(1));
          withWaste = Number((net * wasteFactor).toFixed(1));
        } else {
          gross = Number(grossLength.toFixed(1));
          deductions = Number(dedLength.toFixed(1));
          net = Number(netLength.toFixed(1));
          withWaste = Number((net * wasteFactor).toFixed(1));
        }
        // User spec: Rebar kg = formula
        rebarKg = Number((netKg * wasteFactor).toFixed(1));
        break;
      }
      case 'formwork': {
        const s = Math.max(1, Number(sides) || 2);
        gross = Number((L * H * s * Q).toFixed(2));
        deductions = Number(deductionsTotal.toFixed(2));
        net = Number(Math.max(0, gross - deductions).toFixed(2));
        withWaste = Number((net * wasteFactor).toFixed(2));
        break;
      }
    }

    const defaultRate = getMarketRate(
      selectedRegion,
      activeFormulaType,
      modalUnit,
      modalTitle,
      wallThickness,
      concreteMix,
      rebarDia
    );
    const activeRate = customRate !== null ? customRate : defaultRate;
    const amount = Math.round(withWaste * activeRate);

    return {
      gross,
      deductions,
      net,
      withWaste,
      cementBags,
      sandTippers,
      graniteTippers,
      rebarKg,
      blocks,
      defaultRate,
      activeRate,
      amount
    };
  }, [
    activeFormulaType,
    inputL,
    inputW,
    inputH,
    inputQty,
    modalWaste,
    deductionsTotal,
    wallThickness,
    concreteMix,
    rebarDia,
    rebarLapPercent,
    sides,
    modalUnit,
    modalTitle,
    selectedRegion,
    customRate
  ]);

  // Open 2-Tab Measurement Modal for any item
  const handleOpenMeasurementModal = (item: BtlChecklistItem) => {
    setModalItem(item);
    setModalActiveTab('measurement'); // Default Tab 2 open
    setModalTitle(item.title || item.name || '');
    setModalDescription(item.description || '');
    setModalUnit(item.unit || 'm2');
    setModalWaste(item.waste !== undefined ? item.waste : (item.wastePercent !== undefined ? item.wastePercent : 5));
    setModalDeductions(item.deductions && item.deductions.length > 0 ? JSON.parse(JSON.stringify(item.deductions)) : []);

    // Determine initial formula type
    let fType: BtlFormulaType = item.formulaType || 'area';
    if (!item.formulaType) {
      const lower = item.name.toLowerCase();
      if (item.unit === 'm3' || lower.includes('concrete') || lower.includes('blinding') || lower.includes('waist')) {
        fType = lower.includes('excavation') || lower.includes('filling') || lower.includes('hardcore') ? 'volume' : 'concrete';
      } else if (lower.includes('blockwork') || lower.includes('sandcrete')) {
        fType = 'blockwork';
      } else if (item.unit === 'kg' || lower.includes('rebar') || lower.includes('reinforcement')) {
        fType = 'rebar';
      } else if (lower.includes('formwork') || lower.includes('shuttering')) {
        fType = 'formwork';
      } else if (item.unit === 'm' || item.unit === 'lm') {
        fType = 'linear';
      } else if (item.unit === 'm2') {
        fType = 'area';
      }
    }
    setActiveFormulaType(fType);

    const initialL = item.inputs?.length ?? (item.length > 0 ? item.length : 10);
    const initialW = item.inputs?.width ?? (item.width > 0 ? item.width : (fType === 'linear' ? 0 : 5));
    const initialH = item.inputs?.height ?? (item.height > 0 ? item.height : (fType === 'blockwork' ? 3.0 : fType === 'concrete' ? 0.15 : 0));
    const initialQty = item.inputs?.qty ?? (item.qty > 0 ? item.qty : 1);

    setInputL(initialL);
    setInputW(initialW);
    setInputH(initialH);
    setInputQty(initialQty);
    setWallThickness(item.inputs?.wallThickness ?? (item.blockThickness === '150mm' ? '150' : '225'));
    setConcreteMix(item.inputs?.concreteMix ?? 'M25');
    setRebarDia(item.inputs?.rebarDia ?? (item.rodDiameter ? `Y${item.rodDiameter}` : 'Y16'));
    setRebarLapPercent(item.inputs?.rebarLapPercent ?? 10);
    setSides(item.inputs?.sides ?? (item.sides || 2));

    setCustomRate(item.rate ?? (item.unitRate > 0 ? item.unitRate : null));
    setMeasurementModalOpen(true);
  };

  // Unit dropdown change in Tab 1 Details
  const handleUnitChange = (newUnit: string) => {
    setModalUnit(newUnit);
    if (newUnit === 'm2') {
      if (!['area', 'blockwork', 'formwork'].includes(activeFormulaType)) {
        setActiveFormulaType('area');
      }
    } else if (newUnit === 'm3') {
      if (!['volume', 'concrete'].includes(activeFormulaType)) {
        setActiveFormulaType('concrete');
      }
    } else if (newUnit === 'kg') {
      setActiveFormulaType('rebar');
    } else if (newUnit === 'm' || newUnit === 'lm') {
      setActiveFormulaType('linear');
    }
    setCustomRate(null);
  };

  // Formula pill change in Tab 2 Measurement
  const handleFormulaPillChange = (pill: BtlFormulaType) => {
    setActiveFormulaType(pill);
    if (pill === 'area' || pill === 'blockwork' || pill === 'formwork') {
      setModalUnit('m2');
    } else if (pill === 'concrete' || pill === 'volume') {
      setModalUnit('m3');
    } else if (pill === 'rebar') {
      setModalUnit('kg');
    } else if (pill === 'linear') {
      setModalUnit('m');
    }
    setCustomRate(null);
  };

  // Save measurement modal: Update checklist item with required fields
  const handleSaveMeasurement = () => {
    if (!modalItem) return;

    const title = modalTitle.trim() || modalItem.name;
    const description = modalDescription.trim() || modalItem.description;
    const unit = modalUnit;
    const waste = Number(modalWaste) || 0;
    const formulaType = activeFormulaType;

    const inputs: BtlMeasurementInputs = {
      length: Number(inputL) || 0,
      width: Number(inputW) || 0,
      height: Number(inputH) || 0,
      qty: Number(inputQty) || 1,
      wallThickness,
      concreteMix,
      rebarDia,
      rebarLapPercent: Number(rebarLapPercent) || 0,
      sides: Number(sides) || 2,
    };

    const deductions = [...modalDeductions];
    const netQty = modalCalculations.net;
    const grossQty = modalCalculations.gross;
    const withWasteQty = modalCalculations.withWaste;
    const rate = modalCalculations.activeRate;
    const amount = modalCalculations.amount;

    const materials = {
      cementBags: modalCalculations.cementBags,
      sandTippers: modalCalculations.sandTippers,
      graniteTippers: modalCalculations.graniteTippers,
      rebarKg: modalCalculations.rebarKg,
      blocks: modalCalculations.blocks,
    };

    const updatedItem: BtlChecklistItem = {
      ...modalItem,
      title,
      name: title,
      description,
      unit,
      waste,
      wastePercent: waste,
      formulaType,
      inputs,
      deductions,
      netQty,
      grossQty,
      materials,
      materialBreakdown: materials,
      rate,
      unitRate: rate,
      amount,
      totalCost: amount,

      // Mark calculated & checked
      checked: true,
      isCalculated: true,
      calculatedQty: withWasteQty,

      // Quick numbers
      cementBags: modalCalculations.cementBags,
      sandTipper: modalCalculations.sandTippers,
      graniteTipper: modalCalculations.graniteTippers,
      rebarKg: modalCalculations.rebarKg,

      // Synchronize dimensions
      length: inputs.length,
      width: inputs.width || 0,
      height: inputs.height || 0,
      qty: inputs.qty,
      sides: inputs.sides,
      rodDiameter: rebarDia ? parseInt(rebarDia.replace('Y', '')) : modalItem.rodDiameter,
      blockThickness: wallThickness ? `${wallThickness}mm` : modalItem.blockThickness,
    };

    setItems(prev => {
      const exists = prev.some(it => it.id === modalItem.id);
      if (exists) {
        return prev.map(it => it.id === modalItem.id ? updatedItem : it);
      }
      return [...prev, updatedItem];
    });

    setMeasurementModalOpen(false);
    setModalItem(null);
    showToast(`"${title}" measured & calculated: ${formatNumber(withWasteQty)} ${unit} (${formatNaira(amount)})`);
  };

  // ---------------------------------------------------------------------------
  // DETERMINISTIC CALCULATION ENGINE
  // ---------------------------------------------------------------------------
  const calculateRowItem = (item: BtlChecklistItem): BtlChecklistItem => {
    const wasteFactor = 1 + ((item.wastePercent || 0) / 100);
    const deductionsArea = (item.deductions || []).reduce(
      (acc, d) => acc + (d.width * d.height * d.qty),
      0
    );

    let calculatedQty = 0;
    let cementBags = 0;
    let sandTipper = 0;
    let graniteTipper = 0;
    let rebarKg = 0;
    let labourCost = 0;
    let totalCost = 0;
    const materials: BtlMaterialRequirement[] = [];

    const lowerName = item.name.toLowerCase();

    // Traceable formulaType calculation handling
    if (item.formulaType) {
      const inputs = item.inputs || { length: item.length, width: item.width, height: item.height, qty: item.qty };
      const L = inputs.length || 0;
      const W = inputs.width || 0;
      const H = inputs.height || 0;
      const Q = inputs.qty || 1;
      
      let gross = 0;
      let dedVal = deductionsArea;
      let net = 0;

      switch (item.formulaType) {
        case 'area':
          gross = L * W * Q;
          net = Math.max(0, gross - dedVal);
          calculatedQty = Number((net * wasteFactor).toFixed(2));
          break;
        case 'linear':
          gross = L * Q;
          dedVal = (item.deductions || []).reduce((acc, d) => acc + (d.width * d.qty), 0);
          net = Math.max(0, gross - dedVal);
          calculatedQty = Number((net * wasteFactor).toFixed(2));
          break;
        case 'volume':
          gross = L * W * H * Q;
          net = Math.max(0, gross - (dedVal * (H || 1)));
          calculatedQty = Number((net * wasteFactor).toFixed(2));
          cementBags = Number((calculatedQty * 6.5).toFixed(1));
          sandTipper = Number((calculatedQty / 5).toFixed(2));
          graniteTipper = Number((calculatedQty / 5).toFixed(2));
          break;
        case 'blockwork':
          gross = L * H * Q;
          net = Math.max(0, gross - dedVal);
          calculatedQty = Number((net * wasteFactor).toFixed(2));
          const blks = Math.ceil(calculatedQty * 10);
          cementBags = Math.ceil(blks / 60);
          sandTipper = Number(((cementBags * 0.18) / 5).toFixed(2));
          break;
        case 'concrete':
          gross = L * W * H * Q;
          net = Math.max(0, gross - (dedVal * (H || 0.15)));
          calculatedQty = Number((net * wasteFactor).toFixed(2));
          cementBags = Number((calculatedQty * (inputs.concreteMix === 'M25' ? 7.2 : 6.5)).toFixed(1));
          sandTipper = Number((calculatedQty / 5).toFixed(2));
          graniteTipper = Number((calculatedQty / 5).toFixed(2));
          break;
        case 'rebar':
          const d = inputs.rebarDia ? parseInt(inputs.rebarDia.replace('Y', '')) : (item.rodDiameter || 16);
          const wtPerM = (d * d) / 162;
          const grossLen = L * Q * (1 + ((inputs.rebarLapPercent || 10) / 100));
          const dedLen = (item.deductions || []).reduce((acc, d) => acc + (d.width * d.qty), 0);
          const netLen = Math.max(0, grossLen - dedLen);
          rebarKg = Number((netLen * wtPerM * wasteFactor).toFixed(1));
          calculatedQty = item.unit === 'kg' ? rebarKg : Number((netLen * wasteFactor).toFixed(1));
          break;
        case 'formwork':
          gross = L * H * (inputs.sides || 2) * Q;
          net = Math.max(0, gross - dedVal);
          calculatedQty = Number((net * wasteFactor).toFixed(2));
          break;
      }

      const activeRate = item.unitRate || item.rate || getMarketRate(
        selectedRegion, 
        item.formulaType, 
        item.unit, 
        item.name, 
        inputs.wallThickness, 
        inputs.concreteMix, 
        inputs.rebarDia
      );
      totalCost = Math.round(calculatedQty * activeRate);
      labourCost = item.labourCost ? Math.round(item.labourCost * regMultiplier) : Math.round(totalCost * 0.25);

      return {
        ...item,
        isCalculated: true,
        grossQty: gross,
        netQty: net,
        calculatedQty,
        cementBags,
        sandTipper,
        graniteTipper,
        rebarKg,
        unitRate: activeRate,
        rate: activeRate,
        totalCost,
        amount: totalCost,
        labourCost,
      };
    }

    // 0. Preliminaries & General Conditions, Lump Sums or Manually Priced Items
    if (item.sectionKey === 'preliminaries' || ['item', 'sum', 'month', 'ls', 'day', 'wk'].includes(item.unit) || item.isManual) {
      if (item.unit === 'm' && item.length > 0) {
        calculatedQty = Number(((item.length || 1) * (item.qty || 1) * wasteFactor).toFixed(1));
      } else {
        calculatedQty = item.qty || 1;
      }

      const unitRate = item.unitRate && item.unitRate > 0 
        ? item.unitRate 
        : (item.totalCost && calculatedQty > 0 ? Math.round(item.totalCost / calculatedQty) : 250000);

      totalCost = Math.round(calculatedQty * unitRate * regMultiplier * (item.unit === 'm' ? 1 : wasteFactor));
      labourCost = item.labourCost ? Math.round(item.labourCost * regMultiplier) : Math.round(totalCost * 0.25);

      return {
        ...item,
        isCalculated: true,
        calculatedQty,
        cementBags: 0,
        sandTipper: 0,
        graniteTipper: 0,
        rebarKg: 0,
        labourCost,
        totalCost,
        unitRate: Math.round(unitRate * regMultiplier),
        materials: []
      };
    }

    // 1. Concrete Elements (Foundation, bases, columns, beams, slabs, staircase waist)
    if (lowerName.includes('concrete') || lowerName.includes('blinding') || lowerName.includes('slab concrete') || lowerName.includes('waist')) {
      const grossVol = (item.length || 0) * (item.width || 0) * (item.height || 0.15) * (item.qty || 1);
      const netVol = Math.max(0, grossVol - (deductionsArea * (item.height || 0.15)));
      calculatedQty = Number(netVol.toFixed(2));

      // Formula: Cement Bags = Volume * 6.5, Sand m3 = Volume * 0.42, Granite m3 = Volume * 0.82, Tipper = m3 / 5
      cementBags = Math.ceil(calculatedQty * 6.5 * wasteFactor);
      const sandM3 = Number((calculatedQty * 0.42 * wasteFactor).toFixed(2));
      const graniteM3 = Number((calculatedQty * 0.82 * wasteFactor).toFixed(2));
      sandTipper = Number((sandM3 / 5).toFixed(2));
      graniteTipper = Number((graniteM3 / 5).toFixed(2));

      const cementCost = cementBags * baseRates.cementBag;
      const sandCost = Math.round(sandM3 * baseRates.sandM3);
      const graniteCost = Math.round(graniteM3 * baseRates.graniteM3);
      labourCost = Math.round(calculatedQty * 8500 * regMultiplier);
      totalCost = cementCost + sandCost + graniteCost + labourCost;

      materials.push(
        { label: 'Dangote 42.5N Cement', quantity: cementBags, unit: 'bags', rate: baseRates.cementBag, cost: cementCost },
        { label: 'Sharp Sand (5m³ Tipper)', quantity: sandTipper, unit: 'tippers', rate: baseRates.tipperTrip, cost: sandCost },
        { label: 'Crushed Granite 3/4" (5m³ Tipper)', quantity: graniteTipper, unit: 'tippers', rate: Math.round(baseRates.tipperTrip * 3.5), cost: graniteCost }
      );
    }
    // 2. Blockwork Elements
    else if (lowerName.includes('blockwork')) {
      const grossArea = (item.length || 0) * (item.height || 3.0) * (item.qty || 1);
      const netArea = Math.max(0, grossArea - deductionsArea);
      calculatedQty = Number(netArea.toFixed(2));

      const is225 = !lowerName.includes('150') && (item.blockThickness !== '150mm');
      const multiplier = is225 ? 10 : 12.5;
      const rawBlocks = calculatedQty * multiplier;
      const totalBlocks = Math.ceil(rawBlocks * wasteFactor);

      cementBags = Math.ceil(totalBlocks / 60); // 60 blocks per bag
      const sandM3 = Number((cementBags * 0.18).toFixed(2));
      sandTipper = Number((sandM3 / 5).toFixed(2));

      const blockUnitPrice = is225 ? baseRates.block225 : baseRates.block150;
      const blocksCost = totalBlocks * blockUnitPrice;
      const cementCost = cementBags * baseRates.cementBag;
      const sandCost = Math.round(sandM3 * baseRates.sandM3);
      labourCost = totalBlocks * Math.round(200 * regMultiplier);
      totalCost = blocksCost + cementCost + sandCost + labourCost;

      materials.push(
        { label: `${is225 ? '225mm' : '150mm'} Sandcrete Blocks`, quantity: totalBlocks, unit: 'pcs', rate: blockUnitPrice, cost: blocksCost },
        { label: 'Cement for 1:6 Mortar', quantity: cementBags, unit: 'bags', rate: baseRates.cementBag, cost: cementCost },
        { label: 'Sharp Sand for Mortar', quantity: sandM3, unit: 'm³', rate: baseRates.sandM3, cost: sandCost }
      );
    }
    // 3. Reinforcement / Rebar Elements
    else if (lowerName.includes('rebar') || lowerName.includes('reinforcement')) {
      const d = item.rodDiameter || (lowerName.includes('column') ? 16 : lowerName.includes('beam') ? 16 : 12);
      const totalLength = ((item.length || 12) * (item.qty || 1)) * wasteFactor;
      // Formula: Weight kg = (D * D / 162) * Total Length
      rebarKg = Number(((d * d / 162) * totalLength).toFixed(1));
      calculatedQty = rebarKg;

      // Binding Wire = Weight * 0.015
      const wireKg = Number((rebarKg * 0.015).toFixed(1));
      const steelCost = Math.round(rebarKg * baseRates.rebarKg);
      const wireCost = Math.round(wireKg * baseRates.bindingWireKg);
      labourCost = Math.round(rebarKg * 85 * regMultiplier);
      totalCost = steelCost + wireCost + labourCost;

      materials.push(
        { label: `High-Yield Ribbed Steel Y${d}`, quantity: rebarKg, unit: 'kg', rate: baseRates.rebarKg, cost: steelCost },
        { label: 'Black Binding Wire', quantity: wireKg, unit: 'kg', rate: baseRates.bindingWireKg, cost: wireCost }
      );
    }
    // 4. Formwork Elements
    else if (lowerName.includes('formwork')) {
      // Formula: Area = L * H * Sides * Qty
      const sides = item.sides || (lowerName.includes('column') ? 4 : lowerName.includes('beam') ? 3 : 2);
      const area = (item.length || 0) * (item.height || 0.45) * sides * (item.qty || 1);
      const netArea = Math.max(0, area - deductionsArea);
      calculatedQty = Number(netArea.toFixed(2));

      const marineBoardSheets = Math.ceil((calculatedQty / 2.9) / 3); // 3x reuse
      const timberM = Number((calculatedQty * 0.8).toFixed(1));
      const boardCost = marineBoardSheets * Math.round(45000 * regMultiplier);
      const timberCost = Math.round(timberM * 800 * regMultiplier);
      labourCost = Math.round(calculatedQty * 2500 * regMultiplier);
      totalCost = boardCost + timberCost + labourCost;

      materials.push(
        { label: '18mm Film-Faced Marine Board (Reusable)', quantity: marineBoardSheets, unit: 'sheets', rate: Math.round(45000 * regMultiplier), cost: boardCost },
        { label: '50x50mm Hardwood Runners', quantity: timberM, unit: 'm', rate: Math.round(800 * regMultiplier), cost: timberCost }
      );
    }
    // 5. Tiling Elements
    else if (lowerName.includes('tiling')) {
      // Formula: Tiles m2 = Net Area * (1 + Waste / 100)
      const grossArea = (item.length || 0) * (item.width || item.height || 1) * (item.qty || 1);
      const netArea = Math.max(0, grossArea - deductionsArea);
      calculatedQty = Number((netArea * wasteFactor).toFixed(2));

      const tileBagsAdhesive = Math.ceil(calculatedQty / 8);
      const tilesCost = Math.round(calculatedQty * baseRates.tilesM2);
      const adhesiveCost = tileBagsAdhesive * Math.round(6000 * regMultiplier);
      labourCost = Math.round(calculatedQty * 2500 * regMultiplier);
      totalCost = tilesCost + adhesiveCost + labourCost;

      materials.push(
        { label: 'Vitrified Glazed Floor/Wall Tiles', quantity: calculatedQty, unit: 'm²', rate: baseRates.tilesM2, cost: tilesCost },
        { label: 'Tile Adhesive 20kg Bags', quantity: tileBagsAdhesive, unit: 'bags', rate: Math.round(6000 * regMultiplier), cost: adhesiveCost }
      );
    }
    // 6. Roofing Timber / Covering
    else if (lowerName.includes('timber carcass')) {
      const area = (item.length || 20) * (item.width || 12) * (item.qty || 1);
      calculatedQty = Number(area.toFixed(2));
      const rate = item.woodType === 'Hardwood' ? 8500 : 6800;
      totalCost = Math.round(calculatedQty * rate * regMultiplier);
      labourCost = Math.round(totalCost * 0.25);
    } else if (lowerName.includes('roof covering')) {
      const area = (item.length || 20) * (item.width || 12) * (item.qty || 1) * 1.15; // pitch slope
      calculatedQty = Number((area * wasteFactor).toFixed(2));
      let sheetRate = 8500;
      if (item.sheetType === '0.55mm Longspan') sheetRate = 10500;
      if (item.sheetType === 'Metcoppo') sheetRate = 11500;
      if (item.sheetType === 'Stone Coated') sheetRate = 14500;
      totalCost = Math.round(calculatedQty * sheetRate * regMultiplier);
      labourCost = Math.round(calculatedQty * 1200 * regMultiplier);
    }
    // 7. General Linear / Area / Volume fallback
    else {
      if (item.unit === 'm3') {
        const vol = (item.length || 1) * (item.width || 1) * (item.height || 1) * (item.qty || 1);
        calculatedQty = Number((vol * wasteFactor).toFixed(2));
        const rate = lowerName.includes('excavation') ? 5500 : 7500;
        totalCost = Math.round(calculatedQty * rate * regMultiplier);
        labourCost = Math.round(totalCost * 0.6);
      } else if (item.unit === 'm2') {
        const gross = (item.length || 1) * (item.height || item.width || 1) * (item.qty || 1);
        calculatedQty = Number((Math.max(0, gross - deductionsArea) * wasteFactor).toFixed(2));
        const rate = lowerName.includes('plaster') ? 3800 : lowerName.includes('screed') ? 4200 : lowerName.includes('paint') ? 2200 : 4500;
        totalCost = Math.round(calculatedQty * rate * regMultiplier);
        labourCost = Math.round(totalCost * 0.4);
      } else if (item.unit === 'm') {
        calculatedQty = Number(((item.length || 1) * (item.qty || 1) * wasteFactor).toFixed(1));
        totalCost = Math.round(calculatedQty * 4500 * regMultiplier);
        labourCost = Math.round(totalCost * 0.3);
      } else {
        calculatedQty = item.qty || 1;
        const rate = lowerName.includes('door') ? 105000 : lowerName.includes('window') ? 70000 : 50000;
        totalCost = Math.round(calculatedQty * rate * regMultiplier);
        labourCost = Math.round(totalCost * 0.15);
      }
    }

    const derivedRate = calculatedQty > 0 ? Math.round(totalCost / calculatedQty) : 0;

    return {
      ...item,
      isCalculated: true,
      calculatedQty,
      cementBags,
      sandTipper,
      graniteTipper,
      rebarKg,
      labourCost,
      totalCost,
      unitRate: derivedRate,
      materials
    };
  };

  // Toggle Checkbox
  const handleToggleCheck = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  // Change Waste % directly from small box
  const handleWasteChange = (id: string, newWaste: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, wastePercent: Math.max(0, newWaste) };
        return item.isCalculated ? calculateRowItem(updated) : updated;
      }
      return item;
    }));
  };

  // Inline Item Name Change
  const handleItemNameChange = (id: string, newName: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, name: newName } : item));
  };

  // Calculate All Ticked in a section
  const handleCalculateAllTicked = (secKey: BtlSectionKey) => {
    setItems(prev => prev.map(item => {
      if (item.sectionKey === secKey && item.checked) {
        return calculateRowItem(item);
      }
      return item;
    }));
    showToast(`Calculated all ticked items in ${secKey.toUpperCase().replace('_', ' ')}!`);
  };

  // Single Item Calculate
  const handleSingleItemCalc = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? calculateRowItem(item) : item));
    showToast('Calculation applied!');
  };

  // Export Section to BOQ
  const handleExportSectionToBoq = async (secKey: BtlSectionKey) => {
    const secItems = items.filter(it => it.sectionKey === secKey && it.checked);
    const secTotal = secItems.reduce((acc, it) => acc + (it.totalCost || 0), 0);
    const secName = BTL_SECTIONS.find(s => s.key === secKey)?.name || secKey;

    if (secItems.length === 0) {
      showToast(`No checked items in ${secName} to export.`);
      return;
    }

    const exportPayload = {
      section: secName,
      exportedAt: new Date().toISOString(),
      region: selectedRegion,
      sectionTotal: secTotal,
      items: secItems.map(it => ({
        id: it.id,
        name: it.name,
        description: it.description,
        qty: it.calculatedQty || it.qty || 1,
        unit: it.unit,
        waste: it.wastePercent,
        materials: it.materials || [],
        labourCost: it.labourCost || 0,
        cost: it.totalCost || 0,
      }))
    };

    // Save to localStorage as requested: localStorage key boq_sections
    try {
      const existing = localStorage.getItem('boq_sections');
      let parsedSections: Record<string, any> = {};
      if (existing) {
        parsedSections = JSON.parse(existing);
      }
      parsedSections[secKey] = exportPayload;
      localStorage.setItem('boq_sections', JSON.stringify(parsedSections));
    } catch (e) {
      console.error('Failed saving to localStorage boq_sections', e);
    }

    // Direct Integration with Project BOQ if available
    if (onApplyBulkToBoq) {
      const boqRows = secItems.map(it => {
        let secTrade = BTL_SECTIONS.find(s => s.key === secKey)?.besmmTrade || 'Superstructure';
        const lower = (it.name || '').toLowerCase();
        if (lower.includes('blockwork') || lower.includes('sandcrete')) {
          secTrade = 'Masonry & Blockwork';
        } else if (secKey === 'preliminaries') {
          secTrade = 'Bill No. 1: Preliminaries & General Conditions';
        } else if (secKey === 'substructure') {
          secTrade = 'Substructure';
        }
        return {
          item: it.name,
          description: it.description,
          qty: it.calculatedQty || it.qty || 1,
          unit: it.unit,
          rate: it.unitRate || Math.round((it.totalCost || 0) / (it.calculatedQty || 1)),
          amount: it.totalCost || 0,
          section: secTrade
        };
      });

      await onApplyBulkToBoq(boqRows, {
        targetProjectId: activeProject?.id,
        createAsNewProject: false
      });
    }

    showToast(`${secName} exported to BOQ (${secItems.length} items)`);
  };

  const handleSelectOnlyBlockwork = () => {
    setItems(prev => prev.map(it => {
      const lower = (it.name || '').toLowerCase();
      const isBw = lower.includes('blockwork') || lower.includes('sandcrete');
      return { ...it, checked: isBw };
    }));
    showToast('Ticked ONLY blockwork items across all sections (all other trades unchecked).');
  };

  const handleUncheckAll = () => {
    setItems(prev => prev.map(it => ({ ...it, checked: false })));
    showToast('Unchecked all checklist items.');
  };

  const handleCheckAll = () => {
    setItems(prev => prev.map(it => ({ ...it, checked: true })));
    showToast('Checked all checklist items.');
  };

  const tickedBlockworkItems = useMemo(() => {
    return items.filter(it => it.checked && ((it.name || '').toLowerCase().includes('blockwork') || (it.name || '').toLowerCase().includes('sandcrete')));
  }, [items]);

  const handleExportAllBlockworkToBoq = async (asNewProject: boolean = false) => {
    if (tickedBlockworkItems.length === 0) {
      showToast('No blockwork items are currently ticked.');
      return;
    }
    if (onApplyBulkToBoq) {
      const boqRows = tickedBlockworkItems.map(it => ({
        item: it.name,
        description: it.description,
        qty: it.calculatedQty || it.qty || 1,
        unit: it.unit,
        rate: it.unitRate || Math.round((it.totalCost || 0) / (it.calculatedQty || 1)),
        amount: it.totalCost || 0,
        section: 'Masonry & Blockwork'
      }));

      await onApplyBulkToBoq(boqRows, {
        targetProjectId: asNewProject ? undefined : activeProject?.id,
        createAsNewProject: asNewProject,
        newProjectTitle: `Blockwork Takeoff & Schedule (${new Date().toLocaleDateString('en-GB')})`,
        newProjectLocation: activeProject?.location || 'Lagos, Nigeria',
        newProjectType: 'Residential'
      });

      showToast(asNewProject 
        ? `Created new dedicated BOQ with ${boqRows.length} blockwork items!` 
        : `Exported ${boqRows.length} blockwork items to active BOQ under "Masonry & Blockwork"!`);
    }
  };

  // Standard BESMM4 Presets for Quick 1-Click Preliminaries Addition
  const PRELIM_MANUAL_PRESETS = [
    { name: 'Project Signboard & Site Hoarding Billboard', desc: 'Fabrication & erection of 3.0m x 2.4m steel frame project signboard with architectural impressions & consultant particulars', unit: 'item', qty: 1, rate: 250000, waste: 0, labour: 45000 },
    { name: 'Geotechnical Soil Investigation & Core Boring', desc: 'Standard penetration tests (SPT), 2x exploratory boreholes to 15m depth, lab soil report & bearing capacity recommendations', unit: 'item', qty: 1, rate: 450000, waste: 0, labour: 80000 },
    { name: 'Standby Foundation Dewatering Pump Hire', desc: '3-inch submersible dewatering pump with delivery layflat hoses, fuel allowance & operator', unit: 'item', qty: 1, rate: 180000, waste: 0, labour: 35000 },
    { name: 'Resident Site Engineer / Project Manager Allowance', desc: 'Monthly engineering supervision allowance, site management, daily reporting & quality oversight', unit: 'month', qty: 6, rate: 450000, waste: 0, labour: 450000 },
    { name: '24/7 Uniformed Security Watchmen Services', desc: 'Day and night guard personnel, gate registry logbook, materials gate-pass inspection & perimeter patrols', unit: 'month', qty: 6, rate: 160000, waste: 0, labour: 160000 },
    { name: 'Topographical Cadastral Survey & Setting Out', desc: 'Cadastral perimeter boundary verification, perimeter traverse, spot levels, contours & permanent concrete benchmarks', unit: 'item', qty: 1, rate: 200000, waste: 0, labour: 50000 },
    { name: 'Mobile Chemical Toilet Sanitation Rental', desc: 'Self-contained portable chemical toilet rental, weekly servicing, waste evacuation & hygiene maintenance', unit: 'month', qty: 6, rate: 120000, waste: 0, labour: 25000 },
    { name: 'Safety Signage, PPE & Fire Extinguishers Pack', desc: 'Certified 9kg ABC dry chemical & CO2 fire extinguishers, wall brackets, safety warning boards & industrial first-aid boxes', unit: 'item', qty: 1, rate: 150000, waste: 0, labour: 20000 },
    { name: 'Temporary Site Internet / Starlink Installation', desc: 'High-speed satellite terminal, WiFi router, protective enclosure & monthly subscription for drawing sharing and video logs', unit: 'item', qty: 1, rate: 380000, waste: 0, labour: 30000 },
  ];

  // Open Manual Modal helper
  const handleOpenManualModal = (secKey: BtlSectionKey, preset?: typeof PRELIM_MANUAL_PRESETS[0]) => {
    setManualTargetSection(secKey);
    if (preset) {
      setManualForm({
        name: preset.name,
        description: preset.desc,
        unit: preset.unit,
        qty: preset.qty,
        unitRate: preset.rate,
        wastePercent: preset.waste,
        labourCost: preset.labour,
      });
    } else {
      setManualForm({
        name: '',
        description: '',
        unit: secKey === 'preliminaries' ? 'item' : 'm2',
        qty: 1,
        unitRate: secKey === 'preliminaries' ? 250000 : 5000,
        wastePercent: secKey === 'preliminaries' ? 0 : 5,
        labourCost: 25000,
      });
    }
    setManualModalOpen(true);
  };

  // Save Manual Item helper
  const handleSaveManualItem = () => {
    if (!manualForm.name.trim()) {
      showToast('Please enter an item name');
      return;
    }

    const secKey = manualTargetSection;
    const wasteFactor = 1 + (manualForm.wastePercent / 100);
    const computedTotal = Math.round(manualForm.qty * manualForm.unitRate * wasteFactor * regMultiplier);
    const computedLabour = manualForm.labourCost 
      ? Math.round(manualForm.labourCost * regMultiplier) 
      : Math.round(computedTotal * 0.25);

    const newItem: BtlChecklistItem = {
      id: `manual-${Date.now()}`,
      sectionKey: secKey,
      name: manualForm.name.trim(),
      description: manualForm.description.trim() || 'Manual custom item specification',
      unit: manualForm.unit || 'item',
      checked: true,
      wastePercent: manualForm.wastePercent,
      length: manualForm.unit === 'm' ? manualForm.qty : 0,
      width: 0,
      height: 0,
      qty: manualForm.qty,
      deductions: [],
      isCalculated: true,
      isManual: true,
      calculatedQty: manualForm.qty,
      cementBags: 0,
      sandTipper: 0,
      graniteTipper: 0,
      rebarKg: 0,
      labourCost: computedLabour,
      totalCost: computedTotal,
      unitRate: Math.round(manualForm.unitRate * regMultiplier),
      materials: []
    };

    setItems(prev => [...prev, newItem]);
    setOpenRollKey(secKey);
    setManualModalOpen(false);
    showToast(`Added manual item "${newItem.name}"!`);
  };

  // Add Custom Item to Section
  const handleAddCustomItem = (secKey: BtlSectionKey) => {
    const newItem: BtlChecklistItem = {
      id: `custom-${Date.now()}`,
      sectionKey: secKey,
      name: 'Custom Measured Item',
      description: 'Custom specified measured works item',
      unit: 'm2',
      checked: true,
      wastePercent: 5,
      length: 10,
      width: 5,
      height: 0,
      qty: 1,
      deductions: [],
      isCalculated: false,
      calculatedQty: 50,
      cementBags: 0,
      sandTipper: 0,
      graniteTipper: 0,
      rebarKg: 0,
      labourCost: 25000,
      totalCost: 150000,
      unitRate: 3000,
      materials: []
    };

    setItems(prev => [...prev, newItem]);
    setCalcActiveItemId(newItem.id);
    showToast('Added custom checklist item');
  };

  // Add Deduction inside calculator panel
  const handleAddDeduction = (itemId: string, type: 'door' | 'window' | 'void') => {
    const dim = type === 'door' ? { w: 0.9, h: 2.1, name: 'Standard Door' } : type === 'window' ? { w: 1.5, h: 1.2, name: 'Window' } : { w: 2.0, h: 1.5, name: 'Opening / Void' };
    const newDed: BtlDeduction = {
      id: `ded-${Date.now()}`,
      name: dim.name,
      type,
      width: dim.w,
      height: dim.h,
      qty: 1
    };

    setItems(prev => prev.map(it => {
      if (it.id === itemId) {
        const updated = { ...it, deductions: [...(it.deductions || []), newDed] };
        return calculateRowItem(updated);
      }
      return it;
    }));
  };

  const handleRemoveDeduction = (itemId: string, dedId: string) => {
    setItems(prev => prev.map(it => {
      if (it.id === itemId) {
        const updated = { ...it, deductions: it.deductions.filter(d => d.id !== dedId) };
        return calculateRowItem(updated);
      }
      return it;
    }));
  };

  // Section Totals & Counts
  const sectionSummaries = useMemo(() => {
    const map: Record<BtlSectionKey, { totalCost: number; itemsCount: number; calculatedCount: number }> = {
      preliminaries: { totalCost: 0, itemsCount: 0, calculatedCount: 0 },
      substructure: { totalCost: 0, itemsCount: 0, calculatedCount: 0 },
      superstructure: { totalCost: 0, itemsCount: 0, calculatedCount: 0 },
      roofing: { totalCost: 0, itemsCount: 0, calculatedCount: 0 },
      staircase: { totalCost: 0, itemsCount: 0, calculatedCount: 0 },
      finishing: { totalCost: 0, itemsCount: 0, calculatedCount: 0 },
      external_works: { totalCost: 0, itemsCount: 0, calculatedCount: 0 },
    };

    items.forEach(it => {
      if (map[it.sectionKey]) {
        map[it.sectionKey].itemsCount += 1;
        if (it.checked) {
          map[it.sectionKey].totalCost += (it.totalCost || 0);
          if (it.isCalculated) {
            map[it.sectionKey].calculatedCount += 1;
          }
        }
      }
    });

    return map;
  }, [items]);

  const grandTotalCost = useMemo(() => {
    return Object.values(sectionSummaries).reduce((acc, s) => acc + s.totalCost, 0);
  }, [sectionSummaries]);

  // Filter items by search query
  const filteredItemsBySection = (secKey: BtlSectionKey) => {
    return items.filter(it => {
      if (it.sectionKey !== secKey) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q);
    });
  };

  return (
    <div id="btl-estimator-view" className="w-full max-w-7xl mx-auto space-y-6 pb-16 overflow-x-hidden text-slate-800">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-2.5 shadow-xl animate-fade-in border border-emerald-500">
          <CheckCircle className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP HEADER: Title + Region Dropdown [Lagos, PH, Abuja] + Search Bar */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-extrabold border border-emerald-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>NIQS / BESMM4 Built-in Checklist Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Let's Estimate 2.0 - Build Mode
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Deterministic measured works checklist &amp; unit rate synthesis. Expand any of the 7 core building sections (including Bill 1: Preliminaries &amp; General Conditions according to BESMM4) to calculate, add manual custom items, and export to your BOQ.
          </p>
        </div>

        {/* Controls: Region Selector + Search Bar + Overall Total */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Add Manual Item Button */}
          <button
            type="button"
            onClick={() => handleOpenManualModal(openRollKey || 'preliminaries')}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 flex items-center space-x-1.5 cursor-pointer"
            title="Add a manual preliminary item or custom trade item"
          >
            <FolderPlus className="w-4 h-4" />
            <span>+ Add Manual Item</span>
          </button>

          {/* Region Dropdown [Lagos, PH, Abuja] */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center space-x-2 shadow-2xs">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Region</span>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value as BtlRegion)}
                className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="Lagos">Lagos</option>
                <option value="PH">PH</option>
                <option value="Abuja">Abuja</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search checklist items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Grand Total Badge */}
          <div className="bg-slate-900 text-white rounded-xl px-4 py-2 text-right hidden lg:block shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Estimated</span>
            <span className="text-sm font-black font-mono text-emerald-400">{formatNaira(grandTotalCost)}</span>
          </div>

        </div>

      </div>

      {/* Scope & Trade Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            <span>Trade Scope:</span>
          </span>
          <button
            type="button"
            onClick={handleSelectOnlyBlockwork}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 transition shadow-2xs flex items-center space-x-1.5 cursor-pointer"
            title="Tick ONLY blockwork items across all sections and untick all others"
          >
            <Box className="w-3.5 h-3.5 text-slate-950" />
            <span>Select Only Blockwork (Untick Others)</span>
          </button>
          <button
            type="button"
            onClick={handleUncheckAll}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="Untick all items across all sections"
          >
            <span>Uncheck All</span>
          </button>
          <button
            type="button"
            onClick={handleCheckAll}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="Check all items across all sections"
          >
            <span>Check All</span>
          </button>
        </div>

        {tickedBlockworkItems.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => handleExportAllBlockworkToBoq(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white transition shadow-2xs flex items-center space-x-1.5 cursor-pointer"
              title="Append all ticked blockwork items to current active project BOQ"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Add Blockwork to Active BOQ ({tickedBlockworkItems.length})</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportAllBlockworkToBoq(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition shadow-2xs flex items-center space-x-1.5 cursor-pointer"
              title="Create a brand new isolated BOQ project containing ONLY this blockwork"
            >
              <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Create New Project (Blockwork Only)</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BELOW: 6 BIG SECTION CARDS IN 2-COLUMN GRID */}
      {/* 1. SUBSTRUCTURE 2. SUPERSTRUCTURE 3. ROOFING 4. STAIRCASE 5. FINISHING 6. EXTERNAL WORKS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        
        {BTL_SECTIONS.map((sec) => {
          const summary = sectionSummaries[sec.key];
          const isOpen = openRollKey === sec.key;
          const secFilteredItems = filteredItemsBySection(sec.key);
          const IconComponent = sec.icon;

          return (
            <div 
              key={sec.key}
              className={`bg-white rounded-xl border transition-all duration-200 shadow-sm overflow-hidden ${
                isOpen ? 'md:col-span-2 border-emerald-600 ring-2 ring-emerald-600/20' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              
              {/* Card Summary Header (Click expands accordion Roll) */}
              <button
                type="button"
                onClick={() => setOpenRollKey(isOpen ? null : sec.key)}
                className="w-full p-5 flex items-center justify-between text-left cursor-pointer bg-white hover:bg-slate-50/80 transition"
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs transition ${
                    isOpen ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        0{sec.number}
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                        {sec.name}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {sec.tagline}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      {summary.itemsCount} Items
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-800">
                      {formatNaira(summary.totalCost)}
                    </span>
                  </div>

                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                    isOpen ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </button>

              {/* =================================================================== */}
              {/* ACCORDION ROLL DIRECTLY UNDER THE CARD */}
              {/* =================================================================== */}
              {isOpen && (
                <div className="border-t border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4 animate-fade-in">
                  
                  {/* Roll Header: Section Name + [Calculate All Ticked] green + [Export to BOQ] outline */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider block">
                        Trade Checklist &bull; {selectedRegion}
                      </span>
                      <h4 className="text-sm font-black text-slate-900">
                        {sec.name} CHECKLIST ({secFilteredItems.length} items)
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenManualModal(sec.key)}
                        className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold shadow-2xs transition active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                        title="Add a manual item with custom unit and price"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-emerald-700" />
                        <span>+ Add Manual Item</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCalculateAllTicked(sec.key)}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                        title="Calculate all checked rows in this section using input formulas"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Calculate All Ticked</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportSectionToBoq(sec.key)}
                        className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-600 rounded-lg text-xs font-bold shadow-2xs transition active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                        title="Export section data to BOQ and save to localStorage"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Export to BOQ</span>
                      </button>
                    </div>
                  </div>

                  {/* BESMM4 Bill 1 Quick Presets & Manual Overhead Entry Banner */}
                  {sec.key === 'preliminaries' && (
                    <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span className="text-xs font-black text-slate-900">
                            BESMM4 Bill No. 1: Contractual Preliminaries &amp; Temporary Works
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenManualModal('preliminaries')}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-extrabold flex items-center space-x-1 shadow-2xs transition active:scale-95 cursor-pointer self-start sm:self-auto"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Manual Preliminary / Overhead</span>
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Quick-add standard statutory, site management or plant service items with 1-click presets:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {PRELIM_MANUAL_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleOpenManualModal('preliminaries', preset)}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-400 transition cursor-pointer shadow-2xs flex items-center space-x-1"
                          >
                            <Plus className="w-2.5 h-2.5 text-emerald-700" />
                            <span>{preset.name.split('&')[0]} ({formatNaira(preset.rate)})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Checklist Table Header */}
                  <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                    <div className="sm:col-span-5">Checklist Item</div>
                    <div className="sm:col-span-3 text-center">Waste % &bull; Qty</div>
                    <div className="sm:col-span-4 text-right">Cost &bull; Actions</div>
                  </div>

                  {/* List of Checklist Rows */}
                  <div className="space-y-2">
                    {secFilteredItems.map((item) => {
                      const isCalcOpen = calcActiveItemId === item.id;
                      const isInlineEditing = inlineEditingItemId === item.id;

                      return (
                        <div 
                          key={item.id}
                          className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition overflow-hidden"
                        >
                          {/* Row Container */}
                          <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            
                            {/* LEFT: Checkbox + Item Name (inline editable) + Info icon */}
                            <div className="flex items-center space-x-3 sm:col-span-5 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => handleToggleCheck(item.id)}
                                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 cursor-pointer accent-emerald-700 shrink-0"
                              />

                              <div className="min-w-0 flex-1">
                                {isInlineEditing ? (
                                  <div className="flex items-center space-x-1.5">
                                    <input
                                      type="text"
                                      value={item.name}
                                      onChange={(e) => handleItemNameChange(item.id, e.target.value)}
                                      onBlur={() => setInlineEditingItemId(null)}
                                      onKeyDown={(e) => e.key === 'Enter' && setInlineEditingItemId(null)}
                                      autoFocus
                                      className="text-xs font-bold text-slate-900 border-b border-emerald-600 bg-[#e8f5e9] px-1 py-0.5 rounded focus:outline-none w-full"
                                    />
                                    <button 
                                      type="button" 
                                      onClick={() => setInlineEditingItemId(null)}
                                      className="p-1 text-emerald-700 hover:text-emerald-900"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1.5">
                                    <span 
                                      onClick={() => setInlineEditingItemId(item.id)}
                                      className="text-xs font-bold text-slate-900 hover:text-emerald-800 cursor-pointer truncate block"
                                      title="Click to edit item name"
                                    >
                                      {item.name}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => alert(`Waste Allowance Info for "${item.name}":\nStandard NIQS/BESMM4 trade allowance is ${item.wastePercent}% to accommodate cutting, breakage and placing tolerances.`)}
                                      className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                                      title="Waste & spec info"
                                    >
                                      <Info className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                                <span className="text-[10px] text-slate-500 line-clamp-1">
                                  {item.description}
                                </span>
                              </div>
                            </div>

                            {/* MIDDLE: Waste input % small box (bg #e8f5e9) + Qty Result */}
                            <div className="flex items-center justify-between sm:justify-center space-x-3 shrink-0">
                              <div className="flex items-center space-x-1 bg-[#e8f5e9] border border-emerald-300 rounded-lg px-2 py-1">
                                <span className="text-[10px] font-bold text-emerald-900">Waste:</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="25"
                                  value={item.wastePercent}
                                  onChange={(e) => handleWasteChange(item.id, Number(e.target.value) || 0)}
                                  className="w-8 text-center text-xs font-extrabold text-emerald-950 bg-transparent focus:outline-none"
                                />
                                <span className="text-[10px] font-bold text-emerald-800">%</span>
                              </div>

                              <div className="text-right sm:text-center min-w-[75px]">
                                {item.isCalculated ? (
                                  <>
                                    <span className="text-xs font-mono font-bold text-slate-900 block">
                                      {formatNumber(item.calculatedQty || item.netQty || 0)}
                                    </span>
                                    <span className="text-[10px] text-emerald-700 font-bold uppercase">
                                      {item.unit} &bull; Measured
                                    </span>
                                  </>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold inline-block">
                                    Take-Off ({item.unit})
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* RIGHT: Cost ₦ + [Edit] + [Calc] buttons */}
                            <div className="flex items-center justify-between sm:justify-end space-x-2.5 shrink-0">
                              <div className="text-right min-w-[90px]">
                                {item.isCalculated ? (
                                  <>
                                    <span className="text-xs font-mono font-extrabold text-slate-900 block">
                                      {formatNaira(item.totalCost || item.amount || 0)}
                                    </span>
                                    <span className="text-[10px] font-mono text-emerald-700">
                                      @{formatNaira(item.unitRate || item.rate || 0)}/{item.unit}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-xs font-mono font-bold text-slate-400 block">
                                      ₦--
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      Not Measured
                                    </span>
                                  </>
                                )}
                              </div>

                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenMeasurementModal(item)}
                                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                                    item.isCalculated
                                      ? 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                  }`}
                                  title="Open measurement & details modal (Tab 2 default)"
                                >
                                  {item.isCalculated ? (
                                    <>
                                      <Edit2 className="w-3 h-3 text-slate-500" />
                                      <span>Edit / Measure</span>
                                    </>
                                  ) : (
                                    <>
                                      <Calculator className="w-3 h-3 text-white" />
                                      <span>Measure &amp; Calc</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                          </div>

                          {/* ========================================================= */}
                          {/* INLINE CALCULATOR PANEL (Opens below row on [Calc] click) */}
                          {/* ========================================================= */}
                          {isCalcOpen && (
                            <div className="border-t border-emerald-200 bg-[#f4fbf6] p-4 space-y-3.5 animate-fade-in text-xs">
                              
                              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                                <div className="flex items-center space-x-2">
                                  <Calculator className="w-4 h-4 text-emerald-700" />
                                  <span className="font-extrabold text-slate-900">
                                    Inline Calculator: {item.name}
                                  </span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                                  Rates: {selectedRegion}
                                </span>
                              </div>

                              {item.sectionKey === 'preliminaries' || ['item', 'sum', 'month', 'ls', 'day', 'wk'].includes(item.unit) || item.isManual ? (
                                <div className="space-y-3">
                                  <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                      <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                                        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                                        <span>BESMM4 Bill 1 &bull; Direct Rate &amp; Overheads Schedule</span>
                                      </div>
                                      <span className="text-[10px] text-slate-500 font-semibold">
                                        Unit: <strong className="text-slate-800 uppercase">{item.unit}</strong>
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                      <div>
                                        <label className="text-[10px] font-bold text-slate-600 block mb-1">
                                          {item.unit === 'month' ? 'Duration (Months)' : item.unit === 'm' ? 'Perimeter / Length (m)' : 'Quantity / Lump Count'}
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="any"
                                          value={item.unit === 'm' && item.length ? item.length : (item.qty || 1)}
                                          onChange={(e) => {
                                            const val = Math.max(0, Number(e.target.value) || 0);
                                            setItems(prev => prev.map(it => {
                                              if (it.id === item.id) {
                                                const updated = it.unit === 'm' ? { ...it, length: val, qty: 1 } : { ...it, qty: val };
                                                return calculateRowItem(updated);
                                              }
                                              return it;
                                            }));
                                          }}
                                          className="w-full px-2.5 py-1.5 bg-[#e8f5e9] border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 focus:bg-white focus:outline-none"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] font-bold text-slate-600 block mb-1">
                                          Unit Rate (₦/{item.unit})
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="any"
                                          value={item.unitRate || Math.round((item.totalCost || 0) / (item.calculatedQty || 1))}
                                          onChange={(e) => {
                                            const r = Math.max(0, Number(e.target.value) || 0);
                                            setItems(prev => prev.map(it => {
                                              if (it.id === item.id) {
                                                const updated = { ...it, unitRate: r };
                                                return calculateRowItem(updated);
                                              }
                                              return it;
                                            }));
                                          }}
                                          className="w-full px-2.5 py-1.5 bg-[#e8f5e9] border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-950 focus:bg-white focus:outline-none"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Waste Allowance (%)</label>
                                        <input
                                          type="number"
                                          min="0"
                                          max="25"
                                          value={item.wastePercent || 0}
                                          onChange={(e) => {
                                            const w = Math.max(0, Number(e.target.value) || 0);
                                            handleWasteChange(item.id, w);
                                          }}
                                          className="w-full px-2.5 py-1.5 bg-[#e8f5e9] border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 focus:bg-white focus:outline-none"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Labour/Fee Portion (₦)</label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={item.labourCost || 0}
                                          onChange={(e) => {
                                            const l = Math.max(0, Number(e.target.value) || 0);
                                            setItems(prev => prev.map(it => it.id === item.id ? { ...it, labourCost: l } : it));
                                          }}
                                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                                        />
                                      </div>
                                    </div>

                                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                                      <strong>BESMM4 Guide:</strong> Time-related items (Supervision, Security, Power Generator) should be budgeted across the anticipated construction duration (e.g. 6 to 12 months). Fixed charges (Hoarding, Borehole, Bonds) are priced as single lump sums.
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Specialized dropdowns for Roofing / Blockwork / Rebar / Formwork */}
                                  <div className="flex flex-wrap items-center gap-3">
                                    {item.woodType !== undefined && (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[11px] font-bold text-slate-600">Wood Type:</span>
                                        <select
                                          value={item.woodType}
                                          onChange={(e) => {
                                            const wt = e.target.value as any;
                                            setItems(prev => prev.map(it => it.id === item.id ? calculateRowItem({ ...it, woodType: wt }) : it));
                                          }}
                                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                                        >
                                          <option value="Hardwood">Hardwood (Heavy Timber Trusses)</option>
                                          <option value="Alaska">Alaska (Softwood / Treated Timber)</option>
                                        </select>
                                      </div>
                                    )}

                                    {item.sheetType !== undefined && (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[11px] font-bold text-slate-600">Roof Sheet Type:</span>
                                        <select
                                          value={item.sheetType}
                                          onChange={(e) => {
                                            const st = e.target.value as any;
                                            setItems(prev => prev.map(it => it.id === item.id ? calculateRowItem({ ...it, sheetType: st }) : it));
                                          }}
                                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                                        >
                                          <option value="0.45mm Aluzinc">0.45mm Aluzinc Corrugated</option>
                                          <option value="0.55mm Longspan">0.55mm Longspan Aluminium</option>
                                          <option value="Metcoppo">Metcoppo Tile Profile</option>
                                          <option value="Stone Coated">Stone Coated Bond/Shingle</option>
                                        </select>
                                      </div>
                                    )}

                                    {(item.blockThickness !== undefined || item.name.toLowerCase().includes('blockwork')) && (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[11px] font-bold text-slate-600">Block Thickness:</span>
                                        <select
                                          value={item.blockThickness || '225mm'}
                                          onChange={(e) => {
                                            const bt = e.target.value as any;
                                            setItems(prev => prev.map(it => it.id === item.id ? calculateRowItem({ ...it, blockThickness: bt }) : it));
                                          }}
                                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                                        >
                                          <option value="225mm">225mm (9-inch Loadbearing)</option>
                                          <option value="150mm">150mm (6-inch Partition)</option>
                                        </select>
                                      </div>
                                    )}

                                    {(item.rodDiameter !== undefined || item.name.toLowerCase().includes('rebar') || item.name.toLowerCase().includes('reinforcement')) && (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[11px] font-bold text-slate-600">Rod Diameter (D):</span>
                                        <select
                                          value={item.rodDiameter || 16}
                                          onChange={(e) => {
                                            const rd = Number(e.target.value);
                                            setItems(prev => prev.map(it => it.id === item.id ? calculateRowItem({ ...it, rodDiameter: rd }) : it));
                                          }}
                                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                                        >
                                          <option value={8}>Y8 (8mm Stirrup/Link)</option>
                                          <option value={10}>Y10 (10mm Rebar)</option>
                                          <option value={12}>Y12 (12mm Slab/Base)</option>
                                          <option value={16}>Y16 (16mm Column/Beam)</option>
                                          <option value={20}>Y20 (20mm Heavy Column)</option>
                                          <option value={25}>Y25 (25mm High-Load Beam)</option>
                                        </select>
                                      </div>
                                    )}

                                    {(item.sides !== undefined || item.name.toLowerCase().includes('formwork')) && (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[11px] font-bold text-slate-600">Sides to Form:</span>
                                        <select
                                          value={item.sides || 2}
                                          onChange={(e) => {
                                            const s = Number(e.target.value);
                                            setItems(prev => prev.map(it => it.id === item.id ? calculateRowItem({ ...it, sides: s }) : it));
                                          }}
                                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                                        >
                                          <option value={1}>1 Side (Slab Edge)</option>
                                          <option value={2}>2 Sides (Foundation/Trench)</option>
                                          <option value={3}>3 Sides (Beam Soffit & Sides)</option>
                                          <option value={4}>4 Sides (Square Column)</option>
                                        </select>
                                      </div>
                                    )}
                                  </div>

                                  {/* Standard Inputs: L, W, H/D/Thickness, Qty, Waste % */}
                                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                    <div>
                                      <label className="text-[10px] font-bold text-slate-600 block mb-1">L (Length m)</label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={item.length}
                                        onChange={(e) => {
                                          const val = Math.max(0, Number(e.target.value) || 0);
                                          setItems(prev => prev.map(it => it.id === item.id ? calculateRowItem({ ...it, length: val }) : it));
                                        }}
                                        className="w-full px-2.5 py-1.5 bg-[#e8f5e9] border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 focus:bg-white focus:outline-none"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[10px] font-bold text-slate-600 block mb-1">W (Width m)</label>
                                      <input
                                        type="number"
                                        step="0.05"
                                        value={item.width}
                                        onChange={(e) => {
                                          const val = Math.max(0, Number(e.target.value) || 0);
                                          setItems(prev => prev.map(it => it.id === item.id ? calculateRowItem({ ...it, width: val }) : it));
                                        }}
                                        className="w-full px-2.5 py-1.5 bg-[#e8f5e9] border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 focus:bg-white focus:outline-none"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[10px] font-bold text-slate-600 block mb-1">H/D/Thickness (m)</label>
                                      <input
                                        type="number"
                                        step="0.025"
                                        value={item.height}
                                        onChange={(e) => {
                                          const val = Math.max(0, Number(e.target.value) || 0);
                                          setItems(prev => prev.map(it => it.id === item.id ? calculateRowItem({ ...it, height: val }) : it));
                                        }}
                                        className="w-full px-2.5 py-1.5 bg-[#e8f5e9] border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 focus:bg-white focus:outline-none"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Qty (Members)</label>
                                      <input
                                        type="number"
                                        value={item.qty}
                                        onChange={(e) => {
                                          const val = Math.max(1, Number(e.target.value) || 1);
                                          setItems(prev => prev.map(it => it.id === item.id ? calculateRowItem({ ...it, qty: val }) : it));
                                        }}
                                        className="w-full px-2.5 py-1.5 bg-[#e8f5e9] border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 focus:bg-white focus:outline-none"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Waste Allowance (%)</label>
                                      <input
                                        type="number"
                                        value={item.wastePercent}
                                        onChange={(e) => {
                                          const val = Math.max(0, Number(e.target.value) || 0);
                                          handleWasteChange(item.id, val);
                                        }}
                                        className="w-full px-2.5 py-1.5 bg-[#e8f5e9] border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 focus:bg-white focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  {/* Deductions Repeater: Width, Height, Qty + [+Add Door/Window] */}
                                  <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-extrabold text-slate-700">
                                        Deductions Repeater (Openings &amp; Voids)
                                      </span>
                                      <div className="flex items-center space-x-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleAddDeduction(item.id, 'door')}
                                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded border border-emerald-300 transition cursor-pointer"
                                        >
                                          + Add Door (0.9×2.1m)
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleAddDeduction(item.id, 'window')}
                                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded border border-emerald-300 transition cursor-pointer"
                                        >
                                          + Add Window (1.5×1.2m)
                                        </button>
                                      </div>
                                    </div>

                                    {item.deductions.length === 0 ? (
                                      <div className="text-[10px] text-slate-400 italic">
                                        No deductions added. Gross dimensional geometry will be used.
                                      </div>
                                    ) : (
                                      <div className="space-y-1.5">
                                        {item.deductions.map(ded => (
                                          <div key={ded.id} className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded border border-slate-200 text-xs">
                                            <span className="text-[9px] uppercase font-bold px-1 rounded bg-slate-200 text-slate-700">
                                              {ded.type}
                                            </span>
                                            <span className="flex-1 text-[11px] font-medium text-slate-800">
                                              {ded.name}
                                            </span>
                                            <div className="flex items-center space-x-1 font-mono text-[11px]">
                                              <input
                                                type="number"
                                                step="0.05"
                                                value={ded.width}
                                                onChange={(e) => {
                                                  const w = Number(e.target.value);
                                                  setItems(prev => prev.map(it => it.id === item.id ? calculateRowItem({ ...it, deductions: it.deductions.map(d => d.id === ded.id ? { ...d, width: w } : d) }) : it));
                                                }}
                                                className="w-12 px-1 text-center font-bold border border-slate-300 rounded bg-white"
                                              />
                                              <span>×</span>
                                              <input
                                                type="number"
                                                step="0.05"
                                                value={ded.height}
                                                onChange={(e) => {
                                                  const h = Number(e.target.value);
                                                  setItems(prev => prev.map(it => it.id === item.id ? calculateRowItem({ ...it, deductions: it.deductions.map(d => d.id === ded.id ? { ...d, height: h } : d) }) : it));
                                                }}
                                                className="w-12 px-1 text-center font-bold border border-slate-300 rounded bg-white"
                                              />
                                              <span>m (Qty:</span>
                                              <input
                                                type="number"
                                                value={ded.qty}
                                                onChange={(e) => {
                                                  const q = Number(e.target.value);
                                                  setItems(prev => prev.map(it => it.id === item.id ? calculateRowItem({ ...it, deductions: it.deductions.map(d => d.id === ded.id ? { ...d, qty: q } : d) }) : it));
                                                }}
                                                className="w-10 px-1 text-center font-bold border border-slate-300 rounded bg-white"
                                              />
                                              <span>)</span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveDeduction(item.id, ded.id)}
                                              className="text-red-500 hover:text-red-700 p-1"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}

                              {/* SHOW RESULTS CARD: Qty, Cement Bags, Sand Tipper, Granite Tipper, Rebar kg, Labour Cost, Total Cost */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 p-3 bg-white rounded-lg border border-emerald-300">
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Qty Result</span>
                                  <span className="text-xs font-mono font-black text-slate-900">
                                    {formatNumber(item.calculatedQty || 0)} {item.unit}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Cement</span>
                                  <span className="text-xs font-mono font-black text-emerald-800">
                                    {item.cementBags ? `${item.cementBags} bags` : '-'}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Sand Tipper</span>
                                  <span className="text-xs font-mono font-black text-emerald-800">
                                    {item.sandTipper ? `${item.sandTipper} trips` : '-'}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Granite Tipper</span>
                                  <span className="text-xs font-mono font-black text-emerald-800">
                                    {item.graniteTipper ? `${item.graniteTipper} trips` : '-'}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Rebar Steel</span>
                                  <span className="text-xs font-mono font-black text-emerald-800">
                                    {item.rebarKg ? `${formatNumber(item.rebarKg)} kg` : '-'}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Labour Cost</span>
                                  <span className="text-xs font-mono font-black text-slate-800">
                                    {formatNaira(item.labourCost || 0)}
                                  </span>
                                </div>

                                <div className="col-span-2 sm:col-span-1 bg-emerald-50 p-1 rounded border border-emerald-200">
                                  <span className="text-[10px] text-emerald-800 uppercase block font-extrabold">Total Cost</span>
                                  <span className="text-xs font-mono font-black text-emerald-950 truncate block">
                                    {formatNaira(item.totalCost || 0)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex justify-end space-x-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleSingleItemCalc(item.id)}
                                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center space-x-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Apply &amp; Save Calculation</span>
                                </button>
                              </div>

                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>

                  {/* Footer: [+ Add Custom Item] and [+ Add Manual Item] */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleAddCustomItem(sec.key)}
                        className="text-xs font-extrabold text-emerald-800 hover:text-emerald-950 flex items-center space-x-1.5 p-1 rounded hover:bg-emerald-50 transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-emerald-700" />
                        <span>+ Add Custom Item to {sec.name}</span>
                      </button>

                      <span className="text-slate-300 hidden sm:inline">&bull;</span>

                      <button
                        type="button"
                        onClick={() => handleOpenManualModal(sec.key)}
                        className="text-xs font-extrabold text-teal-800 hover:text-teal-950 flex items-center space-x-1.5 p-1 rounded hover:bg-teal-50 transition cursor-pointer"
                      >
                        <FolderPlus className="w-4 h-4 text-teal-700" />
                        <span>+ Add Manual Item (Direct Price / Overheads)</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Total Bar: Section Total = ₦XX */}
                  <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {sec.name} Summary Total
                      </span>
                      <span className="text-xs text-slate-300">
                        {summary.itemsCount} trade items &bull; Calibrated for {selectedRegion}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-400 block uppercase">Section Total</span>
                      <span className="text-lg font-black font-mono text-emerald-400">
                        {formatNaira(summary.totalCost)}
                      </span>
                    </div>
                  </div>

                </div>
              )}

            </div>
          );
        })}

      </div>

      {/* ========================================================================= */}
      {/* 2-TAB MEASUREMENT MODAL: Details (Tab 1) & Measurement (Tab 2 Default)     */}
      {/* ========================================================================= */}
      {measurementModalOpen && modalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-[600px] w-full p-4 sm:p-5 shadow-2xl border border-slate-200 space-y-3.5 my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-2.5 shrink-0">
              <div className="min-w-0 pr-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                    {BTL_SECTIONS.find(s => s.key === modalItem.sectionKey)?.name || modalItem.sectionKey}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Traceable Take-Off</span>
                </div>
                <h3 className="text-base font-black text-slate-900 truncate mt-1">
                  {modalTitle || modalItem.name}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setMeasurementModalOpen(false);
                  setModalItem(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2 Tabs Header: Tab 2 Measurement (Default Open) & Tab 1 Details */}
            <div className="flex border-b border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setModalActiveTab('measurement')}
                className={`flex-1 py-2 text-xs font-black transition border-b-2 flex items-center justify-center space-x-1.5 cursor-pointer ${
                  modalActiveTab === 'measurement'
                    ? 'border-emerald-600 text-emerald-800 bg-emerald-50/60 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                <span>Tab 2 - Measurement</span>
                <span className="text-[9px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded font-bold">
                  Default
                </span>
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab('details')}
                className={`flex-1 py-2 text-xs font-black transition border-b-2 flex items-center justify-center space-x-1.5 cursor-pointer ${
                  modalActiveTab === 'details'
                    ? 'border-emerald-600 text-emerald-800 bg-emerald-50/60 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Tab 1 - Details</span>
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="overflow-y-auto space-y-3.5 pr-1 flex-1">
              
              {/* TAB 1: DETAILS */}
              {modalActiveTab === 'details' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Title / Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={modalTitle}
                      onChange={(e) => setModalTitle(e.target.value)}
                      placeholder="e.g. 225mm Vibrated Sandcrete Blockwork"
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Description / Specification
                    </label>
                    <textarea
                      rows={3}
                      value={modalDescription}
                      onChange={(e) => setModalDescription(e.target.value)}
                      placeholder="Trade specifications, mix ratios, code of practice, contractor requirements..."
                      className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Unit of Measurement
                      </label>
                      <select
                        value={modalUnit}
                        onChange={(e) => handleUnitChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      >
                        <option value="m">m (Linear)</option>
                        <option value="m2">m2 (Area)</option>
                        <option value="m3">m3 (Volume)</option>
                        <option value="kg">kg (Weight / Steel)</option>
                        <option value="nos">nos (Count / Items)</option>
                        <option value="lm">lm (Linear Meters)</option>
                        <option value="pc">pc (Pieces)</option>
                        <option value="item">item (Lump Sum)</option>
                        <option value="month">month (Duration)</option>
                        <option value="sum">sum (Provisional Sum)</option>
                      </select>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Changing unit auto-adapts formula &amp; rates.
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Waste Allowance (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={modalWaste}
                        onChange={(e) => setModalWaste(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Standard NIQS trade allowance (3% concrete, 5% block/steel).
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MEASUREMENT (DEFAULT OPEN) */}
              {modalActiveTab === 'measurement' && (
                <div className="space-y-3.5 pt-1">
                  
                  {/* Top: Formula Type pills */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1.5">
                      Formula Type:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'area', label: 'Area LxW' },
                        { id: 'linear', label: 'Linear L' },
                        { id: 'volume', label: 'Volume LxWxH' },
                        { id: 'blockwork', label: 'Blockwork' },
                        { id: 'concrete', label: 'Concrete' },
                        { id: 'rebar', label: 'Rebar' },
                        { id: 'formwork', label: 'Formwork' },
                      ].map((pill) => {
                        const isSelected = activeFormulaType === pill.id;
                        return (
                          <button
                            key={pill.id}
                            type="button"
                            onClick={() => handleFormulaPillChange(pill.id as BtlFormulaType)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {pill.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic inputs based on type */}
                  <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 space-y-2.5">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      Dimensional Inputs ({activeFormulaType.toUpperCase()}):
                    </span>

                    {/* If Area: L, W, Qty */}
                    {activeFormulaType === 'area' && (
                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">L (Length m)</label>
                          <input
                            type="number"
                            step="0.05"
                            value={inputL}
                            onChange={(e) => setInputL(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">W (Width m)</label>
                          <input
                            type="number"
                            step="0.05"
                            value={inputW}
                            onChange={(e) => setInputW(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Qty (Multiplier)</label>
                          <input
                            type="number"
                            min="1"
                            value={inputQty}
                            onChange={(e) => setInputQty(Math.max(1, Number(e.target.value) || 1))}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* If Linear: L, Qty */}
                    {activeFormulaType === 'linear' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">L (Linear Length m)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={inputL}
                            onChange={(e) => setInputL(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Qty (Number of Runs)</label>
                          <input
                            type="number"
                            min="1"
                            value={inputQty}
                            onChange={(e) => setInputQty(Math.max(1, Number(e.target.value) || 1))}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* If Volume: L, W, H/D, Qty */}
                    {activeFormulaType === 'volume' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">L (Length m)</label>
                          <input
                            type="number"
                            step="0.05"
                            value={inputL}
                            onChange={(e) => setInputL(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">W (Width m)</label>
                          <input
                            type="number"
                            step="0.05"
                            value={inputW}
                            onChange={(e) => setInputW(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">H/D (Depth m)</label>
                          <input
                            type="number"
                            step="0.05"
                            value={inputH}
                            onChange={(e) => setInputH(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Qty (Count)</label>
                          <input
                            type="number"
                            min="1"
                            value={inputQty}
                            onChange={(e) => setInputQty(Math.max(1, Number(e.target.value) || 1))}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* If Blockwork: L, H, Qty, Wall thickness selector 150/225, Deduction repeater */}
                    {activeFormulaType === 'blockwork' && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">L (Wall Length m)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={inputL}
                              onChange={(e) => setInputL(Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">H (Storey Height m)</label>
                            <input
                              type="number"
                              step="0.05"
                              value={inputH}
                              onChange={(e) => setInputH(Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">Qty (Walls)</label>
                            <input
                              type="number"
                              min="1"
                              value={inputQty}
                              onChange={(e) => setInputQty(Math.max(1, Number(e.target.value) || 1))}
                              className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">Thickness (150/225)</label>
                            <div className="flex rounded-lg overflow-hidden border border-slate-300">
                              <button
                                type="button"
                                onClick={() => {
                                  setWallThickness('150');
                                  setCustomRate(null);
                                }}
                                className={`flex-1 py-1.5 text-[11px] font-bold cursor-pointer ${
                                  wallThickness === '150' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700'
                                }`}
                              >
                                150mm (6")
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setWallThickness('225');
                                  setCustomRate(null);
                                }}
                                className={`flex-1 py-1.5 text-[11px] font-bold cursor-pointer ${
                                  wallThickness === '225' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700'
                                }`}
                              >
                                225mm (9")
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* If Concrete: L, W, H, Qty, Mix selector M20/M25 */}
                    {activeFormulaType === 'concrete' && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">L (Length m)</label>
                            <input
                              type="number"
                              step="0.05"
                              value={inputL}
                              onChange={(e) => setInputL(Number(e.target.value))}
                              className="w-full px-2 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">W (Width m)</label>
                            <input
                              type="number"
                              step="0.05"
                              value={inputW}
                              onChange={(e) => setInputW(Number(e.target.value))}
                              className="w-full px-2 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">H (Thick m)</label>
                            <input
                              type="number"
                              step="0.025"
                              value={inputH}
                              onChange={(e) => setInputH(Number(e.target.value))}
                              className="w-full px-2 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">Qty (Members)</label>
                            <input
                              type="number"
                              min="1"
                              value={inputQty}
                              onChange={(e) => setInputQty(Math.max(1, Number(e.target.value) || 1))}
                              className="w-full px-2 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">Mix (M20/M25)</label>
                            <select
                              value={concreteMix}
                              onChange={(e) => {
                                setConcreteMix(e.target.value as any);
                                setCustomRate(null);
                              }}
                              className="w-full px-2 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                            >
                              <option value="M20">M20 (1:2:4)</option>
                              <option value="M25">M25 (1:1.5:3)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* If Rebar: Dia selector Y8/Y12/Y16, L, Qty, Lap % */}
                    {activeFormulaType === 'rebar' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Dia (Y8/Y12/Y16)</label>
                          <select
                            value={rebarDia}
                            onChange={(e) => {
                              setRebarDia(e.target.value);
                              setCustomRate(null);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs font-black border border-slate-300 rounded-lg bg-white text-emerald-900"
                          >
                            <option value="Y8">Y8 (8mm Stirrup)</option>
                            <option value="Y10">Y10 (10mm Rebar)</option>
                            <option value="Y12">Y12 (12mm Main)</option>
                            <option value="Y16">Y16 (16mm Heavy)</option>
                            <option value="Y20">Y20 (20mm High)</option>
                            <option value="Y25">Y25 (25mm Base)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">L (Cut Length m)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={inputL}
                            onChange={(e) => setInputL(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Qty (Number of Bars)</label>
                          <input
                            type="number"
                            min="1"
                            value={inputQty}
                            onChange={(e) => setInputQty(Math.max(1, Number(e.target.value) || 1))}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Lap Allowance (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="25"
                            value={rebarLapPercent}
                            onChange={(e) => setRebarLapPercent(Math.max(0, Number(e.target.value) || 0))}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* If Formwork: L, H, Sides, Qty */}
                    {activeFormulaType === 'formwork' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">L (Length m)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={inputL}
                            onChange={(e) => setInputL(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">H (Depth / Height m)</label>
                          <input
                            type="number"
                            step="0.05"
                            value={inputH}
                            onChange={(e) => setInputH(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Sides (1,2,3,4)</label>
                          <select
                            value={sides}
                            onChange={(e) => setSides(Number(e.target.value) || 1)}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          >
                            <option value={1}>1 Side (Slab Edge)</option>
                            <option value={2}>2 Sides (Trench / Wall)</option>
                            <option value={3}>3 Sides (Beam Soffit &amp; Sides)</option>
                            <option value={4}>4 Sides (Column)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Qty (Members)</label>
                          <input
                            type="number"
                            min="1"
                            value={inputQty}
                            onChange={(e) => setInputQty(Math.max(1, Number(e.target.value) || 1))}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Always show: Deductions repeater (W, H, Qty) + Add button */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-800">Deductions Repeater (Openings &amp; Voids)</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono font-bold">
                          {modalDeductions.length}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            setModalDeductions(prev => [
                              ...prev,
                              { id: `ded-${Date.now()}-${Math.random()}`, name: 'Door', type: 'door', width: 0.9, height: 2.1, qty: 1 }
                            ]);
                          }}
                          className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded cursor-pointer transition shadow-2xs"
                        >
                          + Door (0.9×2.1m)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalDeductions(prev => [
                              ...prev,
                              { id: `ded-${Date.now()}-${Math.random()}`, name: 'Window', type: 'window', width: 1.5, height: 1.2, qty: 1 }
                            ]);
                          }}
                          className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded cursor-pointer transition shadow-2xs"
                        >
                          + Window (1.5×1.2m)
                        </button>
                      </div>
                    </div>

                    {modalDeductions.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic py-1 text-center bg-white rounded border border-dashed border-slate-200">
                        No deductions entered. Gross measurement geometry will be used.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {modalDeductions.map((ded, idx) => (
                          <div key={ded.id} className="flex items-center space-x-1.5 bg-white p-1.5 rounded-lg border border-slate-200 text-xs">
                            <span className="text-[10px] font-bold text-slate-400 w-4 text-center">#{idx + 1}</span>
                            <input
                              type="text"
                              value={ded.name}
                              placeholder="Name"
                              onChange={(e) => {
                                const val = e.target.value;
                                setModalDeductions(prev => prev.map(d => d.id === ded.id ? { ...d, name: val } : d));
                              }}
                              className="flex-1 text-[11px] px-1.5 py-0.5 border border-slate-200 rounded font-medium focus:outline-none"
                            />
                            <div className="flex items-center space-x-1 font-mono text-[11px]">
                              <span className="text-[10px] font-bold text-slate-500">W:</span>
                              <input
                                type="number"
                                step="0.05"
                                min="0"
                                value={ded.width}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  setModalDeductions(prev => prev.map(d => d.id === ded.id ? { ...d, width: val } : d));
                                }}
                                className="w-12 px-1 py-0.5 text-center font-bold border border-slate-300 rounded bg-white"
                              />
                              <span className="text-slate-400">×</span>
                              <span className="text-[10px] font-bold text-slate-500">H:</span>
                              <input
                                type="number"
                                step="0.05"
                                min="0"
                                value={ded.height}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  setModalDeductions(prev => prev.map(d => d.id === ded.id ? { ...d, height: val } : d));
                                }}
                                className="w-12 px-1 py-0.5 text-center font-bold border border-slate-300 rounded bg-white"
                              />
                              <span className="text-[10px] font-bold text-slate-500">Qty:</span>
                              <input
                                type="number"
                                min="1"
                                value={ded.qty}
                                onChange={(e) => {
                                  const val = Math.max(1, Number(e.target.value) || 1);
                                  setModalDeductions(prev => prev.map(d => d.id === ded.id ? { ...d, qty: val } : d));
                                }}
                                className="w-10 px-1 py-0.5 text-center font-bold border border-slate-300 rounded bg-white"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setModalDeductions(prev => prev.filter(d => d.id !== ded.id))}
                              className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                              title="Delete deduction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setModalDeductions(prev => [
                            ...prev,
                            { id: `ded-${Date.now()}-${Math.random()}`, name: 'Void/Opening', type: 'void', width: 1.0, height: 1.0, qty: 1 }
                          ]);
                        }}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Deduction</span>
                      </button>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        Total Deductions: -{modalCalculations.deductions} {modalUnit === 'm3' ? 'm³' : modalUnit === 'm' || modalUnit === 'lm' ? 'm' : 'm²'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Live calculation box (light green bg #e8f5e9, monospace numbers) */}
                  <div className="bg-[#e8f5e9] border border-emerald-300 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-black uppercase text-emerald-900 tracking-wider">
                          Live Traceable Calculation Box
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900">
                          {activeFormulaType.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-800">
                        Region: {selectedRegion} ({regMultiplier}x)
                      </span>
                    </div>

                    {/* Monospace 4 Stats: Gross, Deductions, Net Qty, With Waste */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="bg-white/80 rounded-lg p-2 border border-emerald-200">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Gross</span>
                        <span className="text-xs font-mono font-black text-slate-800 block truncate">
                          {formatNumber(modalCalculations.gross)} {modalUnit}
                        </span>
                      </div>
                      <div className="bg-white/80 rounded-lg p-2 border border-emerald-200">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Deductions</span>
                        <span className="text-xs font-mono font-black text-red-600 block truncate">
                          -{formatNumber(modalCalculations.deductions)} {modalUnit}
                        </span>
                      </div>
                      <div className="bg-white/80 rounded-lg p-2 border border-emerald-200">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Net Qty</span>
                        <span className="text-xs font-mono font-black text-slate-900 block truncate">
                          {formatNumber(modalCalculations.net)} {modalUnit}
                        </span>
                      </div>
                      <div className="bg-emerald-100/90 rounded-lg p-2 border border-emerald-300">
                        <span className="text-[10px] uppercase font-bold text-emerald-900 block">With Waste ({modalWaste}%)</span>
                        <span className="text-xs font-mono font-black text-emerald-950 block truncate">
                          {formatNumber(modalCalculations.withWaste)} {modalUnit}
                        </span>
                      </div>
                    </div>

                    {/* Material breakdown according to user formula specs */}
                    <div className="bg-white/90 rounded-lg p-2.5 border border-emerald-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider">
                          Material Breakdown:
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">Traceable NIQS Calibration</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                        {modalCalculations.cementBags > 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold">
                            Cement bags: {modalCalculations.cementBags} bags {activeFormulaType === 'concrete' ? '(Volume×6.5)' : ''}
                          </span>
                        )}
                        {modalCalculations.sandTippers > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-900 font-bold">
                            Sand tippers: {modalCalculations.sandTippers} tippers (m³/5)
                          </span>
                        )}
                        {modalCalculations.graniteTippers > 0 && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-900 font-bold">
                            Granite tippers: {modalCalculations.graniteTippers} tippers (m³/5)
                          </span>
                        )}
                        {modalCalculations.rebarKg > 0 && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-300 text-blue-900 font-bold">
                            Rebar kg: {formatNumber(modalCalculations.rebarKg)} kg (D²/162 formula)
                          </span>
                        )}
                        {modalCalculations.blocks > 0 && (
                          <span className="px-2 py-0.5 rounded bg-stone-100 border border-stone-300 text-stone-900 font-bold">
                            Blocks: {modalCalculations.blocks} pcs (Area×10)
                          </span>
                        )}
                        {modalCalculations.cementBags === 0 && modalCalculations.sandTippers === 0 && modalCalculations.graniteTippers === 0 && modalCalculations.rebarKg === 0 && modalCalculations.blocks === 0 && (
                          <span className="text-[11px] text-slate-500 italic">
                            Measured work item &bull; Traceable unit rate applies directly to {formatNumber(modalCalculations.withWaste)} {modalUnit}.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rate from marketRates[region][item] + Amount = Qty * Rate */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-emerald-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-slate-700">Rate from marketRates:</span>
                        <div className="flex items-center space-x-1 font-mono">
                          <span className="text-xs font-bold text-slate-500">₦</span>
                          <input
                            type="number"
                            min="0"
                            value={modalCalculations.activeRate}
                            onChange={(e) => setCustomRate(Math.max(0, Number(e.target.value) || 0))}
                            className="w-24 px-2 py-1 text-xs font-mono font-extrabold border border-emerald-400 rounded bg-white text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          />
                          <span className="text-[10px] text-slate-500">/{modalUnit}</span>
                          {customRate !== null && (
                            <button
                              type="button"
                              onClick={() => setCustomRate(null)}
                              className="text-[10px] text-emerald-700 underline font-semibold hover:text-emerald-900 ml-1 cursor-pointer"
                              title="Reset to benchmark market rate"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-emerald-900 font-bold uppercase block">
                          Amount = Qty × Rate
                        </span>
                        <span className="text-base font-mono font-black text-emerald-950 block">
                          {formatNaira(modalCalculations.amount)}
                        </span>
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>

            {/* Footer Buttons: [Cancel] [Save & Calculate] */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMeasurementModalOpen(false);
                  setModalItem(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveMeasurement}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg shadow-md hover:shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save &amp; Calculate</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANUAL ITEM CREATION MODAL: Room to add manual items to any section */}
      {/* ========================================================================= */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="text-base font-black text-slate-900">Add Manual Item to Estimate</h3>
                  <span className="text-xs font-bold text-emerald-700">
                    {BTL_SECTIONS.find(s => s.key === manualTargetSection)?.name || manualTargetSection}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Section Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Trade Section</label>
              <select
                value={manualTargetSection}
                onChange={(e) => setManualTargetSection(e.target.value as BtlSectionKey)}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {BTL_SECTIONS.map((sec) => (
                  <option key={sec.key} value={sec.key}>
                    0{sec.number}. {sec.name} ({sec.besmmTrade})
                  </option>
                ))}
              </select>
            </div>

            {/* If section is Preliminaries, show quick 1-click preset selector */}
            {manualTargetSection === 'preliminaries' && (
              <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl space-y-1.5">
                <span className="text-[10px] font-black uppercase text-emerald-900 block tracking-wider">
                  BESMM4 Preliminaries 1-Click Templates:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRELIM_MANUAL_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setManualForm({
                          name: p.name,
                          description: p.desc,
                          unit: p.unit,
                          qty: p.qty,
                          unitRate: p.rate,
                          wastePercent: p.waste,
                          labourCost: p.labour,
                        });
                      }}
                      className="text-[10px] font-bold px-2 py-1 rounded bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 transition cursor-pointer shadow-2xs"
                    >
                      {p.name.split('&')[0]} ({formatNaira(p.rate)})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Item Title / Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Heavy Duty Dewatering Pump Hire, Site Signboard, etc."
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Description / Specification</label>
                <textarea
                  rows={2}
                  placeholder="Detailed scope, specifications, contractor requirements or preliminary conditions..."
                  value={manualForm.description}
                  onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Unit of Measurement</label>
                  <select
                    value={manualForm.unit}
                    onChange={(e) => setManualForm({ ...manualForm, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="item">item (Lump Sum)</option>
                    <option value="month">month (Duration)</option>
                    <option value="sum">sum (Provisional Sum)</option>
                    <option value="ls">ls (Lump Sum)</option>
                    <option value="m">m (Linear)</option>
                    <option value="m2">m2 (Area)</option>
                    <option value="m3">m3 (Volume)</option>
                    <option value="kg">kg (Weight)</option>
                    <option value="nos">nos (Count)</option>
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="day">day (Daily Rate)</option>
                    <option value="wk">wk (Weekly Rate)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Waste Allowance (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={manualForm.wastePercent}
                    onChange={(e) => setManualForm({ ...manualForm, wastePercent: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Quantity / Count</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={manualForm.qty}
                    onChange={(e) => setManualForm({ ...manualForm, qty: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Unit Rate (₦/{manualForm.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={manualForm.unitRate}
                    onChange={(e) => setManualForm({ ...manualForm, unitRate: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-emerald-800"
                  />
                </div>
              </div>

              {/* Total Calculation Preview Card */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-900 font-extrabold uppercase block">
                    Calculated Total ({selectedRegion})
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    {manualForm.qty} {manualForm.unit} @ ₦{manualForm.unitRate.toLocaleString()}/{manualForm.unit}
                    {manualForm.wastePercent > 0 ? ` (+${manualForm.wastePercent}% waste)` : ''}
                    {regMultiplier !== 1 ? ` (×${regMultiplier} reg factor)` : ''}
                  </span>
                </div>
                <span className="text-base font-black font-mono text-emerald-950">
                  {formatNaira(Math.round(manualForm.qty * manualForm.unitRate * (1 + manualForm.wastePercent / 100) * regMultiplier))}
                </span>
              </div>

            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveManualItem}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Save &amp; Add to Section</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

import { LAGOS_BASE_RATES, REGIONAL_FACTORS, MarketRegion } from '../../data/marketRatesData';

export type WorkSectionKey = 
  | 'groundwork' 
  | 'concrete' 
  | 'blockwork' 
  | 'roofing' 
  | 'formwork' 
  | 'reinforcement' 
  | 'finishes' 
  | 'external';

export interface WorkSectionDef {
  key: WorkSectionKey;
  code: string;
  title: string;
  shortDesc: string;
  besmm4Trade: string;
  iconName: string;
}

export const WORK_SECTIONS: WorkSectionDef[] = [
  { key: 'groundwork', code: '[D]', title: 'Groundwork', shortDesc: 'Site clearance, topsoil strip, excavation & filling', besmm4Trade: 'Substructure', iconName: 'Shovel' },
  { key: 'concrete', code: '[E]', title: 'Concrete', shortDesc: 'Grade 15/25/30 mix, footings, columns, beams & slabs', besmm4Trade: 'Reinforced Concrete Frame', iconName: 'Layers' },
  { key: 'blockwork', code: '[F]', title: 'Blockwork', shortDesc: '150mm & 225mm vibrated sandcrete walls with deductions', besmm4Trade: 'Blockwork & Partitioning', iconName: 'Box' },
  { key: 'roofing', code: '[G]', title: 'Roofing', shortDesc: 'Gable & hip geometry, sheets, ridge caps & purlins', besmm4Trade: 'Roofing & Rainwater Goods', iconName: 'Home' },
  { key: 'formwork', code: '[M]', title: 'Formwork', shortDesc: 'Foundation sides, marine board, columns, beams & slab soffits', besmm4Trade: 'Carpentry, Doors & Windows', iconName: 'Grid' },
  { key: 'reinforcement', code: '[J]', title: 'Reinforcement', shortDesc: 'High-yield rebar Y8-Y25, links, lapping & binding wire', besmm4Trade: 'Reinforced Concrete Frame', iconName: 'Activity' },
  { key: 'finishes', code: '[Q]', title: 'Finishes', shortDesc: 'Plastering, 50mm floor screeding, tiling & wall painting', besmm4Trade: 'Finishes (Plastering, Tiling & Screed)', iconName: 'Brush' },
  { key: 'external', code: '[Ext]', title: 'External Works', shortDesc: '60mm interlocking paving, fencing, concrete drains & kerbs', besmm4Trade: 'External Works & Preliminaries', iconName: 'Trees' },
];

export interface DeductionItem {
  id: string;
  name: string;
  type: 'door' | 'window' | 'void' | 'opening';
  width: number; // m
  height: number; // m
  qty: number;
}

export interface MaterialCostSummary {
  label: string;
  quantity: number;
  unit: string;
  unitRate: number;
  totalCost: number;
}

export interface CalculatedSectionResult {
  sectionKey: WorkSectionKey;
  itemName: string;
  besmm4Trade: string;
  billDescription: string;
  primaryQty: number;
  primaryUnit: string;
  labourDays: number;
  labourCost: number;
  materialsCost: number;
  plantCost: number;
  totalCost: number;
  derivedUnitRate: number;
  materials: MaterialCostSummary[];
  notes: string[];
  keyOutputs?: Array<{ label: string; value: string; highlight?: boolean }>;
}

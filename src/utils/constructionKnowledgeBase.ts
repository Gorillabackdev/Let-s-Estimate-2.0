/**
 * Let's Estimate - Construction Knowledge Base & Deterministic Rules Engine
 * Encodes Nigerian Quantity Surveying standards (BESMM4 / NIQS / SMM7)
 * Implements architectural, structural, and trade rules.
 */

import { BoqItem, ProjectQuestionnaire, QuantitySource } from '../types';

export interface GeneratedTradeItem {
  section: string;
  item_code: string;
  item: string;
  description: string;
  unit: string;
  baseQtyFormula: (params: ProjectParameters) => number;
  rateKey: string;
  defaultRate: number;
  source: QuantitySource;
  sourceNote?: string;
  condition?: (q: ProjectQuestionnaire) => boolean;
}

export interface ProjectParameters {
  gfa: number;
  floors: number;
  rooms: number;
  perimeter: number;
  wallHeight: number;
  roofArea: number;
  isBungalow: boolean;
  isRcFrame: boolean;
  isStripFoundation: boolean;
  isRaftFoundation: boolean;
  terrain: string;
}

/**
 * Calculates geometric proxies based on questionnaire answers
 */
export function deriveGeometricParameters(q: ProjectQuestionnaire): ProjectParameters {
  const gfa = Math.max(40, Number(q.general.approximateGFA) || 180);
  const floors = Math.max(1, Number(q.general.numberOfFloors) || (q.general.buildingType === 'Bungalow' ? 1 : 2));
  const rooms = Math.max(1, Number(q.general.numberOfRooms) || 4);
  const isBungalow = q.general.buildingType === 'Bungalow' || floors === 1;

  // Ground footprint area = GFA / floors
  const footprintArea = gfa / floors;

  // Approximate rectangular perimeter = 2 * (length + width) ~ 4.2 * sqrt(footprint)
  const perimeter = Math.round(4.4 * Math.sqrt(footprintArea));

  // Floor-to-ceiling height (standard Nigerian residential = 3.0m to 3.15m)
  const wallHeight = 3.0;

  // Approximate pitched roof area with 30-35 degree pitch + 600mm eaves overhang
  const roofArea = Math.round(footprintArea * 1.35);

  const isRcFrame = q.superstructure.structuralSystem === 'Reinforced concrete frame' || q.superstructure.columns === 'Yes';
  const isStripFoundation = q.substructure.foundationType === 'Strip foundation' || (isBungalow && q.substructure.foundationType !== 'Raft foundation' && q.substructure.foundationType !== 'Pile foundation');
  const isRaftFoundation = q.substructure.foundationType === 'Raft foundation' || q.general.terrain === 'Swamp' || q.general.terrain === 'Waterlogged';

  return {
    gfa,
    floors,
    rooms,
    perimeter,
    wallHeight,
    roofArea,
    isBungalow,
    isRcFrame,
    isStripFoundation,
    isRaftFoundation,
    terrain: q.general.terrain,
  };
}

/**
 * Full BESMM4 / NIQS Construction Work Breakdown Structure with Conditional Logic
 */
export const WBS_TRADE_DEFINITIONS: GeneratedTradeItem[] = [
  // ==========================================
  // 1. PRELIMINARIES
  // ==========================================
  {
    section: 'Preliminaries',
    item_code: '1.1',
    item: 'Site Mobilisation',
    description: 'Mobilisation of plant, labour, temporary site office, storage shed, and initial site security setup',
    unit: 'Item',
    baseQtyFormula: () => 1,
    rateKey: 'mobilisation',
    defaultRate: 750000,
    source: 'ESTIMATED',
    sourceNote: 'Standard preliminary site establishment allowance',
  },
  {
    section: 'Preliminaries',
    item_code: '1.2',
    item: 'Water and Electricity for the Works',
    description: 'Provision of temporary bore-hole water supply and generator power for the execution of construction works',
    unit: 'Item',
    baseQtyFormula: () => 1,
    rateKey: 'site_utilities',
    defaultRate: 650000,
    source: 'ESTIMATED',
  },
  {
    section: 'Preliminaries',
    item_code: '1.3',
    item: 'Signboard & Safety Protection',
    description: 'Statutory project signboard, first aid kits, personal protective equipment (PPE), and safety barriers',
    unit: 'Item',
    baseQtyFormula: () => 1,
    rateKey: 'safety_signboard',
    defaultRate: 350000,
    source: 'ESTIMATED',
  },

  // ==========================================
  // 2. SUBSTRUCTURE
  // ==========================================
  {
    section: 'Substructure',
    item_code: '2.1',
    item: 'Site Clearance',
    description: 'Clear the site of all vegetation, shrubs, and small trees and cart away rubbish to approved dump site',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round((p.gfa / p.floors) * 1.5),
    rateKey: 'site_clearance',
    defaultRate: 850,
    source: 'CALCULATED',
    sourceNote: 'Calculated from building footprint + 3m working buffer',
  },
  {
    section: 'Substructure',
    item_code: '2.2',
    item: 'Setting Out',
    description: 'Setting out the building lines and levels including profiles, pegs, and baseline datum references',
    unit: 'Item',
    baseQtyFormula: () => 1,
    rateKey: 'setting_out',
    defaultRate: 180000,
    source: 'ESTIMATED',
  },
  {
    section: 'Substructure',
    item_code: '2.3',
    item: 'Foundation Trench Excavation',
    description: 'Excavate trenches for foundation strip footings starting from stripped level not exceeding 1.20m deep in firm soil',
    unit: 'm3',
    baseQtyFormula: (p) => Math.round(p.perimeter * 0.675 * 1.05 * 1.3), // internal + external trenches
    rateKey: 'trench_excavation',
    defaultRate: 6500,
    source: 'CALCULATED',
    sourceNote: 'Derived from wall run perimeter and standard 675mm strip trench width',
    condition: (q) => q.substructure.foundationType !== 'Raft foundation' && q.substructure.foundationType !== 'Pile foundation',
  },
  {
    section: 'Substructure',
    item_code: '2.3-raft',
    item: 'Raft Foundation Bulk Excavation',
    description: 'Excavate oversite for raft foundation slab and perimeter downstand edge beams not exceeding 1.5m deep',
    unit: 'm3',
    baseQtyFormula: (p) => Math.round((p.gfa / p.floors) * 1.2),
    rateKey: 'raft_excavation',
    defaultRate: 7500,
    source: 'CALCULATED',
    condition: (q) => q.substructure.foundationType === 'Raft foundation',
  },
  {
    section: 'Substructure',
    item_code: '2.4',
    item: 'Earthwork Disposal',
    description: 'Disposal of surplus excavated spoil material away from site by mechanical tippers',
    unit: 'm3',
    baseQtyFormula: (p) => Math.round(p.perimeter * 0.675 * 0.5),
    rateKey: 'earthwork_disposal',
    defaultRate: 4500,
    source: 'CALCULATED',
  },
  {
    section: 'Substructure',
    item_code: '2.5',
    item: 'Anti-Termite Treatment',
    description: 'Approved chemical anti-termite treatment (Termiticide solution) applied to sides and bottom of trenches and hardcore surface',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round(p.gfa / p.floors + p.perimeter * 2),
    rateKey: 'anti_termite',
    defaultRate: 1200,
    source: 'CALCULATED',
  },
  {
    section: 'Substructure',
    item_code: '2.6',
    item: 'Concrete Blinding (1:3:6)',
    description: '50mm thick plain in-situ mass concrete (1:3:6) blinding under foundation footings/downstand beams',
    unit: 'm3',
    baseQtyFormula: (p) => Math.round(p.perimeter * 0.675 * 0.05 * 1.3),
    rateKey: 'concrete_blinding',
    defaultRate: 98000,
    source: 'CALCULATED',
  },
  {
    section: 'Substructure',
    item_code: '2.7',
    item: 'Reinforced Concrete Footing (1:2:4)',
    description: 'Reinforced in-situ concrete Grade 25 (1:2:4 - 20mm aggregate) in foundation strip footings',
    unit: 'm3',
    baseQtyFormula: (p) => Math.round(p.perimeter * 0.675 * 0.225 * 1.3),
    rateKey: 'foundation_concrete',
    defaultRate: 185000,
    source: 'CALCULATED',
    condition: (q) => q.substructure.foundationType !== 'Raft foundation',
  },
  {
    section: 'Substructure',
    item_code: '2.7-raft',
    item: 'Reinforced Concrete Raft Slab & Beams',
    description: 'Reinforced concrete Grade 25 in 250mm thick raft foundation slab and downstand beams',
    unit: 'm3',
    baseQtyFormula: (p) => Math.round((p.gfa / p.floors) * 0.25 + p.perimeter * 0.3 * 0.4),
    rateKey: 'raft_concrete',
    defaultRate: 195000,
    source: 'CALCULATED',
    condition: (q) => q.substructure.foundationType === 'Raft foundation',
  },
  {
    section: 'Substructure',
    item_code: '2.8',
    item: 'Foundation Blockwork',
    description: '225mm thick solid/vibrated hollow sandcrete blockwork in cement mortar (1:3) in foundation trenches filled with lean concrete up to DPC',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round(p.perimeter * 0.9 * 1.3),
    rateKey: 'foundation_blockwork',
    defaultRate: 15500,
    source: 'CALCULATED',
  },
  {
    section: 'Substructure',
    item_code: '2.9',
    item: 'Laterite / Sand Filling',
    description: 'Approved selected laterite filling in layers not exceeding 150mm thick, well rammed, watered, and compacted',
    unit: 'm3',
    baseQtyFormula: (p) => Math.round((p.gfa / p.floors) * 0.35),
    rateKey: 'sand_filling',
    defaultRate: 8500,
    source: 'CALCULATED',
  },
  {
    section: 'Substructure',
    item_code: '2.10',
    item: 'Hardcore Bed (150mm thick)',
    description: '150mm thick clean broken granite stones / crushed rock hardcore bed, rolled and blinded with sand',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round(p.gfa / p.floors),
    rateKey: 'hardcore_bed',
    defaultRate: 4800,
    source: 'CALCULATED',
  },
  {
    section: 'Substructure',
    item_code: '2.11',
    item: 'Damp Proof Membrane (DPM)',
    description: '1000-gauge polythene damp proof membrane laid over sand blinding with 150mm laps',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round((p.gfa / p.floors) * 1.15),
    rateKey: 'dpm_membrane',
    defaultRate: 1400,
    source: 'CALCULATED',
  },
  {
    section: 'Substructure',
    item_code: '2.12',
    item: 'Ground Floor Oversite Concrete Slab (150mm)',
    description: '150mm thick in-situ reinforced concrete Grade 20 (1:2:4) in ground floor oversite slab with BRC wire mesh A142',
    unit: 'm3',
    baseQtyFormula: (p) => Math.round((p.gfa / p.floors) * 0.15),
    rateKey: 'ground_slab_concrete',
    defaultRate: 180000,
    source: 'CALCULATED',
  },

  // ==========================================
  // 3. SUPERSTRUCTURE
  // ==========================================
  // NOTE: BUNGALOW LOAD-BEARING RULE: Exclude columns & beams if load-bearing bungalow without columns
  {
    section: 'Superstructure',
    item_code: '3.1',
    item: 'Reinforced Concrete Columns',
    description: 'Reinforced concrete Grade 25 in 225x225mm isolated columns including high-yield rebar and formwork',
    unit: 'm3',
    baseQtyFormula: (p) => Math.round(p.rooms * 3 * 0.225 * 0.225 * p.wallHeight * (p.floors)),
    rateKey: 'rc_columns',
    defaultRate: 210000,
    source: 'CALCULATED',
    condition: (q) => q.superstructure.structuralSystem === 'Reinforced concrete frame' || q.superstructure.columns === 'Yes' || q.general.numberOfFloors > 1,
  },
  {
    section: 'Superstructure',
    item_code: '3.2',
    item: 'Reinforced Concrete Beams & Lintels',
    description: 'Reinforced concrete Grade 25 in suspended floor beams and 225x225mm lintels over openings',
    unit: 'm3',
    baseQtyFormula: (p) => Math.round(p.perimeter * 0.225 * 0.3 * (p.floors > 1 ? p.floors : 0.4)),
    rateKey: 'rc_beams',
    defaultRate: 200000,
    source: 'CALCULATED',
  },
  {
    section: 'Superstructure',
    item_code: '3.3',
    item: 'Suspended Floor Slab (150mm)',
    description: '150mm thick reinforced concrete Grade 25 in suspended floor slab including props and marine board formwork',
    unit: 'm3',
    baseQtyFormula: (p) => Math.round((p.gfa / p.floors) * 0.15 * (p.floors - 1)),
    rateKey: 'suspended_slab',
    defaultRate: 220000,
    source: 'CALCULATED',
    condition: (q) => q.general.numberOfFloors > 1 || q.superstructure.suspendedSlabs === 'Yes',
  },
  {
    section: 'Superstructure',
    item_code: '3.4',
    item: 'External Sandcrete Blockwork (225mm)',
    description: '225mm thick vibrated hollow sandcrete blockwork in cement mortar (1:4) for external walls',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round(p.perimeter * p.wallHeight * p.floors * 0.82), // minus door/window openings
    rateKey: 'external_blockwork',
    defaultRate: 14500,
    source: 'CALCULATED',
    sourceNote: 'Net wall area after deducting door and window openings',
  },
  {
    section: 'Superstructure',
    item_code: '3.5',
    item: 'Internal Partition Blockwork (150mm)',
    description: '150mm thick vibrated hollow sandcrete blockwork in cement mortar (1:4) for internal room partitions',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round(p.perimeter * 0.7 * p.wallHeight * p.floors * 0.85),
    rateKey: 'internal_blockwork',
    defaultRate: 12500,
    source: 'CALCULATED',
  },
  {
    section: 'Superstructure',
    item_code: '3.6',
    item: 'Reinforced Concrete Staircase',
    description: 'Reinforced concrete Grade 25 in waist slab, risers, treads, and landing for main staircase',
    unit: 'm3',
    baseQtyFormula: (p) => (p.floors - 1) * 3.5,
    rateKey: 'rc_staircase',
    defaultRate: 230000,
    source: 'CALCULATED',
    condition: (q) => q.general.numberOfFloors > 1 && q.superstructure.staircase !== 'None',
  },

  // ==========================================
  // 4. ROOFING
  // ==========================================
  {
    section: 'Roofing',
    item_code: '4.1',
    item: 'Hardwood Timber Roof Carcassing',
    description: '50x150mm, 50x100mm, and 50x75mm treated semi-hardwood timber trusses, rafters, purlins, and wall plates',
    unit: 'm2',
    baseQtyFormula: (p) => p.roofArea,
    rateKey: 'timber_carcassing',
    defaultRate: 16500,
    source: 'CALCULATED',
    sourceNote: 'Measured on plan area with slope factor',
    condition: (q) => q.roofing.roofStructure !== 'Reinforced concrete',
  },
  {
    section: 'Roofing',
    item_code: '4.2',
    item: 'Aluminium Longspan Roofing Sheets (0.55mm)',
    description: '0.55mm gauge step-tile / corrugated aluminium longspan roofing sheets fixed to timber purlins with drive screws and neoprene washers',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round(p.roofArea * 1.08), // allowance for laps
    rateKey: 'roof_covering',
    defaultRate: 28500,
    source: 'CALCULATED',
    condition: (q) => q.roofing.roofCovering === 'Aluminium longspan' || q.roofing.roofCovering === 'Other' || q.roofing.roofCovering === 'Unknown',
  },
  {
    section: 'Roofing',
    item_code: '4.2-stone',
    item: 'Stone-Coated Steel Roofing Tiles',
    description: '0.45mm pressed steel stone-coated interlocking roofing tiles fixed to 50x50mm timber battens',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round(p.roofArea * 1.1),
    rateKey: 'stone_roof_covering',
    defaultRate: 36000,
    source: 'CALCULATED',
    condition: (q) => q.roofing.roofCovering === 'Stone-coated',
  },
  {
    section: 'Roofing',
    item_code: '4.3',
    item: 'Ridge and Hip Caps',
    description: 'Matching gauge aluminium / stone-coated ridge and hip capping pieces fixed to timber ridges',
    unit: 'm',
    baseQtyFormula: (p) => Math.round(p.perimeter * 0.45),
    rateKey: 'ridge_caps',
    defaultRate: 6500,
    source: 'CALCULATED',
  },
  {
    section: 'Roofing',
    item_code: '4.4',
    item: 'Valley Gutters & Flashings',
    description: '0.55mm aluminium box valley gutters with bitumen felt underlay (strictly applicable for hip/valley roof geometries)',
    unit: 'm',
    baseQtyFormula: (p) => Math.round(p.perimeter * 0.25),
    rateKey: 'valley_gutters',
    defaultRate: 8500,
    source: 'CALCULATED',
    // CRITICAL CONDITIONAL RULE: Only generate valleys if hip/valley combination is specified!
    condition: (q) => q.roofing.roofType === 'Hip/Gable combination' || q.roofing.features.valleys,
  },
  {
    section: 'Roofing',
    item_code: '4.5',
    item: 'Fascia & Soffit Board (300mm)',
    description: '20mm x 300mm seasoned timber / UPVC external fascia board and vented soffit lining',
    unit: 'm',
    baseQtyFormula: (p) => Math.round(p.perimeter * 1.1),
    rateKey: 'fascia_board',
    defaultRate: 7500,
    source: 'CALCULATED',
  },
  {
    section: 'Roofing',
    item_code: '4.6',
    item: 'Rainwater Gutters & Downpipes',
    description: '150mm half-round UPVC rainwater guttering with 75mm diameter downpipes and offset brackets',
    unit: 'm',
    baseQtyFormula: (p) => Math.round(p.perimeter * 0.9 + p.floors * 12),
    rateKey: 'gutters_downpipes',
    defaultRate: 6800,
    source: 'CALCULATED',
    condition: (q) => q.roofing.features.gutters || q.roofing.features.downpipes,
  },

  // ==========================================
  // 5. DOORS & WINDOWS
  // ==========================================
  {
    section: 'Doors & Windows',
    item_code: '5.1',
    item: 'External Security Steel Doors (900x2100mm)',
    description: 'Reinforced security armored steel entrance doors (900x2100mm) with multi-point locking mechanisms',
    unit: 'No',
    baseQtyFormula: (p) => Math.max(2, p.floors * 2),
    rateKey: 'external_security_doors',
    defaultRate: 145000,
    source: 'CALCULATED',
  },
  {
    section: 'Doors & Windows',
    item_code: '5.2',
    item: 'Internal Timber Flush Doors (800x2100mm)',
    description: 'Solid core timber panel flush doors (800x2100mm) including hardwood frames, architraves, and mortice locksets',
    unit: 'No',
    baseQtyFormula: (p) => Math.max(4, p.rooms * 2),
    rateKey: 'internal_flush_doors',
    defaultRate: 68000,
    source: 'CALCULATED',
  },
  {
    section: 'Doors & Windows',
    item_code: '5.3',
    item: 'Aluminium Sliding Glazed Windows (1200x1200mm)',
    description: 'Powder-coated aluminium sliding windows with 5mm tinted glass, insect fly-screens, and hardware',
    unit: 'No',
    baseQtyFormula: (p) => Math.max(6, Math.round(p.rooms * 2.5)),
    rateKey: 'sliding_windows',
    defaultRate: 72000,
    source: 'CALCULATED',
  },
  {
    section: 'Doors & Windows',
    item_code: '5.4',
    item: 'Burglar Proofing Grilles',
    description: 'Wrought iron burglar security grilles (1200x1200mm) manufactured from 16mm square mild steel solid bars primed and painted',
    unit: 'No',
    baseQtyFormula: (p) => Math.max(6, Math.round(p.rooms * 2.5)),
    rateKey: 'burglar_bars',
    defaultRate: 24000,
    source: 'CALCULATED',
  },

  // ==========================================
  // 6. FINISHES
  // ==========================================
  {
    section: 'Finishes',
    item_code: '6.1',
    item: 'Internal Cement-Sand Plastering (15mm)',
    description: '15mm thick cement and washed sand plaster (1:4) to internal wall faces trowelled to a smooth flat finish',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round((p.perimeter * p.floors + p.rooms * 14) * p.wallHeight * 0.9),
    rateKey: 'internal_plastering',
    defaultRate: 4200,
    source: 'CALCULATED',
  },
  {
    section: 'Finishes',
    item_code: '6.2',
    item: 'External Wall Rendering (15mm)',
    description: '15mm thick cement-sand rendering (1:3) with waterproofing additive to all external blockwork elevations',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round(p.perimeter * p.wallHeight * p.floors * 0.85),
    rateKey: 'external_rendering',
    defaultRate: 4600,
    source: 'CALCULATED',
  },
  {
    section: 'Finishes',
    item_code: '6.3',
    item: 'Floor Tile Screed & Vitrified Floor Tiles',
    description: '600x600mm polished vitrified porcelain floor tiles laid on 38mm cement mortar bed with matching grout',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round(p.gfa * 0.88),
    rateKey: 'floor_tiles',
    defaultRate: 15500,
    source: 'CALCULATED',
  },
  {
    section: 'Finishes',
    item_code: '6.4',
    item: 'Glazed Wall Tiles in Wet Areas',
    description: '300x600mm ceramic glazed wall tiles in bathrooms and kitchen splashback up to 2.1m height',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round(p.rooms * 18),
    rateKey: 'wall_tiles',
    defaultRate: 13500,
    source: 'CALCULATED',
  },
  {
    section: 'Finishes',
    item_code: '6.5',
    item: 'Plaster of Paris (POP) Ceiling',
    description: 'Suspended Plaster of Paris (POP) ceiling with recessed decorative cornice moulding and light troughs',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round(p.gfa * 0.92),
    rateKey: 'pop_ceiling',
    defaultRate: 9500,
    source: 'CALCULATED',
    condition: (q) => q.finishes.ceilings === 'POP',
  },
  {
    section: 'Finishes',
    item_code: '6.5-pvc',
    item: 'PVC Strip Ceiling Panels',
    description: 'Tongue and groove interlocking PVC decorative ceiling panels on 50x50mm hardwood noggings',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round(p.gfa * 0.92),
    rateKey: 'pvc_ceiling',
    defaultRate: 6800,
    source: 'CALCULATED',
    condition: (q) => q.finishes.ceilings === 'PVC',
  },
  {
    section: 'Finishes',
    item_code: '6.6',
    item: 'Internal Emulsion Painting',
    description: 'Prepare and apply one coat primer and two finishing coats of washable interior acrylic emulsion paint (Dulux / Meyer)',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round((p.perimeter * p.floors + p.rooms * 14) * p.wallHeight * 0.9),
    rateKey: 'internal_paint',
    defaultRate: 2200,
    source: 'CALCULATED',
  },
  {
    section: 'Finishes',
    item_code: '6.7',
    item: 'External Weather-shield Textured Paint',
    description: 'Two coats of heavy-duty exterior weather-shield textured emulsion paint to all external rendered surfaces',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round(p.perimeter * p.wallHeight * p.floors * 0.85),
    rateKey: 'external_paint',
    defaultRate: 3100,
    source: 'CALCULATED',
  },

  // ==========================================
  // 7. SERVICES (ELECTRICAL & PLUMBING)
  // Respecting 'Excluded' and 'Separate contract'
  // ==========================================
  {
    section: 'Services',
    item_code: '7.1',
    item: 'Electrical Conduit & Wiring First-Fix',
    description: 'PVC conduit piping, junction boxes, and copper wiring embedded in slabs and block walls for lighting and socket circuits',
    unit: 'Item',
    baseQtyFormula: () => 1,
    rateKey: 'electrical_first_fix',
    defaultRate: 1850000,
    source: 'ESTIMATED',
    sourceNote: 'Based on total points count and distribution board schedule',
    condition: (q) => q.services.electrical === 'Included',
  },
  {
    section: 'Services',
    item_code: '7.2',
    item: 'Electrical Fittings & Distribution Board Second-Fix',
    description: 'Standard 13A switch sockets, lighting fixtures, LED spotlights, distribution board with MCBs, and earth rod',
    unit: 'Item',
    baseQtyFormula: () => 1,
    rateKey: 'electrical_second_fix',
    defaultRate: 1650000,
    source: 'ESTIMATED',
    condition: (q) => q.services.electrical === 'Included',
  },
  {
    section: 'Services',
    item_code: '7.3',
    item: 'Plumbing Soil, Waste & Vent Pipework First-Fix',
    description: '100mm and 50mm heavy gauge PVC soil and waste discharge stacks, vent pipes, and PPR cold/hot water distribution pipes',
    unit: 'Item',
    baseQtyFormula: () => 1,
    rateKey: 'plumbing_first_fix',
    defaultRate: 1450000,
    source: 'ESTIMATED',
    condition: (q) => q.services.plumbing === 'Included',
  },
  {
    section: 'Services',
    item_code: '7.4',
    item: 'Sanitary Appliances Second-Fix',
    description: 'Vitreous china water closets (WC), ceramic wash hand basins with pedestals, mixer taps, shower sets, and water heaters',
    unit: 'Item',
    baseQtyFormula: () => 1,
    rateKey: 'sanitary_appliances',
    defaultRate: 1950000,
    source: 'ESTIMATED',
    condition: (q) => q.services.plumbing === 'Included',
  },

  // ==========================================
  // 8. EXTERNAL WORKS & DRAINAGE
  // ==========================================
  {
    section: 'External Works',
    item_code: '8.1',
    item: 'Septic Tank and Soakaway Pit',
    description: 'Construct 25-user capacity reinforced concrete block septic tank (3.6m x 1.8m x 2.1m deep) and circular soakaway pit with hardcore filter',
    unit: 'Item',
    baseQtyFormula: () => 1,
    rateKey: 'septic_tank',
    defaultRate: 1850000,
    source: 'CALCULATED',
    condition: (q) => q.services.drainage === 'Included' || q.services.externalWorks === 'Included',
  },
  {
    section: 'External Works',
    item_code: '8.2',
    item: 'Surface Water Peripheral Drainage',
    description: '225mm wide cast in-situ concrete storm water drains with precast concrete perforated grating covers',
    unit: 'm',
    baseQtyFormula: (p) => Math.round(p.perimeter * 1.2),
    rateKey: 'surface_drainage',
    defaultRate: 28000,
    source: 'CALCULATED',
    condition: (q) => q.services.drainage === 'Included',
  },
  {
    section: 'External Works',
    item_code: '8.3',
    item: 'Compound Interlocking Paving Stones',
    description: '60mm thick heavy-duty vibrated concrete interlocking paving stones laid on 50mm compacted sand bed',
    unit: 'm2',
    baseQtyFormula: (p) => Math.round((p.gfa / p.floors) * 1.5),
    rateKey: 'interlocking_paving',
    defaultRate: 12500,
    source: 'CALCULATED',
    condition: (q) => q.services.landscaping === 'Included' || q.services.externalWorks === 'Included',
  },
  {
    section: 'External Works',
    item_code: '8.4',
    item: 'Perimeter Fence Wall (225mm)',
    description: '225mm sandcrete block perimeter boundary fence wall (2.1m high) with coping, plastering, and foundation',
    unit: 'm',
    baseQtyFormula: (p) => Math.round(p.perimeter * 2.2),
    rateKey: 'perimeter_fence',
    defaultRate: 48000,
    source: 'CALCULATED',
    condition: (q) => q.services.fenceWall === 'Included',
  },
  {
    section: 'External Works',
    item_code: '8.5',
    item: 'Vehicular Entrance Gate & Pedestrian Wicket',
    description: 'Fabricated wrought iron vehicular entrance sliding gate (4.0m x 2.1m) and pedestrian wicket gate primed and painted',
    unit: 'Item',
    baseQtyFormula: () => 1,
    rateKey: 'entrance_gate',
    defaultRate: 850000,
    source: 'ESTIMATED',
    condition: (q) => q.services.gate === 'Included',
  },
  {
    section: 'Provisional Sums',
    item_code: '9.1',
    item: 'Provisional Sum for Contingencies',
    description: 'Provisional sum for unforeseen site conditions, rock excavation, and client design refinements to be expended at the direction of the Architect / Quantity Surveyor',
    unit: 'Item',
    baseQtyFormula: () => 1,
    rateKey: 'contingency_sum',
    defaultRate: 1500000,
    source: 'ESTIMATED',
    sourceNote: 'Standard contractual contingency allocation',
  },
];

/**
 * Executes deterministic rules engine to produce a comprehensive BOQ
 * calibrated to the questionnaire and parameters.
 */
export function generateDeterministicBoq(
  questionnaire: ProjectQuestionnaire,
  customRates: Record<string, number> = {}
): BoqItem[] {
  const params = deriveGeometricParameters(questionnaire);

  let itemCounter = 1;
  const items: BoqItem[] = [];

  for (const def of WBS_TRADE_DEFINITIONS) {
    // Check conditional logic
    if (def.condition && !def.condition(questionnaire)) {
      continue;
    }

    const calculatedQty = Math.max(1, Math.round(def.baseQtyFormula(params) * 10) / 10);
    const rate = customRates[def.rateKey] || def.defaultRate;
    const amount = Math.round(calculatedQty * rate);

    items.push({
      id: `boq-item-${Date.now()}-${itemCounter}`,
      item_number: itemCounter,
      item_code: def.item_code,
      section: def.section,
      item: def.item,
      description: def.description,
      unit: def.unit,
      qty: calculatedQty,
      rate: rate,
      amount: amount,
      source: 'Preliminary Parametric Estimate',
      source_note: 'Assumed parametric quantity derived from questionnaire specifications (No drawing takeoff)',
      evidence: 'Preliminary Parametric: Based on project questionnaire geometry assumptions',
      confidence: 70,
      verification_status: 'Preliminary Parametric Estimate',
      is_ai_generated: false,
      is_confirmed: false,
      requires_confirmation: true,
    });

    itemCounter++;
  }

  return items;
}

/**
 * Creates default questionnaire state for new projects
 */
export function createDefaultQuestionnaire(overrides?: Partial<ProjectQuestionnaire>): ProjectQuestionnaire {
  return {
    general: {
      projectType: 'Residential',
      buildingType: 'Bungalow',
      numberOfBuildings: 1,
      numberOfFloors: 1,
      numberOfRooms: 4,
      approximateGFA: 220,
      numberOfUnits: 1,
      location: 'Lagos, Nigeria',
      terrain: 'Normal',
      ...(overrides?.general || {}),
    },
    substructure: {
      foundationType: 'Strip foundation',
      rcColumnsPresent: 'No',
      rcBeamsPresent: 'No',
      groundBeamsPresent: 'No',
      suspendedFloor: 'No',
      groundFloorConstruction: 'Ground-bearing slab',
      foundationDepth: '1.2m',
      basement: 'No',
      ...(overrides?.substructure || {}),
    },
    superstructure: {
      structuralSystem: 'Load-bearing masonry',
      columns: 'No',
      beams: 'No',
      suspendedSlabs: 'No',
      staircase: 'None',
      numberOfStaircases: 0,
      ...(overrides?.superstructure || {}),
    },
    roofing: {
      roofType: 'Hip/Gable combination',
      roofStructure: 'Timber',
      roofCovering: 'Aluminium longspan',
      features: {
        ridge: true,
        hips: true,
        valleys: true,
        fascia: true,
        soffit: true,
        gutters: true,
        downpipes: true,
        flashings: true,
        insulation: false,
      },
      ...(overrides?.roofing || {}),
    },
    finishes: {
      walls: 'Plaster/render',
      floors: 'Porcelain',
      ceilings: 'POP',
      doors: 'Timber',
      windows: 'Aluminium sliding',
      ...(overrides?.finishes || {}),
    },
    services: {
      electrical: 'Included',
      plumbing: 'Included',
      mechanical: 'Excluded',
      externalWorks: 'Included',
      landscaping: 'Included',
      drainage: 'Included',
      fenceWall: 'Included',
      gate: 'Included',
      ...(overrides?.services || {}),
    },
  };
}

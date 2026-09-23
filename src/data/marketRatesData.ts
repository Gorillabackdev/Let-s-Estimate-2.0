/**
 * Nigerian Construction Market Rates Engine
 * Calibrated to NIQS (Nigerian Institute of Quantity Surveyors) & BESMM4 standards.
 * Live localized price datasets for Lagos, Port Harcourt, Abuja, Kano, and Enugu.
 */

export type MarketRegion = 'Lagos' | 'Port Harcourt' | 'Abuja' | 'Kano' | 'Enugu';

export interface MarketRateItem {
  id: string;
  category: string;
  name: string;
  unit: string;
  price: number; // Current regional price in ₦
  niqsDefault: number; // NIQS baseline benchmark in ₦
  spec?: string;
  iconType?: 'cement' | 'sand' | 'granite' | 'block' | 'steel' | 'timber' | 'roof' | 'paint' | 'tile' | 'chemical' | 'mason' | 'carpenter' | 'labour' | 'tools' | 'truck' | 'mixer' | 'electric' | 'plumbing' | 'concrete';
  isCustom?: boolean;
}

export interface RegionalRatesDataset {
  region: MarketRegion;
  lastUpdated: string;
  coreMaterials: MarketRateItem[];
  labourWages: MarketRateItem[];
  plantHire: MarketRateItem[];
  compositeTrades: MarketRateItem[];
}

export const REGIONAL_FACTORS: Record<MarketRegion, {
  name: string;
  materialsMultiplier: number;
  labourMultiplier: number;
  plantMultiplier: number;
  compositeMultiplier: number;
  description: string;
}> = {
  'Lagos': {
    name: 'Lagos State (Baseline)',
    materialsMultiplier: 1.0,
    labourMultiplier: 1.0,
    plantMultiplier: 1.0,
    compositeMultiplier: 1.0,
    description: 'Commercial benchmark, direct port depot proximity, high skilled trade density.'
  },
  'Port Harcourt': {
    name: 'Port Harcourt (Rivers & Niger Delta)',
    materialsMultiplier: 1.12,
    labourMultiplier: 1.15,
    plantMultiplier: 1.18,
    compositeMultiplier: 1.14,
    description: 'Swamp/creek logistics, marine timber, high oil-hub artisanal labour wages.'
  },
  'Abuja': {
    name: 'Abuja (Federal Capital Territory)',
    materialsMultiplier: 1.08,
    labourMultiplier: 1.10,
    plantMultiplier: 1.12,
    compositeMultiplier: 1.09,
    description: 'Interstate haulage premiums on steel and timber, high compliance construction.'
  },
  'Kano': {
    name: 'Kano (Northern Regional Hub)',
    materialsMultiplier: 1.06,
    labourMultiplier: 0.88,
    plantMultiplier: 0.95,
    compositeMultiplier: 0.97,
    description: 'Inland transit haulage on imported steel, very competitive local artisan labour.'
  },
  'Enugu': {
    name: 'Enugu (South-East Regional Hub)',
    materialsMultiplier: 0.98,
    labourMultiplier: 0.95,
    plantMultiplier: 1.02,
    compositeMultiplier: 0.99,
    description: 'Abundant quarry stone & sharp sand proximity, established masonry guilds.'
  }
};

// Base Lagos Reference Data (Calibrated to NIQS & BESMM4)
export const LAGOS_BASE_RATES: RegionalRatesDataset = {
  region: 'Lagos',
  lastUpdated: '21 Aug 2025 • 09:32 AM',
  coreMaterials: [
    // 1. Cement
    { id: 'mat-cem-01', category: 'Cement', name: 'Dangote Cement 42.5N (50kg)', unit: 'bag', price: 9800, niqsDefault: 9500, spec: 'Grade 42.5N Portland Limestone Cement', iconType: 'cement' },
    { id: 'mat-cem-02', category: 'Cement', name: '32.5N Cement (50kg)', unit: 'bag', price: 9200, niqsDefault: 9000, spec: 'Grade 32.5N General Purpose Cement (Lafarge/Elephant)', iconType: 'cement' },
    { id: 'mat-cem-03', category: 'Cement', name: 'BUA Portland Cement 42.5N (50kg)', unit: 'bag', price: 9600, niqsDefault: 9400, spec: 'Grade 42.5N Rapid Hardening Cement', iconType: 'cement' },
    { id: 'mat-cem-04', category: 'Cement', name: 'White Portland Cement (40kg)', unit: 'bag', price: 16500, niqsDefault: 16000, spec: 'Imported White Architectural Cement', iconType: 'cement' },

    // 2. Aggregate & Filling
    { id: 'mat-agg-01', category: 'Aggregate', name: 'Sharp Sand (20-tonne)', unit: '20-tonne', price: 85000, niqsDefault: 80000, spec: 'Clean Screened River Sand (Dredged)', iconType: 'sand' },
    { id: 'mat-agg-02', category: 'Aggregate', name: 'Plaster Sand (20-tonne)', unit: '20-tonne', price: 70000, niqsDefault: 68000, spec: 'Fine Silt-Free Plastering / Rendering Sand', iconType: 'sand' },
    { id: 'mat-agg-03', category: 'Aggregate', name: 'Granite 3/4" (30-tonne)', unit: '30-tonne', price: 310000, niqsDefault: 300000, spec: '20mm Machine Crushed Granite Aggregate', iconType: 'granite' },
    { id: 'mat-agg-04', category: 'Aggregate', name: 'Granite 1/2" (30-tonne)', unit: '30-tonne', price: 290000, niqsDefault: 285000, spec: '12.5mm Clean Crushed Aggregate', iconType: 'granite' },
    { id: 'mat-agg-05', category: 'Aggregate', name: 'Stone Dust / Quarry Dust (30-tonne)', unit: '30-tonne', price: 220000, niqsDefault: 210000, spec: 'Granite Fines for Mortar & Screed', iconType: 'granite' },
    { id: 'mat-agg-06', category: 'Aggregate', name: 'Laterite Filling (per m³)', unit: 'm³', price: 4500, niqsDefault: 4200, spec: 'Selected Reddish Brown Burrow Fill Material', iconType: 'sand' },
    { id: 'mat-agg-07', category: 'Aggregate', name: 'Hardcore (per m³)', unit: 'm³', price: 8000, niqsDefault: 7500, spec: 'Broken Rock / Concrete Spalls for Subbase', iconType: 'granite' },

    // 3. Blocks & Masonry
    { id: 'mat-blk-01', category: 'Blocks', name: '150mm Hollow Block (per pc)', unit: 'pc', price: 550, niqsDefault: 520, spec: '6-inch Vibrated Sandcrete Block (Machine Moulded)', iconType: 'block' },
    { id: 'mat-blk-02', category: 'Blocks', name: '225mm Hollow Block (per pc)', unit: 'pc', price: 650, niqsDefault: 620, spec: '9-inch Vibrated Sandcrete Block (Machine Moulded)', iconType: 'block' },
    { id: 'mat-blk-03', category: 'Blocks', name: '125mm Solid Block (per pc)', unit: 'pc', price: 520, niqsDefault: 500, spec: '5-inch Solid Sandcrete Foundation Block', iconType: 'block' },
    { id: 'mat-blk-04', category: 'Blocks', name: 'Interlocking Paving Stones 60mm (per m²)', unit: 'm²', price: 4800, niqsDefault: 4600, spec: 'Heavy Duty 60mm Zig-zag / Cobble Paving', iconType: 'block' },

    // 4. Reinforcement
    { id: 'mat-stl-01', category: 'Reinforcement', name: '8mm Steel Rebar (per tonne)', unit: 'tonne', price: 480000, niqsDefault: 470000, spec: 'Grade TMT 500 N/mm2 High-Yield Ribbed Bar', iconType: 'steel' },
    { id: 'mat-stl-02', category: 'Reinforcement', name: '10mm Steel Rebar (per tonne)', unit: 'tonne', price: 485000, niqsDefault: 475000, spec: 'Grade TMT 500 High-Yield Ribbed Bar', iconType: 'steel' },
    { id: 'mat-stl-03', category: 'Reinforcement', name: '12mm Steel Rebar (per tonne)', unit: 'tonne', price: 485000, niqsDefault: 475000, spec: 'Grade TMT 500 High-Yield Ribbed Bar (12mm standard)', iconType: 'steel' },
    { id: 'mat-stl-04', category: 'Reinforcement', name: '16mm Steel Rebar (per tonne)', unit: 'tonne', price: 490000, niqsDefault: 480000, spec: 'Grade TMT 500 High-Yield Ribbed Bar', iconType: 'steel' },
    { id: 'mat-stl-05', category: 'Reinforcement', name: '20mm Steel Rebar (per tonne)', unit: 'tonne', price: 495000, niqsDefault: 485000, spec: 'Grade TMT 500 High-Yield Ribbed Bar', iconType: 'steel' },
    { id: 'mat-stl-06', category: 'Reinforcement', name: '25mm Steel Rebar (per tonne)', unit: 'tonne', price: 500000, niqsDefault: 490000, spec: 'Grade TMT 500 High-Yield Ribbed Bar', iconType: 'steel' },
    { id: 'mat-stl-07', category: 'Reinforcement', name: 'Binding Wire (per kg)', unit: 'kg', price: 1200, niqsDefault: 1150, spec: 'Black Annealed 16-Gauge Tying Wire', iconType: 'steel' },
    { id: 'mat-stl-08', category: 'Reinforcement', name: 'BRC Fabric Mesh No. 65 (per roll)', unit: 'roll', price: 42000, niqsDefault: 40000, spec: 'Welded Steel Mesh 2.4m x 48m for Ground Slabs', iconType: 'steel' },

    // 5. Timber / Formwork
    { id: 'mat-tmb-01', category: 'Timber/Formwork', name: '50x50mm per m', unit: 'm', price: 800, niqsDefault: 750, spec: '2"x2" Sawn Hardwood Timber (Mahogany/Obeche)', iconType: 'timber' },
    { id: 'mat-tmb-02', category: 'Timber/Formwork', name: '50x100mm per m', unit: 'm', price: 1500, niqsDefault: 1400, spec: '2"x4" Sawn Hardwood Timber', iconType: 'timber' },
    { id: 'mat-tmb-03', category: 'Timber/Formwork', name: '225x25mm plank per m', unit: 'm', price: 2200, niqsDefault: 2100, spec: '1"x9" Sawn Hardwood Shuttering Plank', iconType: 'timber' },
    { id: 'mat-tmb-04', category: 'Timber/Formwork', name: 'Marine Board 18mm per sheet', unit: 'sheet', price: 45000, niqsDefault: 43000, spec: '18mm Film-Faced Black Water-Resistant Plywood', iconType: 'timber' },
    { id: 'mat-tmb-05', category: 'Timber/Formwork', name: 'Nails assorted per kg', unit: 'kg', price: 2500, niqsDefault: 2300, spec: 'Assorted 2", 3", 4" Wire Construction Nails', iconType: 'tools' },
    { id: 'mat-tmb-06', category: 'Timber/Formwork', name: 'Bamboo Scaffold Props', unit: 'pc', price: 1200, niqsDefault: 1100, spec: '3.0m - 3.6m Mature Solid Bamboo Stem', iconType: 'timber' },

    // 6. Roofing / Ceiling
    { id: 'mat-rof-01', category: 'Roofing/Ceiling', name: 'Aluzinc 0.45mm per m2', unit: 'm2', price: 6500, niqsDefault: 6200, spec: '0.45mm Step-Tile Aluminium-Zinc Coated Sheet', iconType: 'roof' },
    { id: 'mat-rof-02', category: 'Roofing/Ceiling', name: 'Longspan 0.55mm per m2', unit: 'm2', price: 8500, niqsDefault: 8200, spec: '0.55mm Continuous Longspan Industrial Profile', iconType: 'roof' },
    { id: 'mat-rof-03', category: 'Roofing/Ceiling', name: 'POP Cement per bag', unit: 'bag', price: 12000, niqsDefault: 11500, spec: '40kg Plaster of Paris Casting Powder', iconType: 'cement' },
    { id: 'mat-rof-04', category: 'Roofing/Ceiling', name: 'POP Board per pc', unit: 'pc', price: 2500, niqsDefault: 2400, spec: 'Precast Gypsum Ceiling Board 1.2m x 2.4m', iconType: 'roof' },
    { id: 'mat-rof-05', category: 'Roofing/Ceiling', name: 'Bituminous Felt per roll', unit: 'roll', price: 18500, niqsDefault: 17500, spec: 'Heavy Duty 3-Ply Waterproofing Underlay', iconType: 'roof' },

    // 7. Finishes
    { id: 'mat-fin-01', category: 'Finishes', name: '600x600 Floor Tile per m2', unit: 'm2', price: 8500, niqsDefault: 8000, spec: 'Vitrified Porcelain Polished Floor Tile', iconType: 'tile' },
    { id: 'mat-fin-02', category: 'Finishes', name: 'Wall Tile per m2', unit: 'm2', price: 7500, niqsDefault: 7200, spec: '300x600mm Glazed Ceramic Bathroom/Kitchen Tile', iconType: 'tile' },
    { id: 'mat-fin-03', category: 'Finishes', name: 'Tile Adhesive 20kg', unit: 'bag', price: 6000, niqsDefault: 5800, spec: 'Polymer-Modified High Bond Ceramic Mortar', iconType: 'chemical' },
    { id: 'mat-fin-04', category: 'Finishes', name: 'Emulsion Paint 20L', unit: 'drum', price: 45000, niqsDefault: 42000, spec: 'Premium Acrylic Washable Interior/Exterior Emulsion', iconType: 'paint' },
    { id: 'mat-fin-05', category: 'Finishes', name: 'Gloss Paint 20L', unit: 'drum', price: 65000, niqsDefault: 62000, spec: 'Oil-Based Synthetic Alkyd Gloss Finish', iconType: 'paint' },
    { id: 'mat-fin-06', category: 'Finishes', name: 'Screeding Putty 20kg', unit: 'bag', price: 7200, niqsDefault: 6800, spec: 'White Interior Wall Skim Coat Putty', iconType: 'chemical' }
  ],

  labourWages: [
    { id: 'lab-01', category: 'Artisan', name: 'Mason - Skilled', unit: 'day', price: 8000, niqsDefault: 7500, spec: 'Skilled Bricklayer / Blocklayer & Screeder', iconType: 'mason' },
    { id: 'lab-02', category: 'Artisan', name: 'Carpenter - Skilled', unit: 'day', price: 7500, niqsDefault: 7200, spec: 'Roofing Joiner & General Timber Craftsman', iconType: 'carpenter' },
    { id: 'lab-03', category: 'General Labour', name: 'Labourer - Unskilled', unit: 'day', price: 4500, niqsDefault: 4200, spec: 'Concrete Mixing, Excavation & Site Carrier', iconType: 'labour' },
    { id: 'lab-04', category: 'Artisan', name: 'Steel Fixer', unit: 'day', price: 8500, niqsDefault: 8000, spec: 'Bar Bender & Reinforcement Fabricator', iconType: 'steel' },
    { id: 'lab-05', category: 'Artisan', name: 'Formwork Carpenter', unit: 'day', price: 8000, niqsDefault: 7500, spec: 'Shuttering, Column/Beam Props & Marine Board Fitter', iconType: 'carpenter' },
    { id: 'lab-06', category: 'Artisan', name: 'Painter', unit: 'day', price: 7500, niqsDefault: 7000, spec: 'Screeding, Sanding, Primer & Final Coat Painter', iconType: 'paint' },
    { id: 'lab-07', category: 'Artisan', name: 'Tiler', unit: 'day', price: 8500, niqsDefault: 8000, spec: 'Floor & Wall Vitrified Tile Alignment Specialist', iconType: 'tile' },
    { id: 'lab-08', category: 'Artisan', name: 'Plumber', unit: 'day', price: 9000, niqsDefault: 8500, spec: 'PPR/PVC Pipefitter & Sanitary Drainage Installer', iconType: 'plumbing' },
    { id: 'lab-09', category: 'Artisan', name: 'Electrician', unit: 'day', price: 9000, niqsDefault: 8500, spec: 'Conduit Piping, Cable Pulling & Distribution Board Tech', iconType: 'electric' },
    { id: 'lab-10', category: 'Artisan', name: 'Welder', unit: 'day', price: 8000, niqsDefault: 7500, spec: 'Arc/Gas Welder for Structural Steel & Gates', iconType: 'tools' },
    { id: 'lab-11', category: 'Artisan', name: 'POP Installer', unit: 'day', price: 8500, niqsDefault: 8000, spec: 'Suspended Ceiling Framing, Boarding & Finishing', iconType: 'roof' },
    { id: 'lab-12', category: 'Supervision', name: 'Ganger/Foreman', unit: 'day', price: 12000, niqsDefault: 11000, spec: 'Trade Labour Gang Leader & Daily Site Coordinator', iconType: 'mason' },
    { id: 'lab-13', category: 'Management', name: 'Site QS', unit: 'day', price: 25000, niqsDefault: 22000, spec: 'On-site Quantity Surveyor (Measurement & Verification)', iconType: 'tools' }
  ],

  plantHire: [
    { id: 'plt-01', category: 'Concreting', name: 'Concrete Mixer per day', unit: 'day', price: 15000, niqsDefault: 14000, spec: 'Diesel Driven 400/200L Reversible Drum Mixer', iconType: 'mixer' },
    { id: 'plt-02', category: 'Concreting', name: 'Poker Vibrator per day', unit: 'day', price: 8000, niqsDefault: 7500, spec: 'Petrol Powered Vibrator with 38mm/45mm Needle', iconType: 'tools' },
    { id: 'plt-03', category: 'Haulage', name: '5-ton Tipper per day', unit: 'day', price: 70000, niqsDefault: 65000, spec: 'Local Material Cartage, Earthmoving & Debris Removal', iconType: 'truck' },
    { id: 'plt-04', category: 'Earthmoving', name: 'Excavator/JCB per day', unit: 'day', price: 120000, niqsDefault: 110000, spec: 'Hydraulic Crawler Excavator / Backhoe Loader Wet Lease', iconType: 'truck' },
    { id: 'plt-05', category: 'Access', name: 'Scaffolding per m2 per week', unit: 'm2/wk', price: 500, niqsDefault: 450, spec: 'Modular Steel Tube & Coupler System with Walkways', iconType: 'tools' },
    { id: 'plt-06', category: 'General', name: 'Wheelbarrow per day', unit: 'day', price: 1500, niqsDefault: 1200, spec: 'Heavy Duty Pressed Steel Contractor Wheelbarrow', iconType: 'tools' },
    { id: 'plt-07', category: 'Power', name: 'Generator 15KVA per day', unit: 'day', price: 20000, niqsDefault: 18000, spec: 'Silent Diesel Generator (Excluding Fuel)', iconType: 'electric' }
  ],

  compositeTrades: [
    // D-Groundwork
    { id: 'trd-d-01', category: 'D-Groundwork', name: 'Excavation for foundation per m3', unit: 'm3', price: 4500, niqsDefault: 4200, spec: 'BESMM4 D20.1: Trench excavation not exceeding 1.50m deep in normal soil', iconType: 'tools' },
    { id: 'trd-d-02', category: 'D-Groundwork', name: 'Laterite filling per m3', unit: 'm3', price: 6500, niqsDefault: 6000, spec: 'BESMM4 D20.5: Selected imported earth filling compacted in 150mm layers', iconType: 'sand' },
    { id: 'trd-d-03', category: 'D-Groundwork', name: 'Hardcore filling 150mm per m2', unit: 'm2', price: 3500, niqsDefault: 3200, spec: 'BESMM4 D20.6: 150mm compacted broken stone bed blinded with sand', iconType: 'granite' },

    // E-Concrete
    { id: 'trd-e-01', category: 'E-Concrete', name: 'Blinding 50mm Grade 15 per m2', unit: 'm2', price: 2800, niqsDefault: 2600, spec: 'BESMM4 E10.1: 50mm plain concrete (1:3:6) under foundation footings', iconType: 'concrete' },
    { id: 'trd-e-02', category: 'E-Concrete', name: 'Foundation Concrete Grade 25 per m3', unit: 'm3', price: 95000, niqsDefault: 92000, spec: 'BESMM4 E10.2: Vibrated reinforced concrete (1:2:4) in pad & strip footings', iconType: 'concrete' },
    { id: 'trd-e-03', category: 'E-Concrete', name: 'Column/Beam Grade 25 per m3', unit: 'm3', price: 110000, niqsDefault: 105000, spec: 'BESMM4 E10.4: Vibrated reinforced concrete in isolated columns and lintels/beams', iconType: 'concrete' },
    { id: 'trd-e-04', category: 'E-Concrete', name: 'Slab Grade 25 per m3', unit: 'm3', price: 115000, niqsDefault: 110000, spec: 'BESMM4 E10.5: Reinforced concrete suspended floor slabs and staircases', iconType: 'concrete' },

    // F-Blockwork
    { id: 'trd-f-02', category: 'F-Blockwork', name: 'Blockwork 225mm (per m²)', unit: 'm²', price: 6200, niqsDefault: 5900, spec: 'BESMM4 F10.2: 225mm sandcrete blockwork in 1:4 cement-sand mortar', iconType: 'block' },
    { id: 'trd-f-01', category: 'F-Blockwork', name: 'Blockwork 150mm (per m²)', unit: 'm²', price: 5500, niqsDefault: 5200, spec: 'BESMM4 F10.1: 150mm sandcrete blockwork in 1:4 cement-sand mortar', iconType: 'block' },

    // M-Formwork
    { id: 'trd-m-01', category: 'M-Formwork', name: 'To foundation sides per m2', unit: 'm²', price: 4500, niqsDefault: 4200, spec: 'BESMM4 M10.1: Sawn timber formwork to sides of foundation trenches & pads', iconType: 'timber' },
    { id: 'trd-m-02', category: 'M-Formwork', name: 'To columns/beams per m2', unit: 'm²', price: 6000, niqsDefault: 5600, spec: 'BESMM4 M10.2: Marine board shuttering to sides and soffits of beams and columns', iconType: 'timber' },
    { id: 'trd-m-03', category: 'M-Formwork', name: 'To slabs per m2', unit: 'm²', price: 6500, niqsDefault: 6000, spec: 'BESMM4 M10.3: Marine board formwork to suspended floor slab soffits with props', iconType: 'timber' },

    // Finishes
    { id: 'trd-fin-01', category: 'Finishes', name: 'Plastering 15mm (per m²)', unit: 'm²', price: 2900, niqsDefault: 2700, spec: 'BESMM4 M20.1: 15mm cement-sand (1:4) render to internal block walls', iconType: 'cement' },
    { id: 'trd-fin-02', category: 'Finishes', name: '50mm Floor Screed (per m²)', unit: 'm²', price: 3200, niqsDefault: 3000, spec: 'BESMM4 M20.3: 50mm smooth troweled cement-sand (1:3) floor screeding', iconType: 'cement' },
    { id: 'trd-fin-03', category: 'Finishes', name: 'Floor Tiling 600x600 (per m²)', unit: 'm²', price: 9500, niqsDefault: 9000, spec: 'BESMM4 M40.1: Vitrified porcelain floor tiles bedded in cement adhesive & grouted', iconType: 'tile' },
    { id: 'trd-fin-04', category: 'Finishes', name: 'Wall Tiling (per m²)', unit: 'm²', price: 9000, niqsDefault: 8500, spec: 'BESMM4 M40.2: Glazed ceramic wall tiles fixed with adhesive on rendered wall', iconType: 'tile' },
    { id: 'trd-fin-05', category: 'Finishes', name: 'Emulsion Painting 3 coats (per m²)', unit: 'm²', price: 2500, niqsDefault: 2300, spec: 'BESMM4 M60.1: 3 coats quality emulsion paint on screeded and sanded surfaces', iconType: 'paint' },

    // Roofing
    { id: 'trd-rof-01', category: 'Roofing', name: 'Roof carcass per m2', unit: 'm2', price: 8500, niqsDefault: 8000, spec: 'BESMM4 G20.1: Hardwood timber roof trusses, rafters, purlins & tie beams', iconType: 'timber' },
    { id: 'trd-rof-02', category: 'Roofing', name: '0.55mm Longspan Installation per m2', unit: 'm2', price: 11200, niqsDefault: 10800, spec: 'BESMM4 H10.1: 0.55mm longspan aluminium roofing sheet with ridge capping', iconType: 'roof' },

    // Services
    { id: 'trd-sve-01', category: 'Services', name: 'Electrical Point per point', unit: 'point', price: 12000, niqsDefault: 11000, spec: 'BESMM4 V10: Lighting/socket point complete with PVC conduit, single core wire & box', iconType: 'electric' },
    { id: 'trd-sve-02', category: 'Services', name: 'Plumbing Point per point', unit: 'point', price: 15000, niqsDefault: 14000, spec: 'BESMM4 W10: Sanitary plumbing point with PPR hot/cold piping & waste connection', iconType: 'plumbing' }
  ]
};

/**
 * Generate localized dataset for a region by applying its regional economic multipliers
 */
export function getRegionalDefaultRates(region: MarketRegion): RegionalRatesDataset {
  const factor = REGIONAL_FACTORS[region] || REGIONAL_FACTORS['Lagos'];
  const base = LAGOS_BASE_RATES;

  const roundToTens = (num: number) => Math.round(num / 10) * 10;
  const roundToHundreds = (num: number) => Math.round(num / 50) * 50;

  return {
    region,
    lastUpdated: '21 Aug 2025 • 09:32 AM',
    coreMaterials: base.coreMaterials.map(item => {
      const scaledPrice = roundToTens(item.price * factor.materialsMultiplier);
      const scaledNiqs = roundToTens(item.niqsDefault * factor.materialsMultiplier);
      return {
        ...item,
        price: scaledPrice,
        niqsDefault: scaledNiqs,
      };
    }),
    labourWages: base.labourWages.map(item => {
      const scaledPrice = roundToHundreds(item.price * factor.labourMultiplier);
      const scaledNiqs = roundToHundreds(item.niqsDefault * factor.labourMultiplier);
      return {
        ...item,
        price: scaledPrice,
        niqsDefault: scaledNiqs,
      };
    }),
    plantHire: base.plantHire.map(item => {
      const scaledPrice = roundToHundreds(item.price * factor.plantMultiplier);
      const scaledNiqs = roundToHundreds(item.niqsDefault * factor.plantMultiplier);
      return {
        ...item,
        price: scaledPrice,
        niqsDefault: scaledNiqs,
      };
    }),
    compositeTrades: base.compositeTrades.map(item => {
      const scaledPrice = roundToTens(item.price * factor.compositeMultiplier);
      const scaledNiqs = roundToTens(item.niqsDefault * factor.compositeMultiplier);
      return {
        ...item,
        price: scaledPrice,
        niqsDefault: scaledNiqs,
      };
    })
  };
}

/**
 * Load saved rates for region from localStorage, fallback to regional baseline
 */
export function loadSavedRegionalRates(region: MarketRegion): RegionalRatesDataset {
  const defaultData = getRegionalDefaultRates(region);
  if (typeof window === 'undefined') return defaultData;

  try {
    const saved = localStorage.getItem(`rates_${region}`);
    if (!saved) return defaultData;
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === 'object') {
      return {
        region,
        lastUpdated: parsed.lastUpdated || defaultData.lastUpdated,
        coreMaterials: Array.isArray(parsed.coreMaterials) && parsed.coreMaterials.length > 0 ? parsed.coreMaterials : defaultData.coreMaterials,
        labourWages: Array.isArray(parsed.labourWages) && parsed.labourWages.length > 0 ? parsed.labourWages : defaultData.labourWages,
        plantHire: Array.isArray(parsed.plantHire) && parsed.plantHire.length > 0 ? parsed.plantHire : defaultData.plantHire,
        compositeTrades: Array.isArray(parsed.compositeTrades) && parsed.compositeTrades.length > 0 ? parsed.compositeTrades : defaultData.compositeTrades
      };
    }
  } catch (err) {
    console.error(`Error reading rates_${region} from localStorage:`, err);
  }

  return defaultData;
}

/**
 * Save rates to localStorage under key rates_{region}
 */
export function saveRegionalRatesToStorage(region: MarketRegion, dataset: RegionalRatesDataset): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`rates_${region}`, JSON.stringify(dataset));
  } catch (err) {
    console.error(`Error saving rates_${region} to localStorage:`, err);
  }
}

/**
 * Reset rates for a region by removing the localStorage key
 */
export function resetRegionalRatesInStorage(region: MarketRegion): RegionalRatesDataset {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`rates_${region}`);
    } catch (err) {
      console.error(`Error removing rates_${region} from localStorage:`, err);
    }
  }
  return getRegionalDefaultRates(region);
}

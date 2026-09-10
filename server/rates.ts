/**
 * Let's Estimate - Nigerian Construction Rate Library & Unit Cost Breakdown Engine
 * Accurate, localized construction rates across key Nigerian economic and construction hubs.
 */

import { getDb, saveDbToDisk } from './db.js';

export interface RateItem {
  id: string;
  category: string;
  item: string;
  description: string;
  unit: string;
  lagosRate: number;
  portHarcourtRate: number;
  abujaRate: number;
  regionalRate: number;
  breakdown: {
    materials: number;
    labor: number;
    plant: number;
    wastePercent: number;
    overheadProfitPercent: number;
  };
}

export const NIGERIAN_RATE_LIBRARY: RateItem[] = [
  // SUBSTRUCTURE & EARTHWORKS
  {
    id: 'rate-sub-01',
    category: 'Substructure',
    item: 'Site Clearance',
    description: 'Clearing site of vegetation, shrubs, small trees and grubbing up roots',
    unit: 'm2',
    lagosRate: 450,
    portHarcourtRate: 550,
    abujaRate: 400,
    regionalRate: 350,
    breakdown: { materials: 0, labor: 350, plant: 100, wastePercent: 0, overheadProfitPercent: 15 }
  },
  {
    id: 'rate-sub-02',
    category: 'Substructure',
    item: 'Trench Excavation',
    description: 'Excavating foundation trenches not exceeding 1.5m deep in normal soil',
    unit: 'm3',
    lagosRate: 6500,
    portHarcourtRate: 8500,
    abujaRate: 6000,
    regionalRate: 5500,
    breakdown: { materials: 0, labor: 5500, plant: 1000, wastePercent: 0, overheadProfitPercent: 15 }
  },
  {
    id: 'rate-sub-03',
    category: 'Substructure',
    item: 'Hardcore Filling',
    description: '300mm thick compacted approved granite boulder/broken stone hardcore under slab',
    unit: 'm2',
    lagosRate: 8500,
    portHarcourtRate: 11500,
    abujaRate: 7800,
    regionalRate: 7000,
    breakdown: { materials: 6000, labor: 1500, plant: 1000, wastePercent: 5, overheadProfitPercent: 15 }
  },
  {
    id: 'rate-sub-04',
    category: 'Substructure',
    item: 'DPC Membrane',
    description: '500 gauge polythene damp proof membrane laid with 150mm laps under ground floor slab',
    unit: 'm2',
    lagosRate: 1850,
    portHarcourtRate: 2200,
    abujaRate: 1750,
    regionalRate: 1600,
    breakdown: { materials: 1300, labor: 350, plant: 0, wastePercent: 10, overheadProfitPercent: 15 }
  },
  {
    id: 'rate-sub-05',
    category: 'Substructure',
    item: 'Raft Foundation Concrete',
    description: 'Reinforced concrete Grade 25 in 250mm thick raft foundation slab',
    unit: 'm3',
    lagosRate: 175000,
    portHarcourtRate: 215000,
    abujaRate: 185000,
    regionalRate: 165000,
    breakdown: { materials: 135000, labor: 25000, plant: 15000, wastePercent: 5, overheadProfitPercent: 15 }
  },

  // CONCRETE & REINFORCEMENT
  {
    id: 'rate-conc-01',
    category: 'Concrete',
    item: 'Grade 25 Concrete (Beams & Columns)',
    description: 'Vibrated reinforced in-situ concrete Grade 25 (1:1.5:3) in columns and suspended beams',
    unit: 'm3',
    lagosRate: 180000,
    portHarcourtRate: 220000,
    abujaRate: 190000,
    regionalRate: 170000,
    breakdown: { materials: 140000, labor: 25000, plant: 15000, wastePercent: 5, overheadProfitPercent: 15 }
  },
  {
    id: 'rate-conc-02',
    category: 'Concrete',
    item: '150mm Suspended RC Slab',
    description: 'Reinforced concrete Grade 25 in 150mm suspended first-floor slab',
    unit: 'm3',
    lagosRate: 175000,
    portHarcourtRate: 210000,
    abujaRate: 185000,
    regionalRate: 165000,
    breakdown: { materials: 135000, labor: 25000, plant: 15000, wastePercent: 5, overheadProfitPercent: 15 }
  },
  {
    id: 'rate-conc-03',
    category: 'Concrete',
    item: 'High Tensile Reinforcement Y16/Y12',
    description: 'High tensile ribbed steel rebar bars (BS 4449) bent and fixed in position',
    unit: 'Tonne',
    lagosRate: 1450000,
    portHarcourtRate: 1550000,
    abujaRate: 1480000,
    regionalRate: 1420000,
    breakdown: { materials: 1250000, labor: 120000, plant: 30000, wastePercent: 5, overheadProfitPercent: 15 }
  },
  {
    id: 'rate-conc-04',
    category: 'Concrete',
    item: 'Marine Plywood Formwork',
    description: 'Marine plywood shuttering to sides and soffits of suspended slabs, beams and columns',
    unit: 'm2',
    lagosRate: 12500,
    portHarcourtRate: 15000,
    abujaRate: 13000,
    regionalRate: 11000,
    breakdown: { materials: 8500, labor: 3000, plant: 500, wastePercent: 10, overheadProfitPercent: 15 }
  },

  // BLOCKWORK & MASONRY
  {
    id: 'rate-block-01',
    category: 'Blockwork',
    item: '225mm Sandcrete Blockwork',
    description: '225mm (9-inch) vibrated hollow sandcrete blocks bedded in cement-sand mortar (1:4)',
    unit: 'm2',
    lagosRate: 14500,
    portHarcourtRate: 16500,
    abujaRate: 15000,
    regionalRate: 13500,
    breakdown: { materials: 10500, labor: 2800, plant: 500, wastePercent: 5, overheadProfitPercent: 15 }
  },
  {
    id: 'rate-block-02',
    category: 'Blockwork',
    item: '150mm Sandcrete Blockwork',
    description: '150mm (6-inch) vibrated hollow sandcrete blocks bedded in cement mortar (1:4) for partitions',
    unit: 'm2',
    lagosRate: 11500,
    portHarcourtRate: 13500,
    abujaRate: 12000,
    regionalRate: 10500,
    breakdown: { materials: 8200, labor: 2500, plant: 300, wastePercent: 5, overheadProfitPercent: 15 }
  },

  // ROOFING
  {
    id: 'rate-roof-01',
    category: 'Roofing',
    item: '0.55mm Aluminium Longspan',
    description: '0.55mm gauge aluminium longspan standing seam corrugated sheets fixed to hardwood timber trusses',
    unit: 'm2',
    lagosRate: 28500,
    portHarcourtRate: 31500,
    abujaRate: 29000,
    regionalRate: 26500,
    breakdown: { materials: 22000, labor: 4500, plant: 500, wastePercent: 5, overheadProfitPercent: 15 }
  },
  {
    id: 'rate-roof-02',
    category: 'Roofing',
    item: 'Stone-Coated Bond Roofing Tiles',
    description: 'South Korean/New Zealand stone-coated steel roof tiles (0.45mm core) on treated batten framework',
    unit: 'm2',
    lagosRate: 36000,
    portHarcourtRate: 41000,
    abujaRate: 37500,
    regionalRate: 34000,
    breakdown: { materials: 28500, labor: 5500, plant: 500, wastePercent: 5, overheadProfitPercent: 15 }
  },
  {
    id: 'rate-roof-03',
    category: 'Roofing',
    item: 'Treated Hardwood Roof Trusses',
    description: '50x150mm & 50x100mm pressure-treated hardwood timber trusses, purlins and wall plates',
    unit: 'm2',
    lagosRate: 18500,
    portHarcourtRate: 22500,
    abujaRate: 19500,
    regionalRate: 17000,
    breakdown: { materials: 14000, labor: 3500, plant: 500, wastePercent: 8, overheadProfitPercent: 15 }
  },

  // FINISHES
  {
    id: 'rate-fin-01',
    category: 'Finishes',
    item: 'Internal & External Plastering',
    description: '15mm thick cement-sand (1:3) plastering and rendering finished smooth with wood float',
    unit: 'm2',
    lagosRate: 4200,
    portHarcourtRate: 4900,
    abujaRate: 4400,
    regionalRate: 3800,
    breakdown: { materials: 2600, labor: 1400, plant: 100, wastePercent: 5, overheadProfitPercent: 15 }
  },
  {
    id: 'rate-fin-02',
    category: 'Finishes',
    item: '600x600mm Vitrified Floor Tiles',
    description: 'Polished vitrified porcelain floor tiles (600x600mm) bedded in cement mortar and grouted',
    unit: 'm2',
    lagosRate: 16500,
    portHarcourtRate: 19500,
    abujaRate: 17000,
    regionalRate: 15000,
    breakdown: { materials: 12500, labor: 3200, plant: 200, wastePercent: 8, overheadProfitPercent: 15 }
  },
  {
    id: 'rate-fin-03',
    category: 'Finishes',
    item: 'POP Suspended False Ceiling',
    description: 'Plaster of Paris (POP) decorative suspended ceiling with cove mouldings and cornice design',
    unit: 'm2',
    lagosRate: 14500,
    portHarcourtRate: 17500,
    abujaRate: 15000,
    regionalRate: 13000,
    breakdown: { materials: 9800, labor: 3800, plant: 200, wastePercent: 7, overheadProfitPercent: 15 }
  },
  {
    id: 'rate-fin-04',
    category: 'Finishes',
    item: 'Internal Emulsion & Gloss Paint',
    description: 'Applying 1 coat primer and 2 coats high-grade washable acrylic emulsion paint',
    unit: 'm2',
    lagosRate: 2600,
    portHarcourtRate: 3100,
    abujaRate: 2700,
    regionalRate: 2300,
    breakdown: { materials: 1800, labor: 700, plant: 50, wastePercent: 5, overheadProfitPercent: 15 }
  },

  // DOORS & WINDOWS
  {
    id: 'rate-door-01',
    category: 'Doors & Windows',
    item: 'Turkish Steel Security Entrance Door',
    description: 'Armored multi-lock Turkish steel entrance door (1200x2100mm) with heavy duty frame & accessories',
    unit: 'No',
    lagosRate: 320000,
    portHarcourtRate: 360000,
    abujaRate: 340000,
    regionalRate: 300000,
    breakdown: { materials: 280000, labor: 25000, plant: 0, wastePercent: 0, overheadProfitPercent: 15 }
  },
  {
    id: 'rate-door-02',
    category: 'Doors & Windows',
    item: 'Solid Core Internal Timber Door',
    description: '900x2100mm solid core flush timber door with hardwood architrave, mortice lock and brass hinges',
    unit: 'No',
    lagosRate: 75000,
    portHarcourtRate: 88000,
    abujaRate: 78000,
    regionalRate: 68000,
    breakdown: { materials: 60000, labor: 12000, plant: 0, wastePercent: 0, overheadProfitPercent: 15 }
  },
  {
    id: 'rate-win-01',
    category: 'Doors & Windows',
    item: 'Aluminium Sliding Window (1200x1200mm)',
    description: 'Powder-coated aluminium sliding glazed window (1200x1200mm) with 5mm tinted glass and burglar bars',
    unit: 'No',
    lagosRate: 68000,
    portHarcourtRate: 78000,
    abujaRate: 70000,
    regionalRate: 62000,
    breakdown: { materials: 54000, labor: 10000, plant: 0, wastePercent: 0, overheadProfitPercent: 15 }
  }
];

/**
 * Filter library by query or category
 */
export function getRateLibrary(query = '', category = '', location = 'lagos'): RateItem[] {
  let filtered = NIGERIAN_RATE_LIBRARY;

  if (category && category !== 'All') {
    filtered = filtered.filter(item => item.category.toLowerCase() === category.toLowerCase());
  }

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      item => item.item.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
    );
  }

  return filtered;
}

/**
 * Retrieve user's custom rates
 */
export async function getUserCustomRates(userId: string): Promise<any[]> {
  const database = await getDb();
  const safeUser = userId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM user_rates WHERE user_id = '${safeUser}' ORDER BY created_at DESC`);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj: any = {};
    cols.forEach((col, idx) => { obj[col] = row[idx]; });
    return obj;
  });
}

/**
 * Save user custom rate
 */
export async function saveUserCustomRate(rate: {
  userId: string;
  category: string;
  item: string;
  description: string;
  unit: string;
  rate: number;
  location?: string;
}): Promise<any> {
  const database = await getDb();
  const id = 'urate-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

  database.run(
    `INSERT INTO user_rates (id, user_id, category, item, description, unit, rate, location)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, rate.userId, rate.category, rate.item, rate.description, rate.unit, rate.rate, rate.location || 'Nigeria']
  );

  saveDbToDisk();
  return { id, ...rate };
}

/**
 * Delete user custom rate
 */
export async function deleteUserCustomRate(id: string, userId: string): Promise<boolean> {
  const database = await getDb();
  database.run(`DELETE FROM user_rates WHERE id = '${id.replace(/'/g, "''")}' AND user_id = '${userId.replace(/'/g, "''")}'`);
  saveDbToDisk();
  return true;
}

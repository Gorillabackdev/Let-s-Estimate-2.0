import { getDb, saveDbToDisk } from "./db.js";
const NIGERIAN_RATE_LIBRARY = [
  // SUBSTRUCTURE & EARTHWORKS
  {
    id: "rate-sub-01",
    category: "Substructure",
    item: "Site Clearance",
    description: "Clearing site of vegetation, shrubs, small trees and grubbing up roots",
    unit: "m2",
    lagosRate: 450,
    portHarcourtRate: 550,
    abujaRate: 400,
    regionalRate: 350,
    breakdown: { materials: 0, labor: 350, plant: 100, wastePercent: 0, overheadProfitPercent: 15 }
  },
  {
    id: "rate-sub-02",
    category: "Substructure",
    item: "Trench Excavation",
    description: "Excavating foundation trenches not exceeding 1.5m deep in normal soil",
    unit: "m3",
    lagosRate: 6500,
    portHarcourtRate: 8500,
    abujaRate: 6e3,
    regionalRate: 5500,
    breakdown: { materials: 0, labor: 5500, plant: 1e3, wastePercent: 0, overheadProfitPercent: 15 }
  },
  {
    id: "rate-sub-03",
    category: "Substructure",
    item: "Hardcore Filling",
    description: "300mm thick compacted approved granite boulder/broken stone hardcore under slab",
    unit: "m2",
    lagosRate: 8500,
    portHarcourtRate: 11500,
    abujaRate: 7800,
    regionalRate: 7e3,
    breakdown: { materials: 6e3, labor: 1500, plant: 1e3, wastePercent: 5, overheadProfitPercent: 15 }
  },
  {
    id: "rate-sub-04",
    category: "Substructure",
    item: "DPC Membrane",
    description: "500 gauge polythene damp proof membrane laid with 150mm laps under ground floor slab",
    unit: "m2",
    lagosRate: 1850,
    portHarcourtRate: 2200,
    abujaRate: 1750,
    regionalRate: 1600,
    breakdown: { materials: 1300, labor: 350, plant: 0, wastePercent: 10, overheadProfitPercent: 15 }
  },
  {
    id: "rate-sub-05",
    category: "Substructure",
    item: "Raft Foundation Concrete",
    description: "Reinforced concrete Grade 25 in 250mm thick raft foundation slab",
    unit: "m3",
    lagosRate: 175e3,
    portHarcourtRate: 215e3,
    abujaRate: 185e3,
    regionalRate: 165e3,
    breakdown: { materials: 135e3, labor: 25e3, plant: 15e3, wastePercent: 5, overheadProfitPercent: 15 }
  },
  // CONCRETE & REINFORCEMENT
  {
    id: "rate-conc-01",
    category: "Concrete",
    item: "Grade 25 Concrete (Beams & Columns)",
    description: "Vibrated reinforced in-situ concrete Grade 25 (1:1.5:3) in columns and suspended beams",
    unit: "m3",
    lagosRate: 18e4,
    portHarcourtRate: 22e4,
    abujaRate: 19e4,
    regionalRate: 17e4,
    breakdown: { materials: 14e4, labor: 25e3, plant: 15e3, wastePercent: 5, overheadProfitPercent: 15 }
  },
  {
    id: "rate-conc-02",
    category: "Concrete",
    item: "150mm Suspended RC Slab",
    description: "Reinforced concrete Grade 25 in 150mm suspended first-floor slab",
    unit: "m3",
    lagosRate: 175e3,
    portHarcourtRate: 21e4,
    abujaRate: 185e3,
    regionalRate: 165e3,
    breakdown: { materials: 135e3, labor: 25e3, plant: 15e3, wastePercent: 5, overheadProfitPercent: 15 }
  },
  {
    id: "rate-conc-03",
    category: "Concrete",
    item: "High Tensile Reinforcement Y16/Y12",
    description: "High tensile ribbed steel rebar bars (BS 4449) bent and fixed in position",
    unit: "Tonne",
    lagosRate: 145e4,
    portHarcourtRate: 155e4,
    abujaRate: 148e4,
    regionalRate: 142e4,
    breakdown: { materials: 125e4, labor: 12e4, plant: 3e4, wastePercent: 5, overheadProfitPercent: 15 }
  },
  {
    id: "rate-conc-04",
    category: "Concrete",
    item: "Marine Plywood Formwork",
    description: "Marine plywood shuttering to sides and soffits of suspended slabs, beams and columns",
    unit: "m2",
    lagosRate: 12500,
    portHarcourtRate: 15e3,
    abujaRate: 13e3,
    regionalRate: 11e3,
    breakdown: { materials: 8500, labor: 3e3, plant: 500, wastePercent: 10, overheadProfitPercent: 15 }
  },
  // BLOCKWORK & MASONRY
  {
    id: "rate-block-01",
    category: "Blockwork",
    item: "225mm Sandcrete Blockwork",
    description: "225mm (9-inch) vibrated hollow sandcrete blocks bedded in cement-sand mortar (1:4)",
    unit: "m2",
    lagosRate: 14500,
    portHarcourtRate: 16500,
    abujaRate: 15e3,
    regionalRate: 13500,
    breakdown: { materials: 10500, labor: 2800, plant: 500, wastePercent: 5, overheadProfitPercent: 15 }
  },
  {
    id: "rate-block-02",
    category: "Blockwork",
    item: "150mm Sandcrete Blockwork",
    description: "150mm (6-inch) vibrated hollow sandcrete blocks bedded in cement mortar (1:4) for partitions",
    unit: "m2",
    lagosRate: 11500,
    portHarcourtRate: 13500,
    abujaRate: 12e3,
    regionalRate: 10500,
    breakdown: { materials: 8200, labor: 2500, plant: 300, wastePercent: 5, overheadProfitPercent: 15 }
  },
  // ROOFING
  {
    id: "rate-roof-01",
    category: "Roofing",
    item: "0.55mm Aluminium Longspan",
    description: "0.55mm gauge aluminium longspan standing seam corrugated sheets fixed to hardwood timber trusses",
    unit: "m2",
    lagosRate: 28500,
    portHarcourtRate: 31500,
    abujaRate: 29e3,
    regionalRate: 26500,
    breakdown: { materials: 22e3, labor: 4500, plant: 500, wastePercent: 5, overheadProfitPercent: 15 }
  },
  {
    id: "rate-roof-02",
    category: "Roofing",
    item: "Stone-Coated Bond Roofing Tiles",
    description: "South Korean/New Zealand stone-coated steel roof tiles (0.45mm core) on treated batten framework",
    unit: "m2",
    lagosRate: 36e3,
    portHarcourtRate: 41e3,
    abujaRate: 37500,
    regionalRate: 34e3,
    breakdown: { materials: 28500, labor: 5500, plant: 500, wastePercent: 5, overheadProfitPercent: 15 }
  },
  {
    id: "rate-roof-03",
    category: "Roofing",
    item: "Treated Hardwood Roof Trusses",
    description: "50x150mm & 50x100mm pressure-treated hardwood timber trusses, purlins and wall plates",
    unit: "m2",
    lagosRate: 18500,
    portHarcourtRate: 22500,
    abujaRate: 19500,
    regionalRate: 17e3,
    breakdown: { materials: 14e3, labor: 3500, plant: 500, wastePercent: 8, overheadProfitPercent: 15 }
  },
  // FINISHES
  {
    id: "rate-fin-01",
    category: "Finishes",
    item: "Internal & External Plastering",
    description: "15mm thick cement-sand (1:3) plastering and rendering finished smooth with wood float",
    unit: "m2",
    lagosRate: 4200,
    portHarcourtRate: 4900,
    abujaRate: 4400,
    regionalRate: 3800,
    breakdown: { materials: 2600, labor: 1400, plant: 100, wastePercent: 5, overheadProfitPercent: 15 }
  },
  {
    id: "rate-fin-02",
    category: "Finishes",
    item: "600x600mm Vitrified Floor Tiles",
    description: "Polished vitrified porcelain floor tiles (600x600mm) bedded in cement mortar and grouted",
    unit: "m2",
    lagosRate: 16500,
    portHarcourtRate: 19500,
    abujaRate: 17e3,
    regionalRate: 15e3,
    breakdown: { materials: 12500, labor: 3200, plant: 200, wastePercent: 8, overheadProfitPercent: 15 }
  },
  {
    id: "rate-fin-03",
    category: "Finishes",
    item: "POP Suspended False Ceiling",
    description: "Plaster of Paris (POP) decorative suspended ceiling with cove mouldings and cornice design",
    unit: "m2",
    lagosRate: 14500,
    portHarcourtRate: 17500,
    abujaRate: 15e3,
    regionalRate: 13e3,
    breakdown: { materials: 9800, labor: 3800, plant: 200, wastePercent: 7, overheadProfitPercent: 15 }
  },
  {
    id: "rate-fin-04",
    category: "Finishes",
    item: "Internal Emulsion & Gloss Paint",
    description: "Applying 1 coat primer and 2 coats high-grade washable acrylic emulsion paint",
    unit: "m2",
    lagosRate: 2600,
    portHarcourtRate: 3100,
    abujaRate: 2700,
    regionalRate: 2300,
    breakdown: { materials: 1800, labor: 700, plant: 50, wastePercent: 5, overheadProfitPercent: 15 }
  },
  // DOORS & WINDOWS
  {
    id: "rate-door-01",
    category: "Doors & Windows",
    item: "Turkish Steel Security Entrance Door",
    description: "Armored multi-lock Turkish steel entrance door (1200x2100mm) with heavy duty frame & accessories",
    unit: "No",
    lagosRate: 32e4,
    portHarcourtRate: 36e4,
    abujaRate: 34e4,
    regionalRate: 3e5,
    breakdown: { materials: 28e4, labor: 25e3, plant: 0, wastePercent: 0, overheadProfitPercent: 15 }
  },
  {
    id: "rate-door-02",
    category: "Doors & Windows",
    item: "Solid Core Internal Timber Door",
    description: "900x2100mm solid core flush timber door with hardwood architrave, mortice lock and brass hinges",
    unit: "No",
    lagosRate: 75e3,
    portHarcourtRate: 88e3,
    abujaRate: 78e3,
    regionalRate: 68e3,
    breakdown: { materials: 6e4, labor: 12e3, plant: 0, wastePercent: 0, overheadProfitPercent: 15 }
  },
  {
    id: "rate-win-01",
    category: "Doors & Windows",
    item: "Aluminium Sliding Window (1200x1200mm)",
    description: "Powder-coated aluminium sliding glazed window (1200x1200mm) with 5mm tinted glass and burglar bars",
    unit: "No",
    lagosRate: 68e3,
    portHarcourtRate: 78e3,
    abujaRate: 7e4,
    regionalRate: 62e3,
    breakdown: { materials: 54e3, labor: 1e4, plant: 0, wastePercent: 0, overheadProfitPercent: 15 }
  }
];
function getRateLibrary(query = "", category = "", location = "lagos") {
  let filtered = NIGERIAN_RATE_LIBRARY;
  if (category && category !== "All") {
    filtered = filtered.filter((item) => item.category.toLowerCase() === category.toLowerCase());
  }
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (item) => item.item.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
    );
  }
  return filtered.map((item) => ({
    ...item,
    spec: item.description,
    lagos: item.lagosRate,
    abuja: item.abujaRate,
    ph: item.portHarcourtRate,
    lagosRate: item.lagosRate,
    abujaRate: item.abujaRate,
    portHarcourtRate: item.portHarcourtRate
  }));
}
async function getUserCustomRates(userId) {
  const database = await getDb();
  const safeUser = (userId || "guest-user").replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM library_rates WHERE is_custom = 1 OR user_id = '${safeUser}' ORDER BY created_at DESC`);
  if (res.length > 0 && res[0].values.length > 0) {
    const cols = res[0].columns;
    return res[0].values.map((row) => {
      const obj = {};
      cols.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return {
        id: obj.id,
        item: obj.item,
        category: obj.category,
        description: obj.specification || "",
        unit: obj.unit,
        rate: Number(obj.lagos_rate || 0),
        lagosRate: Number(obj.lagos_rate || 0),
        abujaRate: Number(obj.abuja_rate || 0),
        portHarcourtRate: Number(obj.port_harcourt_rate || 0),
        northernRate: Number(obj.northern_rate || 0),
        source: "Custom Rate Library",
        createdAt: obj.created_at
      };
    });
  }
  const ures = database.exec(`SELECT * FROM user_rates WHERE user_id = '${safeUser}' OR user_id = 'guest-user' OR user_id = 'system' ORDER BY created_at DESC`);
  if (ures.length > 0 && ures[0].values.length > 0) {
    const cols = ures[0].columns;
    return ures[0].values.map((row) => {
      const obj = {};
      cols.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      const rateVal = Number(obj.rate || 0);
      return {
        id: obj.id,
        item: obj.item,
        category: obj.category,
        description: obj.description || "",
        unit: obj.unit,
        rate: rateVal,
        lagosRate: rateVal,
        abujaRate: Math.round(rateVal * 1.05),
        portHarcourtRate: Math.round(rateVal * 1.09),
        northernRate: Math.round(rateVal * 0.96),
        source: obj.source || "User Custom",
        createdAt: obj.created_at
      };
    });
  }
  return [];
}
async function saveUserCustomRate(rate) {
  const database = await getDb();
  const id = "urate-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const lRate = Number(rate.lagosRate || rate.rate || 0);
  const aRate = Number(rate.abujaRate || Math.round(lRate * 1.05));
  const phRate = Number(rate.portHarcourtRate || Math.round(lRate * 1.09));
  const nRate = Number(rate.northernRate || Math.round(lRate * 0.96));
  try {
    database.run(
      `INSERT INTO user_rates (id, user_id, category, item, item_name, description, specification, unit, rate, composite_rate, lagos_rate, abuja_rate, port_harcourt_rate, northern_rate, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, rate.userId, rate.category, rate.item, rate.item, rate.description || "", rate.description || "", rate.unit, lRate, lRate, lRate, aRate, phRate, nRate, rate.location || "Nigeria"]
    );
  } catch (uErr) {
    try {
      database.run(
        `INSERT INTO user_rates (id, user_id, category, item_name, specification, unit, composite_rate, location)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, rate.userId, rate.category, rate.item, rate.description || "", rate.unit, lRate, rate.location || "Nigeria"]
      );
    } catch {
    }
  }
  database.run(
    `INSERT INTO library_rates (
      id, type, category, item, specification, unit,
      lagos_rate, abuja_rate, port_harcourt_rate, northern_rate,
      material_component, labour_component, plant_component, overhead_profit_percent,
      trend, trend_percent, key_suppliers_json, last_updated, is_custom, user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      id,
      "Material",
      rate.category,
      rate.item,
      rate.description || "",
      rate.unit,
      lRate,
      aRate,
      phRate,
      nRate,
      lRate,
      0,
      0,
      15,
      "stable",
      0,
      "[]",
      (/* @__PURE__ */ new Date()).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }),
      rate.userId
    ]
  );
  saveDbToDisk();
  return {
    id,
    ...rate,
    rate: lRate,
    lagosRate: lRate,
    abujaRate: aRate,
    portHarcourtRate: phRate,
    northernRate: nRate
  };
}
async function deleteUserCustomRate(id, userId) {
  const database = await getDb();
  database.run(`DELETE FROM user_rates WHERE id = ?`, [id]);
  database.run(`DELETE FROM library_rates WHERE id = ?`, [id]);
  saveDbToDisk();
  return true;
}
async function updateUserCustomRate(id, updates) {
  const database = await getDb();
  const lRate = Number(updates.lagosRate !== void 0 ? updates.lagosRate : updates.rate || 0);
  const aRate = Number(updates.abujaRate !== void 0 ? updates.abujaRate : Math.round(lRate * 1.05));
  const phRate = Number(updates.portHarcourtRate !== void 0 ? updates.portHarcourtRate : Math.round(lRate * 1.09));
  const nRate = Number(updates.northernRate !== void 0 ? updates.northernRate : Math.round(lRate * 0.96));
  try {
    database.run(
      `UPDATE user_rates SET
         category = COALESCE(?, category),
         item = COALESCE(?, item),
         item_name = COALESCE(?, item_name),
         description = COALESCE(?, description),
         specification = COALESCE(?, specification),
         unit = COALESCE(?, unit),
         rate = ?,
         composite_rate = ?,
         lagos_rate = ?,
         abuja_rate = ?,
         port_harcourt_rate = ?,
         northern_rate = ?
       WHERE id = ?`,
      [
        updates.category || null,
        updates.item || null,
        updates.item || null,
        updates.description || null,
        updates.description || null,
        updates.unit || null,
        lRate,
        lRate,
        lRate,
        aRate,
        phRate,
        nRate,
        id
      ]
    );
  } catch {
    try {
      database.run(
        `UPDATE user_rates SET
           category = COALESCE(?, category),
           item_name = COALESCE(?, item_name),
           unit = COALESCE(?, unit),
           composite_rate = ?
         WHERE id = ?`,
        [updates.category || null, updates.item || null, updates.unit || null, lRate, id]
      );
    } catch {
    }
  }
  database.run(
    `UPDATE library_rates SET
       category = COALESCE(?, category),
       item = COALESCE(?, item),
       specification = COALESCE(?, specification),
       unit = COALESCE(?, unit),
       lagos_rate = ?,
       abuja_rate = ?,
       port_harcourt_rate = ?,
       northern_rate = ?,
       last_updated = ?
     WHERE id = ?`,
    [
      updates.category || null,
      updates.item || null,
      updates.description || null,
      updates.unit || null,
      lRate,
      aRate,
      phRate,
      nRate,
      (/* @__PURE__ */ new Date()).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }),
      id
    ]
  );
  saveDbToDisk();
  return {
    id,
    ...updates,
    rate: lRate,
    lagosRate: lRate,
    abujaRate: aRate,
    portHarcourtRate: phRate,
    northernRate: nRate
  };
}
export {
  NIGERIAN_RATE_LIBRARY,
  deleteUserCustomRate,
  getRateLibrary,
  getUserCustomRates,
  saveUserCustomRate,
  updateUserCustomRate
};

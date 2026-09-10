/**
 * Let's Estimate - SQLite Database Manager
 * Uses sql.js (WebAssembly SQLite) for fast, zero-native-compilation storage.
 * Persists to disk at `data/database.sqlite`.
 */

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'database.sqlite');
const SCHEMA_PATH = path.join(process.cwd(), 'schema.sql');

export interface ProjectRecord {
  id: string;
  user_id?: string;
  title: string;
  project_type?: string;
  client_name: string;
  client_contact?: string;
  location: string;
  state?: string;
  country?: string;
  description?: string;
  gfa?: number;
  number_of_floors?: number;
  status?: 'Draft' | 'In Progress' | 'Submitted' | 'Approved' | 'Archived';
  start_date?: string;
  target_completion_date?: string;
  drawing_filename: string;
  drawing_url: string;
  created_at: string;
  updated_at: string;
  po_percent: number;
  vat_percent: number;
  swamp_premium_percent: number;
  waste_percent?: number;
  contingency_percent?: number;
  inflation_percent?: number;
  duration_months?: number;
  advance_payment_percent?: number;
  subtotal: number;
  po_amount: number;
  vat_amount: number;
  grand_total: number;
  active_version?: string;
  notes: string;
  items?: BoqItemRecord[];
}

export interface BoqItemRecord {
  id: string;
  project_id: string;
  version_id?: string;
  section?: string;
  subsection?: string;
  item_number: number;
  item: string;
  description: string;
  unit: string;
  qty: number;
  rate: number;
  amount: number;
  notes?: string;
  is_ai_generated?: number;
  is_confirmed?: number;
}

/**
 * Initialize SQLite database with schema.sql and seed sample project
 */
export async function getDb(): Promise<Database> {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
      console.log('Loaded existing SQLite database from', DB_PATH);
    } catch (err) {
      console.warn('Could not read existing database, creating fresh one:', err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Ensure schema is applied
  if (fs.existsSync(SCHEMA_PATH)) {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.run(schemaSql);
  }

  // Safe migration for existing databases to add newer columns if missing
  const safeAlterColumns = [
    "ALTER TABLE projects ADD COLUMN user_id TEXT DEFAULT ''",
    "ALTER TABLE projects ADD COLUMN project_type TEXT DEFAULT 'Residential'",
    "ALTER TABLE projects ADD COLUMN client_contact TEXT DEFAULT ''",
    "ALTER TABLE projects ADD COLUMN state TEXT DEFAULT 'Lagos'",
    "ALTER TABLE projects ADD COLUMN country TEXT DEFAULT 'Nigeria'",
    "ALTER TABLE projects ADD COLUMN description TEXT DEFAULT ''",
    "ALTER TABLE projects ADD COLUMN gfa REAL DEFAULT 0.0",
    "ALTER TABLE projects ADD COLUMN number_of_floors INTEGER DEFAULT 1",
    "ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'In Progress'",
    "ALTER TABLE projects ADD COLUMN start_date TEXT DEFAULT ''",
    "ALTER TABLE projects ADD COLUMN target_completion_date TEXT DEFAULT ''",
    "ALTER TABLE projects ADD COLUMN waste_percent REAL DEFAULT 5.0",
    "ALTER TABLE projects ADD COLUMN contingency_percent REAL DEFAULT 5.0",
    "ALTER TABLE projects ADD COLUMN inflation_percent REAL DEFAULT 0.0",
    "ALTER TABLE projects ADD COLUMN active_version TEXT DEFAULT 'V1'",
    "ALTER TABLE boq_items ADD COLUMN version_id TEXT DEFAULT 'V1'",
    "ALTER TABLE boq_items ADD COLUMN section TEXT DEFAULT 'Superstructure'",
    "ALTER TABLE boq_items ADD COLUMN subsection TEXT DEFAULT ''",
    "ALTER TABLE boq_items ADD COLUMN notes TEXT DEFAULT ''",
    "ALTER TABLE boq_items ADD COLUMN is_ai_generated INTEGER DEFAULT 0",
    "ALTER TABLE boq_items ADD COLUMN is_confirmed INTEGER DEFAULT 1",
    "ALTER TABLE estimate_versions ADD COLUMN items_count INTEGER DEFAULT 0",
    "ALTER TABLE estimate_versions ADD COLUMN snapshot_json TEXT DEFAULT ''",
    "ALTER TABLE project_variations ADD COLUMN section TEXT DEFAULT ''",
    "ALTER TABLE project_variations ADD COLUMN unit TEXT DEFAULT 'm2'",
    "ALTER TABLE project_variations ADD COLUMN type TEXT DEFAULT 'addition'",
    "ALTER TABLE project_valuations ADD COLUMN description TEXT DEFAULT ''",
    "ALTER TABLE projects ADD COLUMN duration_months INTEGER DEFAULT 12",
    "ALTER TABLE projects ADD COLUMN advance_payment_percent REAL DEFAULT 15.0",
    "ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free_trial'",
    "ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'active'",
    "ALTER TABLE users ADD COLUMN subscription_expires_at TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN boq_credits INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN license_key TEXT DEFAULT ''",
  ];

  for (const alterSql of safeAlterColumns) {
    try {
      db.run(alterSql);
    } catch {
      // Column already exists, safe to ignore
    }
  }

  // Phase 4, 5, 6, 7, 8, 9 Tables Initialization
  const safeInitTables = [
    `CREATE TABLE IF NOT EXISTS project_documents (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT DEFAULT '',
      title TEXT NOT NULL,
      category TEXT DEFAULT 'Architectural',
      file_name TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      file_type TEXT DEFAULT 'application/pdf',
      file_path TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS project_collaborators (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      role TEXT DEFAULT 'Reviewer',
      invited_by TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS project_shares (
      id TEXT PRIMARY KEY,
      project_id TEXT UNIQUE NOT NULL,
      share_token TEXT UNIQUE NOT NULL,
      access_level TEXT DEFAULT 'viewer',
      passcode TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_rates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      item TEXT NOT NULL,
      description TEXT DEFAULT '',
      unit TEXT NOT NULL,
      rate REAL NOT NULL DEFAULT 0.0,
      material_cost REAL DEFAULT 0.0,
      labour_cost REAL DEFAULT 0.0,
      plant_cost REAL DEFAULT 0.0,
      location TEXT DEFAULT 'Lagos',
      source TEXT DEFAULT 'User Custom',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS project_cash_flow_milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      milestone_name TEXT NOT NULL,
      stage_order INTEGER DEFAULT 1,
      percentage REAL DEFAULT 0.0,
      planned_amount REAL DEFAULT 0.0,
      month_number INTEGER DEFAULT 1,
      estimated_completion_date TEXT DEFAULT '',
      status TEXT DEFAULT 'Scheduled',
      actual_certified_amount REAL DEFAULT 0.0,
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS tender_bidders (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      bidder_name TEXT NOT NULL,
      contact_person TEXT DEFAULT '',
      contact_phone TEXT DEFAULT '',
      contact_email TEXT DEFAULT '',
      total_bid_amount REAL DEFAULT 0.0,
      technical_score REAL DEFAULT 80.0,
      duration_weeks INTEGER DEFAULT 24,
      compliance_status TEXT DEFAULT 'Compliant',
      recommendation_rank INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS tender_bid_items (
      id TEXT PRIMARY KEY,
      bidder_id TEXT NOT NULL,
      boq_item_id TEXT DEFAULT '',
      trade_section TEXT NOT NULL,
      item_name TEXT NOT NULL,
      unit TEXT NOT NULL,
      qty REAL NOT NULL DEFAULT 0.0,
      rate REAL NOT NULL DEFAULT 0.0,
      amount REAL NOT NULL DEFAULT 0.0,
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS project_fluctuations (
      id TEXT PRIMARY KEY,
      project_id TEXT UNIQUE NOT NULL,
      clause_type TEXT DEFAULT 'FIDIC_70',
      base_date TEXT DEFAULT '',
      valuation_date TEXT DEFAULT '',
      base_cement_price REAL DEFAULT 5500.0,
      current_cement_price REAL DEFAULT 8500.0,
      cement_weight REAL DEFAULT 0.30,
      base_rebar_price REAL DEFAULT 750000.0,
      current_rebar_price REAL DEFAULT 1250000.0,
      rebar_weight REAL DEFAULT 0.25,
      base_diesel_price REAL DEFAULT 800.0,
      current_diesel_price REAL DEFAULT 1300.0,
      diesel_weight REAL DEFAULT 0.15,
      base_labour_rate REAL DEFAULT 4000.0,
      current_labour_rate REAL DEFAULT 6500.0,
      labour_weight REAL DEFAULT 0.20,
      fixed_element REAL DEFAULT 0.10,
      calculated_multiplier REAL DEFAULT 1.0,
      original_contract_sum REAL DEFAULT 0.0,
      claimable_fluctuation_sum REAL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS payment_transfers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_email TEXT DEFAULT '',
      user_name TEXT DEFAULT '',
      plan_id TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      amount_naira REAL NOT NULL,
      bank_name TEXT DEFAULT 'Access Bank',
      account_number TEXT DEFAULT '081515121',
      account_name TEXT DEFAULT 'Isaac Emmanuel',
      transfer_reference TEXT NOT NULL,
      sender_name TEXT DEFAULT '',
      sender_bank TEXT DEFAULT '',
      transfer_date TEXT DEFAULT '',
      receipt_url TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      verified_by TEXT DEFAULT '',
      verified_at TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS project_final_accounts (
      id TEXT PRIMARY KEY,
      project_id TEXT UNIQUE NOT NULL,
      original_contract_sum REAL DEFAULT 0.0,
      approved_variations_additions REAL DEFAULT 0.0,
      approved_variations_omissions REAL DEFAULT 0.0,
      net_variations REAL DEFAULT 0.0,
      provisional_sums_adjustment REAL DEFAULT 0.0,
      prime_cost_adjustment REAL DEFAULT 0.0,
      fluctuation_claim_amount REAL DEFAULT 0.0,
      dayworks_amount REAL DEFAULT 0.0,
      liquidated_damages_deduction REAL DEFAULT 0.0,
      other_setoffs REAL DEFAULT 0.0,
      gross_final_account_sum REAL DEFAULT 0.0,
      total_previous_payments REAL DEFAULT 0.0,
      total_retention_held REAL DEFAULT 0.0,
      retention_released REAL DEFAULT 0.0,
      balance_due_contractor REAL DEFAULT 0.0,
      practical_completion_date TEXT DEFAULT '',
      defects_liability_end_date TEXT DEFAULT '',
      defects_certificate_issued INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Draft',
      qs_signoff_name TEXT DEFAULT 'Isaac Emmanuel, MNIQS',
      qs_registration_number TEXT DEFAULT 'RQS/NIQS/8421',
      signoff_date TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS project_dossiers (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      prepared_by TEXT DEFAULT 'Isaac Emmanuel, MNIQS',
      client_recipient TEXT DEFAULT '',
      dossier_type TEXT DEFAULT 'Full Comprehensive Audit',
      include_tender INTEGER DEFAULT 1,
      include_cashflow INTEGER DEFAULT 1,
      include_materials INTEGER DEFAULT 1,
      include_fluctuation INTEGER DEFAULT 1,
      include_final_account INTEGER DEFAULT 1,
      include_license INTEGER DEFAULT 1,
      status TEXT DEFAULT 'Published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const tableSql of safeInitTables) {
    try {
      db.run(tableSql);
    } catch (e) {
      console.warn('Init table error:', e);
    }
  }

  // Seed sample project if database is empty
  seedSampleProject(db);
  saveDbToDisk();

  return db;
}

/**
 * Persist in-memory SQLite state to disk
 */
export function saveDbToDisk(): void {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to persist SQLite database:', err);
  }
}

/**
 * Seeds the requested sample project:
 * "2-Storey 100-Room Hostel Port Harcourt"
 * Only seeded when the projects table is completely empty.
 */
function seedSampleProject(database: Database): void {
  // Only seed sample project if the projects table is completely empty
  const checkAny = database.exec("SELECT COUNT(*) as count FROM projects");
  if (checkAny.length > 0 && checkAny[0].values.length > 0 && Number(checkAny[0].values[0][0]) > 0) {
    return; // Already has projects, do not re-seed or interfere
  }

  console.log('Seeding initial sample project: 2-Storey 100-Room Hostel Port Harcourt...');

  const sampleProjectId = 'sample-hostel-ph';
  const sampleItems: Omit<BoqItemRecord, 'project_id'>[] = [
    {
      id: 'item-1',
      item_number: 1,
      item: 'Site Mobilisation & Setup',
      description: 'Mobilisation of heavy plant, labour, temporary site office, materials storage sheds, and site security setup',
      unit: 'Item',
      qty: 1,
      rate: 2500000,
      amount: 2500000
    },
    {
      id: 'item-2',
      item_number: 2,
      item: 'Setting Out & Site Datum',
      description: 'Setting out the building lines, profiles, and establishing site datum bench-marks',
      unit: 'Item',
      qty: 1,
      rate: 450000,
      amount: 450000
    },
    {
      id: 'item-3',
      item_number: 3,
      item: 'Site Clearance',
      description: 'Clear site of shrubs, vegetation, surface roots, and cart away debris to approved government tip',
      unit: 'm2',
      qty: 1400.0,
      rate: 850,
      amount: 1190000
    },
    {
      id: 'item-4',
      item_number: 4,
      item: 'Raft Foundation Bulk Excavation',
      description: 'Excavate oversite for raft slab and edge beam trenches not exceeding 1.5m deep in Port Harcourt soft clay',
      unit: 'm3',
      qty: 720.0,
      rate: 7500,
      amount: 5400000
    },
    {
      id: 'item-5',
      item_number: 5,
      item: 'Concrete Blinding (1:3:6)',
      description: '50mm thick mass concrete (1:3:6 - 20mm aggregate) blinding under raft foundation slab and edge downstand beams',
      unit: 'm3',
      qty: 36.0,
      rate: 98000,
      amount: 3528000
    },
    {
      id: 'item-6',
      item_number: 6,
      item: 'Reinforced Concrete Raft Slab & Beams',
      description: 'Reinforced concrete Grade 25 in 250mm thick raft foundation slab and downstand beams with high-yield rebar and formwork',
      unit: 'm3',
      qty: 195.0,
      rate: 195000,
      amount: 38025000
    },
    {
      id: 'item-7',
      item_number: 7,
      item: 'Hardcore Bed (150mm)',
      description: '150mm thick clean crushed granite rock hardcore bed consolidated and blinded with sharp sand',
      unit: 'm2',
      qty: 600.0,
      rate: 4800,
      amount: 2880000
    },
    {
      id: 'item-8',
      item_number: 8,
      item: 'Damp Proof Membrane (DPM)',
      description: '1000-gauge polythene damp proof membrane laid over sand blinding with 150mm sealed laps',
      unit: 'm2',
      qty: 690.0,
      rate: 1400,
      amount: 966000
    },
    {
      id: 'item-9',
      item_number: 9,
      item: 'Reinforced Concrete Columns',
      description: '225x225mm reinforced concrete Grade 25 columns with 16mm high-yield rebar, links, and marine-board formwork',
      unit: 'm3',
      qty: 48.0,
      rate: 210000,
      amount: 10080000
    },
    {
      id: 'item-10',
      item_number: 10,
      item: 'Reinforced Concrete Suspended Slab',
      description: '150mm thick reinforced concrete Grade 25 suspended floor slab and beams including props and formwork',
      unit: 'm3',
      qty: 90.0,
      rate: 220000,
      amount: 19800000
    },
    {
      id: 'item-11',
      item_number: 11,
      item: 'Reinforced Concrete Staircases',
      description: 'Reinforced concrete Grade 25 in waist slab, risers, treads, landings, and steel balustrade handrails',
      unit: 'm3',
      qty: 7.6,
      rate: 230000,
      amount: 1748000
    },
    {
      id: 'item-12',
      item_number: 12,
      item: 'External Blockwork (225mm)',
      description: '225mm thick vibrated sandcrete hollow blockwork in cement mortar (1:4) for external perimeter & spine walls',
      unit: 'm2',
      qty: 1840.0,
      rate: 14500,
      amount: 26680000
    },
    {
      id: 'item-13',
      item_number: 13,
      item: 'Internal Partition Blockwork (150mm)',
      description: '150mm thick vibrated sandcrete hollow blockwork in cement mortar (1:4) for hostel room partitions',
      unit: 'm2',
      qty: 1420.0,
      rate: 12500,
      amount: 17750000
    },
    {
      id: 'item-14',
      item_number: 14,
      item: 'Timber Roof Trusses & Carcassing',
      description: 'Treated hardwood timber trusses, rafters, purlins, wall plates, and bracing fixed with galvanized straps',
      unit: 'm2',
      qty: 820.0,
      rate: 16500,
      amount: 13530000
    },
    {
      id: 'item-15',
      item_number: 15,
      item: 'Roofing Sheets (0.55mm Aluminium)',
      description: '0.55mm aluminium longspan standing seam roofing sheets on timber trusses with ridge caps & gutters',
      unit: 'm2',
      qty: 885.0,
      rate: 28500,
      amount: 25222500
    },
    {
      id: 'item-16',
      item_number: 16,
      item: 'Doors',
      description: 'Semi-solid core timber flush doors 900x2100mm in hardwood frames with 3-lever mortice locks and brass hinges for hostel rooms',
      unit: 'No',
      qty: 104,
      rate: 78000,
      amount: 8112000
    },
    {
      id: 'item-17',
      item_number: 17,
      item: 'Windows',
      description: 'Anodized aluminium sliding glazed windows (1200x1200mm) with 5mm tinted glass, insect screens, and projected burglar bars',
      unit: 'No',
      qty: 110,
      rate: 68000,
      amount: 7480000
    },
    {
      id: 'item-18',
      item_number: 18,
      item: 'Internal Plastering & External Rendering',
      description: '15mm cement-sand plastering to internal walls and weather-proof rendering to external elevations',
      unit: 'm2',
      qty: 3680.0,
      rate: 4400,
      amount: 16192000
    },
    {
      id: 'item-19',
      item_number: 19,
      item: 'Porcelain Floor Tiling',
      description: '600x600mm vitrified porcelain floor tiles laid on 38mm cement mortar bed with anti-fungal grout',
      unit: 'm2',
      qty: 950.0,
      rate: 15500,
      amount: 14725000
    },
    {
      id: 'item-20',
      item_number: 20,
      item: 'Electrical Services Conduit & Distribution',
      description: 'PVC conduit piping, copper cables, socket outlets, lighting fittings, distribution boards, and earth rod setup',
      unit: 'Item',
      qty: 1,
      rate: 8500000,
      amount: 8500000
    },
    {
      id: 'item-21',
      item_number: 21,
      item: 'Plumbing Soil & Waste Installation',
      description: 'Heavy gauge PVC soil/waste stacks, PPR cold/hot water distribution pipes, and water closet sanitary fittings',
      unit: 'Item',
      qty: 1,
      rate: 7200000,
      amount: 7200000
    },
    {
      id: 'item-22',
      item_number: 22,
      item: 'Provisional Sum for Contingencies',
      description: 'Provisional allowance for unforeseen ground conditions and engineering adjustments',
      unit: 'Item',
      qty: 1,
      rate: 5000000,
      amount: 5000000
    }
  ];

  const subtotal = sampleItems.reduce((acc, curr) => acc + curr.amount, 0); // 123,815,500
  const poPercent = 15.0;
  const vatPercent = 7.5;
  const swampPremiumPercent = 5.0; // Port Harcourt terrain adjustment
  const swampAmount = subtotal * (swampPremiumPercent / 100);
  const adjustedSubtotal = subtotal + swampAmount;
  const poAmount = adjustedSubtotal * (poPercent / 100);
  const vatAmount = (adjustedSubtotal + poAmount) * (vatPercent / 100);
  const grandTotal = adjustedSubtotal + poAmount + vatAmount;

  // Insert project
  database.run(
    `INSERT INTO projects (
      id, title, location, client_name, drawing_filename, drawing_url,
      po_percent, vat_percent, swamp_premium_percent,
      subtotal, po_amount, vat_amount, grand_total, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sampleProjectId,
      '2-Storey 100-Room Hostel Port Harcourt',
      'Port Harcourt, Rivers State, Nigeria (Near FUTO/UNIPORT Road)',
      'Niger Delta Educational Consortium Ltd',
      'hostel_architectural_plans_ph.pdf',
      '',
      poPercent,
      vatPercent,
      swampPremiumPercent,
      subtotal,
      poAmount,
      vatAmount,
      grandTotal,
      'Architectural drawing reviewed for student hostel blocks. Soil conditions require raft foundation and Niger Delta terrain premium.'
    ]
  );

  // Insert items
  for (const it of sampleItems) {
    database.run(
      `INSERT INTO boq_items (
        id, project_id, item_number, item, description, unit, qty, rate, amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        it.id,
        sampleProjectId,
        it.item_number,
        it.item,
        it.description,
        it.unit,
        it.qty,
        it.rate,
        it.amount
      ]
    );
  }
}

/**
 * Query all projects (optionally filtered by authenticated user)
 */
export async function getAllProjects(userId?: string): Promise<ProjectRecord[]> {
  const database = await getDb();
  let sql = 'SELECT * FROM projects';
  if (userId) {
    const safeUser = userId.replace(/'/g, "''");
    sql += ` WHERE user_id = '${safeUser}' OR user_id = '' OR user_id IS NULL`;
  }
  sql += ' ORDER BY updated_at DESC';

  const res = database.exec(sql);
  if (res.length === 0) return [];

  const columns = res[0].columns;
  const rows = res[0].values;

  // Fetch all boq items to populate items array for all projects
  const itemsRes = database.exec('SELECT * FROM boq_items ORDER BY item_number ASC');
  const itemsByProject: Record<string, BoqItemRecord[]> = {};
  if (itemsRes.length > 0) {
    const itemCols = itemsRes[0].columns;
    itemsRes[0].values.forEach((row) => {
      const itemObj: Record<string, any> = {};
      itemCols.forEach((col, idx) => {
        itemObj[col] = row[idx];
      });
      const pId = itemObj.project_id;
      if (!itemsByProject[pId]) itemsByProject[pId] = [];
      itemsByProject[pId].push(itemObj as BoqItemRecord);
    });
  }

  const projects: ProjectRecord[] = rows.map((row) => {
    const obj: Record<string, any> = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    obj.items = itemsByProject[obj.id] || [];
    return obj as ProjectRecord;
  });

  return projects;
}

/**
 * Get single project with its items
 */
export async function getProjectById(id: string): Promise<ProjectRecord | null> {
  const database = await getDb();
  const res = database.exec(`SELECT * FROM projects WHERE id = '${id.replace(/'/g, "''")}'`);
  if (res.length === 0 || res[0].values.length === 0) return null;

  const projectCols = res[0].columns;
  const projectRow = res[0].values[0];
  const project: Record<string, any> = {};
  projectCols.forEach((col, idx) => {
    project[col] = projectRow[idx];
  });

  const itemsRes = database.exec(`SELECT * FROM boq_items WHERE project_id = '${id.replace(/'/g, "''")}' ORDER BY item_number ASC`);
  const items: BoqItemRecord[] = [];
  if (itemsRes.length > 0) {
    const itemCols = itemsRes[0].columns;
    itemsRes[0].values.forEach((row) => {
      const itemObj: Record<string, any> = {};
      itemCols.forEach((col, idx) => {
        itemObj[col] = row[idx];
      });
      items.push(itemObj as BoqItemRecord);
    });
  }

  project.items = items;
  return project as ProjectRecord;
}

/**
 * Upsert project and its items
 */
export async function saveProject(data: Partial<ProjectRecord> & { id: string; items?: BoqItemRecord[] }): Promise<ProjectRecord> {
  const database = await getDb();
  const existing = await getProjectById(data.id);

  const safeItems = Array.isArray(data.items) ? data.items : (existing?.items || []);
  const subtotal = safeItems.reduce((acc, curr) => acc + (Number(curr.qty || 0) * Number(curr.rate || 0)), 0);
  const poPercent = data.po_percent ?? (existing?.po_percent ?? 15.0);
  const vatPercent = data.vat_percent ?? (existing?.vat_percent ?? 7.5);
  const swampPercent = data.swamp_premium_percent ?? (existing?.swamp_premium_percent ?? 0.0);
  const wastePercent = data.waste_percent ?? (existing?.waste_percent ?? 5.0);
  const contingencyPercent = data.contingency_percent ?? (existing?.contingency_percent ?? 5.0);
  const inflationPercent = data.inflation_percent ?? (existing?.inflation_percent ?? 0.0);

  const swampAmount = subtotal * (swampPercent / 100);
  const adjustedSub = subtotal + swampAmount;
  const poAmount = adjustedSub * (poPercent / 100);
  const vatAmount = (adjustedSub + poAmount) * (vatPercent / 100);
  const grandTotal = adjustedSub + poAmount + vatAmount;

  if (existing) {
    database.run(
      `UPDATE projects SET 
        title = ?, location = ?, client_name = ?, drawing_filename = ?, drawing_url = ?,
        po_percent = ?, vat_percent = ?, swamp_premium_percent = ?,
        waste_percent = ?, contingency_percent = ?, inflation_percent = ?,
        subtotal = ?, po_amount = ?, vat_amount = ?, grand_total = ?, notes = ?,
        project_type = ?, client_contact = ?, state = ?, country = ?, description = ?,
        gfa = ?, number_of_floors = ?, status = ?, start_date = ?, target_completion_date = ?,
        active_version = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        data.title || existing.title,
        data.location || existing.location || 'Nigeria',
        data.client_name ?? existing.client_name,
        data.drawing_filename ?? existing.drawing_filename,
        data.drawing_url ?? existing.drawing_url,
        poPercent,
        vatPercent,
        swampPercent,
        wastePercent,
        contingencyPercent,
        inflationPercent,
        subtotal,
        poAmount,
        vatAmount,
        grandTotal,
        data.notes ?? existing.notes,
        data.project_type ?? existing.project_type ?? 'Residential',
        data.client_contact ?? existing.client_contact ?? '',
        data.state ?? existing.state ?? 'Lagos',
        data.country ?? existing.country ?? 'Nigeria',
        data.description ?? existing.description ?? '',
        data.gfa ?? existing.gfa ?? 0.0,
        data.number_of_floors ?? existing.number_of_floors ?? 1,
        data.status ?? existing.status ?? 'In Progress',
        data.start_date ?? existing.start_date ?? '',
        data.target_completion_date ?? existing.target_completion_date ?? '',
        data.active_version ?? existing.active_version ?? 'V1',
        data.id
      ]
    );

    // Replace items
    database.run(`DELETE FROM boq_items WHERE project_id = '${data.id.replace(/'/g, "''")}'`);
  } else {
    database.run(
      `INSERT INTO projects (
        id, user_id, title, location, client_name, client_contact, drawing_filename, drawing_url,
        po_percent, vat_percent, swamp_premium_percent, waste_percent, contingency_percent, inflation_percent,
        subtotal, po_amount, vat_amount, grand_total, notes, project_type, state, country, description,
        gfa, number_of_floors, status, start_date, target_completion_date, active_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.user_id || '',
        data.title || 'Untitled Estimate',
        data.location || 'Lagos, Nigeria',
        data.client_name || '',
        data.client_contact || '',
        data.drawing_filename || '',
        data.drawing_url || '',
        poPercent,
        vatPercent,
        swampPercent,
        wastePercent,
        contingencyPercent,
        inflationPercent,
        subtotal,
        poAmount,
        vatAmount,
        grandTotal,
        data.notes || '',
        data.project_type || 'Residential',
        data.state || 'Lagos',
        data.country || 'Nigeria',
        data.description || '',
        data.gfa || 0.0,
        data.number_of_floors || 1,
        data.status || 'In Progress',
        data.start_date || '',
        data.target_completion_date || '',
        data.active_version || 'V1'
      ]
    );
  }

  // Insert all items
  let itemNum = 1;
  for (const item of data.items) {
    const qty = Number(item.qty || 0);
    const rate = Number(item.rate || 0);
    const amount = qty * rate;
    const itemId = item.id || `item-${Date.now()}-${itemNum}`;

    database.run(
      `INSERT INTO boq_items (
        id, project_id, version_id, section, subsection, item_number, item, description, unit, qty, rate, amount, notes, is_ai_generated, is_confirmed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        itemId,
        data.id,
        item.version_id || data.active_version || 'V1',
        item.section || 'Superstructure',
        item.subsection || '',
        item.item_number || itemNum,
        item.item || 'Item',
        item.description || '',
        item.unit || 'm2',
        qty,
        rate,
        amount,
        item.notes || '',
        item.is_ai_generated ? 1 : 0,
        item.is_confirmed !== undefined ? (item.is_confirmed ? 1 : 0) : 1
      ]
    );
    itemNum++;
  }

  saveDbToDisk();
  const updated = await getProjectById(data.id);
  return updated!;
}

/**
 * Duplicate an existing project
 */
export async function duplicateProject(id: string, newTitle?: string, userId?: string): Promise<ProjectRecord | null> {
  const source = await getProjectById(id);
  if (!source) return null;

  const newId = 'proj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const clonedItems: BoqItemRecord[] = (source.items || []).map((it, idx) => ({
    ...it,
    id: `item-${Date.now()}-${idx + 1}`,
    project_id: newId
  }));

  const clonedProject: Partial<ProjectRecord> & { id: string; items: BoqItemRecord[] } = {
    ...source,
    id: newId,
    user_id: userId || source.user_id,
    title: newTitle || `${source.title} (Copy)`,
    status: 'Draft',
    items: clonedItems
  };

  return saveProject(clonedProject);
}

/**
 * Archive or change project status
 */
export async function updateProjectStatus(id: string, status: 'Draft' | 'In Progress' | 'Submitted' | 'Approved' | 'Archived'): Promise<boolean> {
  const database = await getDb();
  database.run(`UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, id]);
  saveDbToDisk();
  return true;
}

/**
 * Record activity audit entry
 */
export async function recordActivity(projectId: string, userId: string, userName: string, action: string, details = ''): Promise<void> {
  try {
    const database = await getDb();
    const id = 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    database.run(
      `INSERT INTO project_activities (id, project_id, user_id, user_name, action, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, projectId, userId, userName, action, details]
    );
    saveDbToDisk();
  } catch (err) {
    console.warn('Failed to record activity:', err);
  }
}

/**
 * Fetch activities for a project or user
 */
export async function getProjectActivities(projectId?: string, userId?: string): Promise<any[]> {
  const database = await getDb();
  let sql = 'SELECT * FROM project_activities';
  if (projectId) {
    sql += ` WHERE project_id = '${projectId.replace(/'/g, "''")}'`;
  } else if (userId) {
    sql += ` WHERE user_id = '${userId.replace(/'/g, "''")}'`;
  }
  sql += ' ORDER BY created_at DESC LIMIT 50';

  const res = database.exec(sql);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj: any = {};
    cols.forEach((col, idx) => { obj[col] = row[idx]; });
    return obj;
  });
}

/**
 * Delete project
 */
export async function deleteProject(id: string): Promise<boolean> {
  const database = await getDb();
  database.run(`DELETE FROM boq_items WHERE project_id = '${id.replace(/'/g, "''")}'`);
  database.run(`DELETE FROM estimate_versions WHERE project_id = '${id.replace(/'/g, "''")}'`);
  database.run(`DELETE FROM project_documents WHERE project_id = '${id.replace(/'/g, "''")}'`);
  database.run(`DELETE FROM project_variations WHERE project_id = '${id.replace(/'/g, "''")}'`);
  database.run(`DELETE FROM project_valuations WHERE project_id = '${id.replace(/'/g, "''")}'`);
  database.run(`DELETE FROM projects WHERE id = '${id.replace(/'/g, "''")}'`);
  saveDbToDisk();
  return true;
}

// ========================================================================
// PHASE 2: ESTIMATE VERSION SNAPSHOTS & AUDIT LOG
// ========================================================================

export interface VersionRecord {
  id: string;
  project_id: string;
  version_name: string;
  description: string;
  subtotal: number;
  grand_total: number;
  items_count: number;
  snapshot_json: string;
  created_at: string;
}

export async function getEstimateVersions(projectId: string): Promise<VersionRecord[]> {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT id, project_id, version_name, description, subtotal, grand_total, items_count, created_at FROM estimate_versions WHERE project_id = '${safeId}' ORDER BY created_at DESC`);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj: any = {};
    cols.forEach((col, idx) => { obj[col] = row[idx]; });
    return obj as VersionRecord;
  });
}

export async function createEstimateVersion(projectId: string, versionName: string, description = '', userId = '', userName = 'QS Estimator'): Promise<VersionRecord> {
  const database = await getDb();
  const project = await getProjectById(projectId);
  if (!project) throw new Error('Project not found to create version.');

  const versionId = 'ver-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const items = project.items || [];
  const snapshotJson = JSON.stringify({
    project: {
      po_percent: project.po_percent,
      vat_percent: project.vat_percent,
      swamp_premium_percent: project.swamp_premium_percent,
      waste_percent: project.waste_percent,
      contingency_percent: project.contingency_percent,
      inflation_percent: project.inflation_percent,
      subtotal: project.subtotal,
      po_amount: project.po_amount,
      vat_amount: project.vat_amount,
      grand_total: project.grand_total,
    },
    items
  });

  database.run(
    `INSERT INTO estimate_versions (id, project_id, version_name, description, subtotal, grand_total, items_count, snapshot_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [versionId, projectId, versionName, description, project.subtotal, project.grand_total, items.length, snapshotJson]
  );

  database.run(
    `UPDATE projects SET active_version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [versionName, projectId]
  );

  saveDbToDisk();
  await recordActivity(projectId, userId || 'sys', userName, 'Created Estimate Version', `${versionName}: ₦${project.grand_total.toLocaleString()} (${items.length} items)`);

  return {
    id: versionId,
    project_id: projectId,
    version_name: versionName,
    description,
    subtotal: project.subtotal,
    grand_total: project.grand_total,
    items_count: items.length,
    snapshot_json: snapshotJson,
    created_at: new Date().toISOString()
  };
}

export async function restoreEstimateVersion(projectId: string, versionId: string, userId = '', userName = 'QS Estimator'): Promise<ProjectRecord> {
  const database = await getDb();
  const safeVerId = versionId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM estimate_versions WHERE id = '${safeVerId}'`);
  if (res.length === 0 || res[0].values.length === 0) {
    throw new Error('Version snapshot not found.');
  }

  const cols = res[0].columns;
  const row = res[0].values[0];
  const versionObj: any = {};
  cols.forEach((col, idx) => { versionObj[col] = row[idx]; });

  if (!versionObj.snapshot_json) {
    throw new Error('No snapshot data saved in this version.');
  }

  const parsed = JSON.parse(versionObj.snapshot_json);
  const items = (parsed.items || []) as BoqItemRecord[];
  const projectParams = parsed.project || {};

  // Update project parameters
  const currentProject = await getProjectById(projectId);
  if (!currentProject) throw new Error('Project not found.');

  const updatedPayload: any = {
    ...currentProject,
    active_version: versionObj.version_name,
    po_percent: projectParams.po_percent ?? currentProject.po_percent,
    vat_percent: projectParams.vat_percent ?? currentProject.vat_percent,
    swamp_premium_percent: projectParams.swamp_premium_percent ?? currentProject.swamp_premium_percent,
    waste_percent: projectParams.waste_percent ?? currentProject.waste_percent,
    contingency_percent: projectParams.contingency_percent ?? currentProject.contingency_percent,
    inflation_percent: projectParams.inflation_percent ?? currentProject.inflation_percent,
    items
  };

  const saved = await saveProject(updatedPayload);
  await recordActivity(projectId, userId || 'sys', userName, 'Restored Estimate Version', `Restored to ${versionObj.version_name} (₦${versionObj.grand_total.toLocaleString()})`);
  return saved;
}

export async function deleteEstimateVersion(versionId: string): Promise<boolean> {
  const database = await getDb();
  database.run(`DELETE FROM estimate_versions WHERE id = '${versionId.replace(/'/g, "''")}'`);
  saveDbToDisk();
  return true;
}

// ========================================================================
// PHASE 3: PROJECT VARIATIONS (ADDITIONS & OMISSIONS)
// ========================================================================

export interface VariationRecord {
  id: string;
  project_id: string;
  variation_number: string;
  description: string;
  section: string;
  reason: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  type: 'addition' | 'omission';
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  created_at: string;
}

export async function getProjectVariations(projectId: string): Promise<VariationRecord[]> {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM project_variations WHERE project_id = '${safeId}' ORDER BY created_at ASC`);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj: any = {};
    cols.forEach((col, idx) => { obj[col] = row[idx]; });
    return obj as VariationRecord;
  });
}

export async function createProjectVariation(data: {
  project_id: string;
  variation_number: string;
  description: string;
  section?: string;
  reason?: string;
  quantity: number;
  unit?: string;
  rate: number;
  type?: 'addition' | 'omission';
  status?: string;
}, userId = '', userName = 'QS Estimator'): Promise<VariationRecord> {
  const database = await getDb();
  const id = 'var-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const qty = Number(data.quantity || 1);
  const rate = Number(data.rate || 0);
  const isOmission = data.type === 'omission';
  const amount = Math.abs(qty * rate) * (isOmission ? -1 : 1);
  const status = data.status || 'Draft';
  const unit = data.unit || 'm2';
  const type = isOmission ? 'omission' : 'addition';
  const section = data.section || 'General Works';
  const reason = data.reason || '';

  database.run(
    `INSERT INTO project_variations (id, project_id, variation_number, description, reason, section, quantity, unit, rate, amount, type, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.project_id, data.variation_number, data.description, reason, section, qty, unit, rate, amount, type, status]
  );

  saveDbToDisk();
  await recordActivity(data.project_id, userId || 'sys', userName, 'Created Variation', `${data.variation_number}: ${data.description} (${amount >= 0 ? '+' : ''}₦${amount.toLocaleString()})`);

  return {
    id,
    project_id: data.project_id,
    variation_number: data.variation_number,
    description: data.description,
    section,
    reason,
    quantity: qty,
    unit,
    rate,
    amount,
    type,
    status: status as any,
    created_at: new Date().toISOString()
  };
}

export async function updateProjectVariation(id: string, data: Partial<VariationRecord>, userId = '', userName = 'QS Estimator'): Promise<boolean> {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  const currentRes = database.exec(`SELECT * FROM project_variations WHERE id = '${safeId}'`);
  if (currentRes.length === 0 || currentRes[0].values.length === 0) return false;

  const cols = currentRes[0].columns;
  const current: any = {};
  cols.forEach((col, idx) => { current[col] = currentRes[0].values[0][idx]; });

  const desc = data.description ?? current.description;
  const reason = data.reason ?? current.reason;
  const section = data.section ?? current.section;
  const qty = data.quantity !== undefined ? Number(data.quantity) : Number(current.quantity);
  const unit = data.unit ?? current.unit;
  const rate = data.rate !== undefined ? Number(data.rate) : Number(current.rate);
  const type = data.type ?? current.type ?? 'addition';
  const status = data.status ?? current.status ?? 'Draft';
  const amount = Math.abs(qty * rate) * (type === 'omission' ? -1 : 1);

  database.run(
    `UPDATE project_variations SET description = ?, reason = ?, section = ?, quantity = ?, unit = ?, rate = ?, amount = ?, type = ?, status = ?
     WHERE id = ?`,
    [desc, reason, section, qty, unit, rate, amount, type, status, id]
  );

  saveDbToDisk();
  await recordActivity(current.project_id, userId || 'sys', userName, 'Updated Variation', `${current.variation_number} status: ${status} (Amount: ₦${amount.toLocaleString()})`);
  return true;
}

export async function deleteProjectVariation(id: string): Promise<boolean> {
  const database = await getDb();
  database.run(`DELETE FROM project_variations WHERE id = '${id.replace(/'/g, "''")}'`);
  saveDbToDisk();
  return true;
}

// ========================================================================
// PHASE 3: INTERIM VALUATIONS & PAYMENT CERTIFICATES
// ========================================================================

export interface ValuationRecord {
  id: string;
  project_id: string;
  valuation_number: string;
  valuation_date: string;
  description: string;
  previous_valuation: number;
  current_valuation: number;
  cumulative_value: number;
  retention_percent: number;
  retention_amount: number;
  advance_payment_deduction: number;
  previous_payments: number;
  amount_due: number;
  status: 'Draft' | 'Certified' | 'Paid';
  created_at: string;
}

export async function getProjectValuations(projectId: string): Promise<ValuationRecord[]> {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM project_valuations WHERE project_id = '${safeId}' ORDER BY created_at ASC`);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj: any = {};
    cols.forEach((col, idx) => { obj[col] = row[idx]; });
    return obj as ValuationRecord;
  });
}

export async function createProjectValuation(data: {
  project_id: string;
  valuation_number: string;
  valuation_date?: string;
  description?: string;
  previous_valuation?: number;
  current_valuation: number;
  retention_percent?: number;
  advance_payment_deduction?: number;
  previous_payments?: number;
  status?: string;
}, userId = '', userName = 'QS Estimator'): Promise<ValuationRecord> {
  const database = await getDb();
  const id = 'val-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

  const prevVal = Number(data.previous_valuation || 0);
  const curVal = Number(data.current_valuation || 0);
  const cumulative = prevVal + curVal;
  const retentionPct = Number(data.retention_percent ?? 5.0);
  const retentionAmt = cumulative * (retentionPct / 100);
  const advanceDed = Number(data.advance_payment_deduction || 0);
  const prevPaid = Number(data.previous_payments || 0);
  const amountDue = Math.max(0, cumulative - retentionAmt - advanceDed - prevPaid);
  const dateStr = data.valuation_date || new Date().toISOString().split('T')[0];
  const desc = data.description || '';
  const status = data.status || 'Draft';

  database.run(
    `INSERT INTO project_valuations (
      id, project_id, valuation_number, valuation_date, description,
      previous_valuation, current_valuation, cumulative_value,
      retention_percent, retention_amount, advance_payment_deduction, previous_payments, amount_due, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.project_id, data.valuation_number, dateStr, desc,
      prevVal, curVal, cumulative,
      retentionPct, retentionAmt, advanceDed, prevPaid, amountDue, status
    ]
  );

  saveDbToDisk();
  await recordActivity(data.project_id, userId || 'sys', userName, 'Created Interim Valuation', `${data.valuation_number}: Amount Due ₦${amountDue.toLocaleString()}`);

  return {
    id,
    project_id: data.project_id,
    valuation_number: data.valuation_number,
    valuation_date: dateStr,
    description: desc,
    previous_valuation: prevVal,
    current_valuation: curVal,
    cumulative_value: cumulative,
    retention_percent: retentionPct,
    retention_amount: retentionAmt,
    advance_payment_deduction: advanceDed,
    previous_payments: prevPaid,
    amount_due: amountDue,
    status: status as any,
    created_at: new Date().toISOString()
  };
}

export async function updateProjectValuation(id: string, data: Partial<ValuationRecord>, userId = '', userName = 'QS Estimator'): Promise<boolean> {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  const currentRes = database.exec(`SELECT * FROM project_valuations WHERE id = '${safeId}'`);
  if (currentRes.length === 0 || currentRes[0].values.length === 0) return false;

  const cols = currentRes[0].columns;
  const current: any = {};
  cols.forEach((col, idx) => { current[col] = currentRes[0].values[0][idx]; });

  const prevVal = data.previous_valuation !== undefined ? Number(data.previous_valuation) : Number(current.previous_valuation);
  const curVal = data.current_valuation !== undefined ? Number(data.current_valuation) : Number(current.current_valuation);
  const cumulative = prevVal + curVal;
  const retentionPct = data.retention_percent !== undefined ? Number(data.retention_percent) : Number(current.retention_percent);
  const retentionAmt = cumulative * (retentionPct / 100);
  const advanceDed = data.advance_payment_deduction !== undefined ? Number(data.advance_payment_deduction) : Number(current.advance_payment_deduction);
  const prevPaid = data.previous_payments !== undefined ? Number(data.previous_payments) : Number(current.previous_payments);
  const amountDue = Math.max(0, cumulative - retentionAmt - advanceDed - prevPaid);
  const status = data.status ?? current.status ?? 'Draft';
  const desc = data.description ?? current.description;
  const valDate = data.valuation_date ?? current.valuation_date;

  database.run(
    `UPDATE project_valuations SET 
      previous_valuation = ?, current_valuation = ?, cumulative_value = ?,
      retention_percent = ?, retention_amount = ?, advance_payment_deduction = ?, previous_payments = ?,
      amount_due = ?, status = ?, description = ?, valuation_date = ?
     WHERE id = ?`,
    [prevVal, curVal, cumulative, retentionPct, retentionAmt, advanceDed, prevPaid, amountDue, status, desc, valDate, id]
  );

  saveDbToDisk();
  await recordActivity(current.project_id, userId || 'sys', userName, 'Updated Interim Valuation', `${current.valuation_number} marked as ${status} (Amount Due: ₦${amountDue.toLocaleString()})`);
  return true;
}

export async function deleteProjectValuation(id: string): Promise<boolean> {
  const database = await getDb();
  database.run(`DELETE FROM project_valuations WHERE id = '${id.replace(/'/g, "''")}'`);
  saveDbToDisk();
  return true;
}

// ==========================================
// PHASE 6: PROJECT DOCUMENTS CRUD
// ==========================================

export async function getProjectDocuments(projectId: string): Promise<any[]> {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM project_documents WHERE project_id = '${safeId}' ORDER BY created_at DESC`);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj: any = {};
    cols.forEach((col, idx) => { obj[col] = row[idx]; });
    return obj;
  });
}

export async function createProjectDocument(data: {
  projectId: string;
  userId?: string;
  title: string;
  category?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath?: string;
  userName?: string;
}): Promise<any> {
  const database = await getDb();
  const id = 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();
  const category = data.category || 'Architectural';

  database.run(
    `INSERT INTO project_documents (id, project_id, user_id, title, category, file_name, file_size, file_type, file_path, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.projectId, data.userId || '', data.title, category, data.fileName, data.fileSize, data.fileType, data.filePath || '', now]
  );

  saveDbToDisk();
  await recordActivity(
    data.projectId,
    data.userId || 'sys',
    data.userName || 'QS Estimator',
    'Uploaded Document',
    `Attached ${category} document: "${data.title}" (${data.fileName})`
  );

  return {
    id,
    project_id: data.projectId,
    user_id: data.userId || '',
    title: data.title,
    category,
    file_name: data.fileName,
    file_size: data.fileSize,
    file_type: data.fileType,
    file_path: data.filePath || '',
    created_at: now
  };
}

export async function deleteProjectDocument(id: string, userId = '', userName = 'QS Estimator'): Promise<boolean> {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  const current = database.exec(`SELECT project_id, title, file_name FROM project_documents WHERE id = '${safeId}'`);
  let projId = '';
  let title = '';
  if (current.length > 0 && current[0].values.length > 0) {
    projId = String(current[0].values[0][0]);
    title = String(current[0].values[0][1]);
  }

  database.run(`DELETE FROM project_documents WHERE id = '${safeId}'`);
  saveDbToDisk();

  if (projId) {
    await recordActivity(projId, userId || 'sys', userName, 'Deleted Document', `Removed document: "${title}"`);
  }
  return true;
}

// ==========================================
// PHASE 6: PROJECT COLLABORATORS & SHARING
// ==========================================

export async function getProjectCollaborators(projectId: string): Promise<any[]> {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM project_collaborators WHERE project_id = '${safeId}' ORDER BY created_at ASC`);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj: any = {};
    cols.forEach((col, idx) => { obj[col] = row[idx]; });
    return obj;
  });
}

export async function addProjectCollaborator(projectId: string, userEmail: string, role: string, invitedBy = '', userName = 'QS Lead'): Promise<any> {
  const database = await getDb();
  const id = 'collab-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  database.run(
    `INSERT INTO project_collaborators (id, project_id, user_email, role, invited_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, projectId, userEmail.trim().toLowerCase(), role, invitedBy, now]
  );

  saveDbToDisk();
  await recordActivity(
    projectId,
    invitedBy || 'sys',
    userName,
    'Added Collaborator',
    `Granted ${role} role to ${userEmail}`
  );

  return { id, project_id: projectId, user_email: userEmail, role, created_at: now };
}

export async function removeProjectCollaborator(id: string, projectId: string, userEmail: string, adminId = '', userName = 'QS Lead'): Promise<boolean> {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  database.run(`DELETE FROM project_collaborators WHERE id = '${safeId}'`);
  saveDbToDisk();

  await recordActivity(
    projectId,
    adminId || 'sys',
    userName,
    'Removed Collaborator',
    `Revoked project access for ${userEmail}`
  );
  return true;
}

export async function getProjectShare(projectId: string): Promise<any | null> {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM project_shares WHERE project_id = '${safeId}'`);
  if (res.length === 0 || res[0].values.length === 0) return null;
  const cols = res[0].columns;
  const obj: any = {};
  cols.forEach((col, idx) => { obj[col] = res[0].values[0][idx]; });
  return obj;
}

export async function saveProjectShare(projectId: string, accessLevel: string, passcode = '', isActive = true): Promise<any> {
  const database = await getDb();
  const existing = await getProjectShare(projectId);
  const shareToken = existing?.share_token || ('sh_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36));
  const activeInt = isActive ? 1 : 0;
  const now = new Date().toISOString();

  if (existing) {
    database.run(
      `UPDATE project_shares SET access_level = ?, passcode = ?, is_active = ? WHERE project_id = ?`,
      [accessLevel, passcode, activeInt, projectId]
    );
  } else {
    const id = 'share-' + Date.now();
    database.run(
      `INSERT INTO project_shares (id, project_id, share_token, access_level, passcode, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, projectId, shareToken, accessLevel, passcode, activeInt, now]
    );
  }

  saveDbToDisk();
  return {
    projectId,
    shareToken,
    accessLevel,
    passcode,
    isActive
  };
}

export async function getProjectByShareToken(token: string): Promise<ProjectRecord | null> {
  const database = await getDb();
  const safeToken = token.replace(/'/g, "''");
  const shareRes = database.exec(`SELECT project_id, is_active, access_level FROM project_shares WHERE share_token = '${safeToken}'`);
  if (shareRes.length === 0 || shareRes[0].values.length === 0) return null;
  
  const isActive = Number(shareRes[0].values[0][1]) === 1;
  if (!isActive) return null;

  const projectId = String(shareRes[0].values[0][0]);
  return getProjectById(projectId);
}

// ==========================================
// PHASE 4: IMPORT BOQ ITEMS INTO MY RATES
// ==========================================

export async function importBoqItemsToUserRates(
  userId: string,
  items: Array<{ item: string; description: string; unit: string; rate: number; section?: string; location?: string }>
): Promise<number> {
  const database = await getDb();
  let count = 0;
  const now = new Date().toISOString();

  for (const it of items) {
    if (!it.rate || it.rate <= 0) continue;
    const id = 'urate-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const category = it.section || 'General Works';
    const loc = it.location || 'Lagos, Nigeria';

    database.run(
      `INSERT INTO user_rates (id, user_id, category, item, description, unit, rate, location, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, category, it.item, it.description || '', it.unit, it.rate, loc, 'Project BOQ Import', now]
    );
    count++;
  }

  saveDbToDisk();
  return count;
}

// =========================================================================
// PHASE 7: CASH FLOW PROJECTION, MILESTONES & S-CURVE ENGINE
// =========================================================================

export async function getCashFlowMilestones(projectId: string): Promise<any[]> {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM project_cash_flow_milestones WHERE project_id = '${safeId}' ORDER BY stage_order ASC, month_number ASC`);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj: any = {};
    cols.forEach((col, idx) => { obj[col] = row[idx]; });
    return obj;
  });
}

export async function generateDefaultCashFlow(
  projectId: string,
  durationMonths = 12
): Promise<any[]> {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  
  // Fetch project total
  const project = await getProjectById(projectId);
  const totalSum = project ? (project.grand_total || 100000000) : 100000000;
  
  // Delete existing milestones
  database.run(`DELETE FROM project_cash_flow_milestones WHERE project_id = '${safeId}'`);

  const dur = Math.max(3, Math.min(36, durationMonths));
  
  // BESMM4 Standard Nigerian Construction Milestones Distribution
  const templates = [
    {
      name: 'Preliminaries, Site Mobilization & Setting Out',
      pct: 10,
      monthRatio: 1 / 12,
      status: 'Certified',
      actualRatio: 1.0,
      notes: 'Initial hoarding, temporary water/power, site survey, building approvals'
    },
    {
      name: 'Substructure Excavation & Foundation Raft/Footings',
      pct: 18,
      monthRatio: 2.5 / 12,
      status: 'In Progress',
      actualRatio: 0.85,
      notes: 'Earthwork, blinding concrete, foundation rebar, DPC damp proofing'
    },
    {
      name: 'Superstructure Concrete Columns, Beams & Suspended Slab',
      pct: 25,
      monthRatio: 5.5 / 12,
      status: 'Scheduled',
      actualRatio: 0.0,
      notes: 'Grade 25 structural frame, high-yield rebar, formwork, suspended slab'
    },
    {
      name: 'Sandcrete Blockwork Walling & Structural Roof Covering',
      pct: 20,
      monthRatio: 8 / 12,
      status: 'Scheduled',
      actualRatio: 0.0,
      notes: '225mm vibrated blocks, lintels, hardwood timber trusses & aluminium longspan'
    },
    {
      name: 'Internal/External Plastering, MEP Rough-in & Wall Tiles',
      pct: 17,
      monthRatio: 10.5 / 12,
      status: 'Scheduled',
      actualRatio: 0.0,
      notes: 'Cement plastering, electrical conduit, plumbing piping, floor screeding'
    },
    {
      name: 'Fittings, Painting, External Paving, Testing & Commissioning',
      pct: 10,
      monthRatio: 1.0,
      status: 'Scheduled',
      actualRatio: 0.0,
      notes: 'Doors, windows, emulsion paint, interlock driveway paving, final handover'
    }
  ];

  const milestones: any[] = [];
  const now = new Date().toISOString();

  templates.forEach((tpl, idx) => {
    const id = 'cfm-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substring(2, 6);
    const plannedAmount = Math.round((totalSum * tpl.pct) / 100);
    const monthNumber = Math.max(1, Math.min(dur, Math.round(tpl.monthRatio * dur)));
    const actualCertified = tpl.actualRatio > 0 ? Math.round(plannedAmount * tpl.actualRatio) : 0;
    
    database.run(
      `INSERT INTO project_cash_flow_milestones 
       (id, project_id, milestone_name, stage_order, percentage, planned_amount, month_number, estimated_completion_date, status, actual_certified_amount, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, projectId, tpl.name, idx + 1, tpl.pct, plannedAmount, monthNumber,
        `Month ${monthNumber}`, tpl.status, actualCertified, tpl.notes, now
      ]
    );

    milestones.push({
      id,
      project_id: projectId,
      milestone_name: tpl.name,
      stage_order: idx + 1,
      percentage: tpl.pct,
      planned_amount: plannedAmount,
      month_number: monthNumber,
      estimated_completion_date: `Month ${monthNumber}`,
      status: tpl.status,
      actual_certified_amount: actualCertified,
      notes: tpl.notes,
      created_at: now
    });
  });

  saveDbToDisk();
  return milestones;
}

export async function updateCashFlowMilestone(id: string, data: any): Promise<boolean> {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  
  const fields: string[] = [];
  const vals: any[] = [];

  if (data.milestone_name !== undefined) { fields.push('milestone_name = ?'); vals.push(data.milestone_name); }
  if (data.percentage !== undefined) { fields.push('percentage = ?'); vals.push(Number(data.percentage)); }
  if (data.planned_amount !== undefined) { fields.push('planned_amount = ?'); vals.push(Number(data.planned_amount)); }
  if (data.month_number !== undefined) { fields.push('month_number = ?'); vals.push(Number(data.month_number)); }
  if (data.estimated_completion_date !== undefined) { fields.push('estimated_completion_date = ?'); vals.push(data.estimated_completion_date); }
  if (data.status !== undefined) { fields.push('status = ?'); vals.push(data.status); }
  if (data.actual_certified_amount !== undefined) { fields.push('actual_certified_amount = ?'); vals.push(Number(data.actual_certified_amount)); }
  if (data.notes !== undefined) { fields.push('notes = ?'); vals.push(data.notes); }

  if (fields.length === 0) return false;

  vals.push(safeId);
  database.run(`UPDATE project_cash_flow_milestones SET ${fields.join(', ')} WHERE id = ?`, vals);
  saveDbToDisk();
  return true;
}

export async function addCashFlowMilestone(data: any): Promise<any> {
  const database = await getDb();
  const id = 'cfm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  database.run(
    `INSERT INTO project_cash_flow_milestones 
     (id, project_id, milestone_name, stage_order, percentage, planned_amount, month_number, estimated_completion_date, status, actual_certified_amount, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.project_id,
      data.milestone_name || 'Custom Construction Stage',
      Number(data.stage_order || 1),
      Number(data.percentage || 10),
      Number(data.planned_amount || 0),
      Number(data.month_number || 1),
      data.estimated_completion_date || 'Month 1',
      data.status || 'Scheduled',
      Number(data.actual_certified_amount || 0),
      data.notes || '',
      now
    ]
  );

  saveDbToDisk();
  return { id, ...data, created_at: now };
}

export async function deleteCashFlowMilestone(id: string): Promise<boolean> {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  database.run(`DELETE FROM project_cash_flow_milestones WHERE id = '${safeId}'`);
  saveDbToDisk();
  return true;
}

export async function getCashFlowForecast(projectId: string, durationMonths = 12): Promise<any> {
  let milestones = await getCashFlowMilestones(projectId);
  if (milestones.length === 0) {
    milestones = await generateDefaultCashFlow(projectId, durationMonths);
  }

  const project = await getProjectById(projectId);
  const totalSum = project ? (project.grand_total || 100000000) : 100000000;
  const dur = Math.max(3, Math.min(36, durationMonths));

  const mobilizationAdvancePercent = 15;
  const mobilizationAdvanceAmount = Math.round((totalSum * mobilizationAdvancePercent) / 100);
  const retentionPercent = 5;
  const retentionAmount = Math.round((totalSum * retentionPercent) / 100);

  // Generate monthly distribution points for S-Curve
  const monthlyDistribution: any[] = [];
  let cumPlanned = 0;
  let cumActual = 0;

  // Gaussian/Sigmoid cumulative distribution factor for S-Curve
  for (let m = 1; m <= dur; m++) {
    // Collect milestone amounts for this month
    const matchingMilestones = milestones.filter(ms => Number(ms.month_number) === m);
    let monthPlanned = 0;
    let monthActual = 0;

    if (matchingMilestones.length > 0) {
      monthPlanned = matchingMilestones.reduce((acc, curr) => acc + Number(curr.planned_amount || 0), 0);
      monthActual = matchingMilestones.reduce((acc, curr) => acc + Number(curr.actual_certified_amount || 0), 0);
    } else {
      // Smooth interpolation according to classic S-Curve Bell shape
      const progressRatio = m / dur;
      // standard bell-shaped derivative: 6 * t * (1-t)
      const monthlyBellFactor = (6 * progressRatio * (1 - progressRatio)) / dur;
      monthPlanned = Math.round(totalSum * monthlyBellFactor);
    }

    cumPlanned += monthPlanned;
    if (cumPlanned > totalSum) cumPlanned = totalSum;

    if (monthActual > 0) {
      cumActual += monthActual;
    } else if (matchingMilestones.some(ms => ms.status === 'Certified')) {
      cumActual += monthPlanned;
    }

    monthlyDistribution.push({
      month: m,
      monthLabel: `M${m}`,
      plannedMonthly: monthPlanned,
      plannedCumulative: cumPlanned,
      actualMonthly: monthActual,
      actualCumulative: cumActual > 0 ? cumActual : null,
      percentageComplete: Math.min(100, Math.round((cumPlanned / (totalSum || 1)) * 100))
    });
  }

  const peakMonthlyOutlay = Math.max(...monthlyDistribution.map(d => d.plannedMonthly), 0);
  const totalCertifiedToDate = milestones.reduce((acc, m) => acc + Number(m.actual_certified_amount || 0), 0);

  return {
    projectId,
    projectTotal: totalSum,
    durationMonths: dur,
    mobilizationAdvancePercent,
    mobilizationAdvanceAmount,
    retentionPercent,
    retentionAmount,
    peakMonthlyOutlay,
    totalCertifiedToDate,
    milestones,
    monthlyDistribution
  };
}

// =========================================================================
// PHASE 8: SUBCONTRACTOR & VENDOR TENDER COMPARISON MATRIX
// =========================================================================

export async function getTenderBidders(projectId: string): Promise<any[]> {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  
  const res = database.exec(`SELECT * FROM tender_bidders WHERE project_id = '${safeId}' ORDER BY recommendation_rank ASC, total_bid_amount ASC`);
  if (res.length === 0) return [];
  
  const cols = res[0].columns;
  const bidders = res[0].values.map(row => {
    const obj: any = {};
    cols.forEach((col, idx) => { obj[col] = row[idx]; });
    return obj;
  });

  // Attach items for each bidder
  for (const b of bidders) {
    const safeBidderId = String(b.id).replace(/'/g, "''");
    const itemsRes = database.exec(`SELECT * FROM tender_bid_items WHERE bidder_id = '${safeBidderId}' ORDER BY trade_section ASC, item_name ASC`);
    if (itemsRes.length > 0) {
      const iCols = itemsRes[0].columns;
      b.items = itemsRes[0].values.map(r => {
        const itemObj: any = {};
        iCols.forEach((c, i) => { itemObj[c] = r[i]; });
        return itemObj;
      });
    } else {
      b.items = [];
    }
  }

  return bidders;
}

export async function createTenderBidder(projectId: string, data: any): Promise<any> {
  const database = await getDb();
  const id = 'bid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  database.run(
    `INSERT INTO tender_bidders 
     (id, project_id, bidder_name, contact_person, contact_phone, contact_email, total_bid_amount, technical_score, duration_weeks, compliance_status, recommendation_rank, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      projectId,
      data.bidder_name || 'New Subcontractor',
      data.contact_person || '',
      data.contact_phone || '',
      data.contact_email || '',
      Number(data.total_bid_amount || 0),
      Number(data.technical_score || 80),
      Number(data.duration_weeks || 24),
      data.compliance_status || 'Compliant',
      Number(data.recommendation_rank || 0),
      data.notes || '',
      now
    ]
  );

  // If initial items provided
  if (Array.isArray(data.items)) {
    for (const it of data.items) {
      const itemId = 'bidi-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const qty = Number(it.qty || 0);
      const rate = Number(it.rate || 0);
      const amount = qty * rate;

      database.run(
        `INSERT INTO tender_bid_items (id, bidder_id, boq_item_id, trade_section, item_name, unit, qty, rate, amount, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId, id, it.boq_item_id || '', it.trade_section || 'General',
          it.item_name || it.item, it.unit || 'm2', qty, rate, amount, it.notes || '', now
        ]
      );
    }
  }

  saveDbToDisk();
  return { id, project_id: projectId, ...data, created_at: now };
}

export async function updateTenderBidder(id: string, data: any): Promise<boolean> {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");

  const fields: string[] = [];
  const vals: any[] = [];

  if (data.bidder_name !== undefined) { fields.push('bidder_name = ?'); vals.push(data.bidder_name); }
  if (data.contact_person !== undefined) { fields.push('contact_person = ?'); vals.push(data.contact_person); }
  if (data.contact_phone !== undefined) { fields.push('contact_phone = ?'); vals.push(data.contact_phone); }
  if (data.contact_email !== undefined) { fields.push('contact_email = ?'); vals.push(data.contact_email); }
  if (data.total_bid_amount !== undefined) { fields.push('total_bid_amount = ?'); vals.push(Number(data.total_bid_amount)); }
  if (data.technical_score !== undefined) { fields.push('technical_score = ?'); vals.push(Number(data.technical_score)); }
  if (data.duration_weeks !== undefined) { fields.push('duration_weeks = ?'); vals.push(Number(data.duration_weeks)); }
  if (data.compliance_status !== undefined) { fields.push('compliance_status = ?'); vals.push(data.compliance_status); }
  if (data.recommendation_rank !== undefined) { fields.push('recommendation_rank = ?'); vals.push(Number(data.recommendation_rank)); }
  if (data.notes !== undefined) { fields.push('notes = ?'); vals.push(data.notes); }

  if (fields.length > 0) {
    vals.push(safeId);
    database.run(`UPDATE tender_bidders SET ${fields.join(', ')} WHERE id = ?`, vals);
  }

  // Update items if supplied
  if (Array.isArray(data.items)) {
    database.run(`DELETE FROM tender_bid_items WHERE bidder_id = '${safeId}'`);
    let calcTotal = 0;
    const now = new Date().toISOString();
    for (const it of data.items) {
      const itemId = 'bidi-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const qty = Number(it.qty || 0);
      const rate = Number(it.rate || 0);
      const amount = qty * rate;
      calcTotal += amount;

      database.run(
        `INSERT INTO tender_bid_items (id, bidder_id, boq_item_id, trade_section, item_name, unit, qty, rate, amount, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [itemId, safeId, it.boq_item_id || '', it.trade_section || 'General', it.item_name || it.item, it.unit || 'm2', qty, rate, amount, it.notes || '', now]
      );
    }

    if (calcTotal > 0) {
      database.run(`UPDATE tender_bidders SET total_bid_amount = ? WHERE id = ?`, [calcTotal, safeId]);
    }
  }

  saveDbToDisk();
  return true;
}

export async function deleteTenderBidder(id: string): Promise<boolean> {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  database.run(`DELETE FROM tender_bid_items WHERE bidder_id = '${safeId}'`);
  database.run(`DELETE FROM tender_bidders WHERE id = '${safeId}'`);
  saveDbToDisk();
  return true;
}

export async function autoPopulateBiddersFromBoq(projectId: string): Promise<any[]> {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const project = await getProjectById(projectId);
  if (!project) return [];

  const items = project.items || [];
  const baseSubtotal = project.subtotal || 100000000;

  // Clear existing bidders for this project
  const existing = await getTenderBidders(projectId);
  for (const b of existing) {
    await deleteTenderBidder(b.id);
  }

  // Pre-seed 3 realistic Nigerian construction contractors
  const biddersConfig = [
    {
      name: 'Julius & Brothers Construction Ltd',
      contact: 'Engr. Emeka Nwankwo',
      phone: '+234 803 219 4481',
      email: 'tenders@juliusconstruction.ng',
      rateMultiplier: 1.04, // +4% above benchmark
      technicalScore: 89,
      durationWeeks: 24,
      compliance: 'Compliant',
      rank: 1,
      notes: 'COREN certified, strong local plant inventory, highly responsive rate submission'
    },
    {
      name: 'Dantata Horizon Building Contractors',
      contact: 'Alhaji Sanusi Bello',
      phone: '+234 802 884 1290',
      email: 'bids@dantatahorizon.com',
      rateMultiplier: 0.91, // -9% below benchmark (aggressive low bidder)
      technicalScore: 78,
      durationWeeks: 22,
      compliance: 'Compliant',
      rank: 2,
      notes: 'Lowest priced tender. Potential risk of rebar and concrete rate under-quoting, requires close QS oversight'
    },
    {
      name: 'Cappa Elite Structures Ltd',
      contact: 'Arc. Tunde Balogun',
      phone: '+234 805 441 9022',
      email: 'commercial@cappaelite.ng',
      rateMultiplier: 1.18, // +18% premium tier
      technicalScore: 95,
      durationWeeks: 20,
      compliance: 'Compliant',
      rank: 3,
      notes: 'Premium commercial grade, ISO 9001, guaranteed delivery in 20 weeks with full safety equipment'
    }
  ];

  const results: any[] = [];

  for (const cfg of biddersConfig) {
    const bidderId = 'bid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    let bidderTotal = 0;
    const now = new Date().toISOString();

    database.run(
      `INSERT INTO tender_bidders 
       (id, project_id, bidder_name, contact_person, contact_phone, contact_email, total_bid_amount, technical_score, duration_weeks, compliance_status, recommendation_rank, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bidderId, projectId, cfg.name, cfg.contact, cfg.phone, cfg.email,
        0, cfg.technicalScore, cfg.durationWeeks, cfg.compliance, cfg.rank, cfg.notes, now
      ]
    );

    // Populate bid items derived from active BOQ with varied rates
    for (const boq of items) {
      const bidiId = 'bidi-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      // Introduce slight trade variation
      const variance = (Math.random() * 0.08 - 0.04); // +/- 4% trade variation
      const bidRate = Math.round(Number(boq.rate) * (cfg.rateMultiplier + variance));
      const bidAmount = Math.round(Number(boq.qty) * bidRate);
      bidderTotal += bidAmount;

      database.run(
        `INSERT INTO tender_bid_items (id, bidder_id, boq_item_id, trade_section, item_name, unit, qty, rate, amount, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bidiId, bidderId, boq.id || '', boq.section || 'Superstructure',
          boq.item, boq.unit, Number(boq.qty), bidRate, bidAmount, '', now
        ]
      );
    }

    database.run(`UPDATE tender_bidders SET total_bid_amount = ? WHERE id = ?`, [bidderTotal, bidderId]);
    results.push({
      id: bidderId,
      project_id: projectId,
      bidder_name: cfg.name,
      total_bid_amount: bidderTotal,
      technical_score: cfg.technicalScore,
      duration_weeks: cfg.durationWeeks,
      recommendation_rank: cfg.rank,
      compliance_status: cfg.compliance
    });
  }

  saveDbToDisk();
  return results;
}

// =========================================================================
// PHASE 9: INFLATION FLUCTUATION & MACROECONOMIC SIMULATOR
// =========================================================================

export async function getProjectFluctuation(projectId: string): Promise<any> {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM project_fluctuations WHERE project_id = '${safeId}'`);

  if (res.length > 0 && res[0].values.length > 0) {
    const cols = res[0].columns;
    const obj: any = {};
    cols.forEach((c, i) => { obj[c] = res[0].values[0][i]; });
    return obj;
  }

  // If not found, create standard Nigerian FIDIC Clause 70 baseline
  const project = await getProjectById(projectId);
  const contractSum = project ? (project.grand_total || 100000000) : 100000000;
  const id = 'fluc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  const defaultRecord = {
    id,
    project_id: projectId,
    clause_type: 'FIDIC_70',
    base_date: '2024-01-15',
    valuation_date: '2025-02-01',
    base_cement_price: 5500.0,      // Naira / 50kg bag at tender
    current_cement_price: 8800.0,   // Current market price
    cement_weight: 0.30,           // 30% material factor
    base_rebar_price: 750000.0,     // Naira / tonne at tender
    current_rebar_price: 1280000.0, // Current market price
    rebar_weight: 0.25,            // 25% material factor
    base_diesel_price: 800.0,       // Naira / litre at tender
    current_diesel_price: 1350.0,   // Current market price
    diesel_weight: 0.15,           // 15% plant/fuel factor
    base_labour_rate: 4500.0,       // Artisan daily wage at tender
    current_labour_rate: 7000.0,    // Current daily wage
    labour_weight: 0.20,           // 20% labour factor
    fixed_element: 0.10,           // 10% non-adjustable
    calculated_multiplier: 1.342,
    original_contract_sum: contractSum,
    claimable_fluctuation_sum: Math.round(contractSum * 0.342),
    created_at: now
  };

  database.run(
    `INSERT INTO project_fluctuations 
     (id, project_id, clause_type, base_date, valuation_date, base_cement_price, current_cement_price, cement_weight,
      base_rebar_price, current_rebar_price, rebar_weight, base_diesel_price, current_diesel_price, diesel_weight,
      base_labour_rate, current_labour_rate, labour_weight, fixed_element, calculated_multiplier, original_contract_sum, claimable_fluctuation_sum, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      defaultRecord.id, defaultRecord.project_id, defaultRecord.clause_type,
      defaultRecord.base_date, defaultRecord.valuation_date,
      defaultRecord.base_cement_price, defaultRecord.current_cement_price, defaultRecord.cement_weight,
      defaultRecord.base_rebar_price, defaultRecord.current_rebar_price, defaultRecord.rebar_weight,
      defaultRecord.base_diesel_price, defaultRecord.current_diesel_price, defaultRecord.diesel_weight,
      defaultRecord.base_labour_rate, defaultRecord.current_labour_rate, defaultRecord.labour_weight,
      defaultRecord.fixed_element, defaultRecord.calculated_multiplier,
      defaultRecord.original_contract_sum, defaultRecord.claimable_fluctuation_sum, now
    ]
  );

  saveDbToDisk();
  return defaultRecord;
}

export async function saveProjectFluctuation(projectId: string, data: any): Promise<any> {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");

  // Calculate Price Adjustment Multiplier based on FIDIC 70 Formula:
  // Pn / P0 = a + b*(Cn/C0) + c*(Rn/R0) + d*(Dn/D0) + e*(Ln/L0)
  const a = Number(data.fixed_element ?? 0.10);
  const b = Number(data.cement_weight ?? 0.30);
  const c = Number(data.rebar_weight ?? 0.25);
  const d = Number(data.diesel_weight ?? 0.15);
  const e = Number(data.labour_weight ?? 0.20);

  const cRatio = (Number(data.current_cement_price) || 1) / (Number(data.base_cement_price) || 1);
  const rRatio = (Number(data.current_rebar_price) || 1) / (Number(data.base_rebar_price) || 1);
  const dRatio = (Number(data.current_diesel_price) || 1) / (Number(data.base_diesel_price) || 1);
  const lRatio = (Number(data.current_labour_rate) || 1) / (Number(data.base_labour_rate) || 1);

  const multiplier = +(a + (b * cRatio) + (c * rRatio) + (d * dRatio) + (e * lRatio)).toFixed(4);
  const contractSum = Number(data.original_contract_sum || 100000000);
  const claimable = Math.round(contractSum * (multiplier - 1));

  database.run(`DELETE FROM project_fluctuations WHERE project_id = '${safeId}'`);

  const id = 'fluc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  database.run(
    `INSERT INTO project_fluctuations 
     (id, project_id, clause_type, base_date, valuation_date, base_cement_price, current_cement_price, cement_weight,
      base_rebar_price, current_rebar_price, rebar_weight, base_diesel_price, current_diesel_price, diesel_weight,
      base_labour_rate, current_labour_rate, labour_weight, fixed_element, calculated_multiplier, original_contract_sum, claimable_fluctuation_sum, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, projectId, data.clause_type || 'FIDIC_70',
      data.base_date || '2024-01-15', data.valuation_date || '2025-02-01',
      Number(data.base_cement_price || 5500), Number(data.current_cement_price || 8800), b,
      Number(data.base_rebar_price || 750000), Number(data.current_rebar_price || 1280000), c,
      Number(data.base_diesel_price || 800), Number(data.current_diesel_price || 1350), d,
      Number(data.base_labour_rate || 4500), Number(data.current_labour_rate || 7000), e,
      a, multiplier, contractSum, claimable, now
    ]
  );

  saveDbToDisk();

  return {
    id,
    project_id: projectId,
    ...data,
    calculated_multiplier: multiplier,
    original_contract_sum: contractSum,
    claimable_fluctuation_sum: claimable
  };
}

// ============================================================================
// PHASE 10: BANK TRANSFER BILLING, 7-DAY TRIAL & SUBSCRIPTION ENGINE
// ============================================================================

export interface PaymentTransferRecord {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  plan_id: string;
  plan_name: string;
  amount_naira: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  transfer_reference: string;
  sender_name: string;
  sender_bank: string;
  transfer_date: string;
  receipt_url?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export async function createPaymentTransfer(data: {
  user_id: string;
  user_email: string;
  user_name: string;
  plan_id: 'per_boq' | 'monthly' | 'yearly' | 'lifetime_license';
  plan_name: string;
  amount_naira: number;
  transfer_reference: string;
  sender_name: string;
  sender_bank: string;
  transfer_date?: string;
  receipt_url?: string;
  notes?: string;
  autoApprove?: boolean;
}): Promise<PaymentTransferRecord> {
  const database = await getDb();
  const id = 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();
  const status = data.autoApprove ? 'approved' : 'pending';
  const verifiedBy = data.autoApprove ? 'System Instant Verification' : '';
  const verifiedAt = data.autoApprove ? now : '';

  database.run(
    `INSERT INTO payment_transfers 
     (id, user_id, user_email, user_name, plan_id, plan_name, amount_naira, bank_name, account_number, account_name,
      transfer_reference, sender_name, sender_bank, transfer_date, receipt_url, notes, status, verified_by, verified_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.user_id,
      data.user_email,
      data.user_name,
      data.plan_id,
      data.plan_name,
      data.amount_naira,
      'Access Bank',
      '081515121',
      'Isaac Emmanuel',
      data.transfer_reference,
      data.sender_name,
      data.sender_bank,
      data.transfer_date || new Date().toISOString().split('T')[0],
      data.receipt_url || '',
      data.notes || '',
      status,
      verifiedBy,
      verifiedAt,
      now
    ]
  );

  if (data.autoApprove) {
    await applyPlanToUser(database, data.user_id, data.plan_id);
  }

  saveDbToDisk();

  return {
    id,
    user_id: data.user_id,
    user_email: data.user_email,
    user_name: data.user_name,
    plan_id: data.plan_id,
    plan_name: data.plan_name,
    amount_naira: data.amount_naira,
    bank_name: 'Access Bank',
    account_number: '081515121',
    account_name: 'Isaac Emmanuel',
    transfer_reference: data.transfer_reference,
    sender_name: data.sender_name,
    sender_bank: data.sender_bank,
    transfer_date: data.transfer_date || new Date().toISOString().split('T')[0],
    receipt_url: data.receipt_url || '',
    notes: data.notes || '',
    status,
    verified_by: verifiedBy,
    verified_at: verifiedAt,
    created_at: now
  };
}

async function applyPlanToUser(database: Database, userId: string, planId: string) {
  const safeId = userId.replace(/'/g, "''");
  const now = new Date();

  if (planId === 'per_boq') {
    database.run(`UPDATE users SET boq_credits = COALESCE(boq_credits, 0) + 1 WHERE id = '${safeId}'`);
  } else if (planId === 'monthly') {
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    database.run(`UPDATE users SET subscription_tier = 'monthly', subscription_status = 'active', subscription_expires_at = '${expiresAt}' WHERE id = '${safeId}'`);
  } else if (planId === 'yearly') {
    const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
    database.run(`UPDATE users SET subscription_tier = 'yearly', subscription_status = 'active', subscription_expires_at = '${expiresAt}' WHERE id = '${safeId}'`);
  } else if (planId === 'lifetime_license') {
    const licenseKey = 'LE-2026-QS-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-81515121';
    database.run(`UPDATE users SET subscription_tier = 'lifetime_license', subscription_status = 'active', subscription_expires_at = '', license_key = '${licenseKey}' WHERE id = '${safeId}'`);
  }
}

export async function verifyPaymentTransfer(
  transferId: string, 
  status: 'approved' | 'rejected', 
  verifiedBy = 'Isaac Emmanuel, Lead QS',
  notes = ''
): Promise<PaymentTransferRecord | null> {
  const database = await getDb();
  const safeId = transferId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM payment_transfers WHERE id = '${safeId}'`);
  if (res.length === 0 || res[0].values.length === 0) return null;

  const cols = res[0].columns;
  const row = res[0].values[0];
  const tx: any = {};
  cols.forEach((col, idx) => { tx[col] = row[idx]; });

  const now = new Date().toISOString();
  database.run(
    `UPDATE payment_transfers SET status = ?, verified_by = ?, verified_at = ?, notes = ? WHERE id = ?`,
    [status, verifiedBy, now, notes || tx.notes, transferId]
  );

  if (status === 'approved') {
    await applyPlanToUser(database, tx.user_id, tx.plan_id);
  }

  saveDbToDisk();
  tx.status = status;
  tx.verified_by = verifiedBy;
  tx.verified_at = now;
  return tx;
}

export async function getPaymentTransfers(userId?: string): Promise<PaymentTransferRecord[]> {
  const database = await getDb();
  let query = "SELECT * FROM payment_transfers ORDER BY created_at DESC";
  if (userId) {
    query = `SELECT * FROM payment_transfers WHERE user_id = '${userId.replace(/'/g, "''")}' ORDER BY created_at DESC`;
  }

  const res = database.exec(query);
  if (res.length === 0 || res[0].values.length === 0) return [];

  const cols = res[0].columns;
  return res[0].values.map(row => {
    const item: any = {};
    cols.forEach((col, idx) => { item[col] = row[idx]; });
    return item as PaymentTransferRecord;
  });
}

export async function getUserSubscriptionInfo(userId: string) {
  const database = await getDb();
  const safeId = userId.replace(/'/g, "''");
  const res = database.exec(`SELECT id, created_at, subscription_tier, subscription_status, subscription_expires_at, boq_credits, license_key FROM users WHERE id = '${safeId}'`);
  
  if (res.length === 0 || res[0].values.length === 0) {
    return {
      tier: 'free_trial',
      status: 'active',
      isTrial: true,
      trialDaysRemaining: 7,
      trialExpired: false,
      boqCredits: 0,
      canGenerateBoq: true,
      licenseKey: ''
    };
  }

  const row = res[0].values[0];
  const createdAt = row[1] ? new Date(row[1] as string).getTime() : Date.now();
  const tier = (row[2] as string) || 'free_trial';
  const status = (row[3] as string) || 'active';
  const expiresAt = (row[4] as string) || '';
  const boqCredits = Number(row[5] || 0);
  const licenseKey = (row[6] as string) || '';

  // Free tier valid for 7 days
  const now = Date.now();
  const daysElapsed = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
  const trialDaysRemaining = Math.max(0, 7 - daysElapsed);
  const trialExpired = trialDaysRemaining <= 0;

  // Check if active subscription or license
  let isSubscriptionActive = false;
  if (tier === 'lifetime_license') {
    isSubscriptionActive = true;
  } else if ((tier === 'monthly' || tier === 'yearly') && expiresAt) {
    isSubscriptionActive = new Date(expiresAt).getTime() > now;
  }

  const isTrial = tier === 'free_trial' && !isSubscriptionActive;
  const canGenerateBoq = isSubscriptionActive || (isTrial && !trialExpired) || boqCredits > 0;

  return {
    tier,
    status: isSubscriptionActive ? 'active' : (isTrial && trialExpired ? 'expired' : status),
    isTrial,
    trialDaysRemaining,
    trialExpired,
    boqCredits,
    expiresAt,
    licenseKey,
    canGenerateBoq
  };
}

export async function consumeBoqCredit(userId: string): Promise<boolean> {
  const database = await getDb();
  const info = await getUserSubscriptionInfo(userId);
  if (info.tier === 'lifetime_license' || (info.expiresAt && new Date(info.expiresAt).getTime() > Date.now())) {
    // Unlimited on active plans
    return true;
  }
  if (info.isTrial && !info.trialExpired) {
    // Free within 7 days trial
    return true;
  }
  if (info.boqCredits > 0) {
    database.run(`UPDATE users SET boq_credits = boq_credits - 1 WHERE id = '${userId.replace(/'/g, "''")}'`);
    saveDbToDisk();
    return true;
  }
  return false;
}

// ============================================================================
// PHASE 11: FINAL ACCOUNT & CONTRACT CLOSEOUT STATEMENT (NIQS STANDARD)
// ============================================================================

export async function getProjectFinalAccount(projectId: string) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM project_final_accounts WHERE project_id = '${safeId}'`);
  
  if (res.length > 0 && res[0].values.length > 0) {
    const cols = res[0].columns;
    const row = res[0].values[0];
    const fa: any = {};
    cols.forEach((col, idx) => { fa[col] = row[idx]; });
    return fa;
  }

  // Auto-generate initial draft from existing variations, fluctuations & valuations
  return autoCalculateFinalAccount(projectId);
}

export async function autoCalculateFinalAccount(projectId: string) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");

  // 1. Get Project Contract Sum
  const pRes = database.exec(`SELECT grand_total, subtotal FROM projects WHERE id = '${safeId}'`);
  const originalContractSum = (pRes.length > 0 && pRes[0].values.length > 0) 
    ? Number(pRes[0].values[0][0] || 0) 
    : 0;

  // 2. Get Variations (Additions and Omissions)
  const vRes = database.exec(`SELECT type, amount, status FROM project_variations WHERE project_id = '${safeId}'`);
  let additions = 0;
  let omissions = 0;
  if (vRes.length > 0) {
    vRes[0].values.forEach(row => {
      const type = (row[0] as string || 'addition').toLowerCase();
      const amt = Number(row[1] || 0);
      const status = row[2] as string;
      if (status !== 'Rejected') {
        if (type === 'addition') additions += amt;
        else omissions += amt;
      }
    });
  }
  const netVariations = additions - omissions;

  // 3. Get Fluctuation (FIDIC 70 claim)
  const fRes = database.exec(`SELECT claimable_fluctuation_sum FROM project_fluctuations WHERE project_id = '${safeId}'`);
  const fluctuationClaim = (fRes.length > 0 && fRes[0].values.length > 0)
    ? Number(fRes[0].values[0][0] || 0)
    : 0;

  // 4. Get Valuations / Previous Payments
  const valRes = database.exec(`SELECT cumulative_value, retention_amount, amount_due, status FROM project_valuations WHERE project_id = '${safeId}' ORDER BY created_at DESC`);
  let totalPreviousPayments = 0;
  let retentionHeld = 0;
  if (valRes.length > 0) {
    valRes[0].values.forEach(row => {
      const amtDue = Number(row[2] || 0);
      const ret = Number(row[1] || 0);
      totalPreviousPayments += amtDue;
      retentionHeld += ret;
    });
  }

  // Provisional sums adjustment and prime cost standard defaults
  const provisionalAdjustment = 0;
  const primeCostAdjustment = 0;
  const dayworksAmount = 0;
  const liquidatedDamages = 0;
  const otherSetoffs = 0;

  // Gross Final Account Sum = Contract Sum + Net Variations + Fluctuation + Provisional Adj + Prime Cost Adj + Dayworks - LAD - Setoffs
  const grossFinalSum = originalContractSum + netVariations + fluctuationClaim + provisionalAdjustment + primeCostAdjustment + dayworksAmount - liquidatedDamages - otherSetoffs;

  // 50% of retention released at Practical Completion
  const retentionReleased = Math.round(retentionHeld * 0.5);
  const balanceDue = grossFinalSum - totalPreviousPayments + retentionReleased;

  const now = new Date().toISOString();

  return {
    id: 'fa-' + projectId,
    project_id: projectId,
    original_contract_sum: originalContractSum,
    approved_variations_additions: additions,
    approved_variations_omissions: omissions,
    net_variations: netVariations,
    provisional_sums_adjustment: provisionalAdjustment,
    prime_cost_adjustment: primeCostAdjustment,
    fluctuation_claim_amount: fluctuationClaim,
    dayworks_amount: dayworksAmount,
    liquidated_damages_deduction: liquidatedDamages,
    other_setoffs: otherSetoffs,
    gross_final_account_sum: grossFinalSum,
    total_previous_payments: totalPreviousPayments,
    total_retention_held: retentionHeld,
    retention_released: retentionReleased,
    balance_due_contractor: balanceDue,
    practical_completion_date: new Date().toISOString().split('T')[0],
    defects_liability_end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months standard DLP
    defects_certificate_issued: 0,
    status: 'Draft',
    qs_signoff_name: 'Isaac Emmanuel, MNIQS',
    qs_registration_number: 'RQS/NIQS/8421',
    signoff_date: new Date().toISOString().split('T')[0],
    notes: 'Prepared in accordance with NIQS Standard Conditions of Building Contract (SMM7/CESMM4).',
    created_at: now,
    updated_at: now
  };
}

export async function saveProjectFinalAccount(projectId: string, data: any) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  database.run(`DELETE FROM project_final_accounts WHERE project_id = '${safeId}'`);

  const id = data.id || ('fa-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6));
  const now = new Date().toISOString();

  database.run(
    `INSERT INTO project_final_accounts
     (id, project_id, original_contract_sum, approved_variations_additions, approved_variations_omissions,
      net_variations, provisional_sums_adjustment, prime_cost_adjustment, fluctuation_claim_amount,
      dayworks_amount, liquidated_damages_deduction, other_setoffs, gross_final_account_sum,
      total_previous_payments, total_retention_held, retention_released, balance_due_contractor,
      practical_completion_date, defects_liability_end_date, defects_certificate_issued, status,
      qs_signoff_name, qs_registration_number, signoff_date, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      projectId,
      Number(data.original_contract_sum || 0),
      Number(data.approved_variations_additions || 0),
      Number(data.approved_variations_omissions || 0),
      Number(data.net_variations || 0),
      Number(data.provisional_sums_adjustment || 0),
      Number(data.prime_cost_adjustment || 0),
      Number(data.fluctuation_claim_amount || 0),
      Number(data.dayworks_amount || 0),
      Number(data.liquidated_damages_deduction || 0),
      Number(data.other_setoffs || 0),
      Number(data.gross_final_account_sum || 0),
      Number(data.total_previous_payments || 0),
      Number(data.total_retention_held || 0),
      Number(data.retention_released || 0),
      Number(data.balance_due_contractor || 0),
      data.practical_completion_date || '',
      data.defects_liability_end_date || '',
      data.defects_certificate_issued ? 1 : 0,
      data.status || 'Draft',
      data.qs_signoff_name || 'Isaac Emmanuel, MNIQS',
      data.qs_registration_number || 'RQS/NIQS/8421',
      data.signoff_date || '',
      data.notes || '',
      data.created_at || now,
      now
    ]
  );

  saveDbToDisk();
  return { ...data, id, project_id: projectId, updated_at: now };
}

// ============================================================================
// PHASE 12: EXECUTIVE QS PROJECT DOSSIER & COMPREHENSIVE REPORT PACK
// ============================================================================

export async function compileExecutiveProjectDossier(projectId: string, user?: any) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");

  // Get Master Project
  const project = await getProjectById(projectId);
  if (!project) throw new Error('Project not found');

  // BOQ items breakdown by section / trade
  const tradeMap: Record<string, { count: number; total: number }> = {};
  let totalBoqSum = 0;
  (project.items || []).forEach(it => {
    const sec = it.section || 'General Building Works';
    if (!tradeMap[sec]) tradeMap[sec] = { count: 0, total: 0 };
    tradeMap[sec].count++;
    tradeMap[sec].total += Number(it.amount || 0);
    totalBoqSum += Number(it.amount || 0);
  });

  const boqTrades = Object.entries(tradeMap).map(([section, data]) => ({
    section,
    itemCount: data.count,
    totalAmount: data.total,
    percentage: totalBoqSum > 0 ? +((data.total / totalBoqSum) * 100).toFixed(1) : 0
  })).sort((a, b) => b.totalAmount - a.totalAmount);

  // Material summary
  const materialSummary = [
    { category: 'Cement', item: 'Dangote 50kg Portland Cement (42.5R)', totalQty: Math.round((project.grand_total * 0.00035)), unit: 'Bags', totalCost: Math.round(project.grand_total * 0.18) },
    { category: 'Reinforcement Steel', item: 'High-Yield T10/T12/T16 Rebar', totalQty: Math.max(5, Math.round((project.gfa || 500) * 0.045)), unit: 'Tonnes', totalCost: Math.round(project.grand_total * 0.15) },
    { category: 'Aggregates', item: 'Crushed Granite Stone (3/4 Inch)', totalQty: Math.max(10, Math.round((project.gfa || 500) * 0.08)), unit: 'Trips (30T)', totalCost: Math.round(project.grand_total * 0.08) },
    { category: 'Sand', item: 'Sharp River Sand', totalQty: Math.max(8, Math.round((project.gfa || 500) * 0.06)), unit: 'Trips (20T)', totalCost: Math.round(project.grand_total * 0.04) },
    { category: 'Energy & Haulage', item: 'AGO Site Diesel (Generators/Mixers)', totalQty: 4500, unit: 'Litres', totalCost: Math.round(project.grand_total * 0.035) }
  ];

  // Cash flow milestones
  const milestones = await getCashFlowMilestones(projectId);
  const cashFlowSummary = milestones.length > 0 ? {
    totalMilestones: milestones.length,
    contractSum: project.grand_total,
    peakMonth: 4,
    scheduledMonths: project.duration_months || 12
  } : null;

  // Tender summary
  let tenderSummary = null;
  try {
    const bidders = await getTenderBidders(projectId);
    if (bidders.length > 0) {
      const benchmarkTotal = project.subtotal || 1;
      const bidSums = bidders.map(b => Number(b.total_bid_amount || 0)).filter(s => s > 0);
      const averageBidSum = bidSums.length > 0 ? Math.round(bidSums.reduce((a, b) => a + b, 0) / bidSums.length) : benchmarkTotal;
      const highestBidSum = bidSums.length > 0 ? Math.max(...bidSums) : benchmarkTotal;
      const lowestBidSum = bidSums.length > 0 ? Math.min(...bidSums) : benchmarkTotal;
      const compliant = bidders.filter(b => b.compliance_status === 'Compliant');
      const lowestResponsive = compliant.sort((a, b) => Number(a.total_bid_amount) - Number(b.total_bid_amount))[0];
      tenderSummary = {
        projectId,
        benchmarkTotal,
        bidders,
        lowestResponsiveBidderId: lowestResponsive?.id,
        averageBidSum,
        highestBidSum,
        lowestBidSum,
        outlierCount: bidders.filter(b => {
          const varPct = Math.abs((Number(b.total_bid_amount) - benchmarkTotal) / benchmarkTotal);
          return varPct > 0.15;
        }).length
      };
    }
  } catch (e) {
    // Optional
  }

  // Fluctuation
  const fluctuationSummary = await getProjectFluctuation(projectId);

  // Final Account
  const finalAccountSummary = await getProjectFinalAccount(projectId);

  // User / License verification
  const userInfo = user ? await getUserSubscriptionInfo(user.id) : null;

  return {
    project,
    compiledAt: new Date().toISOString(),
    compiledBy: user?.full_name || 'Isaac Emmanuel, MNIQS',
    summary: {
      subtotal: project.subtotal,
      vat: project.vat_amount,
      profitOverheads: project.po_amount,
      contingency: Math.round(project.subtotal * ((project.contingency_percent || 5) / 100)),
      grandTotal: project.grand_total,
      gfa: project.gfa || 0,
      costPerSqm: project.gfa && project.gfa > 0 ? Math.round(project.grand_total / project.gfa) : 0
    },
    boqTrades,
    materialSummary,
    cashFlowSummary,
    tenderSummary,
    fluctuationSummary,
    finalAccountSummary,
    licenseVerification: {
      leadQs: 'Isaac Emmanuel, MNIQS',
      registrationNumber: 'RQS/NIQS/8421',
      bankAccount: 'Access Bank 081515121',
      accountName: 'Isaac Emmanuel',
      licenseStatus: userInfo?.status || 'Active Registered Consultant',
      licenseKey: userInfo?.licenseKey || 'LE-2026-QS-MNIQS-81515121',
      certifiedAt: new Date().toISOString().split('T')[0]
    }
  };
}





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
  title: string;
  location: string;
  client_name: string;
  drawing_filename: string;
  drawing_url: string;
  created_at: string;
  updated_at: string;
  po_percent: number;
  vat_percent: number;
  swamp_premium_percent: number;
  subtotal: number;
  po_amount: number;
  vat_amount: number;
  grand_total: number;
  notes: string;
  items?: BoqItemRecord[];
}

export interface BoqItemRecord {
  id: string;
  project_id: string;
  item_number: number;
  item: string;
  description: string;
  unit: string;
  qty: number;
  rate: number;
  amount: number;
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
 */
function seedSampleProject(database: Database): void {
  const check = database.exec("SELECT COUNT(*) as count FROM projects WHERE id = 'sample-hostel-ph'");
  if (check.length > 0 && check[0].values.length > 0 && Number(check[0].values[0][0]) > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial sample project: 2-Storey 100-Room Hostel Port Harcourt...');

  const sampleProjectId = 'sample-hostel-ph';
  const sampleItems: Omit<BoqItemRecord, 'project_id'>[] = [
    {
      id: 'item-1',
      item_number: 1,
      item: 'RC Slab',
      description: '150mm thick reinforced concrete Grade 25 suspended floor slabs and beams including formwork and high-yield reinforcement',
      unit: 'm3',
      qty: 215.5,
      rate: 185000,
      amount: 39867500
    },
    {
      id: 'item-2',
      item_number: 2,
      item: 'Blockwork',
      description: '225mm thick vibrated sandcrete hollow blockwork bedded and jointed in cement-sand mortar (1:4) for external perimeter & spine walls',
      unit: 'm2',
      qty: 1840.0,
      rate: 14500,
      amount: 26680000
    },
    {
      id: 'item-3',
      item_number: 3,
      item: 'Walls',
      description: '15mm cement-sand plastering to internal and external wall faces, trowelled smooth to receive emulsion and textcote paint',
      unit: 'm2',
      qty: 3680.0,
      rate: 4200,
      amount: 15456000
    },
    {
      id: 'item-4',
      item_number: 4,
      item: 'Roofing',
      description: '0.55mm aluminium longspan standing seam roofing sheets fixed on treated hardwood timber trusses with aluminium ridge caps & gutters',
      unit: 'm2',
      qty: 920.0,
      rate: 28500,
      amount: 26220000
    },
    {
      id: 'item-5',
      item_number: 5,
      item: 'Doors',
      description: 'Semi-solid core timber flush doors 900x2100mm in hardwood frames with 3-lever mortice locks and brass hinges for hostel rooms',
      unit: 'No',
      qty: 104,
      rate: 78000,
      amount: 8112000
    },
    {
      id: 'item-6',
      item_number: 6,
      item: 'Windows',
      description: 'Anodized aluminium sliding glazed windows (1200x1200mm) with 5mm tinted glass, insect screens, and projected burglar bars',
      unit: 'No',
      qty: 110,
      rate: 68000,
      amount: 7480000
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
 * Query all projects
 */
export async function getAllProjects(): Promise<ProjectRecord[]> {
  const database = await getDb();
  const res = database.exec('SELECT * FROM projects ORDER BY updated_at DESC');
  if (res.length === 0) return [];

  const columns = res[0].columns;
  const rows = res[0].values;

  const projects: ProjectRecord[] = rows.map((row) => {
    const obj: Record<string, any> = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
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
export async function saveProject(data: Partial<ProjectRecord> & { id: string; items: BoqItemRecord[] }): Promise<ProjectRecord> {
  const database = await getDb();
  const existing = await getProjectById(data.id);

  const subtotal = data.items.reduce((acc, curr) => acc + (Number(curr.qty || 0) * Number(curr.rate || 0)), 0);
  const poPercent = data.po_percent ?? 15.0;
  const vatPercent = data.vat_percent ?? 7.5;
  const swampPercent = data.swamp_premium_percent ?? 0.0;
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
        subtotal = ?, po_amount = ?, vat_amount = ?, grand_total = ?, notes = ?,
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
        subtotal,
        poAmount,
        vatAmount,
        grandTotal,
        data.notes ?? existing.notes,
        data.id
      ]
    );

    // Replace items
    database.run(`DELETE FROM boq_items WHERE project_id = '${data.id.replace(/'/g, "''")}'`);
  } else {
    database.run(
      `INSERT INTO projects (
        id, title, location, client_name, drawing_filename, drawing_url,
        po_percent, vat_percent, swamp_premium_percent,
        subtotal, po_amount, vat_amount, grand_total, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.title || 'Untitled Estimate',
        data.location || 'Lagos, Nigeria',
        data.client_name || '',
        data.drawing_filename || '',
        data.drawing_url || '',
        poPercent,
        vatPercent,
        swampPercent,
        subtotal,
        poAmount,
        vatAmount,
        grandTotal,
        data.notes || ''
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
        id, project_id, item_number, item, description, unit, qty, rate, amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        itemId,
        data.id,
        item.item_number || itemNum,
        item.item || 'Item',
        item.description || '',
        item.unit || 'm2',
        qty,
        rate,
        amount
      ]
    );
    itemNum++;
  }

  saveDbToDisk();
  const updated = await getProjectById(data.id);
  return updated!;
}

/**
 * Delete project
 */
export async function deleteProject(id: string): Promise<boolean> {
  const database = await getDb();
  database.run(`DELETE FROM boq_items WHERE project_id = '${id.replace(/'/g, "''")}'`);
  database.run(`DELETE FROM projects WHERE id = '${id.replace(/'/g, "''")}'`);
  saveDbToDisk();
  return true;
}

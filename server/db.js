import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { SEED_PLANT_LABOUR_PRELIM_SUPPLIERS, DEFAULT_LIBRARY_RATES } from "./defaultRatesData.js";
let SQL = null;
let db = null;
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "database.sqlite");
const SCHEMA_PATH = path.join(process.cwd(), "schema.sql");
async function getDb() {
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
      console.log("Loaded existing SQLite database from", DB_PATH);
    } catch (err) {
      console.warn("Could not read existing database, creating fresh one:", err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }
  if (fs.existsSync(SCHEMA_PATH)) {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, "utf-8");
    db.run(schemaSql);
  }
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
    "ALTER TABLE users ADD COLUMN boq_credits INTEGER DEFAULT 3",
    "ALTER TABLE users ADD COLUMN license_key TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN access_status TEXT DEFAULT 'active'",
    "ALTER TABLE users ADD COLUMN admin_notes TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN can_ai_takeoff INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN can_valuations INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN can_variations INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN can_export_pdf_excel INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN can_rates_library INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN can_team_collab INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN max_projects INTEGER DEFAULT 10",
    "ALTER TABLE projects ADD COLUMN questionnaire_json TEXT DEFAULT '{}'",
    "ALTER TABLE projects ADD COLUMN location_details_json TEXT DEFAULT '{}'",
    "ALTER TABLE projects ADD COLUMN drawings_json TEXT DEFAULT '[]'",
    "ALTER TABLE projects ADD COLUMN takeoff_json TEXT DEFAULT '{}'",
    "ALTER TABLE projects ADD COLUMN library_json TEXT DEFAULT '[]'",
    "ALTER TABLE projects ADD COLUMN reference TEXT DEFAULT ''",
    "ALTER TABLE projects ADD COLUMN contractor TEXT DEFAULT ''",
    "ALTER TABLE projects ADD COLUMN image_url TEXT DEFAULT ''",
    "ALTER TABLE projects ADD COLUMN cover_image_url TEXT DEFAULT ''",
    "ALTER TABLE user_rates ADD COLUMN item TEXT DEFAULT ''",
    "ALTER TABLE user_rates ADD COLUMN rate REAL DEFAULT 0.0",
    "ALTER TABLE user_rates ADD COLUMN description TEXT DEFAULT ''",
    "ALTER TABLE user_rates ADD COLUMN lagos_rate REAL DEFAULT 0.0",
    "ALTER TABLE user_rates ADD COLUMN abuja_rate REAL DEFAULT 0.0",
    "ALTER TABLE user_rates ADD COLUMN port_harcourt_rate REAL DEFAULT 0.0",
    "ALTER TABLE user_rates ADD COLUMN northern_rate REAL DEFAULT 0.0"
  ];
  for (const alterSql of safeAlterColumns) {
    try {
      db.run(alterSql);
    } catch {
    }
  }
  try {
    db.run(`UPDATE user_rates SET item = item_name WHERE (item IS NULL OR item = '') AND item_name IS NOT NULL;`);
    db.run(`UPDATE user_rates SET rate = composite_rate WHERE (rate IS NULL OR rate = 0) AND composite_rate IS NOT NULL;`);
    db.run(`UPDATE user_rates SET description = specification WHERE (description IS NULL OR description = '') AND specification IS NOT NULL;`);
    db.run(`UPDATE user_rates SET lagos_rate = rate WHERE (lagos_rate IS NULL OR lagos_rate = 0) AND rate > 0;`);
    db.run(`UPDATE user_rates SET abuja_rate = CAST(rate * 1.05 AS INTEGER) WHERE (abuja_rate IS NULL OR abuja_rate = 0) AND rate > 0;`);
    db.run(`UPDATE user_rates SET port_harcourt_rate = CAST(rate * 1.09 AS INTEGER) WHERE (port_harcourt_rate IS NULL OR port_harcourt_rate = 0) AND rate > 0;`);
    db.run(`UPDATE user_rates SET northern_rate = CAST(rate * 0.96 AS INTEGER) WHERE (northern_rate IS NULL OR northern_rate = 0) AND rate > 0;`);
  } catch (err) {
    console.warn("Migration data sync error for user_rates:", err);
  }
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
    `CREATE TABLE IF NOT EXISTS library_rates (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'Material',
      category TEXT NOT NULL,
      item TEXT NOT NULL,
      specification TEXT DEFAULT '',
      unit TEXT NOT NULL,
      lagos_rate REAL NOT NULL DEFAULT 0.0,
      abuja_rate REAL NOT NULL DEFAULT 0.0,
      port_harcourt_rate REAL NOT NULL DEFAULT 0.0,
      northern_rate REAL NOT NULL DEFAULT 0.0,
      material_component REAL DEFAULT 0.0,
      labour_component REAL DEFAULT 0.0,
      plant_component REAL DEFAULT 0.0,
      overhead_profit_percent REAL DEFAULT 15.0,
      trend TEXT DEFAULT 'stable',
      trend_percent REAL DEFAULT 0.0,
      key_suppliers_json TEXT DEFAULT '[]',
      last_updated TEXT DEFAULT '',
      is_custom INTEGER DEFAULT 0,
      user_id TEXT DEFAULT 'system',
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
      qs_signoff_name TEXT DEFAULT 'Isaac Emmanuel, MYQSF',
      qs_registration_number TEXT DEFAULT 'MYQSF/QS/8421',
      signoff_date TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS project_dossiers (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      prepared_by TEXT DEFAULT 'Isaac Emmanuel, MYQSF',
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
    )`,
    `CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      contact_person TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      whatsapp TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      state TEXT DEFAULT 'Lagos',
      coverage_areas TEXT DEFAULT 'Nationwide',
      lead_time TEXT DEFAULT '24-48 hours',
      min_order TEXT DEFAULT '',
      payment_terms TEXT DEFAULT 'Bank Transfer / COD',
      verification_status TEXT DEFAULT 'Verified',
      rating REAL DEFAULT 4.8,
      notes TEXT DEFAULT '',
      materials_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];
  for (const tableSql of safeInitTables) {
    try {
      db.run(tableSql);
    } catch (e) {
      console.warn("Init table error:", e);
    }
  }
  seedSampleProject(db);
  saveDbToDisk();
  return db;
}
function saveDbToDisk() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error("Failed to persist SQLite database:", err);
  }
}
function seedSampleProject(_database) {
  return;
}
function parseProjectExtras(proj) {
  if (proj.questionnaire_json) {
    try {
      proj.questionnaire = JSON.parse(proj.questionnaire_json);
    } catch {
    }
  }
  if (proj.location_details_json) {
    try {
      proj.location_details = JSON.parse(proj.location_details_json);
    } catch {
    }
  }
  if (proj.drawings_json) {
    try {
      proj.drawings = JSON.parse(proj.drawings_json);
    } catch {
    }
  }
  if (proj.takeoff_json) {
    try {
      proj.takeoff = JSON.parse(proj.takeoff_json);
    } catch {
    }
  }
  if (proj.library_json) {
    try {
      proj.library = JSON.parse(proj.library_json);
    } catch {
    }
  }
  return proj;
}
async function getAllProjects(userId) {
  const database = await getDb();
  if (!userId) {
    return [];
  }
  let sql = "SELECT * FROM projects";
  if (userId !== "ADMIN_ALL") {
    const safeUser = userId.replace(/'/g, "''");
    sql += ` WHERE user_id = '${safeUser}'`;
  }
  sql += " ORDER BY updated_at DESC";
  const res = database.exec(sql);
  if (res.length === 0) return [];
  const columns = res[0].columns;
  const rows = res[0].values;
  const itemsRes = database.exec("SELECT * FROM boq_items ORDER BY item_number ASC");
  const itemsByProject = {};
  if (itemsRes.length > 0) {
    const itemCols = itemsRes[0].columns;
    itemsRes[0].values.forEach((row) => {
      const itemObj = {};
      itemCols.forEach((col, idx) => {
        itemObj[col] = row[idx];
      });
      const pId = itemObj.project_id;
      if (!itemsByProject[pId]) itemsByProject[pId] = [];
      itemsByProject[pId].push(itemObj);
    });
  }
  const projects = rows.map((row) => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    obj.items = itemsByProject[obj.id] || [];
    return parseProjectExtras(obj);
  });
  return projects;
}
async function getProjectById(id) {
  const database = await getDb();
  const res = database.exec(`SELECT * FROM projects WHERE id = '${id.replace(/'/g, "''")}'`);
  if (res.length === 0 || res[0].values.length === 0) return null;
  const projectCols = res[0].columns;
  const projectRow = res[0].values[0];
  const project = {};
  projectCols.forEach((col, idx) => {
    project[col] = projectRow[idx];
  });
  const itemsRes = database.exec(`SELECT * FROM boq_items WHERE project_id = '${id.replace(/'/g, "''")}' ORDER BY item_number ASC`);
  const items = [];
  if (itemsRes.length > 0) {
    const itemCols = itemsRes[0].columns;
    itemsRes[0].values.forEach((row) => {
      const itemObj = {};
      itemCols.forEach((col, idx) => {
        itemObj[col] = row[idx];
      });
      items.push(itemObj);
    });
  }
  project.items = items;
  return parseProjectExtras(project);
}
async function saveProject(data) {
  const database = await getDb();
  const existing = await getProjectById(data.id);
  const hasProvidedItems = Array.isArray(data.items);
  const safeItems = hasProvidedItems ? data.items : existing?.items || [];
  const subtotal = hasProvidedItems ? safeItems.reduce((acc, curr) => acc + Number(curr.qty || 0) * Number(curr.rate || 0), 0) : data.subtotal !== void 0 ? Number(data.subtotal) : existing?.subtotal ?? 0;
  const poPercent = data.po_percent ?? (existing?.po_percent ?? 15);
  const vatPercent = data.vat_percent ?? (existing?.vat_percent ?? 7.5);
  const swampPercent = data.swamp_premium_percent ?? (existing?.swamp_premium_percent ?? 0);
  const wastePercent = data.waste_percent ?? (existing?.waste_percent ?? 5);
  const contingencyPercent = data.contingency_percent ?? (existing?.contingency_percent ?? 5);
  const inflationPercent = data.inflation_percent ?? (existing?.inflation_percent ?? 0);
  const swampAmount = subtotal * (swampPercent / 100);
  const adjustedSub = subtotal + swampAmount;
  const poAmount = adjustedSub * (poPercent / 100);
  const vatAmount = (adjustedSub + poAmount) * (vatPercent / 100);
  const grandTotal = adjustedSub + poAmount + vatAmount;
  const qJson = data.questionnaire ? JSON.stringify(data.questionnaire) : data.questionnaire_json || existing?.questionnaire_json || "{}";
  const locJson = data.location_details ? JSON.stringify(data.location_details) : data.location_details_json || existing?.location_details_json || "{}";
  const drawJson = data.drawings ? JSON.stringify(data.drawings) : data.drawings_json || existing?.drawings_json || "[]";
  const takeJson = data.takeoff ? JSON.stringify(data.takeoff) : data.takeoff_json || existing?.takeoff_json || "{}";
  const libJson = data.library ? JSON.stringify(data.library) : data.library_json || existing?.library_json || "[]";
  if (existing) {
    database.run(
      `UPDATE projects SET 
        title = ?, location = ?, client_name = ?, drawing_filename = ?, drawing_url = ?,
        po_percent = ?, vat_percent = ?, swamp_premium_percent = ?,
        waste_percent = ?, contingency_percent = ?, inflation_percent = ?,
        subtotal = ?, po_amount = ?, vat_amount = ?, grand_total = ?, notes = ?,
        project_type = ?, client_contact = ?, state = ?, country = ?, description = ?,
        gfa = ?, number_of_floors = ?, status = ?, start_date = ?, target_completion_date = ?,
        active_version = ?, questionnaire_json = ?, location_details_json = ?, drawings_json = ?,
        takeoff_json = ?, library_json = ?, reference = ?, contractor = ?,
        image_url = ?, cover_image_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        data.title || existing.title,
        data.location || existing.location || "Nigeria",
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
        data.project_type ?? existing.project_type ?? "Residential",
        data.client_contact ?? existing.client_contact ?? "",
        data.state ?? existing.state ?? "Lagos",
        data.country ?? existing.country ?? "Nigeria",
        data.description ?? existing.description ?? "",
        data.gfa ?? existing.gfa ?? 0,
        data.number_of_floors ?? existing.number_of_floors ?? 1,
        data.status ?? existing.status ?? "In Progress",
        data.start_date ?? existing.start_date ?? "",
        data.target_completion_date ?? existing.target_completion_date ?? "",
        data.active_version ?? existing.active_version ?? "V1",
        qJson,
        locJson,
        drawJson,
        takeJson,
        libJson,
        data.reference ?? existing.reference ?? "",
        data.contractor ?? existing.contractor ?? "",
        data.image_url ?? existing.image_url ?? "",
        data.cover_image_url ?? existing.cover_image_url ?? "",
        data.id
      ]
    );
    if (hasProvidedItems) {
      database.run(`DELETE FROM boq_items WHERE project_id = '${data.id.replace(/'/g, "''")}'`);
    }
  } else {
    database.run(
      `INSERT INTO projects (
        id, user_id, title, location, client_name, client_contact, drawing_filename, drawing_url,
        po_percent, vat_percent, swamp_premium_percent, waste_percent, contingency_percent, inflation_percent,
        subtotal, po_amount, vat_amount, grand_total, notes, project_type, state, country, description,
        gfa, number_of_floors, status, start_date, target_completion_date, active_version,
        questionnaire_json, location_details_json, drawings_json, takeoff_json, library_json,
        reference, contractor, image_url, cover_image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.user_id || "",
        data.title || "Untitled Estimate",
        data.location || "Lagos, Nigeria",
        data.client_name || "",
        data.client_contact || "",
        data.drawing_filename || "",
        data.drawing_url || "",
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
        data.notes || "",
        data.project_type || "Residential",
        data.state || "Lagos",
        data.country || "Nigeria",
        data.description || "",
        data.gfa || 0,
        data.number_of_floors || 1,
        data.status || "In Progress",
        data.start_date || "",
        data.target_completion_date || "",
        data.active_version || "V1",
        qJson,
        locJson,
        drawJson,
        takeJson,
        libJson,
        data.reference || "",
        data.contractor || "",
        data.image_url || "",
        data.cover_image_url || ""
      ]
    );
  }
  if (hasProvidedItems || !existing) {
    let itemNum = 1;
    for (const item of safeItems) {
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
          item.version_id || data.active_version || "V1",
          item.section || "Superstructure",
          item.subsection || "",
          item.item_number || itemNum,
          item.item || "Item",
          item.description || "",
          item.unit || "m2",
          qty,
          rate,
          amount,
          item.notes || "",
          item.is_ai_generated ? 1 : 0,
          item.is_confirmed !== void 0 ? item.is_confirmed ? 1 : 0 : 1
        ]
      );
      itemNum++;
    }
  }
  saveDbToDisk();
  const updated = await getProjectById(data.id);
  return updated;
}
async function renameProject(id, newTitle) {
  const database = await getDb();
  database.run(`UPDATE projects SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [newTitle.trim(), id]);
  saveDbToDisk();
  return getProjectById(id);
}
async function duplicateProject(id, newTitle, userId) {
  const source = await getProjectById(id);
  if (!source) return null;
  const newId = "proj-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const clonedItems = (source.items || []).map((it, idx) => ({
    ...it,
    id: `item-${Date.now()}-${idx + 1}`,
    project_id: newId
  }));
  const clonedProject = {
    ...source,
    id: newId,
    user_id: userId || source.user_id,
    title: newTitle || `${source.title} (Copy)`,
    status: "Draft",
    items: clonedItems
  };
  return saveProject(clonedProject);
}
async function updateProjectStatus(id, status) {
  const database = await getDb();
  database.run(`UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, id]);
  saveDbToDisk();
  return true;
}
async function recordActivity(projectId, userId, userName, action, details = "") {
  try {
    const database = await getDb();
    const id = "act-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    database.run(
      `INSERT INTO project_activities (id, project_id, user_id, user_name, action, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, projectId, userId, userName, action, details]
    );
    saveDbToDisk();
  } catch (err) {
    console.warn("Failed to record activity:", err);
  }
}
async function getProjectActivities(projectId, userId) {
  const database = await getDb();
  let sql = `
    SELECT pa.*, p.title as project_title 
    FROM project_activities pa 
    LEFT JOIN projects p ON pa.project_id = p.id
  `;
  if (projectId) {
    sql += ` WHERE pa.project_id = '${projectId.replace(/'/g, "''")}'`;
  } else if (userId && userId !== "ADMIN_ALL") {
    const safeUser = userId.replace(/'/g, "''");
    sql += ` WHERE (pa.user_id = '${safeUser}' OR p.user_id = '${safeUser}')`;
  }
  sql += " ORDER BY pa.created_at DESC LIMIT 50";
  const res = database.exec(sql);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj = {};
    cols.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}
async function deleteProject(id) {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  const childTables = [
    "boq_items",
    "estimate_versions",
    "project_documents",
    "project_variations",
    "project_valuations",
    "project_activities",
    "project_collaborators",
    "project_shares",
    "project_cash_flow_milestones",
    "tender_bidders",
    "tender_bid_items",
    "project_fluctuations",
    "project_final_accounts",
    "project_dossiers"
  ];
  for (const table of childTables) {
    try {
      database.run(`DELETE FROM ${table} WHERE project_id = '${safeId}'`);
    } catch {
    }
  }
  database.run(`DELETE FROM projects WHERE id = '${safeId}'`);
  saveDbToDisk();
  return true;
}
async function getEstimateVersions(projectId) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT id, project_id, version_name, description, subtotal, grand_total, items_count, created_at FROM estimate_versions WHERE project_id = '${safeId}' ORDER BY created_at DESC`);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj = {};
    cols.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}
async function createEstimateVersion(projectId, versionName, description = "", userId = "", userName = "QS Estimator") {
  const database = await getDb();
  const project = await getProjectById(projectId);
  if (!project) throw new Error("Project not found to create version.");
  const versionId = "ver-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
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
      grand_total: project.grand_total
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
  await recordActivity(projectId, userId || "sys", userName, "Created Estimate Version", `${versionName}: \u20A6${project.grand_total.toLocaleString()} (${items.length} items)`);
  return {
    id: versionId,
    project_id: projectId,
    version_name: versionName,
    description,
    subtotal: project.subtotal,
    grand_total: project.grand_total,
    items_count: items.length,
    snapshot_json: snapshotJson,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function restoreEstimateVersion(projectId, versionId, userId = "", userName = "QS Estimator") {
  const database = await getDb();
  const safeVerId = versionId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM estimate_versions WHERE id = '${safeVerId}'`);
  if (res.length === 0 || res[0].values.length === 0) {
    throw new Error("Version snapshot not found.");
  }
  const cols = res[0].columns;
  const row = res[0].values[0];
  const versionObj = {};
  cols.forEach((col, idx) => {
    versionObj[col] = row[idx];
  });
  if (!versionObj.snapshot_json) {
    throw new Error("No snapshot data saved in this version.");
  }
  const parsed = JSON.parse(versionObj.snapshot_json);
  const items = parsed.items || [];
  const projectParams = parsed.project || {};
  const currentProject = await getProjectById(projectId);
  if (!currentProject) throw new Error("Project not found.");
  const updatedPayload = {
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
  await recordActivity(projectId, userId || "sys", userName, "Restored Estimate Version", `Restored to ${versionObj.version_name} (\u20A6${versionObj.grand_total.toLocaleString()})`);
  return saved;
}
async function deleteEstimateVersion(versionId) {
  const database = await getDb();
  database.run(`DELETE FROM estimate_versions WHERE id = '${versionId.replace(/'/g, "''")}'`);
  saveDbToDisk();
  return true;
}
async function getProjectVariations(projectId) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM project_variations WHERE project_id = '${safeId}' ORDER BY created_at ASC`);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj = {};
    cols.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}
async function createProjectVariation(data, userId = "", userName = "QS Estimator") {
  const database = await getDb();
  const id = "var-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const qty = Number(data.quantity || 1);
  const rate = Number(data.rate || 0);
  const isOmission = data.type === "omission";
  const amount = Math.abs(qty * rate) * (isOmission ? -1 : 1);
  const status = data.status || "Draft";
  const unit = data.unit || "m2";
  const type = isOmission ? "omission" : "addition";
  const section = data.section || "General Works";
  const reason = data.reason || "";
  database.run(
    `INSERT INTO project_variations (id, project_id, variation_number, description, reason, section, quantity, unit, rate, amount, type, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.project_id, data.variation_number, data.description, reason, section, qty, unit, rate, amount, type, status]
  );
  saveDbToDisk();
  await recordActivity(data.project_id, userId || "sys", userName, "Created Variation", `${data.variation_number}: ${data.description} (${amount >= 0 ? "+" : ""}\u20A6${amount.toLocaleString()})`);
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
    status,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function updateProjectVariation(id, data, userId = "", userName = "QS Estimator") {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  const currentRes = database.exec(`SELECT * FROM project_variations WHERE id = '${safeId}'`);
  if (currentRes.length === 0 || currentRes[0].values.length === 0) return false;
  const cols = currentRes[0].columns;
  const current = {};
  cols.forEach((col, idx) => {
    current[col] = currentRes[0].values[0][idx];
  });
  const desc = data.description ?? current.description;
  const reason = data.reason ?? current.reason;
  const section = data.section ?? current.section;
  const qty = data.quantity !== void 0 ? Number(data.quantity) : Number(current.quantity);
  const unit = data.unit ?? current.unit;
  const rate = data.rate !== void 0 ? Number(data.rate) : Number(current.rate);
  const type = data.type ?? current.type ?? "addition";
  const status = data.status ?? current.status ?? "Draft";
  const amount = Math.abs(qty * rate) * (type === "omission" ? -1 : 1);
  database.run(
    `UPDATE project_variations SET description = ?, reason = ?, section = ?, quantity = ?, unit = ?, rate = ?, amount = ?, type = ?, status = ?
     WHERE id = ?`,
    [desc, reason, section, qty, unit, rate, amount, type, status, id]
  );
  saveDbToDisk();
  await recordActivity(current.project_id, userId || "sys", userName, "Updated Variation", `${current.variation_number} status: ${status} (Amount: \u20A6${amount.toLocaleString()})`);
  return true;
}
async function deleteProjectVariation(id) {
  const database = await getDb();
  database.run(`DELETE FROM project_variations WHERE id = '${id.replace(/'/g, "''")}'`);
  saveDbToDisk();
  return true;
}
async function getProjectValuations(projectId) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM project_valuations WHERE project_id = '${safeId}' ORDER BY created_at ASC`);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj = {};
    cols.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}
async function createProjectValuation(data, userId = "", userName = "QS Estimator") {
  const database = await getDb();
  const id = "val-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const prevVal = Number(data.previous_valuation || 0);
  const curVal = Number(data.current_valuation || 0);
  const cumulative = prevVal + curVal;
  const retentionPct = Number(data.retention_percent ?? 5);
  const retentionAmt = cumulative * (retentionPct / 100);
  const advanceDed = Number(data.advance_payment_deduction || 0);
  const prevPaid = Number(data.previous_payments || 0);
  const amountDue = Math.max(0, cumulative - retentionAmt - advanceDed - prevPaid);
  const dateStr = data.valuation_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const desc = data.description || "";
  const status = data.status || "Draft";
  database.run(
    `INSERT INTO project_valuations (
      id, project_id, valuation_number, valuation_date, description,
      previous_valuation, current_valuation, cumulative_value,
      retention_percent, retention_amount, advance_payment_deduction, previous_payments, amount_due, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.project_id,
      data.valuation_number,
      dateStr,
      desc,
      prevVal,
      curVal,
      cumulative,
      retentionPct,
      retentionAmt,
      advanceDed,
      prevPaid,
      amountDue,
      status
    ]
  );
  saveDbToDisk();
  await recordActivity(data.project_id, userId || "sys", userName, "Created Interim Valuation", `${data.valuation_number}: Amount Due \u20A6${amountDue.toLocaleString()}`);
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
    status,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function updateProjectValuation(id, data, userId = "", userName = "QS Estimator") {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  const currentRes = database.exec(`SELECT * FROM project_valuations WHERE id = '${safeId}'`);
  if (currentRes.length === 0 || currentRes[0].values.length === 0) return false;
  const cols = currentRes[0].columns;
  const current = {};
  cols.forEach((col, idx) => {
    current[col] = currentRes[0].values[0][idx];
  });
  const prevVal = data.previous_valuation !== void 0 ? Number(data.previous_valuation) : Number(current.previous_valuation);
  const curVal = data.current_valuation !== void 0 ? Number(data.current_valuation) : Number(current.current_valuation);
  const cumulative = prevVal + curVal;
  const retentionPct = data.retention_percent !== void 0 ? Number(data.retention_percent) : Number(current.retention_percent);
  const retentionAmt = cumulative * (retentionPct / 100);
  const advanceDed = data.advance_payment_deduction !== void 0 ? Number(data.advance_payment_deduction) : Number(current.advance_payment_deduction);
  const prevPaid = data.previous_payments !== void 0 ? Number(data.previous_payments) : Number(current.previous_payments);
  const amountDue = Math.max(0, cumulative - retentionAmt - advanceDed - prevPaid);
  const status = data.status ?? current.status ?? "Draft";
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
  await recordActivity(current.project_id, userId || "sys", userName, "Updated Interim Valuation", `${current.valuation_number} marked as ${status} (Amount Due: \u20A6${amountDue.toLocaleString()})`);
  return true;
}
async function deleteProjectValuation(id) {
  const database = await getDb();
  database.run(`DELETE FROM project_valuations WHERE id = '${id.replace(/'/g, "''")}'`);
  saveDbToDisk();
  return true;
}
async function getProjectDocuments(projectId) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM project_documents WHERE project_id = '${safeId}' ORDER BY created_at DESC`);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj = {};
    cols.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}
async function createProjectDocument(data) {
  const database = await getDb();
  const id = "doc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const category = data.category || "Architectural";
  database.run(
    `INSERT INTO project_documents (id, project_id, user_id, title, category, file_name, file_size, file_type, file_path, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.projectId, data.userId || "", data.title, category, data.fileName, data.fileSize, data.fileType, data.filePath || "", now]
  );
  saveDbToDisk();
  await recordActivity(
    data.projectId,
    data.userId || "sys",
    data.userName || "QS Estimator",
    "Uploaded Document",
    `Attached ${category} document: "${data.title}" (${data.fileName})`
  );
  return {
    id,
    project_id: data.projectId,
    user_id: data.userId || "",
    title: data.title,
    category,
    file_name: data.fileName,
    file_size: data.fileSize,
    file_type: data.fileType,
    file_path: data.filePath || "",
    created_at: now
  };
}
async function deleteProjectDocument(id, userId = "", userName = "QS Estimator") {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  const current = database.exec(`SELECT project_id, title, file_name FROM project_documents WHERE id = '${safeId}'`);
  let projId = "";
  let title = "";
  if (current.length > 0 && current[0].values.length > 0) {
    projId = String(current[0].values[0][0]);
    title = String(current[0].values[0][1]);
  }
  database.run(`DELETE FROM project_documents WHERE id = '${safeId}'`);
  saveDbToDisk();
  if (projId) {
    await recordActivity(projId, userId || "sys", userName, "Deleted Document", `Removed document: "${title}"`);
  }
  return true;
}
async function getProjectCollaborators(projectId) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM project_collaborators WHERE project_id = '${safeId}' ORDER BY created_at ASC`);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj = {};
    cols.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}
async function addProjectCollaborator(projectId, userEmail, role, invitedBy = "", userName = "QS Lead") {
  const database = await getDb();
  const id = "collab-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  database.run(
    `INSERT INTO project_collaborators (id, project_id, user_email, role, invited_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, projectId, userEmail.trim().toLowerCase(), role, invitedBy, now]
  );
  saveDbToDisk();
  await recordActivity(
    projectId,
    invitedBy || "sys",
    userName,
    "Added Collaborator",
    `Granted ${role} role to ${userEmail}`
  );
  return { id, project_id: projectId, user_email: userEmail, role, created_at: now };
}
async function removeProjectCollaborator(id, projectId, userEmail, adminId = "", userName = "QS Lead") {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  database.run(`DELETE FROM project_collaborators WHERE id = '${safeId}'`);
  saveDbToDisk();
  await recordActivity(
    projectId,
    adminId || "sys",
    userName,
    "Removed Collaborator",
    `Revoked project access for ${userEmail}`
  );
  return true;
}
async function getProjectShare(projectId) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM project_shares WHERE project_id = '${safeId}'`);
  if (res.length === 0 || res[0].values.length === 0) return null;
  const cols = res[0].columns;
  const obj = {};
  cols.forEach((col, idx) => {
    obj[col] = res[0].values[0][idx];
  });
  return obj;
}
async function saveProjectShare(projectId, accessLevel, passcode = "", isActive = true) {
  const database = await getDb();
  const existing = await getProjectShare(projectId);
  const shareToken = existing?.share_token || "sh_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const activeInt = isActive ? 1 : 0;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (existing) {
    database.run(
      `UPDATE project_shares SET access_level = ?, passcode = ?, is_active = ? WHERE project_id = ?`,
      [accessLevel, passcode, activeInt, projectId]
    );
  } else {
    const id = "share-" + Date.now();
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
async function getProjectByShareToken(token) {
  const database = await getDb();
  const safeToken = token.replace(/'/g, "''");
  const shareRes = database.exec(`SELECT project_id, is_active, access_level FROM project_shares WHERE share_token = '${safeToken}'`);
  if (shareRes.length === 0 || shareRes[0].values.length === 0) return null;
  const isActive = Number(shareRes[0].values[0][1]) === 1;
  if (!isActive) return null;
  const projectId = String(shareRes[0].values[0][0]);
  return getProjectById(projectId);
}
async function importBoqItemsToUserRates(userId, items) {
  const database = await getDb();
  let count = 0;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  for (const it of items) {
    if (!it.rate || it.rate <= 0) continue;
    const id = "urate-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    const category = it.section || "General Works";
    const loc = it.location || "Lagos, Nigeria";
    database.run(
      `INSERT INTO user_rates (id, user_id, category, item, description, unit, rate, location, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, category, it.item, it.description || "", it.unit, it.rate, loc, "Project BOQ Import", now]
    );
    count++;
  }
  saveDbToDisk();
  return count;
}
async function getCashFlowMilestones(projectId) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM project_cash_flow_milestones WHERE project_id = '${safeId}' ORDER BY stage_order ASC, month_number ASC`);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj = {};
    cols.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}
async function generateDefaultCashFlow(projectId, durationMonths = 12) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const project = await getProjectById(projectId);
  const totalSum = project ? project.grand_total || 1e8 : 1e8;
  database.run(`DELETE FROM project_cash_flow_milestones WHERE project_id = '${safeId}'`);
  const dur = Math.max(3, Math.min(36, durationMonths));
  const templates = [
    {
      name: "Preliminaries, Site Mobilization & Setting Out",
      pct: 10,
      monthRatio: 1 / 12,
      status: "Certified",
      actualRatio: 1,
      notes: "Initial hoarding, temporary water/power, site survey, building approvals"
    },
    {
      name: "Substructure Excavation & Foundation Raft/Footings",
      pct: 18,
      monthRatio: 2.5 / 12,
      status: "In Progress",
      actualRatio: 0.85,
      notes: "Earthwork, blinding concrete, foundation rebar, DPC damp proofing"
    },
    {
      name: "Superstructure Concrete Columns, Beams & Suspended Slab",
      pct: 25,
      monthRatio: 5.5 / 12,
      status: "Scheduled",
      actualRatio: 0,
      notes: "Grade 25 structural frame, high-yield rebar, formwork, suspended slab"
    },
    {
      name: "Sandcrete Blockwork Walling & Structural Roof Covering",
      pct: 20,
      monthRatio: 8 / 12,
      status: "Scheduled",
      actualRatio: 0,
      notes: "225mm vibrated blocks, lintels, hardwood timber trusses & aluminium longspan"
    },
    {
      name: "Internal/External Plastering, MEP Rough-in & Wall Tiles",
      pct: 17,
      monthRatio: 10.5 / 12,
      status: "Scheduled",
      actualRatio: 0,
      notes: "Cement plastering, electrical conduit, plumbing piping, floor screeding"
    },
    {
      name: "Fittings, Painting, External Paving, Testing & Commissioning",
      pct: 10,
      monthRatio: 1,
      status: "Scheduled",
      actualRatio: 0,
      notes: "Doors, windows, emulsion paint, interlock driveway paving, final handover"
    }
  ];
  const milestones = [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  templates.forEach((tpl, idx) => {
    const id = "cfm-" + Date.now() + "-" + idx + "-" + Math.random().toString(36).substring(2, 6);
    const plannedAmount = Math.round(totalSum * tpl.pct / 100);
    const monthNumber = Math.max(1, Math.min(dur, Math.round(tpl.monthRatio * dur)));
    const actualCertified = tpl.actualRatio > 0 ? Math.round(plannedAmount * tpl.actualRatio) : 0;
    database.run(
      `INSERT INTO project_cash_flow_milestones 
       (id, project_id, milestone_name, stage_order, percentage, planned_amount, month_number, estimated_completion_date, status, actual_certified_amount, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        projectId,
        tpl.name,
        idx + 1,
        tpl.pct,
        plannedAmount,
        monthNumber,
        `Month ${monthNumber}`,
        tpl.status,
        actualCertified,
        tpl.notes,
        now
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
async function updateCashFlowMilestone(id, data) {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  const fields = [];
  const vals = [];
  if (data.milestone_name !== void 0) {
    fields.push("milestone_name = ?");
    vals.push(data.milestone_name);
  }
  if (data.percentage !== void 0) {
    fields.push("percentage = ?");
    vals.push(Number(data.percentage));
  }
  if (data.planned_amount !== void 0) {
    fields.push("planned_amount = ?");
    vals.push(Number(data.planned_amount));
  }
  if (data.month_number !== void 0) {
    fields.push("month_number = ?");
    vals.push(Number(data.month_number));
  }
  if (data.estimated_completion_date !== void 0) {
    fields.push("estimated_completion_date = ?");
    vals.push(data.estimated_completion_date);
  }
  if (data.status !== void 0) {
    fields.push("status = ?");
    vals.push(data.status);
  }
  if (data.actual_certified_amount !== void 0) {
    fields.push("actual_certified_amount = ?");
    vals.push(Number(data.actual_certified_amount));
  }
  if (data.notes !== void 0) {
    fields.push("notes = ?");
    vals.push(data.notes);
  }
  if (fields.length === 0) return false;
  vals.push(safeId);
  database.run(`UPDATE project_cash_flow_milestones SET ${fields.join(", ")} WHERE id = ?`, vals);
  saveDbToDisk();
  return true;
}
async function addCashFlowMilestone(data) {
  const database = await getDb();
  const id = "cfm-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  database.run(
    `INSERT INTO project_cash_flow_milestones 
     (id, project_id, milestone_name, stage_order, percentage, planned_amount, month_number, estimated_completion_date, status, actual_certified_amount, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.project_id,
      data.milestone_name || "Custom Construction Stage",
      Number(data.stage_order || 1),
      Number(data.percentage || 10),
      Number(data.planned_amount || 0),
      Number(data.month_number || 1),
      data.estimated_completion_date || "Month 1",
      data.status || "Scheduled",
      Number(data.actual_certified_amount || 0),
      data.notes || "",
      now
    ]
  );
  saveDbToDisk();
  return { id, ...data, created_at: now };
}
async function deleteCashFlowMilestone(id) {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  database.run(`DELETE FROM project_cash_flow_milestones WHERE id = '${safeId}'`);
  saveDbToDisk();
  return true;
}
async function getCashFlowForecast(projectId, durationMonths = 12) {
  let milestones = await getCashFlowMilestones(projectId);
  if (milestones.length === 0) {
    milestones = await generateDefaultCashFlow(projectId, durationMonths);
  }
  const project = await getProjectById(projectId);
  const totalSum = project ? project.grand_total || 1e8 : 1e8;
  const dur = Math.max(3, Math.min(36, durationMonths));
  const mobilizationAdvancePercent = 15;
  const mobilizationAdvanceAmount = Math.round(totalSum * mobilizationAdvancePercent / 100);
  const retentionPercent = 5;
  const retentionAmount = Math.round(totalSum * retentionPercent / 100);
  const monthlyDistribution = [];
  let cumPlanned = 0;
  let cumActual = 0;
  for (let m = 1; m <= dur; m++) {
    const matchingMilestones = milestones.filter((ms) => Number(ms.month_number) === m);
    let monthPlanned = 0;
    let monthActual = 0;
    if (matchingMilestones.length > 0) {
      monthPlanned = matchingMilestones.reduce((acc, curr) => acc + Number(curr.planned_amount || 0), 0);
      monthActual = matchingMilestones.reduce((acc, curr) => acc + Number(curr.actual_certified_amount || 0), 0);
    } else {
      const progressRatio = m / dur;
      const monthlyBellFactor = 6 * progressRatio * (1 - progressRatio) / dur;
      monthPlanned = Math.round(totalSum * monthlyBellFactor);
    }
    cumPlanned += monthPlanned;
    if (cumPlanned > totalSum) cumPlanned = totalSum;
    if (monthActual > 0) {
      cumActual += monthActual;
    } else if (matchingMilestones.some((ms) => ms.status === "Certified")) {
      cumActual += monthPlanned;
    }
    monthlyDistribution.push({
      month: m,
      monthLabel: `M${m}`,
      plannedMonthly: monthPlanned,
      plannedCumulative: cumPlanned,
      actualMonthly: monthActual,
      actualCumulative: cumActual > 0 ? cumActual : null,
      percentageComplete: Math.min(100, Math.round(cumPlanned / (totalSum || 1) * 100))
    });
  }
  const peakMonthlyOutlay = Math.max(...monthlyDistribution.map((d) => d.plannedMonthly), 0);
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
async function getTenderBidders(projectId) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM tender_bidders WHERE project_id = '${safeId}' ORDER BY recommendation_rank ASC, total_bid_amount ASC`);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  const bidders = res[0].values.map((row) => {
    const obj = {};
    cols.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
  for (const b of bidders) {
    const safeBidderId = String(b.id).replace(/'/g, "''");
    const itemsRes = database.exec(`SELECT * FROM tender_bid_items WHERE bidder_id = '${safeBidderId}' ORDER BY trade_section ASC, item_name ASC`);
    if (itemsRes.length > 0) {
      const iCols = itemsRes[0].columns;
      b.items = itemsRes[0].values.map((r) => {
        const itemObj = {};
        iCols.forEach((c, i) => {
          itemObj[c] = r[i];
        });
        return itemObj;
      });
    } else {
      b.items = [];
    }
  }
  return bidders;
}
async function createTenderBidder(projectId, data) {
  const database = await getDb();
  const id = "bid-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  database.run(
    `INSERT INTO tender_bidders 
     (id, project_id, bidder_name, contact_person, contact_phone, contact_email, total_bid_amount, technical_score, duration_weeks, compliance_status, recommendation_rank, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      projectId,
      data.bidder_name || "New Subcontractor",
      data.contact_person || "",
      data.contact_phone || "",
      data.contact_email || "",
      Number(data.total_bid_amount || 0),
      Number(data.technical_score || 80),
      Number(data.duration_weeks || 24),
      data.compliance_status || "Compliant",
      Number(data.recommendation_rank || 0),
      data.notes || "",
      now
    ]
  );
  if (Array.isArray(data.items)) {
    for (const it of data.items) {
      const itemId = "bidi-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
      const qty = Number(it.qty || 0);
      const rate = Number(it.rate || 0);
      const amount = qty * rate;
      database.run(
        `INSERT INTO tender_bid_items (id, bidder_id, boq_item_id, trade_section, item_name, unit, qty, rate, amount, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          id,
          it.boq_item_id || "",
          it.trade_section || "General",
          it.item_name || it.item,
          it.unit || "m2",
          qty,
          rate,
          amount,
          it.notes || "",
          now
        ]
      );
    }
  }
  saveDbToDisk();
  return { id, project_id: projectId, ...data, created_at: now };
}
async function updateTenderBidder(id, data) {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  const fields = [];
  const vals = [];
  if (data.bidder_name !== void 0) {
    fields.push("bidder_name = ?");
    vals.push(data.bidder_name);
  }
  if (data.contact_person !== void 0) {
    fields.push("contact_person = ?");
    vals.push(data.contact_person);
  }
  if (data.contact_phone !== void 0) {
    fields.push("contact_phone = ?");
    vals.push(data.contact_phone);
  }
  if (data.contact_email !== void 0) {
    fields.push("contact_email = ?");
    vals.push(data.contact_email);
  }
  if (data.total_bid_amount !== void 0) {
    fields.push("total_bid_amount = ?");
    vals.push(Number(data.total_bid_amount));
  }
  if (data.technical_score !== void 0) {
    fields.push("technical_score = ?");
    vals.push(Number(data.technical_score));
  }
  if (data.duration_weeks !== void 0) {
    fields.push("duration_weeks = ?");
    vals.push(Number(data.duration_weeks));
  }
  if (data.compliance_status !== void 0) {
    fields.push("compliance_status = ?");
    vals.push(data.compliance_status);
  }
  if (data.recommendation_rank !== void 0) {
    fields.push("recommendation_rank = ?");
    vals.push(Number(data.recommendation_rank));
  }
  if (data.notes !== void 0) {
    fields.push("notes = ?");
    vals.push(data.notes);
  }
  if (fields.length > 0) {
    vals.push(safeId);
    database.run(`UPDATE tender_bidders SET ${fields.join(", ")} WHERE id = ?`, vals);
  }
  if (Array.isArray(data.items)) {
    database.run(`DELETE FROM tender_bid_items WHERE bidder_id = '${safeId}'`);
    let calcTotal = 0;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const it of data.items) {
      const itemId = "bidi-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
      const qty = Number(it.qty || 0);
      const rate = Number(it.rate || 0);
      const amount = qty * rate;
      calcTotal += amount;
      database.run(
        `INSERT INTO tender_bid_items (id, bidder_id, boq_item_id, trade_section, item_name, unit, qty, rate, amount, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [itemId, safeId, it.boq_item_id || "", it.trade_section || "General", it.item_name || it.item, it.unit || "m2", qty, rate, amount, it.notes || "", now]
      );
    }
    if (calcTotal > 0) {
      database.run(`UPDATE tender_bidders SET total_bid_amount = ? WHERE id = ?`, [calcTotal, safeId]);
    }
  }
  saveDbToDisk();
  return true;
}
async function deleteTenderBidder(id) {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  database.run(`DELETE FROM tender_bid_items WHERE bidder_id = '${safeId}'`);
  database.run(`DELETE FROM tender_bidders WHERE id = '${safeId}'`);
  saveDbToDisk();
  return true;
}
async function autoPopulateBiddersFromBoq(projectId) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const project = await getProjectById(projectId);
  if (!project) return [];
  const items = project.items || [];
  const baseSubtotal = project.subtotal || 1e8;
  const existing = await getTenderBidders(projectId);
  for (const b of existing) {
    await deleteTenderBidder(b.id);
  }
  const biddersConfig = [
    {
      name: "Julius & Brothers Construction Ltd",
      contact: "Engr. Emeka Nwankwo",
      phone: "+234 803 219 4481",
      email: "tenders@juliusconstruction.ng",
      rateMultiplier: 1.04,
      // +4% above benchmark
      technicalScore: 89,
      durationWeeks: 24,
      compliance: "Compliant",
      rank: 1,
      notes: "COREN certified, strong local plant inventory, highly responsive rate submission"
    },
    {
      name: "Dantata Horizon Building Contractors",
      contact: "Alhaji Sanusi Bello",
      phone: "+234 802 884 1290",
      email: "bids@dantatahorizon.com",
      rateMultiplier: 0.91,
      // -9% below benchmark (aggressive low bidder)
      technicalScore: 78,
      durationWeeks: 22,
      compliance: "Compliant",
      rank: 2,
      notes: "Lowest priced tender. Potential risk of rebar and concrete rate under-quoting, requires close QS oversight"
    },
    {
      name: "Cappa Elite Structures Ltd",
      contact: "Arc. Tunde Balogun",
      phone: "+234 805 441 9022",
      email: "commercial@cappaelite.ng",
      rateMultiplier: 1.18,
      // +18% premium tier
      technicalScore: 95,
      durationWeeks: 20,
      compliance: "Compliant",
      rank: 3,
      notes: "Premium commercial grade, ISO 9001, guaranteed delivery in 20 weeks with full safety equipment"
    }
  ];
  const results = [];
  for (const cfg of biddersConfig) {
    const bidderId = "bid-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    let bidderTotal = 0;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    database.run(
      `INSERT INTO tender_bidders 
       (id, project_id, bidder_name, contact_person, contact_phone, contact_email, total_bid_amount, technical_score, duration_weeks, compliance_status, recommendation_rank, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bidderId,
        projectId,
        cfg.name,
        cfg.contact,
        cfg.phone,
        cfg.email,
        0,
        cfg.technicalScore,
        cfg.durationWeeks,
        cfg.compliance,
        cfg.rank,
        cfg.notes,
        now
      ]
    );
    for (const boq of items) {
      const bidiId = "bidi-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
      const variance = Math.random() * 0.08 - 0.04;
      const bidRate = Math.round(Number(boq.rate) * (cfg.rateMultiplier + variance));
      const bidAmount = Math.round(Number(boq.qty) * bidRate);
      bidderTotal += bidAmount;
      database.run(
        `INSERT INTO tender_bid_items (id, bidder_id, boq_item_id, trade_section, item_name, unit, qty, rate, amount, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bidiId,
          bidderId,
          boq.id || "",
          boq.section || "Superstructure",
          boq.item,
          boq.unit,
          Number(boq.qty),
          bidRate,
          bidAmount,
          "",
          now
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
async function getProjectFluctuation(projectId) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM project_fluctuations WHERE project_id = '${safeId}'`);
  if (res.length > 0 && res[0].values.length > 0) {
    const cols = res[0].columns;
    const obj = {};
    cols.forEach((c, i) => {
      obj[c] = res[0].values[0][i];
    });
    return obj;
  }
  const project = await getProjectById(projectId);
  const contractSum = project ? project.grand_total || 1e8 : 1e8;
  const id = "fluc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const defaultRecord = {
    id,
    project_id: projectId,
    clause_type: "FIDIC_70",
    base_date: "2024-01-15",
    valuation_date: "2025-02-01",
    base_cement_price: 5500,
    // Naira / 50kg bag at tender
    current_cement_price: 8800,
    // Current market price
    cement_weight: 0.3,
    // 30% material factor
    base_rebar_price: 75e4,
    // Naira / tonne at tender
    current_rebar_price: 128e4,
    // Current market price
    rebar_weight: 0.25,
    // 25% material factor
    base_diesel_price: 800,
    // Naira / litre at tender
    current_diesel_price: 1350,
    // Current market price
    diesel_weight: 0.15,
    // 15% plant/fuel factor
    base_labour_rate: 4500,
    // Artisan daily wage at tender
    current_labour_rate: 7e3,
    // Current daily wage
    labour_weight: 0.2,
    // 20% labour factor
    fixed_element: 0.1,
    // 10% non-adjustable
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
      defaultRecord.id,
      defaultRecord.project_id,
      defaultRecord.clause_type,
      defaultRecord.base_date,
      defaultRecord.valuation_date,
      defaultRecord.base_cement_price,
      defaultRecord.current_cement_price,
      defaultRecord.cement_weight,
      defaultRecord.base_rebar_price,
      defaultRecord.current_rebar_price,
      defaultRecord.rebar_weight,
      defaultRecord.base_diesel_price,
      defaultRecord.current_diesel_price,
      defaultRecord.diesel_weight,
      defaultRecord.base_labour_rate,
      defaultRecord.current_labour_rate,
      defaultRecord.labour_weight,
      defaultRecord.fixed_element,
      defaultRecord.calculated_multiplier,
      defaultRecord.original_contract_sum,
      defaultRecord.claimable_fluctuation_sum,
      now
    ]
  );
  saveDbToDisk();
  return defaultRecord;
}
async function saveProjectFluctuation(projectId, data) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const a = Number(data.fixed_element ?? 0.1);
  const b = Number(data.cement_weight ?? 0.3);
  const c = Number(data.rebar_weight ?? 0.25);
  const d = Number(data.diesel_weight ?? 0.15);
  const e = Number(data.labour_weight ?? 0.2);
  const cRatio = (Number(data.current_cement_price) || 1) / (Number(data.base_cement_price) || 1);
  const rRatio = (Number(data.current_rebar_price) || 1) / (Number(data.base_rebar_price) || 1);
  const dRatio = (Number(data.current_diesel_price) || 1) / (Number(data.base_diesel_price) || 1);
  const lRatio = (Number(data.current_labour_rate) || 1) / (Number(data.base_labour_rate) || 1);
  const multiplier = +(a + b * cRatio + c * rRatio + d * dRatio + e * lRatio).toFixed(4);
  const contractSum = Number(data.original_contract_sum || 1e8);
  const claimable = Math.round(contractSum * (multiplier - 1));
  database.run(`DELETE FROM project_fluctuations WHERE project_id = '${safeId}'`);
  const id = "fluc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  database.run(
    `INSERT INTO project_fluctuations 
     (id, project_id, clause_type, base_date, valuation_date, base_cement_price, current_cement_price, cement_weight,
      base_rebar_price, current_rebar_price, rebar_weight, base_diesel_price, current_diesel_price, diesel_weight,
      base_labour_rate, current_labour_rate, labour_weight, fixed_element, calculated_multiplier, original_contract_sum, claimable_fluctuation_sum, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      projectId,
      data.clause_type || "FIDIC_70",
      data.base_date || "2024-01-15",
      data.valuation_date || "2025-02-01",
      Number(data.base_cement_price || 5500),
      Number(data.current_cement_price || 8800),
      b,
      Number(data.base_rebar_price || 75e4),
      Number(data.current_rebar_price || 128e4),
      c,
      Number(data.base_diesel_price || 800),
      Number(data.current_diesel_price || 1350),
      d,
      Number(data.base_labour_rate || 4500),
      Number(data.current_labour_rate || 7e3),
      e,
      a,
      multiplier,
      contractSum,
      claimable,
      now
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
async function createPaymentTransfer(data) {
  const database = await getDb();
  const id = "tx-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const status = data.autoApprove ? "approved" : "pending";
  const verifiedBy = data.autoApprove ? "System Instant Verification" : "";
  const verifiedAt = data.autoApprove ? now : "";
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
      "Access Bank",
      "081515121",
      "Isaac Emmanuel",
      data.transfer_reference,
      data.sender_name,
      data.sender_bank,
      data.transfer_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      data.receipt_url || "",
      data.notes || "",
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
    bank_name: "Access Bank",
    account_number: "081515121",
    account_name: "Isaac Emmanuel",
    transfer_reference: data.transfer_reference,
    sender_name: data.sender_name,
    sender_bank: data.sender_bank,
    transfer_date: data.transfer_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    receipt_url: data.receipt_url || "",
    notes: data.notes || "",
    status,
    verified_by: verifiedBy,
    verified_at: verifiedAt,
    created_at: now
  };
}
async function applyPlanToUser(database, userId, planId) {
  const safeId = userId.replace(/'/g, "''");
  const now = /* @__PURE__ */ new Date();
  if (planId === "per_boq") {
    database.run(`UPDATE users SET boq_credits = COALESCE(boq_credits, 0) + 1 WHERE id = '${safeId}'`);
  } else if (planId === "monthly") {
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3).toISOString();
    database.run(`UPDATE users SET subscription_tier = 'monthly', subscription_status = 'active', subscription_expires_at = '${expiresAt}' WHERE id = '${safeId}'`);
  } else if (planId === "yearly") {
    const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1e3).toISOString();
    database.run(`UPDATE users SET subscription_tier = 'yearly', subscription_status = 'active', subscription_expires_at = '${expiresAt}' WHERE id = '${safeId}'`);
  } else if (planId === "lifetime_license") {
    const licenseKey = "LE-2026-QS-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-81515121";
    database.run(`UPDATE users SET subscription_tier = 'lifetime_license', subscription_status = 'active', subscription_expires_at = '', license_key = '${licenseKey}' WHERE id = '${safeId}'`);
  }
}
async function verifyPaymentTransfer(transferId, status, verifiedBy = "Isaac Emmanuel, Lead QS", notes = "") {
  const database = await getDb();
  const safeId = transferId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM payment_transfers WHERE id = '${safeId}'`);
  if (res.length === 0 || res[0].values.length === 0) return null;
  const cols = res[0].columns;
  const row = res[0].values[0];
  const tx = {};
  cols.forEach((col, idx) => {
    tx[col] = row[idx];
  });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  database.run(
    `UPDATE payment_transfers SET status = ?, verified_by = ?, verified_at = ?, notes = ? WHERE id = ?`,
    [status, verifiedBy, now, notes || tx.notes, transferId]
  );
  if (status === "approved") {
    await applyPlanToUser(database, tx.user_id, tx.plan_id);
  }
  saveDbToDisk();
  tx.status = status;
  tx.verified_by = verifiedBy;
  tx.verified_at = now;
  return tx;
}
async function getPaymentTransfers(userId) {
  const database = await getDb();
  let query = "SELECT * FROM payment_transfers ORDER BY created_at DESC";
  if (userId) {
    query = `SELECT * FROM payment_transfers WHERE user_id = '${userId.replace(/'/g, "''")}' ORDER BY created_at DESC`;
  }
  const res = database.exec(query);
  if (res.length === 0 || res[0].values.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const item = {};
    cols.forEach((col, idx) => {
      item[col] = row[idx];
    });
    return item;
  });
}
async function getUserSubscriptionInfo(userId) {
  const database = await getDb();
  const safeId = userId.replace(/'/g, "''");
  const res = database.exec(`SELECT id, created_at, subscription_tier, subscription_status, subscription_expires_at, boq_credits, license_key FROM users WHERE id = '${safeId}'`);
  if (res.length === 0 || res[0].values.length === 0) {
    return {
      tier: "free_trial",
      status: "active",
      isTrial: true,
      trialDaysRemaining: 30,
      trialExpired: false,
      boqCredits: 0,
      canGenerateBoq: true,
      licenseKey: ""
    };
  }
  const row = res[0].values[0];
  const createdAt = row[1] ? new Date(row[1]).getTime() : Date.now();
  const tier = row[2] || "free_trial";
  const status = row[3] || "active";
  const expiresAt = row[4] || "";
  const boqCredits = Number(row[5] || 0);
  const licenseKey = row[6] || "";
  const now = Date.now();
  const daysElapsed = Math.floor((now - createdAt) / (1e3 * 60 * 60 * 24));
  const trialDaysRemaining = Math.max(0, 30 - daysElapsed);
  const trialExpired = trialDaysRemaining <= 0;
  let isSubscriptionActive = false;
  if (tier === "lifetime_license") {
    isSubscriptionActive = true;
  } else if ((tier === "monthly" || tier === "yearly") && expiresAt) {
    isSubscriptionActive = new Date(expiresAt).getTime() > now;
  }
  const isTrial = tier === "free_trial" && !isSubscriptionActive;
  const canGenerateBoq = isSubscriptionActive || isTrial && !trialExpired || boqCredits > 0;
  return {
    tier,
    status: isSubscriptionActive ? "active" : isTrial && trialExpired ? "expired" : status,
    isTrial,
    trialDaysRemaining,
    trialExpired,
    boqCredits,
    expiresAt,
    licenseKey,
    canGenerateBoq
  };
}
async function consumeBoqCredit(userId) {
  const database = await getDb();
  const info = await getUserSubscriptionInfo(userId);
  if (info.tier === "lifetime_license" || info.expiresAt && new Date(info.expiresAt).getTime() > Date.now()) {
    return true;
  }
  if (info.isTrial && !info.trialExpired) {
    return true;
  }
  if (info.boqCredits > 0) {
    database.run(`UPDATE users SET boq_credits = boq_credits - 1 WHERE id = '${userId.replace(/'/g, "''")}'`);
    saveDbToDisk();
    return true;
  }
  return false;
}
async function getProjectFinalAccount(projectId) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM project_final_accounts WHERE project_id = '${safeId}'`);
  if (res.length > 0 && res[0].values.length > 0) {
    const cols = res[0].columns;
    const row = res[0].values[0];
    const fa = {};
    cols.forEach((col, idx) => {
      fa[col] = row[idx];
    });
    return fa;
  }
  return autoCalculateFinalAccount(projectId);
}
async function autoCalculateFinalAccount(projectId) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const pRes = database.exec(`SELECT grand_total, subtotal FROM projects WHERE id = '${safeId}'`);
  const originalContractSum = pRes.length > 0 && pRes[0].values.length > 0 ? Number(pRes[0].values[0][0] || 0) : 0;
  const vRes = database.exec(`SELECT type, amount, status FROM project_variations WHERE project_id = '${safeId}'`);
  let additions = 0;
  let omissions = 0;
  if (vRes.length > 0) {
    vRes[0].values.forEach((row) => {
      const type = (row[0] || "addition").toLowerCase();
      const amt = Number(row[1] || 0);
      const status = row[2];
      if (status !== "Rejected") {
        if (type === "addition") additions += amt;
        else omissions += amt;
      }
    });
  }
  const netVariations = additions - omissions;
  const fRes = database.exec(`SELECT claimable_fluctuation_sum FROM project_fluctuations WHERE project_id = '${safeId}'`);
  const fluctuationClaim = fRes.length > 0 && fRes[0].values.length > 0 ? Number(fRes[0].values[0][0] || 0) : 0;
  const valRes = database.exec(`SELECT cumulative_value, retention_amount, amount_due, status FROM project_valuations WHERE project_id = '${safeId}' ORDER BY created_at DESC`);
  let totalPreviousPayments = 0;
  let retentionHeld = 0;
  if (valRes.length > 0) {
    valRes[0].values.forEach((row) => {
      const amtDue = Number(row[2] || 0);
      const ret = Number(row[1] || 0);
      totalPreviousPayments += amtDue;
      retentionHeld += ret;
    });
  }
  const provisionalAdjustment = 0;
  const primeCostAdjustment = 0;
  const dayworksAmount = 0;
  const liquidatedDamages = 0;
  const otherSetoffs = 0;
  const grossFinalSum = originalContractSum + netVariations + fluctuationClaim + provisionalAdjustment + primeCostAdjustment + dayworksAmount - liquidatedDamages - otherSetoffs;
  const retentionReleased = Math.round(retentionHeld * 0.5);
  const balanceDue = grossFinalSum - totalPreviousPayments + retentionReleased;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    id: "fa-" + projectId,
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
    practical_completion_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    defects_liability_end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
    // 6 months standard DLP
    defects_certificate_issued: 0,
    status: "Draft",
    qs_signoff_name: "Isaac Emmanuel, MYQSF",
    qs_registration_number: "MYQSF/QS/8421",
    signoff_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    notes: "Prepared in accordance with Standard Conditions of Building Contract & BESMM4.",
    created_at: now,
    updated_at: now
  };
}
async function saveProjectFinalAccount(projectId, data) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  database.run(`DELETE FROM project_final_accounts WHERE project_id = '${safeId}'`);
  const id = data.id || "fa-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const now = (/* @__PURE__ */ new Date()).toISOString();
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
      data.practical_completion_date || "",
      data.defects_liability_end_date || "",
      data.defects_certificate_issued ? 1 : 0,
      data.status || "Draft",
      data.qs_signoff_name || "Isaac Emmanuel, MYQSF",
      data.qs_registration_number || "MYQSF/QS/8421",
      data.signoff_date || "",
      data.notes || "",
      data.created_at || now,
      now
    ]
  );
  saveDbToDisk();
  return { ...data, id, project_id: projectId, updated_at: now };
}
async function compileExecutiveProjectDossier(projectId, user) {
  const database = await getDb();
  const safeId = projectId.replace(/'/g, "''");
  const project = await getProjectById(projectId);
  if (!project) throw new Error("Project not found");
  const tradeMap = {};
  let totalBoqSum = 0;
  (project.items || []).forEach((it) => {
    const sec = it.section || "General Building Works";
    if (!tradeMap[sec]) tradeMap[sec] = { count: 0, total: 0 };
    tradeMap[sec].count++;
    tradeMap[sec].total += Number(it.amount || 0);
    totalBoqSum += Number(it.amount || 0);
  });
  const boqTrades = Object.entries(tradeMap).map(([section, data]) => ({
    section,
    itemCount: data.count,
    totalAmount: data.total,
    percentage: totalBoqSum > 0 ? +(data.total / totalBoqSum * 100).toFixed(1) : 0
  })).sort((a, b) => b.totalAmount - a.totalAmount);
  const materialSummary = [
    { category: "Cement", item: "Dangote 50kg Portland Cement (42.5R)", totalQty: Math.round(project.grand_total * 35e-5), unit: "Bags", totalCost: Math.round(project.grand_total * 0.18) },
    { category: "Reinforcement Steel", item: "High-Yield T10/T12/T16 Rebar", totalQty: Math.max(5, Math.round((project.gfa || 500) * 0.045)), unit: "Tonnes", totalCost: Math.round(project.grand_total * 0.15) },
    { category: "Aggregates", item: "Crushed Granite Stone (3/4 Inch)", totalQty: Math.max(10, Math.round((project.gfa || 500) * 0.08)), unit: "Trips (30T)", totalCost: Math.round(project.grand_total * 0.08) },
    { category: "Sand", item: "Sharp River Sand", totalQty: Math.max(8, Math.round((project.gfa || 500) * 0.06)), unit: "Trips (20T)", totalCost: Math.round(project.grand_total * 0.04) },
    { category: "Energy & Haulage", item: "AGO Site Diesel (Generators/Mixers)", totalQty: 4500, unit: "Litres", totalCost: Math.round(project.grand_total * 0.035) }
  ];
  const milestones = await getCashFlowMilestones(projectId);
  const cashFlowSummary = milestones.length > 0 ? {
    totalMilestones: milestones.length,
    contractSum: project.grand_total,
    peakMonth: 4,
    scheduledMonths: project.duration_months || 12
  } : null;
  let tenderSummary = null;
  try {
    const bidders = await getTenderBidders(projectId);
    if (bidders.length > 0) {
      const benchmarkTotal = project.subtotal || 1;
      const bidSums = bidders.map((b) => Number(b.total_bid_amount || 0)).filter((s) => s > 0);
      const averageBidSum = bidSums.length > 0 ? Math.round(bidSums.reduce((a, b) => a + b, 0) / bidSums.length) : benchmarkTotal;
      const highestBidSum = bidSums.length > 0 ? Math.max(...bidSums) : benchmarkTotal;
      const lowestBidSum = bidSums.length > 0 ? Math.min(...bidSums) : benchmarkTotal;
      const compliant = bidders.filter((b) => b.compliance_status === "Compliant");
      const lowestResponsive = compliant.sort((a, b) => Number(a.total_bid_amount) - Number(b.total_bid_amount))[0];
      tenderSummary = {
        projectId,
        benchmarkTotal,
        bidders,
        lowestResponsiveBidderId: lowestResponsive?.id,
        averageBidSum,
        highestBidSum,
        lowestBidSum,
        outlierCount: bidders.filter((b) => {
          const varPct = Math.abs((Number(b.total_bid_amount) - benchmarkTotal) / benchmarkTotal);
          return varPct > 0.15;
        }).length
      };
    }
  } catch (e) {
  }
  const fluctuationSummary = await getProjectFluctuation(projectId);
  const finalAccountSummary = await getProjectFinalAccount(projectId);
  const userInfo = user ? await getUserSubscriptionInfo(user.id) : null;
  return {
    project,
    compiledAt: (/* @__PURE__ */ new Date()).toISOString(),
    compiledBy: user?.full_name?.replace(/MNIQS/g, "MYQSF") || "Isaac Emmanuel, MYQSF",
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
      leadQs: "Isaac Emmanuel, MYQSF",
      registrationNumber: "MYQSF/QS/8421",
      bankAccount: "Access Bank 081515121",
      accountName: "Isaac Emmanuel",
      licenseStatus: userInfo?.status || "Active Registered Consultant",
      licenseKey: userInfo?.licenseKey || "LE-2026-QS-MYQSF-81515121",
      certifiedAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    }
  };
}
const SEED_NIGERIAN_SUPPLIERS = [
  {
    id: "supp-dangote-01",
    name: "Dangote Cement Commercial Depot (Ikeja / Apapa)",
    category: "Cement & Aggregates",
    contactPerson: "Alhaji Sanusi Mohammed",
    phone: "+234 803 452 1198",
    whatsapp: "+234 803 452 1198",
    email: "depot.apapa@dangote-cement.com",
    address: "12 Commercial Avenue, Apapa Port Corridor, Lagos",
    state: "Lagos",
    coverageAreas: "South West & Nationwide Direct Factory Dispatch",
    leadTime: "24 hours",
    minOrder: "300 bags (Half Trailer) / 600-900 bags",
    paymentTerms: "Advance Bank Transfer / Certified Draft",
    verificationStatus: "Verified",
    rating: 4.9,
    notes: "Primary authorized depot for Grade 42.5R Ordinary Portland Cement. Fast turnaround for large commercial sites.",
    materials: [
      { name: "Grade 42.5R Ordinary Portland Cement (50kg bag)", unit: "Bag", rate: 9500 },
      { name: "Grade 32.5N Falcon Cement (50kg bag)", unit: "Bag", rate: 8900 },
      { name: "Bulk Cement (Tanker 30 Tonnes)", unit: "Tonne", rate: 185e3 }
    ]
  },
  {
    id: "supp-bua-02",
    name: "BUA Cement Regional Distribution Depot",
    category: "Cement & Aggregates",
    contactPerson: "Engr. Chinedu Okafor",
    phone: "+234 812 770 4390",
    whatsapp: "+234 812 770 4390",
    email: "sales.ph@buacement.com",
    address: "Trans-Amadi Industrial Layout, Port Harcourt, Rivers State",
    state: "Rivers",
    coverageAreas: "South-South, South-East & Delta Riverine",
    leadTime: "24-48 hours",
    minOrder: "200 bags",
    paymentTerms: "Direct Bank Settlement / Confirmed PO",
    verificationStatus: "Verified",
    rating: 4.8,
    notes: "High sulphate-resisting Grade 42.5N cement suitable for coastal, swamp, and saline foundations.",
    materials: [
      { name: "BUA Grade 42.5N Super Cement (50kg bag)", unit: "Bag", rate: 9300 },
      { name: "Trailer Load Delivery (600 Bags)", unit: "Trip", rate: 558e4 }
    ]
  },
  {
    id: "supp-pulkit-03",
    name: "Pulkit & African Steel Mills Ltd",
    category: "Steel & Rebar",
    contactPerson: "Sunday Adebayo (Sales Lead)",
    phone: "+234 802 331 8842",
    whatsapp: "+234 802 331 8842",
    email: "orders@africansteelmills.ng",
    address: "Plot 14, Ikorodu Industrial Scheme, Ogijo Corridor, Lagos/Ogun",
    state: "Lagos",
    coverageAreas: "Nationwide Heavy Haulage",
    leadTime: "2-3 business days",
    minOrder: "5 tonnes",
    paymentTerms: "100% on Dispatch / Confirmed LC",
    verificationStatus: "Verified",
    rating: 4.9,
    notes: "SON certified high-yield deformed bars with yield strength >= 460 N/mm2. Mill test certificates provided with each batch.",
    materials: [
      { name: "High-Yield TMT Rebars Y10 (12m Length)", unit: "Tonne", rate: 145e4 },
      { name: "High-Yield TMT Rebars Y12 (12m Length)", unit: "Tonne", rate: 143e4 },
      { name: "High-Yield TMT Rebars Y16 (12m Length)", unit: "Tonne", rate: 142e4 },
      { name: "High-Yield TMT Rebars Y20 (12m Length)", unit: "Tonne", rate: 142e4 },
      { name: "Binding Wire (25kg Roll)", unit: "Roll", rate: 42e3 }
    ]
  },
  {
    id: "supp-royal-04",
    name: "Royal Quarries & Granite Aggregates Ltd",
    category: "Cement & Aggregates",
    contactPerson: "Chief Olumide Bakare",
    phone: "+234 805 609 3321",
    whatsapp: "+234 805 609 3321",
    email: "dispatch@royalquarries.com",
    address: "KM 42, Lagos-Ibadan Expressway / Abeokuta Quarry Basin",
    state: "Ogun",
    coverageAreas: "Lagos Island, Mainland, Ogun State",
    leadTime: "Same-day 24h dispatch",
    minOrder: "30-tonne Tipper load",
    paymentTerms: "Cash on Site Delivery / Transfer",
    verificationStatus: "Verified",
    rating: 4.8,
    notes: "Clean, unweathered crushed blue granite aggregates tested for low water absorption and high crushing value.",
    materials: [
      { name: 'Crushed Granite 20mm (3/4" Aggregate)', unit: "Tonne", rate: 11500 },
      { name: 'Crushed Granite 12mm (1/2" Aggregate)', unit: "Tonne", rate: 12500 },
      { name: "Granite Stone Dust (For Paving/Plaster)", unit: "Tonne", rate: 7500 },
      { name: "Hardcore Boulder Stones (Foundation Filling)", unit: "Tonne", rate: 8500 }
    ]
  },
  {
    id: "supp-epe-05",
    name: "Epe & Lekki River Sand Dredging Depot",
    category: "Cement & Aggregates",
    contactPerson: "Segun Oladipo",
    phone: "+234 803 912 4001",
    whatsapp: "+234 803 912 4001",
    email: "sand@lekki-dredging.ng",
    address: "Eleko Beach Road, Lekki-Epe Expressway, Ibeju-Lekki, Lagos",
    state: "Lagos",
    coverageAreas: "Lekki Phase 1, Ikoyi, Victoria Island, Ajah, Epe",
    leadTime: "Within 6-12 hours",
    minOrder: "20-tonne Tipper load",
    paymentTerms: "Cash on Delivery (COD)",
    verificationStatus: "Verified",
    rating: 4.7,
    notes: "Clean coarse river sand washed free from organic silt and salinity. Guaranteed 20-tonne full bucket tippers.",
    materials: [
      { name: "Sharp River Sand (Clean Coarse Concrete Sand)", unit: "Tonne", rate: 6500 },
      { name: "Soft Plaster Sand (Silica Free)", unit: "Tonne", rate: 5800 },
      { name: "20-Tonne Tipper Full Trip (Delivered)", unit: "Trip", rate: 13e4 }
    ]
  },
  {
    id: "supp-vibro-06",
    name: "Vibro-Cast Sandcrete Blocks & Paving Co.",
    category: "Blocks & Masonry",
    contactPerson: "David Nnamdi",
    phone: "+234 818 440 9983",
    whatsapp: "+234 818 440 9983",
    email: "orders@vibrocastblocks.ng",
    address: "Plot 8, Gwarinpa Expressway, FCT Abuja",
    state: "Abuja (FCT)",
    coverageAreas: "Abuja Municipal, Kubwa, Lugbe, Maitama, Guzape",
    leadTime: "24 hours",
    minOrder: "500 units",
    paymentTerms: "50% deposit, balance on offloading",
    verificationStatus: "Verified",
    rating: 4.8,
    notes: "Hydraulically vibrated cured sandcrete hollow blocks conforming to NIS 87:2000. Crushing strength tested.",
    materials: [
      { name: "9-inch (225mm) Machine-Vibrated Hollow Sandcrete Block", unit: "Unit", rate: 600 },
      { name: "6-inch (150mm) Machine-Vibrated Hollow Sandcrete Block", unit: "Unit", rate: 480 },
      { name: "60mm Heavy Duty Interlocking Paving Stones", unit: "m2", rate: 4800 }
    ]
  },
  {
    id: "supp-topfeathers-07",
    name: "Topfeathers Longspan Aluminium & Cladding",
    category: "Roofing & Cladding",
    contactPerson: "Arc. Tunde Balogun",
    phone: "+234 802 815 6710",
    whatsapp: "+234 802 815 6710",
    email: "sales@topfeathersroofing.com",
    address: "44 Kudirat Abiola Way, Oregun, Ikeja, Lagos",
    state: "Lagos",
    coverageAreas: "Nationwide Site Profiling",
    leadTime: "48 hours onsite delivery & profiling",
    minOrder: "100 square metres",
    paymentTerms: "70% mobilisation, 30% on delivery",
    verificationStatus: "Verified",
    rating: 4.9,
    notes: "Direct rolling mill partner for certified 0.55mm aluminium coil. On-site portable machine profiling available for long rafters.",
    materials: [
      { name: "0.55mm Thickness Aluminium Longspan Sheet", unit: "m2", rate: 7500 },
      { name: "0.45mm Steptile Aluminium Roofing Sheet", unit: "m2", rate: 6800 },
      { name: "Stone-Coated Bond Roofing Shingle (New Zealand Grade)", unit: "m2", rate: 9800 },
      { name: "Aluminium Ridge Cap & Flashing (0.55mm)", unit: "m", rate: 2500 }
    ]
  },
  {
    id: "supp-mambilla-08",
    name: "Mambilla & Sapele Hardwood Timber Concession",
    category: "Timber & Formwork",
    contactPerson: "Mallam Haruna Ibrahim",
    phone: "+234 806 720 1155",
    whatsapp: "+234 806 720 1155",
    email: "info@mambillatimber.ng",
    address: "Timber Depot Line 4, Oko-Baba, Ebute Metta, Lagos",
    state: "Lagos",
    coverageAreas: "Lagos State & Western Region",
    leadTime: "Same day",
    minOrder: "50 pieces",
    paymentTerms: "Cash on loading / instant transfer",
    verificationStatus: "Verified",
    rating: 4.7,
    notes: "Well-seasoned hardwood timbers (Obeche, Mahogany, Teak, Iroko) and WBP phenolic film-faced marine boards for formwork.",
    materials: [
      { name: '2" x 3" x 12ft Hardwood Rafter/Truss Timber', unit: "Piece", rate: 1850 },
      { name: '2" x 4" x 12ft Hardwood Beam Timber', unit: "Piece", rate: 2450 },
      { name: '2" x 6" x 12ft Hardwood Structural Timber', unit: "Piece", rate: 3600 },
      { name: '1" x 12" x 12ft Black Marine Plywood Board (Formwork)', unit: "Sheet", rate: 18500 },
      { name: "Bamboo Prop Poles (15ft)", unit: "Piece", rate: 650 }
    ]
  }
];
function seedDefaultSuppliersIfEmpty(database) {
  try {
    const allSuppliersToSeed = [...SEED_NIGERIAN_SUPPLIERS, ...SEED_PLANT_LABOUR_PRELIM_SUPPLIERS];
    for (const supp of allSuppliersToSeed) {
      const check = database.exec(`SELECT id FROM suppliers WHERE id = '${supp.id.replace(/'/g, "''")}'`);
      if (!check[0]?.values?.length) {
        database.run(
          `INSERT INTO suppliers (
            id, name, category, contact_person, phone, whatsapp, email, address, state,
            coverage_areas, lead_time, min_order, payment_terms, verification_status, rating, notes, materials_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            supp.id,
            supp.name,
            supp.category,
            supp.contactPerson,
            supp.phone,
            supp.whatsapp,
            supp.email,
            supp.address,
            supp.state,
            supp.coverageAreas,
            supp.leadTime,
            supp.minOrder,
            supp.paymentTerms,
            supp.verificationStatus,
            supp.rating,
            supp.notes,
            JSON.stringify(supp.materials)
          ]
        );
      }
    }
    saveDbToDisk();
  } catch (e) {
    console.warn("Could not seed suppliers table:", e);
  }
}
function seedDefaultLibraryRatesIfEmpty(database) {
  try {
    for (const rate of DEFAULT_LIBRARY_RATES) {
      const check = database.exec(`SELECT id FROM library_rates WHERE id = '${rate.id.replace(/'/g, "''")}'`);
      if (!check[0]?.values?.length) {
        database.run(
          `INSERT INTO library_rates (
            id, type, category, item, specification, unit,
            lagos_rate, abuja_rate, port_harcourt_rate, northern_rate,
            material_component, labour_component, plant_component, overhead_profit_percent,
            trend, trend_percent, key_suppliers_json, last_updated, is_custom, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'system')`,
          [
            rate.id,
            rate.type,
            rate.category,
            rate.item,
            rate.specification,
            rate.unit,
            rate.lagosRate,
            rate.abujaRate,
            rate.portHarcourtRate,
            rate.northernRate,
            rate.materialComponent || 0,
            rate.labourComponent || 0,
            rate.plantComponent || 0,
            rate.overheadProfitPercent || 15,
            rate.trend || "stable",
            rate.trendPercent || 0,
            JSON.stringify(rate.keySuppliers || []),
            (/* @__PURE__ */ new Date()).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })
          ]
        );
      }
    }
    saveDbToDisk();
  } catch (e) {
    console.warn("Could not seed library_rates table:", e);
  }
}
async function getAllSuppliers() {
  const database = await getDb();
  seedDefaultSuppliersIfEmpty(database);
  const stmt = database.prepare("SELECT * FROM suppliers ORDER BY rating DESC, name ASC");
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push({
      id: row.id,
      name: row.name,
      category: row.category,
      contactPerson: row.contact_person,
      phone: row.phone,
      whatsapp: row.whatsapp,
      email: row.email,
      address: row.address,
      state: row.state,
      coverageAreas: row.coverage_areas,
      leadTime: row.lead_time,
      minOrder: row.min_order,
      paymentTerms: row.payment_terms,
      verificationStatus: row.verification_status,
      rating: Number(row.rating || 4.8),
      notes: row.notes,
      materials: JSON.parse(String(row.materials_json || "[]")),
      createdAt: row.created_at
    });
  }
  stmt.free();
  return results;
}
async function createSupplier(data) {
  const database = await getDb();
  const id = data.id || `supp-${Date.now()}`;
  database.run(
    `INSERT INTO suppliers (
      id, name, category, contact_person, phone, whatsapp, email, address, state,
      coverage_areas, lead_time, min_order, payment_terms, verification_status, rating, notes, materials_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.category || "General Materials",
      data.contactPerson || "",
      data.phone || "",
      data.whatsapp || "",
      data.email || "",
      data.address || "",
      data.state || "Lagos",
      data.coverageAreas || "Nationwide",
      data.leadTime || "24-48 hours",
      data.minOrder || "",
      data.paymentTerms || "Bank Transfer / COD",
      data.verificationStatus || "Verified",
      data.rating || 4.8,
      data.notes || "",
      JSON.stringify(data.materials || [])
    ]
  );
  saveDbToDisk();
  return { id, ...data };
}
async function deleteSupplier(id) {
  const database = await getDb();
  database.run(`DELETE FROM suppliers WHERE id = ?`, [id]);
  saveDbToDisk();
  return true;
}
async function getAllLibraryRates(typeFilter, categoryFilter) {
  const database = await getDb();
  seedDefaultLibraryRatesIfEmpty(database);
  let query = "SELECT * FROM library_rates";
  const conditions = [];
  if (typeFilter && typeFilter !== "All") {
    conditions.push(`type = '${typeFilter.replace(/'/g, "''")}'`);
  }
  if (categoryFilter && categoryFilter !== "All") {
    conditions.push(`category = '${categoryFilter.replace(/'/g, "''")}'`);
  }
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY type ASC, category ASC, item ASC";
  const stmt = database.prepare(query);
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push({
      id: row.id,
      type: row.type,
      category: row.category,
      item: row.item,
      specification: row.specification || "",
      unit: row.unit,
      lagosRate: Number(row.lagos_rate || 0),
      abujaRate: Number(row.abuja_rate || 0),
      portHarcourtRate: Number(row.port_harcourt_rate || 0),
      northernRate: Number(row.northern_rate || 0),
      materialComponent: Number(row.material_component || 0),
      labourComponent: Number(row.labour_component || 0),
      plantComponent: Number(row.plant_component || 0),
      overheadProfitPercent: Number(row.overhead_profit_percent || 15),
      trend: row.trend || "stable",
      trendPercent: Number(row.trend_percent || 0),
      keySuppliers: JSON.parse(String(row.key_suppliers_json || "[]")),
      lastUpdated: row.last_updated || "Recent Benchmark",
      isCustom: Boolean(row.is_custom),
      userId: row.user_id,
      createdAt: row.created_at
    });
  }
  stmt.free();
  return results;
}
async function saveLibraryRate(rateData, userId = "user") {
  const database = await getDb();
  seedDefaultLibraryRatesIfEmpty(database);
  const id = rateData.id || `rate-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const nowStr = (/* @__PURE__ */ new Date()).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
  const existing = database.exec(`SELECT id FROM library_rates WHERE id = '${id.replace(/'/g, "''")}'`);
  if (existing[0]?.values?.length) {
    database.run(
      `UPDATE library_rates SET 
        type = ?, category = ?, item = ?, specification = ?, unit = ?,
        lagos_rate = ?, abuja_rate = ?, port_harcourt_rate = ?, northern_rate = ?,
        material_component = ?, labour_component = ?, plant_component = ?, overhead_profit_percent = ?,
        trend = ?, trend_percent = ?, key_suppliers_json = ?, last_updated = ?, is_custom = 1
       WHERE id = ?`,
      [
        rateData.type || "Material",
        rateData.category || "General",
        rateData.item || "",
        rateData.specification || "",
        rateData.unit || "Unit",
        Number(rateData.lagosRate || rateData.rate || 0),
        Number(rateData.abujaRate || rateData.lagosRate || rateData.rate || 0),
        Number(rateData.portHarcourtRate || rateData.lagosRate || rateData.rate || 0),
        Number(rateData.northernRate || rateData.lagosRate || rateData.rate || 0),
        Number(rateData.materialComponent || 0),
        Number(rateData.labourComponent || 0),
        Number(rateData.plantComponent || 0),
        Number(rateData.overheadProfitPercent || 15),
        rateData.trend || "stable",
        Number(rateData.trendPercent || 0),
        JSON.stringify(rateData.keySuppliers || []),
        nowStr,
        id
      ]
    );
  } else {
    database.run(
      `INSERT INTO library_rates (
        id, type, category, item, specification, unit,
        lagos_rate, abuja_rate, port_harcourt_rate, northern_rate,
        material_component, labour_component, plant_component, overhead_profit_percent,
        trend, trend_percent, key_suppliers_json, last_updated, is_custom, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        id,
        rateData.type || "Material",
        rateData.category || "General",
        rateData.item || "",
        rateData.specification || "",
        rateData.unit || "Unit",
        Number(rateData.lagosRate || rateData.rate || 0),
        Number(rateData.abujaRate || rateData.lagosRate || rateData.rate || 0),
        Number(rateData.portHarcourtRate || rateData.lagosRate || rateData.rate || 0),
        Number(rateData.northernRate || rateData.lagosRate || rateData.rate || 0),
        Number(rateData.materialComponent || 0),
        Number(rateData.labourComponent || 0),
        Number(rateData.plantComponent || 0),
        Number(rateData.overheadProfitPercent || 15),
        rateData.trend || "stable",
        Number(rateData.trendPercent || 0),
        JSON.stringify(rateData.keySuppliers || []),
        nowStr,
        userId
      ]
    );
  }
  saveDbToDisk();
  return { id, ...rateData, isCustom: true, lastUpdated: nowStr };
}
async function bulkImportLibraryRates(rateItems, userId = "user") {
  const database = await getDb();
  seedDefaultLibraryRatesIfEmpty(database);
  let savedCount = 0;
  for (const item of rateItems) {
    if (!item.item || !item.unit) continue;
    await saveLibraryRate(item, userId);
    savedCount++;
  }
  saveDbToDisk();
  return { total: rateItems.length, saved: savedCount };
}
async function bulkAdjustLibraryRates(percentChange, typeFilter, categoryFilter) {
  const database = await getDb();
  seedDefaultLibraryRatesIfEmpty(database);
  const multiplier = 1 + percentChange / 100;
  let whereClause = "";
  const conditions = [];
  if (typeFilter && typeFilter !== "All") {
    conditions.push(`type = '${typeFilter.replace(/'/g, "''")}'`);
  }
  if (categoryFilter && categoryFilter !== "All") {
    conditions.push(`category = '${categoryFilter.replace(/'/g, "''")}'`);
  }
  if (conditions.length > 0) {
    whereClause = " WHERE " + conditions.join(" AND ");
  }
  const countRes = database.exec(`SELECT COUNT(*) FROM library_rates ${whereClause}`);
  const affectedCount = Number(countRes[0]?.values[0][0]) || 0;
  database.run(`
    UPDATE library_rates 
    SET 
      lagos_rate = ROUND(lagos_rate * ${multiplier}),
      abuja_rate = ROUND(abuja_rate * ${multiplier}),
      port_harcourt_rate = ROUND(port_harcourt_rate * ${multiplier}),
      northern_rate = ROUND(northern_rate * ${multiplier}),
      material_component = ROUND(material_component * ${multiplier}),
      labour_component = ROUND(labour_component * ${multiplier}),
      plant_component = ROUND(plant_component * ${multiplier}),
      last_updated = '${(/* @__PURE__ */ new Date()).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}',
      trend = ${percentChange >= 0 ? "'up'" : "'down'"},
      trend_percent = ABS(${percentChange})
    ${whereClause}
  `);
  saveDbToDisk();
  return { count: affectedCount };
}
async function deleteLibraryRate(id) {
  const database = await getDb();
  database.run(`DELETE FROM library_rates WHERE id = ?`, [id]);
  saveDbToDisk();
  return true;
}
export {
  addCashFlowMilestone,
  addProjectCollaborator,
  autoCalculateFinalAccount,
  autoPopulateBiddersFromBoq,
  bulkAdjustLibraryRates,
  bulkImportLibraryRates,
  compileExecutiveProjectDossier,
  consumeBoqCredit,
  createEstimateVersion,
  createPaymentTransfer,
  createProjectDocument,
  createProjectValuation,
  createProjectVariation,
  createSupplier,
  createTenderBidder,
  deleteCashFlowMilestone,
  deleteEstimateVersion,
  deleteLibraryRate,
  deleteProject,
  deleteProjectDocument,
  deleteProjectValuation,
  deleteProjectVariation,
  deleteSupplier,
  deleteTenderBidder,
  duplicateProject,
  generateDefaultCashFlow,
  getAllLibraryRates,
  getAllProjects,
  getAllSuppliers,
  getCashFlowForecast,
  getCashFlowMilestones,
  getDb,
  getEstimateVersions,
  getPaymentTransfers,
  getProjectActivities,
  getProjectById,
  getProjectByShareToken,
  getProjectCollaborators,
  getProjectDocuments,
  getProjectFinalAccount,
  getProjectFluctuation,
  getProjectShare,
  getProjectValuations,
  getProjectVariations,
  getTenderBidders,
  getUserSubscriptionInfo,
  importBoqItemsToUserRates,
  recordActivity,
  removeProjectCollaborator,
  renameProject,
  restoreEstimateVersion,
  saveDbToDisk,
  saveLibraryRate,
  saveProject,
  saveProjectFinalAccount,
  saveProjectFluctuation,
  saveProjectShare,
  updateCashFlowMilestone,
  updateProjectStatus,
  updateProjectValuation,
  updateProjectVariation,
  updateTenderBidder,
  verifyPaymentTransfer
};

-- Let's Estimate - SQLite Database Schema
-- AI-Powered BOQ Takeoff Tool for Nigerian Builders

-- 1. Projects Table: Stores master project details, client, and financial parameters
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'Nigeria',
    client_name TEXT DEFAULT '',
    drawing_filename TEXT DEFAULT '',
    drawing_url TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    po_percent REAL DEFAULT 15.0,              -- Default 15% Profit & Overheads
    vat_percent REAL DEFAULT 7.5,              -- Default 7.5% Nigerian VAT
    swamp_premium_percent REAL DEFAULT 0.0,    -- [NICE TO HAVE: Terrain multiplier e.g. Niger Delta swamp premium]
    subtotal REAL DEFAULT 0.0,
    po_amount REAL DEFAULT 0.0,
    vat_amount REAL DEFAULT 0.0,
    grand_total REAL DEFAULT 0.0,
    notes TEXT DEFAULT ''
);

-- 2. BOQ Items Table: Stores detected and edited Bill of Quantities line items
CREATE TABLE IF NOT EXISTS boq_items (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    item_number INTEGER DEFAULT 1,
    item TEXT NOT NULL,                        -- e.g. 'Walls', 'RC Slab', 'Blockwork', 'Doors', 'Windows', 'Roofing'
    description TEXT NOT NULL,                 -- Detailed specification
    unit TEXT NOT NULL,                        -- e.g. 'm2', 'm3', 'No', 'kg', 'm'
    qty REAL NOT NULL DEFAULT 0.0,             -- Quantity from AI takeoff or manual input
    rate REAL NOT NULL DEFAULT 0.0,            -- Unit rate in Nigerian Naira (₦)
    amount REAL NOT NULL DEFAULT 0.0,          -- Calculated as (qty * rate)
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ========================================================================
-- NICE TO HAVE - COMMENTED OUT FOR LATER PHASES (Per Specifications)
-- ========================================================================

-- [NICE TO HAVE 1: Standard Nigerian Building Cost Rate Database]
/*
CREATE TABLE IF NOT EXISTS standard_rates (
    id TEXT PRIMARY KEY,
    item_category TEXT NOT NULL,               -- Substructure, Superstructure, Finishes, Services
    item_name TEXT NOT NULL,
    specification TEXT,
    unit TEXT NOT NULL,
    lagos_rate_ngn REAL DEFAULT 0.0,           -- Regional cost indices
    abuja_rate_ngn REAL DEFAULT 0.0,
    ph_rate_ngn REAL DEFAULT 0.0,              -- Port Harcourt / Niger Delta
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
*/

-- [NICE TO HAVE 2: User Accounts & Authentication with JWT]
/*
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    company_name TEXT,
    phone_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
*/

-- [NICE TO HAVE 3: Multi-page PDF Sheets / Drawing Versions]
/*
CREATE TABLE IF NOT EXISTS project_drawings (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    sheet_number TEXT,
    sheet_title TEXT,
    file_path TEXT NOT NULL,
    page_index INTEGER DEFAULT 1,
    takeoff_status TEXT DEFAULT 'pending',
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
*/

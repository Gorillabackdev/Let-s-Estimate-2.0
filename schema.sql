-- Let's Estimate - SQLite Database Schema
-- Production-Ready SaaS Construction Cost Estimating & BOQ Tool for Nigeria

-- 1. Users Table: Secure accounts, profiles, and authentication
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    profession TEXT DEFAULT 'Quantity Surveyor',
    company TEXT DEFAULT '',
    job_title TEXT DEFAULT 'Principal Quantity Surveyor',
    country TEXT DEFAULT 'Nigeria',
    state TEXT DEFAULT 'Lagos',
    currency TEXT DEFAULT 'NGN',
    measurement_system TEXT DEFAULT 'Metric',
    avatar_url TEXT DEFAULT '',
    email_verified INTEGER DEFAULT 0,
    verification_token TEXT DEFAULT '',
    reset_token TEXT DEFAULT '',
    reset_token_expires DATETIME DEFAULT NULL,
    role TEXT DEFAULT 'Owner',
    company_type TEXT DEFAULT 'Individual',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sessions Table: Multi-device session tracking and instant revocation
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    user_agent TEXT DEFAULT '',
    ip_address TEXT DEFAULT '',
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Login History Table: Audit security and login activities
CREATE TABLE IF NOT EXISTS login_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    ip_address TEXT DEFAULT '',
    user_agent TEXT DEFAULT '',
    status TEXT DEFAULT 'success',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Projects Table: Stores master project details, client, metadata, and financial parameters
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT '',
    title TEXT NOT NULL,
    project_type TEXT DEFAULT 'Residential',
    client_name TEXT DEFAULT '',
    client_contact TEXT DEFAULT '',
    location TEXT NOT NULL DEFAULT 'Nigeria',
    state TEXT DEFAULT 'Lagos',
    country TEXT DEFAULT 'Nigeria',
    description TEXT DEFAULT '',
    gfa REAL DEFAULT 0.0,
    number_of_floors INTEGER DEFAULT 1,
    status TEXT DEFAULT 'In Progress',
    start_date TEXT DEFAULT '',
    target_completion_date TEXT DEFAULT '',
    drawing_filename TEXT DEFAULT '',
    drawing_url TEXT DEFAULT '',
    po_percent REAL DEFAULT 15.0,
    vat_percent REAL DEFAULT 7.5,
    swamp_premium_percent REAL DEFAULT 0.0,
    waste_percent REAL DEFAULT 5.0,
    contingency_percent REAL DEFAULT 5.0,
    inflation_percent REAL DEFAULT 0.0,
    subtotal REAL DEFAULT 0.0,
    po_amount REAL DEFAULT 0.0,
    vat_amount REAL DEFAULT 0.0,
    grand_total REAL DEFAULT 0.0,
    active_version TEXT DEFAULT 'V1',
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. BOQ Items Table: Stores detected and edited Bill of Quantities line items
CREATE TABLE IF NOT EXISTS boq_items (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    version_id TEXT DEFAULT 'V1',
    section TEXT DEFAULT 'Superstructure',
    subsection TEXT DEFAULT '',
    item_number INTEGER DEFAULT 1,
    item TEXT NOT NULL,
    description TEXT NOT NULL,
    unit TEXT NOT NULL,
    qty REAL NOT NULL DEFAULT 0.0,
    rate REAL NOT NULL DEFAULT 0.0,
    amount REAL NOT NULL DEFAULT 0.0,
    notes TEXT DEFAULT '',
    is_ai_generated INTEGER DEFAULT 0,
    is_confirmed INTEGER DEFAULT 1,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 6. Estimate Versions Table: Track V1, V2, V3 revisions with snapshot values
CREATE TABLE IF NOT EXISTS estimate_versions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    version_name TEXT NOT NULL,
    description TEXT DEFAULT '',
    subtotal REAL DEFAULT 0.0,
    grand_total REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 7. User Custom Rates Table ("My Rates")
CREATE TABLE IF NOT EXISTS user_rates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    item_name TEXT NOT NULL,
    specification TEXT DEFAULT '',
    unit TEXT NOT NULL,
    material_cost REAL DEFAULT 0.0,
    labour_cost REAL DEFAULT 0.0,
    plant_cost REAL DEFAULT 0.0,
    composite_rate REAL NOT NULL DEFAULT 0.0,
    location TEXT DEFAULT 'Lagos',
    source TEXT DEFAULT 'User Custom',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Project Documents Table
CREATE TABLE IF NOT EXISTS project_documents (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Architectural Drawing',
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    file_type TEXT DEFAULT 'application/pdf',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 9. Project Variations Table
CREATE TABLE IF NOT EXISTS project_variations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    variation_number TEXT NOT NULL,
    description TEXT NOT NULL,
    reason TEXT DEFAULT '',
    quantity REAL DEFAULT 1.0,
    rate REAL DEFAULT 0.0,
    amount REAL DEFAULT 0.0,
    status TEXT DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 10. Interim Valuations Table
CREATE TABLE IF NOT EXISTS project_valuations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    valuation_number TEXT NOT NULL,
    valuation_date TEXT DEFAULT '',
    previous_valuation REAL DEFAULT 0.0,
    current_valuation REAL DEFAULT 0.0,
    cumulative_value REAL DEFAULT 0.0,
    retention_percent REAL DEFAULT 5.0,
    retention_amount REAL DEFAULT 0.0,
    advance_payment_deduction REAL DEFAULT 0.0,
    previous_payments REAL DEFAULT 0.0,
    amount_due REAL DEFAULT 0.0,
    status TEXT DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 11. Project Activities (Audit Trail)
CREATE TABLE IF NOT EXISTS project_activities (
    id TEXT PRIMARY KEY,
    project_id TEXT DEFAULT '',
    user_id TEXT NOT NULL,
    user_name TEXT DEFAULT '',
    action TEXT NOT NULL,
    details TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

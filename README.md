# Let's Estimate - AI BOQ Takeoff Tool for Nigeria 🇳🇬

An AI-powered Bill of Quantities (BOQ) takeoff web application built for builders, architects, contractors, and quantity surveyors in Nigeria. Upload architectural drawings (.jpg, .png, .pdf), let **Google Gemini 2.5 Flash Vision** draft quantities, edit items and unit rates in Naira (₦) in an Excel-like spreadsheet, and export professional Excel and PDF bills of quantities.

---

## 🏗️ Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS (Mobile-first, clean green Nigerian theme)
- **Backend**: Node.js, Express
- **Database**: SQLite (via `sql.js` WebAssembly for zero native build friction) storing projects, line items, and rates at `data/database.sqlite`
- **AI Computer Vision**: Google Gemini 2.5 Flash Vision API via `@google/genai`
- **File Handling**: `multer` for multipart drawing uploads, `pdf-lib` for document processing
- **Document Export**: `xlsx` for Microsoft Excel workbooks, `pdfkit` for formal contractor BOQ PDFs

---

## 📁 Project Folder Structure

```text
.
├── schema.sql                     # SQLite schema (projects, boq_items, commented starter tables)
├── server.ts                      # Express backend entry point & Vite middleware setup
├── server/
│   ├── db.ts                      # SQLite database manager, queries, and seed data
│   ├── ai.ts                      # Google Gemini 2.5 Flash Vision takeoff engine & prompt
│   └── export.ts                  # Excel (.xlsx) & PDF (.pdf) generation services
├── src/
│   ├── App.tsx                    # Main app orchestrator (Dashboard <-> BOQ Editor)
│   ├── main.tsx                   # React root entry point
│   ├── index.css                  # TailwindCSS directives
│   ├── types.ts                   # TypeScript interfaces (Project, BoqItem, StandardRate)
│   ├── utils/
│   │   └── format.ts              # Nigerian Naira (₦) formatting & financial math
│   └── components/
│       ├── Header.tsx             # App header with Nigeria Green branding & navigation
│       ├── ProjectDashboard.tsx   # Feature 1: Saved projects list & "New Project"
│       ├── ProjectMetaCard.tsx    # Project title, site location, client editor
│       ├── DrawingUploader.tsx    # Feature 2 & 3: .jpg/.png/.pdf uploader & AI Takeoff trigger
│       ├── BoqTable.tsx           # Feature 4 & 5: Excel-style editable spreadsheet table
│       ├── FinancialSummary.tsx   # Feature 6: Subtotal, 15% P&O, 7.5% VAT, Swamp Multiplier
│       ├── ExportActions.tsx      # Feature 7 & 8: Export Excel, Export PDF, Save to SQLite
│       └── NigerianRatesModal.tsx # Nice-to-have: Standard Nigerian market rate guide
├── data/
│   └── database.sqlite            # SQLite database file (created on startup)
├── .env.example                   # Environment variable template
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
└── vite.config.ts                 # Vite setup with TailwindCSS plugin
```

---

## 🚀 Getting Started

### 1. Install Dependencies
Run the following command in your terminal:
```bash
npm install
```

### 2. Configure Your Gemini API Key
Open your `.env` file (or duplicate `.env.example` as `.env`):
```bash
# Add your Google Gemini API Key below:
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

### 3. Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to: **http://localhost:3000**

### 4. Production Build
```bash
npm run build
npm start
```

---

## 🌟 Core MVP Features

1. **Project Dashboard**:
   - Lists all saved projects stored in SQLite.
   - Shows project title, location, client, grand total in ₦ (Naira), and drawing badge.
   - Includes big green **"Start New Estimate"** button.
   - Delete projects with confirmation.

2. **Drawing Upload**:
   - Single-page upload supporting `.jpg`, `.png`, and `.pdf` architectural plans.
   - Drag-and-drop zone with instant thumbnail previews.
   - Includes one-click **Demo Blueprint Presets** (4-Bedroom Bungalow & Student Hostel) for instant testing.

3. **AI Vision Takeoff (Google Gemini 2.5 Flash)**:
   - Sends the architectural drawing to **Google Gemini 2.5 Flash Vision** (`POST /api/takeoff`).
   - System prompt calibrated to Nigerian building codes (BESMM4 / NIQS).
   - Automatically detects and quantifies:
     - `Walls m2` (Internal & external plastering and rendering)
     - `RC Slab m3` (Reinforced concrete suspended slab volume)
     - `Blockwork m2` (225mm & 150mm sandcrete blockwork wall area)
     - `Doors No` (Flush doors, entrance security doors)
     - `Windows No` (Sliding glazed windows, insect nets, burglar bars)
     - `Roofing m2` (Longspan aluminium / stone-coated tiles)

4. **Editable BOQ Table**:
   - Excel-style spreadsheet interface.
   - Inline editing for Item name, Description, Unit (`m²`, `m³`, `No`, `m`, `kg`), Quantity, and Unit Rate (₦).
   - **"Add Row"** button to append custom trades or provisional sums.
   - **"Delete Row"** button for each item.
   - **"Apply Market Rates"** shortcut to fill current Nigerian unit prices.

5. **Rate & Auto-Calculating Amount Column**:
   - Dedicated `Rate ₦` column.
   - Instant calculation: `Amount = Quantity × Unit Rate`.

6. **Bill Totals & Statutory Markups**:
   - **Measured Sub-Total**: Sum of all line item amounts.
   - **15% Profit & Overheads (P&O)**: Standard contractor margin.
   - **7.5% Nigerian Value Added Tax (VAT)**: Statutory tax.
   - **Swamp Premium %**: Terrain multiplier for coastal and Niger Delta high water table sites.
   - **Grand Total**: Formatted in bold Nigerian Naira (₦).

7. **Professional Export**:
   - **Export Excel (`.xlsx`)**: Formatted Microsoft Excel workbook with project header, currency columns, and totals formulas.
   - **Export PDF (`.pdf`)**: Formal contractor Bill of Quantities document styled with Nigerian company header banner, item table, and client sign-off boxes.

8. **SQLite Persistence**:
   - Save projects directly to SQLite (`POST /api/projects`).
   - Reopen anytime from the Dashboard.

---

## 🏬 Seed Data Included

The database automatically initializes on startup with the sample project:
- **Title**: `2-Storey 100-Room Hostel Port Harcourt`
- **Location**: Port Harcourt, Rivers State, Nigeria (Near FUTO/UNIPORT Road)
- **Client**: Niger Delta Educational Consortium Ltd
- **Items Preloaded**: RC Slab (215.5 m³), Blockwork (1,840 m²), Walls (3,680 m²), Roofing (920 m²), Doors (104 No), Windows (110 No)
- **Financials**: Measured Subtotal ~₦123.8M + 5% Swamp Premium + 15% P&O + 7.5% VAT → Grand Total ~₦160.8M.

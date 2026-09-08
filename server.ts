/**
 * Let's Estimate - Express Backend Server
 * Handles AI Vision Takeoff, SQLite CRUD, and Excel/PDF Exports
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import multer from 'multer';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getAllProjects, getProjectById, saveProject, deleteProject, getDb } from './server/db.js';
import { performAiTakeoff } from './server/ai.js';
import { generateExcelBuffer, generatePdfBuffer, ExportData } from './server/export.js';

dotenv.config();

const app = express();
const PORT = 3000;

// Set up Multer for handling architectural drawing uploads (.jpg, .png, .pdf)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size for drawings
  },
  fileFilter: (_req, file, cb) => {
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMime.includes(file.mimetype) || file.originalname.match(/\.(jpg|jpeg|png|pdf)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpg, .png, and .pdf drawing files are allowed.'));
    }
  },
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================================================================
// API ROUTES
// ========================================================================

// Health check and AI status
app.get('/api/health', (_req: Request, res: Response) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

  res.json({
    status: 'ok',
    app: "Let's Estimate - AI BOQ Tool for Nigeria",
    aiEngine: 'Google Gemini 2.5 Flash Vision',
    geminiVisionAvailable: hasGeminiKey,
    defaultProvider: hasGeminiKey ? 'Google Gemini 2.5 Flash' : 'Nigerian Benchmark',
  });
});

// Download complete source code ZIP (frontend + backend for GitHub)
app.get('/api/download-zip', (_req: Request, res: Response) => {
  const zipPath = path.join(process.cwd(), 'lets-estimate.zip');
  try {
    // Regenerate fresh zip bundle excluding node_modules, build artifacts, etc.
    const pythonScript = `
import os, zipfile
EXCLUDE_DIRS = {'node_modules', 'dist', '.git', '.aistudio', '.cache'}
EXCLUDE_FILES = {'lets-estimate.zip'}
with zipfile.ZipFile('lets-estimate.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
        for file in files:
            if file in EXCLUDE_FILES:
                continue
            if file.startswith('.') and file not in ['.env.example', '.gitignore']:
                continue
            filepath = os.path.join(root, file)
            arcname = os.path.relpath(filepath, '.')
            zipf.write(filepath, arcname)
`;
    execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });
    res.download(zipPath, 'lets-estimate-source.zip');
  } catch (err: any) {
    console.error('ZIP generation error:', err);
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, 'lets-estimate-source.zip');
    } else {
      res.status(500).json({ error: 'Failed to generate ZIP archive: ' + err.message });
    }
  }
});

// 1. AI Takeoff Endpoint: Receives file -> sends to Gemini Vision -> returns JSON items
app.post('/api/takeoff', upload.single('drawing'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No drawing file provided. Please upload a .jpg, .png, or .pdf architectural plan.' });
      return;
    }

    console.log(`[Takeoff] Received drawing: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB), mime: ${req.file.mimetype}`);

    const result = await performAiTakeoff(req.file.buffer, req.file.mimetype);

    res.json({
      success: true,
      filename: req.file.originalname,
      engineUsed: result.engineUsed,
      provider: result.provider,
      drawingSummary: result.drawingSummary,
      items: result.items,
    });
  } catch (error: any) {
    console.error('Takeoff error:', error);
    res.status(500).json({
      error: 'Failed to process drawing with AI Vision: ' + (error.message || 'Unknown error'),
    });
  }
});

// 2. Export Excel: Receives BOQ JSON -> returns .xlsx file
app.post('/api/export/excel', (req: Request, res: Response) => {
  try {
    const data: ExportData = req.body;
    if (!data || !Array.isArray(data.items)) {
      res.status(400).json({ error: 'Invalid BOQ data provided for Excel export.' });
      return;
    }

    const buffer = generateExcelBuffer(data);
    const safeTitle = (data.projectTitle || 'BOQ_Estimate').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.xlsx"`);
    res.send(buffer);
  } catch (error: any) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: 'Failed to generate Excel file: ' + error.message });
  }
});

// 3. Export PDF: Receives BOQ JSON -> returns .pdf file with Nigerian company header
app.post('/api/export/pdf', async (req: Request, res: Response) => {
  try {
    const data: ExportData = req.body;
    if (!data || !Array.isArray(data.items)) {
      res.status(400).json({ error: 'Invalid BOQ data provided for PDF export.' });
      return;
    }

    const buffer = await generatePdfBuffer(data);
    const safeTitle = (data.projectTitle || 'BOQ_Estimate').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.pdf"`);
    res.send(buffer);
  } catch (error: any) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to generate PDF document: ' + error.message });
  }
});

// 4. Projects CRUD: List all saved projects from SQLite
app.get('/api/projects', async (_req: Request, res: Response) => {
  try {
    const projects = await getAllProjects();
    res.json({ success: true, projects });
  } catch (error: any) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects from SQLite: ' + error.message });
  }
});

// 5. Get single project with all its items
app.get('/api/projects/:id', async (req: Request, res: Response) => {
  try {
    const project = await getProjectById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    res.json({ success: true, project });
  } catch (error: any) {
    console.error('Fetch project detail error:', error);
    res.status(500).json({ error: 'Failed to load project: ' + error.message });
  }
});

// 6. Save or Update project in SQLite
app.post('/api/projects', async (req: Request, res: Response) => {
  try {
    const projectData = req.body;
    if (!projectData || !projectData.id || !projectData.title) {
      res.status(400).json({ error: 'Project ID and Title are required.' });
      return;
    }

    const saved = await saveProject(projectData);
    res.json({ success: true, project: saved });
  } catch (error: any) {
    console.error('Save project error:', error);
    res.status(500).json({ error: 'Failed to save project to SQLite: ' + error.message });
  }
});

// 7. Delete project from SQLite
app.delete('/api/projects/:id', async (req: Request, res: Response) => {
  try {
    await deleteProject(req.params.id);
    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (error: any) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project: ' + error.message });
  }
});

// 8. Standard Nigerian Rates Reference (Lagos, Abuja, Port Harcourt)
app.get('/api/rates/standard', (_req: Request, res: Response) => {
  const standardRates = [
    { category: 'Earthwork', item: 'Excavation', unit: 'm3', lagos: 6500, abuja: 6200, ph: 7200, spec: 'Excavation in vegetable soil not exceeding 1.5m deep' },
    { category: 'Concrete', item: 'RC Slab (Grade 25)', unit: 'm3', lagos: 175000, abuja: 180000, ph: 185000, spec: '1:2:4 reinforced concrete in suspended floor slabs & beams' },
    { category: 'Concrete', item: 'Mass Concrete Blinding', unit: 'm3', lagos: 110000, abuja: 115000, ph: 120000, spec: '1:3:6 unreinforced concrete in foundation trench base' },
    { category: 'Blockwork', item: '225mm Sandcrete Blocks', unit: 'm2', lagos: 14500, abuja: 15200, ph: 15800, spec: 'Vibrated hollow sandcrete blocks bedded in cement mortar (1:4)' },
    { category: 'Blockwork', item: '150mm Sandcrete Blocks', unit: 'm2', lagos: 11800, abuja: 12400, ph: 12800, spec: 'Internal partition block walls bedded in mortar' },
    { category: 'Finishes', item: 'Walls (Internal & External Plaster)', unit: 'm2', lagos: 4200, abuja: 4500, ph: 4600, spec: '15mm cement sand render trowelled smooth' },
    { category: 'Finishes', item: 'Floor Screeding & Tiles', unit: 'm2', lagos: 9500, abuja: 9800, ph: 10200, spec: '40mm screed bed finished with 400x400mm vitrified ceramic tiles' },
    { category: 'Roofing', item: 'Roofing (Longspan Aluminium 0.55mm)', unit: 'm2', lagos: 28000, abuja: 29500, ph: 31000, spec: 'Pre-painted aluminium sheets on hardwood timber trusses' },
    { category: 'Roofing', item: 'Stone Coated Metal Roofing Tiles', unit: 'm2', lagos: 36000, abuja: 38000, ph: 39500, spec: 'Bond/Milano stone-coated steel roof tiles' },
    { category: 'Doors', item: 'Doors (Solid Flush Timber)', unit: 'No', lagos: 75000, abuja: 78000, ph: 82000, spec: 'Semi-solid hardwood flush door 900x2100mm with locks' },
    { category: 'Doors', item: 'Steel Security Entrance Door', unit: 'No', lagos: 145000, abuja: 150000, ph: 160000, spec: 'Armoured Turkish or Israeli steel security door' },
    { category: 'Windows', item: 'Windows (Glazed Aluminium Sliding)', unit: 'No', lagos: 65000, abuja: 68000, ph: 72000, spec: '1200x1200mm tinted glass sliding window with net' },
  ];
  res.json({ success: true, rates: standardRates });
});

// ========================================================================
// SERVER INITIALIZATION & VITE MIDDLEWARE
// ========================================================================

async function startServer() {
  // Initialize SQLite database
  await getDb();

  // Development: Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static assets
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(` LET'S ESTIMATE - AI BOQ TOOL FOR NIGERIA`);
    console.log(` Server running on http://0.0.0.0:${PORT}`);
    console.log(` SQLite Database: data/database.sqlite`);
    console.log(` AI Engine: Google Gemini 2.5 Flash Vision (${process.env.GEMINI_API_KEY ? 'Active' : 'Missing Key'})`);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
});

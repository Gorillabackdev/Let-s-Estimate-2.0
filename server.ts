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
import { 
  getAllProjects, 
  getProjectById, 
  saveProject, 
  renameProject,
  deleteProject, 
  duplicateProject, 
  updateProjectStatus, 
  recordActivity, 
  getProjectActivities, 
  getEstimateVersions,
  createEstimateVersion,
  restoreEstimateVersion,
  deleteEstimateVersion,
  getProjectVariations,
  createProjectVariation,
  updateProjectVariation,
  deleteProjectVariation,
  getProjectValuations,
  createProjectValuation,
  updateProjectValuation,
  deleteProjectValuation,
  getProjectDocuments,
  createProjectDocument,
  deleteProjectDocument,
  getProjectCollaborators,
  addProjectCollaborator,
  removeProjectCollaborator,
  getProjectShare,
  saveProjectShare,
  getProjectByShareToken,
  importBoqItemsToUserRates,
  getCashFlowMilestones,
  generateDefaultCashFlow,
  updateCashFlowMilestone,
  addCashFlowMilestone,
  deleteCashFlowMilestone,
  getCashFlowForecast,
  getTenderBidders,
  createTenderBidder,
  updateTenderBidder,
  deleteTenderBidder,
  autoPopulateBiddersFromBoq,
  getProjectFluctuation,
  saveProjectFluctuation,
  createPaymentTransfer,
  getPaymentTransfers,
  verifyPaymentTransfer,
  getUserSubscriptionInfo,
  consumeBoqCredit,
  getProjectFinalAccount,
  saveProjectFinalAccount,
  autoCalculateFinalAccount,
  compileExecutiveProjectDossier,
  getAllSuppliers,
  createSupplier,
  deleteSupplier,
  getAllLibraryRates,
  saveLibraryRate,
  bulkImportLibraryRates,
  bulkAdjustLibraryRates,
  deleteLibraryRate,
  getDb, 
  saveDbToDisk 
} from './server/db.js';
import { 
  hashPassword, 
  verifyPassword, 
  getUserByEmail, 
  getUserById, 
  createSession, 
  revokeSession, 
  revokeAllUserSessions, 
  recordLogin, 
  requireAuth, 
  optionalAuth, 
  ensureDefaultUser, 
  AuthRequest 
} from './server/auth.js';
import { performAiTakeoff, estimateFromDescription, analyzeBoqItems, auditValueEngineeringAndRisks } from './server/ai.js';
import { runDrawingTakeoffPipeline } from './server/takeoffPipeline.js';
import { generateExcelBuffer, generatePdfBuffer, generateUserGuidePdfBuffer, calculateMaterialRequirements, ExportData } from './server/export.js';
import { getRateLibrary, getUserCustomRates, saveUserCustomRate, deleteUserCustomRate, updateUserCustomRate } from './server/rates.js';

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

// ========================================================================
// PHASE 1: AUTHENTICATION & USER MANAGEMENT API
// ========================================================================

// 1. Register new user
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      full_name,
      phone = '',
      profession = 'Quantity Surveyor',
      company = '',
      job_title = '',
      country = 'Nigeria',
      state = 'Lagos',
      currency = 'NGN',
      measurement_system = 'Metric',
      company_type = 'Individual'
    } = req.body;

    if (!email || !password || !full_name) {
      res.status(400).json({ error: 'Full name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await getUserByEmail(cleanEmail);
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const userId = 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit verification code

    const database = await getDb();
    database.run(
      `INSERT INTO users (
        id, email, password_hash, salt, full_name, phone, profession, company,
        job_title, country, state, currency, measurement_system, verification_token,
        email_verified, role, company_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        cleanEmail,
        hash,
        salt,
        full_name.trim(),
        phone.trim(),
        profession,
        company.trim(),
        job_title.trim(),
        country,
        state,
        currency,
        measurement_system,
        verificationToken,
        0, // initially unverified
        'Owner',
        company_type
      ]
    );
    saveDbToDisk();

    const user = await getUserById(userId);
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const userAgent = req.headers['user-agent'] || '';
    const token = await createSession(userId, userAgent, ip);
    await recordLogin(userId, ip, userAgent, 'success');

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user,
      verificationCode: verificationToken // included for quick instant verification in prototype/preview
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account: ' + error.message });
  }
});

// 2. Login user
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRecord = await getUserByEmail(cleanEmail);
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const userAgent = req.headers['user-agent'] || '';

    if (!userRecord || !verifyPassword(password, userRecord.password_hash, userRecord.salt)) {
      if (userRecord) {
        await recordLogin(userRecord.id, ip, userAgent, 'failed_password');
      }
      res.status(401).json({ error: 'Invalid email or password. Please check your credentials.' });
      return;
    }

    const token = await createSession(userRecord.id, userAgent, ip);
    await recordLogin(userRecord.id, ip, userAgent, 'success');
    const user = await getUserById(userRecord.id);

    res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to sign in: ' + error.message });
  }
});

// 3. Google Sign-In / One-Tap OAuth
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { email, name, avatarUrl } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Google email is required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    let userRecord = await getUserByEmail(cleanEmail);
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const userAgent = req.headers['user-agent'] || '';

    if (!userRecord) {
      // Auto-register Google account as verified
      const userId = 'usr-g-' + Date.now();
      const { hash, salt } = hashPassword(Math.random().toString(36) + Date.now());
      const database = await getDb();
      database.run(
        `INSERT INTO users (
          id, email, password_hash, salt, full_name, avatar_url, email_verified,
          role, country, state, currency, profession
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          cleanEmail,
          hash,
          salt,
          name || 'Google User',
          avatarUrl || '',
          1, // verified by Google
          'Owner',
          'Nigeria',
          'Lagos',
          'NGN',
          'Quantity Surveyor'
        ]
      );
      saveDbToDisk();
      userRecord = (await getUserByEmail(cleanEmail))!;
    }

    const token = await createSession(userRecord.id, userAgent, ip);
    await recordLogin(userRecord.id, ip, userAgent, 'success_google');
    const user = await getUserById(userRecord.id);

    res.json({
      success: true,
      message: 'Signed in with Google.',
      token,
      user
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google sign-in failed: ' + error.message });
  }
});

// 4. Current user session profile & stats
app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const database = await getDb();
    
    // Aggregate user project stats
    const statsRes = database.exec(`SELECT COUNT(*) as projectCount, COALESCE(SUM(grand_total), 0) as totalValue FROM projects WHERE user_id = '${user.id}' OR user_id = ''`);
    let projectCount = 0;
    let totalPortfolioValue = 0;
    if (statsRes.length > 0 && statsRes[0].values.length > 0) {
      projectCount = Number(statsRes[0].values[0][0] || 0);
      totalPortfolioValue = Number(statsRes[0].values[0][1] || 0);
    }

    res.json({
      success: true,
      user,
      stats: {
        projectCount,
        totalPortfolioValue,
        currency: user.currency || 'NGN',
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve profile: ' + error.message });
  }
});

// 5. Logout current session
app.post('/api/auth/logout', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.sessionToken) {
      await revokeSession(req.sessionToken);
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Logout error: ' + error.message });
  }
});

// 6. Logout all devices
app.post('/api/auth/logout-all', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await revokeAllUserSessions(req.user!.id);
    res.json({ success: true, message: 'Logged out from all devices.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Logout all error: ' + error.message });
  }
});

// 7. Email verification
app.post('/api/auth/verify-email', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
      return;
    }

    const user = await getUserByEmail(email.trim().toLowerCase());
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (user.verification_token && user.verification_token.trim() === code.toString().trim()) {
      const database = await getDb();
      database.run(`UPDATE users SET email_verified = 1, verification_token = '', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [user.id]);
      saveDbToDisk();
      res.json({ success: true, message: 'Email address verified successfully!' });
    } else {
      res.status(400).json({ error: 'Invalid verification code. Please check the code and try again.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Verification error: ' + error.message });
  }
});

// 8. Resend email verification code
app.post('/api/auth/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }
    const user = await getUserByEmail(email.trim().toLowerCase());
    if (!user) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const database = await getDb();
    database.run(`UPDATE users SET verification_token = ? WHERE id = ?`, [newCode, user.id]);
    saveDbToDisk();

    res.json({
      success: true,
      message: 'New verification code generated.',
      verificationCode: newCode
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to resend code: ' + error.message });
  }
});

// 9. Forgot password request
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }
    const user = await getUserByEmail(email.trim().toLowerCase());
    if (!user) {
      // Prevent email enumeration
      res.json({ success: true, message: 'If an account exists, a reset code has been sent.' });
      return;
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    const database = await getDb();
    database.run(`UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?`, [resetCode, expires, user.id]);
    saveDbToDisk();

    res.json({
      success: true,
      message: 'Password reset code generated.',
      resetCode // returned for instant demo testing
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Reset request error: ' + error.message });
  }
});

// 10. Reset password with code
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'Email, reset code, and new password are required.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    const user = await getUserByEmail(email.trim().toLowerCase());
    if (!user || !user.reset_token || user.reset_token.trim() !== code.toString().trim()) {
      res.status(400).json({ error: 'Invalid or expired password reset code.' });
      return;
    }

    const { hash, salt } = hashPassword(newPassword);
    const database = await getDb();
    database.run(
      `UPDATE users SET password_hash = ?, salt = ?, reset_token = '', reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [hash, salt, user.id]
    );
    // Invalidate prior sessions for security
    await revokeAllUserSessions(user.id);
    saveDbToDisk();

    res.json({ success: true, message: 'Password reset successfully. Please sign in with your new password.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Password reset error: ' + error.message });
  }
});

// 11. Update profile
app.put('/api/auth/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      full_name,
      phone,
      profession,
      company,
      job_title,
      country,
      state,
      currency,
      measurement_system,
      avatar_url,
      company_type
    } = req.body;

    const database = await getDb();
    database.run(
      `UPDATE users SET
        full_name = ?, phone = ?, profession = ?, company = ?, job_title = ?,
        country = ?, state = ?, currency = ?, measurement_system = ?,
        avatar_url = ?, company_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        full_name ?? user.full_name,
        phone ?? user.phone,
        profession ?? user.profession,
        company ?? user.company,
        job_title ?? user.job_title,
        country ?? user.country,
        state ?? user.state,
        currency ?? user.currency,
        measurement_system ?? user.measurement_system,
        avatar_url ?? user.avatar_url,
        company_type ?? user.company_type,
        user.id
      ]
    );
    saveDbToDisk();

    const updatedUser = await getUserById(user.id);
    res.json({ success: true, user: updatedUser, message: 'Profile updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Profile update error: ' + error.message });
  }
});

// 12. Change password (authenticated)
app.post('/api/auth/change-password', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    const fullRecord = await getUserByEmail(user.email);
    if (!fullRecord || !verifyPassword(currentPassword, fullRecord.password_hash, fullRecord.salt)) {
      res.status(400).json({ error: 'Incorrect current password.' });
      return;
    }

    const { hash, salt } = hashPassword(newPassword);
    const database = await getDb();
    database.run(`UPDATE users SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [hash, salt, user.id]);
    saveDbToDisk();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Change password error: ' + error.message });
  }
});

// 13. Active sessions list
app.get('/api/auth/sessions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const database = await getDb();
    const resSessions = database.exec(`SELECT token, created_at, expires_at, user_agent, ip_address, last_active FROM sessions WHERE user_id = '${user.id}' ORDER BY last_active DESC`);
    if (resSessions.length === 0) {
      res.json({ success: true, sessions: [] });
      return;
    }
    const cols = resSessions[0].columns;
    const sessions = resSessions[0].values.map(row => {
      const obj: any = {};
      cols.forEach((col, idx) => { obj[col] = row[idx]; });
      obj.isCurrent = obj.token === req.sessionToken;
      return obj;
    });

    res.json({ success: true, sessions });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch sessions: ' + error.message });
  }
});

// 14. Revoke a specific session
app.delete('/api/auth/sessions/:token', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await revokeSession(req.params.token);
    res.json({ success: true, message: 'Session terminated.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Revoke session error: ' + error.message });
  }
});

// 15. Login history
app.get('/api/auth/login-history', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const database = await getDb();
    const resLogs = database.exec(`SELECT * FROM login_history WHERE user_id = '${user.id}' ORDER BY created_at DESC LIMIT 20`);
    if (resLogs.length === 0) {
      res.json({ success: true, history: [] });
      return;
    }
    const cols = resLogs[0].columns;
    const history = resLogs[0].values.map(row => {
      const obj: any = {};
      cols.forEach((col, idx) => { obj[col] = row[idx]; });
      return obj;
    });

    res.json({ success: true, history });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch login history: ' + error.message });
  }
});

// 16. Delete account
app.post('/api/auth/delete-account', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const database = await getDb();
    database.run(`DELETE FROM sessions WHERE user_id = ?`, [user.id]);
    database.run(`DELETE FROM login_history WHERE user_id = ?`, [user.id]);
    database.run(`DELETE FROM user_rates WHERE user_id = ?`, [user.id]);
    database.run(`DELETE FROM users WHERE id = ?`, [user.id]);
    saveDbToDisk();
    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Delete account error: ' + error.message });
  }
});

// ========================================================================
// PHASE 2 & 3: PROJECTS & ESTIMATES MANAGEMENT
// ========================================================================

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

// 1. AI Takeoff Endpoint: Receives file -> sends to Multi-Stage Takeoff Pipeline -> returns BESMM4 JSON items
app.post('/api/takeoff', upload.single('drawing'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No drawing file provided. Please upload a .jpg, .png, or .pdf architectural plan.' });
      return;
    }

    let questionnaire = null;
    if (req.body && req.body.questionnaire) {
      try {
        questionnaire = typeof req.body.questionnaire === 'string'
          ? JSON.parse(req.body.questionnaire)
          : req.body.questionnaire;
      } catch (err) {
        console.warn('Could not parse incoming questionnaire JSON:', err);
      }
    }

    const projectId = req.body?.projectId || req.body?.project_id || 'proj-temp';
    const location = req.body?.location || 'Lagos';
    const state = req.body?.state || 'Lagos';
    const drawingId = req.body?.drawingId || `dwg-${Date.now()}`;

    console.log(`[Takeoff] Received drawing: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB), state: ${state}, mime: ${req.file.mimetype}`);

    const result = await runDrawingTakeoffPipeline({
      fileBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalFilename: req.file.originalname,
      projectId,
      drawingId,
      questionnaire,
      location,
      state
    });

    if (projectId && projectId !== 'proj-temp') {
      try {
        await recordActivity(
          projectId,
          'sys',
          'QS Estimator',
          'Executed AI Takeoff',
          `Generated ${result.items.length} BESMM4 items from ${req.file.originalname} (${result.confidenceScore}% confidence)`
        );
      } catch {}
    }

    res.json({
      success: true,
      filename: req.file.originalname,
      jobId: result.jobId,
      analysisId: result.analysisId,
      drawingHash: result.drawingHash,
      engineUsed: result.engineUsed,
      provider: result.provider,
      confidenceScore: result.confidenceScore,
      drawingSummary: result.summary,
      summary: result.summary,
      sheet: result.sheet,
      evidence: result.evidence,
      missingInformation: result.missingInformation,
      warnings: result.warnings,
      items: result.items,
      detectedConflicts: []
    });
  } catch (error: any) {
    console.error('Takeoff error:', error);
    res.status(500).json({
      error: 'Failed to process drawing with AI Takeoff Pipeline: ' + (error.message || 'Unknown error'),
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

// 3b. Download User Guide & Manual PDF for new users
app.get('/api/guide/pdf', async (req: Request, res: Response) => {
  try {
    const buffer = await generateUserGuidePdfBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Lets_Estimate_2.0_User_Guide.pdf"');
    res.send(buffer);
  } catch (error: any) {
    console.error('User guide PDF export error:', error);
    res.status(500).json({ error: 'Failed to generate User Guide PDF: ' + error.message });
  }
});

// 3c. Direct Project Codebase ZIP Download Endpoint
app.get('/api/download/project-zip', async (req: Request, res: Response) => {
  try {
    const zipPath = path.join(process.cwd(), 'dist', 'lets-estimate-2.0-source.zip');
    
    // Always ensure fresh zip if missing
    if (!fs.existsSync(zipPath)) {
      execSync('python3 scripts/create_zip.py dist/lets-estimate-2.0-source.zip', {
        cwd: process.cwd(),
        timeout: 15000,
      });
    }

    if (!fs.existsSync(zipPath)) {
      res.status(500).json({ error: 'Failed to locate generated ZIP file.' });
      return;
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="Lets-Estimate-2.0-SourceCode.zip"');
    res.sendFile(zipPath);
  } catch (error: any) {
    console.error('Project ZIP download error:', error);
    res.status(500).json({ error: 'Failed to package project ZIP: ' + error.message });
  }
});

// 4. Projects CRUD: List all saved projects from SQLite (with optional search, status filtering, and auth)
app.get('/api/projects', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || (req.query.user_id as string) || undefined;
    const statusFilter = req.query.status as string;
    const searchFilter = req.query.search as string;

    let projects = await getAllProjects(userId);

    if (statusFilter && statusFilter !== 'All') {
      projects = projects.filter(p => p.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      projects = projects.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.location.toLowerCase().includes(q) || 
        (p.client_name && p.client_name.toLowerCase().includes(q))
      );
    }

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
app.post('/api/projects', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const projectData = req.body;
    if (!projectData || !projectData.id || !projectData.title) {
      res.status(400).json({ error: 'Project ID and Title are required.' });
      return;
    }

    if (req.user?.id && !projectData.user_id) {
      projectData.user_id = req.user.id;
    }

    const isNew = !(await getProjectById(projectData.id));
    const saved = await saveProject(projectData);

    const userName = req.user?.full_name || 'QS Estimator';
    const action = isNew ? 'Created Project' : 'Updated Estimate & Rates';
    await recordActivity(saved.id, req.user?.id || 'sys', userName, action, `Grand Total: ₦${saved.grand_total.toLocaleString()}`);

    res.json({ success: true, project: saved });
  } catch (error: any) {
    console.error('Save project error:', error);
    res.status(500).json({ error: 'Failed to save project to SQLite: ' + error.message });
  }
});

// 7. Duplicate project
app.post('/api/projects/:id/duplicate', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    const duplicated = await duplicateProject(req.params.id, title, req.user?.id);
    if (!duplicated) {
      res.status(404).json({ error: 'Source project not found.' });
      return;
    }

    await recordActivity(duplicated.id, req.user?.id || 'sys', req.user?.full_name || 'QS Estimator', 'Duplicated Project', `Cloned from ${req.params.id}`);
    res.json({ success: true, project: duplicated, message: 'Project duplicated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Duplicate error: ' + error.message });
  }
});

// 8. Update project status (Draft, In Progress, Submitted, Approved, Archived)
app.patch('/api/projects/:id/status', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'Status is required.' });
      return;
    }
    await updateProjectStatus(req.params.id, status);
    await recordActivity(req.params.id, req.user?.id || 'sys', req.user?.full_name || 'QS Estimator', `Status Changed to ${status}`);
    res.json({ success: true, message: `Project marked as ${status}.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Status update error: ' + error.message });
  }
});

// 8b. Update project via PUT (status or project data)
app.put('/api/projects/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (status && Object.keys(req.body).length === 1) {
      await updateProjectStatus(req.params.id, status);
      await recordActivity(req.params.id, req.user?.id || 'sys', req.user?.full_name || 'QS Estimator', `Status Changed to ${status}`);
      res.json({ success: true, message: `Project marked as ${status}.` });
      return;
    }
    const projectData = { ...req.body, id: req.params.id };
    if (req.user?.id && !projectData.user_id) {
      projectData.user_id = req.user.id;
    }
    const saved = await saveProject(projectData);
    res.json({ success: true, project: saved });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update project: ' + error.message });
  }
});

// 8c. Rename project endpoint
app.patch('/api/projects/:id/rename', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      res.status(400).json({ error: 'New project title is required.' });
      return;
    }
    const updated = await renameProject(req.params.id, title.trim());
    if (!updated) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    await recordActivity(
      req.params.id, 
      req.user?.id || 'sys', 
      req.user?.full_name || 'QS Estimator', 
      'Renamed Project', 
      `Title updated to: ${title.trim()}`
    );
    res.json({ success: true, project: updated, message: 'Project renamed successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to rename project: ' + error.message });
  }
});

// 9. Get project audit activity trail
app.get('/api/projects/:id/activities', async (req: Request, res: Response) => {
  try {
    const activities = await getProjectActivities(req.params.id);
    res.json({ success: true, activities });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch activities: ' + error.message });
  }
});

// 10. Delete project from SQLite
app.delete('/api/projects/:id', async (req: Request, res: Response) => {
  try {
    await deleteProject(req.params.id);
    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (error: any) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project: ' + error.message });
  }
});

// ========================================================================
// PHASE 2: ESTIMATE VERSION SNAPSHOTS API
// ========================================================================

// 10a. List version snapshots for a project
app.get('/api/projects/:id/versions', async (req: Request, res: Response) => {
  try {
    const versions = await getEstimateVersions(req.params.id);
    res.json({ success: true, versions });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch versions: ' + error.message });
  }
});

// 10b. Create new estimate version snapshot (e.g., "V1 - Pre-Tender Estimate")
app.post('/api/projects/:id/versions', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { version_name, description } = req.body;
    if (!version_name) {
      res.status(400).json({ error: 'Version name is required (e.g. V1 - Initial Draft).' });
      return;
    }
    const created = await createEstimateVersion(
      req.params.id,
      version_name,
      description || '',
      req.user?.id || '',
      req.user?.full_name || 'QS Estimator'
    );
    res.json({ success: true, version: created });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create version snapshot: ' + error.message });
  }
});

// 10c. Restore version snapshot back into active project
app.post('/api/projects/:id/versions/:versionId/restore', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const restoredProject = await restoreEstimateVersion(
      req.params.id,
      req.params.versionId,
      req.user?.id || '',
      req.user?.full_name || 'QS Estimator'
    );
    res.json({ success: true, project: restoredProject, message: 'Version restored successfully!' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to restore version: ' + error.message });
  }
});

// 10d. Delete version snapshot
app.delete('/api/projects/:id/versions/:versionId', async (req: Request, res: Response) => {
  try {
    await deleteEstimateVersion(req.params.versionId);
    res.json({ success: true, message: 'Version deleted.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete version: ' + error.message });
  }
});

// ========================================================================
// PHASE 3: PROJECT VARIATIONS (ADDITIONS & OMISSIONS) API
// ========================================================================

// 10e. List variations for a project
app.get('/api/projects/:id/variations', async (req: Request, res: Response) => {
  try {
    const variations = await getProjectVariations(req.params.id);
    res.json({ success: true, variations });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch variations: ' + error.message });
  }
});

// 10f. Create a new variation order
app.post('/api/projects/:id/variations', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { variation_number, description, reason, section, quantity, unit, rate, type, status } = req.body;
    if (!description) {
      res.status(400).json({ error: 'Variation description is required.' });
      return;
    }
    const created = await createProjectVariation(
      {
        project_id: req.params.id,
        variation_number: variation_number || `VO-${Date.now().toString().slice(-4)}`,
        description,
        reason,
        section,
        quantity: Number(quantity || 1),
        unit: unit || 'm2',
        rate: Number(rate || 0),
        type: type || 'addition',
        status: status || 'Draft'
      },
      req.user?.id || '',
      req.user?.full_name || 'QS Estimator'
    );
    res.json({ success: true, variation: created });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create variation: ' + error.message });
  }
});

// 10g. Update variation status or fields
app.put('/api/projects/:id/variations/:varId', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    await updateProjectVariation(
      req.params.varId,
      req.body,
      req.user?.id || '',
      req.user?.full_name || 'QS Estimator'
    );
    res.json({ success: true, message: 'Variation updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update variation: ' + error.message });
  }
});

// 10h. Delete variation
app.delete('/api/projects/:id/variations/:varId', async (req: Request, res: Response) => {
  try {
    await deleteProjectVariation(req.params.varId);
    res.json({ success: true, message: 'Variation deleted.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete variation: ' + error.message });
  }
});

// ========================================================================
// PHASE 3: INTERIM VALUATIONS & PAYMENT CERTIFICATES API
// ========================================================================

// 10i. List valuations for a project
app.get('/api/projects/:id/valuations', async (req: Request, res: Response) => {
  try {
    const valuations = await getProjectValuations(req.params.id);
    res.json({ success: true, valuations });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch valuations: ' + error.message });
  }
});

// 10j. Create interim valuation
app.post('/api/projects/:id/valuations', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { valuation_number, valuation_date, description, previous_valuation, current_valuation, retention_percent, advance_payment_deduction, previous_payments, status } = req.body;
    if (current_valuation === undefined) {
      res.status(400).json({ error: 'Current valuation amount is required.' });
      return;
    }
    const created = await createProjectValuation(
      {
        project_id: req.params.id,
        valuation_number: valuation_number || `IPC-${Date.now().toString().slice(-3)}`,
        valuation_date,
        description,
        previous_valuation: Number(previous_valuation || 0),
        current_valuation: Number(current_valuation || 0),
        retention_percent: retention_percent !== undefined ? Number(retention_percent) : 5.0,
        advance_payment_deduction: Number(advance_payment_deduction || 0),
        previous_payments: Number(previous_payments || 0),
        status: status || 'Draft'
      },
      req.user?.id || '',
      req.user?.full_name || 'QS Estimator'
    );
    res.json({ success: true, valuation: created });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create interim valuation: ' + error.message });
  }
});

// 10k. Update interim valuation
app.put('/api/projects/:id/valuations/:valId', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    await updateProjectValuation(
      req.params.valId,
      req.body,
      req.user?.id || '',
      req.user?.full_name || 'QS Estimator'
    );
    res.json({ success: true, message: 'Interim valuation updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update valuation: ' + error.message });
  }
});

// 10l. Delete interim valuation
app.delete('/api/projects/:id/valuations/:valId', async (req: Request, res: Response) => {
  try {
    await deleteProjectValuation(req.params.valId);
    res.json({ success: true, message: 'Valuation deleted.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete valuation: ' + error.message });
  }
});

// ========================================================================
// PHASE 4: RATE LIBRARY & COST BENCHMARK API
// ========================================================================

// 11. Full Categorized Nigerian Construction Rate Library
app.get('/api/rates/library', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  const category = (req.query.category as string) || '';
  const location = (req.query.location as string) || 'lagos';

  const rates = getRateLibrary(query, category, location);
  res.json({ success: true, count: rates.length, rates });
});

// 12. User Custom Rate Library
app.get('/api/rates/my', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'guest-user';
    const customRates = await getUserCustomRates(userId);
    res.json({ success: true, rates: customRates });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch custom rates: ' + error.message });
  }
});

// 13. Create User Custom Rate
app.post('/api/rates/my', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'guest-user';
    const { category, item, description, unit, rate, lagosRate, abujaRate, portHarcourtRate, northernRate, location } = req.body;
    if (!category || !item || !unit || (rate === undefined && lagosRate === undefined)) {
      res.status(400).json({ error: 'Category, item, unit, and rate are required.' });
      return;
    }
    const lRate = Number(lagosRate !== undefined ? lagosRate : (rate || 0));
    const aRate = Number(abujaRate !== undefined && Number(abujaRate) > 0 ? abujaRate : Math.round(lRate * 1.05));
    const phRate = Number(portHarcourtRate !== undefined && Number(portHarcourtRate) > 0 ? portHarcourtRate : Math.round(lRate * 1.09));
    const nRate = Number(northernRate !== undefined && Number(northernRate) > 0 ? northernRate : Math.round(lRate * 0.96));

    const created = await saveUserCustomRate({
      userId,
      category,
      item,
      description: description || '',
      unit,
      rate: lRate,
      lagosRate: lRate,
      abujaRate: aRate,
      portHarcourtRate: phRate,
      northernRate: nRate,
      location: location || 'Nigeria'
    });
    res.status(201).json({ success: true, rate: created });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save rate: ' + error.message });
  }
});

// 13b. Update User Custom Rate
app.put('/api/rates/my/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await updateUserCustomRate(req.params.id, req.body);
    res.json({ success: true, rate: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update custom rate: ' + error.message });
  }
});

// 14. Delete User Custom Rate
app.delete('/api/rates/my/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'guest-user';
    await deleteUserCustomRate(req.params.id, userId);
    res.json({ success: true, message: 'Custom rate deleted.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete custom rate: ' + error.message });
  }
});

// 14b. Unit Rate Build-up & Cost Analysis Engine (Phase 4)
app.post('/api/rates/analyze', (req: Request, res: Response) => {
  try {
    const {
      materialCost = 0,
      materialWastePercent = 5,
      labourDailyGangWage = 19000,
      dailyGangOutput = 15,
      plantCostPerUnit = 0,
      overheadProfitPercent = 15
    } = req.body;

    const netMaterial = Number(materialCost) * (1 + Number(materialWastePercent) / 100);
    const labourUnit = Number(dailyGangOutput) > 0 ? Number(labourDailyGangWage) / Number(dailyGangOutput) : 0;
    const plantUnit = Number(plantCostPerUnit);
    const primeCost = netMaterial + labourUnit + plantUnit;
    const overheadProfitAmount = primeCost * (Number(overheadProfitPercent) / 100);
    const compositeUnitRate = Math.round(primeCost + overheadProfitAmount);

    res.json({
      success: true,
      result: {
        netMaterialCost: Math.round(netMaterial),
        labourUnitCost: Math.round(labourUnit),
        plantUnitCost: Math.round(plantUnit),
        primeCost: Math.round(primeCost),
        overheadProfitAmount: Math.round(overheadProfitAmount),
        compositeUnitRate
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to calculate rate analysis: ' + error.message });
  }
});

// 14c. Import project items to user custom rates (Phase 4)
app.post('/api/rates/import-from-boq', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'guest';
    const { items, location = 'Lagos, Nigeria' } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'No items provided for import.' });
      return;
    }

    const count = await importBoqItemsToUserRates(userId, items.map((it: any) => ({
      ...it,
      location
    })));

    res.json({ success: true, count, message: `Successfully imported ${count} items into My Rates.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to import rates from BOQ: ' + error.message });
  }
});

// ========================================================================
// PHASE 5: MATERIAL PROCUREMENT & SITE BUDGET API
// ========================================================================

// 14d. Calculate material procurement requirements from project BOQ
app.get('/api/projects/:id/materials', async (req: Request, res: Response) => {
  try {
    const project = await getProjectById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const summary = calculateMaterialRequirements(project.items || []);
    res.json({
      success: true,
      projectId: project.id,
      projectTitle: project.title,
      summary
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to calculate material schedule: ' + error.message });
  }
});

// 14d-1. Get all suppliers
app.get('/api/suppliers', async (req: Request, res: Response) => {
  try {
    const suppliers = await getAllSuppliers();
    res.json({ success: true, suppliers });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch suppliers: ' + error.message });
  }
});

// 14d-2. Add a new supplier
app.post('/api/suppliers', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, category } = req.body;
    if (!name || !category) {
      res.status(400).json({ error: 'Supplier name and category are required.' });
      return;
    }
    const created = await createSupplier(req.body);
    res.status(201).json({ success: true, supplier: created });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create supplier: ' + error.message });
  }
});

// 14d-3. Delete a supplier
app.delete('/api/suppliers/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    await deleteSupplier(req.params.id);
    res.json({ success: true, message: 'Supplier deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete supplier: ' + error.message });
  }
});

// 14d-4. Get all library rates (Materials, Plants, Labour, Preliminaries)
app.get('/api/rates', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    const category = req.query.category as string | undefined;
    const rates = await getAllLibraryRates(type, category);
    res.json({ success: true, rates });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch library rates: ' + error.message });
  }
});

// 14d-5. Save/create an individual library rate (Small Scale)
app.post('/api/rates', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { item, unit } = req.body;
    if (!item || !unit) {
      res.status(400).json({ error: 'Rate item name and unit of measurement are required.' });
      return;
    }
    const saved = await saveLibraryRate(req.body, req.user?.id || 'system');
    res.status(201).json({ success: true, rate: saved });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save rate: ' + error.message });
  }
});

// 14d-6. Update an individual library rate (Small Scale)
app.put('/api/rates/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const rateId = req.params.id;
    if (rateId.startsWith('urate-')) {
      await updateUserCustomRate(rateId, req.body);
    }
    const saved = await saveLibraryRate({ ...req.body, id: rateId }, req.user?.id || 'system');
    res.json({ success: true, rate: saved });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update rate: ' + error.message });
  }
});

// 14d-7. Delete an individual library rate
app.delete('/api/rates/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    await deleteLibraryRate(req.params.id);
    res.json({ success: true, message: 'Rate deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete rate: ' + error.message });
  }
});

// 14d-8. Bulk import library rates manually (Large Scale Import - saved individually)
app.post('/api/rates/bulk-import', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { rates } = req.body;
    if (!Array.isArray(rates) || rates.length === 0) {
      res.status(400).json({ error: 'Rates array is required for bulk import.' });
      return;
    }
    const result = await bulkImportLibraryRates(rates, req.user?.id || 'system');
    res.json({ success: true, ...result, message: `Successfully imported and saved ${result.saved} rates individually.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to bulk import rates: ' + error.message });
  }
});

// 14d-9. Bulk adjust rates by percentage (Large Scale Adjustment)
app.post('/api/rates/bulk-adjust', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { percentChange, type, category } = req.body;
    if (typeof percentChange !== 'number' || isNaN(percentChange)) {
      res.status(400).json({ error: 'Valid percentChange number is required.' });
      return;
    }
    const result = await bulkAdjustLibraryRates(percentChange, type, category);
    res.json({ success: true, ...result, message: `Adjusted ${result.count} rates by ${percentChange > 0 ? '+' : ''}${percentChange}%.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to bulk adjust rates: ' + error.message });
  }
});

// 14d-10. Get national Nigerian building material market index & price variances
app.get('/api/materials/market-index', async (req: Request, res: Response) => {
  try {
    const allRates = await getAllLibraryRates();
    if (allRates && allRates.length > 0) {
      const items = allRates.map(r => ({
        id: r.id,
        name: r.item,
        category: r.category,
        specification: r.specification || '',
        unit: r.unit,
        lagosRate: r.lagosRate,
        abujaRate: r.abujaRate,
        portHarcourtRate: r.portHarcourtRate,
        northernRate: r.northernRate,
        trend: r.trend,
        trendPercent: r.trendPercent,
        lastUpdated: r.lastUpdated,
        keySuppliers: r.keySuppliers || []
      }));
      res.json({
        success: true,
        benchmarkDate: new Date().toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }),
        items
      });
      return;
    }
  } catch (e) {
    console.warn('Could not query library_rates for market-index, using fallback:', e);
  }
  const marketIndex = [
    {
      id: 'mat-cement-01',
      name: 'Grade 42.5R Ordinary Portland Cement (50kg bag)',
      category: 'Cement & Aggregates',
      specification: 'High early strength CEM I / 42.5R (Dangote / BUA / Lafarge Supaset)',
      unit: 'Bag',
      lagosRate: 9500,
      abujaRate: 9800,
      portHarcourtRate: 9300,
      northernRate: 9200,
      trend: 'up',
      trendPercent: 2.1,
      lastUpdated: 'Current Week Benchmark',
      keySuppliers: ['Dangote Cement Depot', 'BUA Cement Depot', 'Lafarge Retail']
    },
    {
      id: 'mat-sand-02',
      name: 'Clean Sharp River Sand (Concrete Aggregate)',
      category: 'Cement & Aggregates',
      specification: 'Clean coarse riverbed sand, free of silt and organic clay minerals',
      unit: 'Tonne',
      lagosRate: 6500,
      abujaRate: 7200,
      portHarcourtRate: 8500,
      northernRate: 5500,
      trend: 'stable',
      trendPercent: 0.0,
      lastUpdated: 'Current Week Benchmark',
      keySuppliers: ['Epe Dredging Depot', 'Mpape River Sand', 'Choba Dredgers PH']
    },
    {
      id: 'mat-granite-03',
      name: 'Crushed Blue Granite 20mm (3/4" Aggregates)',
      category: 'Cement & Aggregates',
      specification: 'Machine-crushed angular igneous granite aggregate for structural concrete',
      unit: 'Tonne',
      lagosRate: 11500,
      abujaRate: 12000,
      portHarcourtRate: 14500,
      northernRate: 9800,
      trend: 'up',
      trendPercent: 1.5,
      lastUpdated: 'Current Week Benchmark',
      keySuppliers: ['Royal Quarries Abeokuta', 'Julius Berger Quarry Abuja', 'Akamkpa Quarries Calabar']
    },
    {
      id: 'mat-rebar-04',
      name: 'High-Yield TMT Steel Rebars Y12 (12m Length)',
      category: 'Steel & Rebar',
      specification: 'Thermo-Mechanically Treated ribbed deformed rebar fy >= 460 N/mm²',
      unit: 'Tonne',
      lagosRate: 1430000,
      abujaRate: 1480000,
      portHarcourtRate: 1520000,
      northernRate: 1490000,
      trend: 'down',
      trendPercent: 1.8,
      lastUpdated: 'Current Week Benchmark',
      keySuppliers: ['Pulkit Steel Mills', 'African Foundries', 'Tiger TMT']
    },
    {
      id: 'mat-rebar-05',
      name: 'High-Yield TMT Steel Rebars Y16 (12m Length)',
      category: 'Steel & Rebar',
      specification: 'Standard structural beam and column rebar fy >= 460 N/mm²',
      unit: 'Tonne',
      lagosRate: 1420000,
      abujaRate: 1470000,
      portHarcourtRate: 1510000,
      northernRate: 1480000,
      trend: 'down',
      trendPercent: 1.5,
      lastUpdated: 'Current Week Benchmark',
      keySuppliers: ['Pulkit Steel Mills', 'African Foundries', 'Kam Steel']
    },
    {
      id: 'mat-block-06',
      name: '9-inch (225mm) Machine-Vibrated Sandcrete Hollow Block',
      category: 'Blocks & Masonry',
      specification: 'Loadbearing vibrated cured block, mix ratio 1:6 cement to sharp sand',
      unit: 'Unit',
      lagosRate: 550,
      abujaRate: 600,
      portHarcourtRate: 650,
      northernRate: 520,
      trend: 'stable',
      trendPercent: 0.0,
      lastUpdated: 'Current Week Benchmark',
      keySuppliers: ['Vibro-Cast Blocks', 'Crown Block Industries', 'Lekki Master Blocks']
    },
    {
      id: 'mat-block-07',
      name: '6-inch (150mm) Machine-Vibrated Sandcrete Hollow Block',
      category: 'Blocks & Masonry',
      specification: 'Partition wall vibrated cured block, mix ratio 1:6 cement to sharp sand',
      unit: 'Unit',
      lagosRate: 450,
      abujaRate: 480,
      portHarcourtRate: 520,
      northernRate: 420,
      trend: 'stable',
      trendPercent: 0.0,
      lastUpdated: 'Current Week Benchmark',
      keySuppliers: ['Vibro-Cast Blocks', 'Crown Block Industries', 'Lekki Master Blocks']
    },
    {
      id: 'mat-roof-08',
      name: '0.55mm Thickness Aluminium Longspan Roofing Sheet',
      category: 'Roofing & Cladding',
      specification: 'Oven-baked colour-coated aluminium alloy coil with chromate conversion',
      unit: 'm2',
      lagosRate: 7500,
      abujaRate: 7900,
      portHarcourtRate: 8200,
      northernRate: 7600,
      trend: 'up',
      trendPercent: 3.0,
      lastUpdated: 'Current Week Benchmark',
      keySuppliers: ['Topfeathers Aluminium', 'Tower Aluminium', 'First Aluminium']
    },
    {
      id: 'mat-timber-09',
      name: 'Hardwood Timber 2" x 4" x 12ft (Rafters & Ceiling)',
      category: 'Timber & Formwork',
      specification: 'Air-seasoned Nigerian semi-hardwood (Obeche/Afara/Mahogany), straight grain',
      unit: 'Piece',
      lagosRate: 2450,
      abujaRate: 2700,
      portHarcourtRate: 2900,
      northernRate: 2550,
      trend: 'up',
      trendPercent: 1.2,
      lastUpdated: 'Current Week Benchmark',
      keySuppliers: ['Mambilla Timber Depot', 'Oko-Baba Sawmillers', 'Dugbe Timber Market']
    },
    {
      id: 'mat-plywood-10',
      name: '1" x 12" x 12ft Black Marine Plywood Board (Formwork Film-Faced)',
      category: 'Timber & Formwork',
      specification: 'Phenolic resin film-faced WBP waterproof plywood for smooth fair-face concrete',
      unit: 'Sheet',
      lagosRate: 18500,
      abujaRate: 19500,
      portHarcourtRate: 20500,
      northernRate: 19000,
      trend: 'stable',
      trendPercent: 0.0,
      lastUpdated: 'Current Week Benchmark',
      keySuppliers: ['Mambilla Timber Depot', 'Timber World Lagos', 'PH Marine Ply']
    }
  ];

  res.json({
    success: true,
    benchmarkDate: new Date().toISOString().split('T')[0],
    source: "Let's Estimate Nigerian Construction Market Intelligence (NIQS Compliant)",
    currency: 'NGN (₦)',
    items: marketIndex
  });
});

// ========================================================================
// PHASE 6: PROJECT DOCUMENTS & MULTI-DRAWINGS API
// ========================================================================

// 14e. Get Project Documents
app.get('/api/projects/:id/documents', async (req: Request, res: Response) => {
  try {
    const docs = await getProjectDocuments(req.params.id);
    res.json({ success: true, documents: docs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch documents: ' + error.message });
  }
});

// 14f. Add Project Document
app.post('/api/projects/:id/documents', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, fileName, fileSize = 0, fileType = 'application/pdf', filePath = '' } = req.body;
    if (!title || !fileName) {
      res.status(400).json({ error: 'Title and file name are required.' });
      return;
    }

    const doc = await createProjectDocument({
      projectId: req.params.id,
      userId: req.user?.id,
      userName: req.user?.full_name || 'QS Estimator',
      title,
      category: category || 'Architectural',
      fileName,
      fileSize: Number(fileSize),
      fileType,
      filePath
    });

    res.status(201).json({ success: true, document: doc });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create document: ' + error.message });
  }
});

// 14g. Delete Project Document
app.delete('/api/projects/:id/documents/:docId', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    await deleteProjectDocument(req.params.docId, req.user?.id, req.user?.full_name || 'QS Estimator');
    res.json({ success: true, message: 'Document removed.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete document: ' + error.message });
  }
});

// ========================================================================
// PHASE 6: PROJECT COLLABORATORS & CLIENT TENDER SHARING API
// ========================================================================

// 14h. Get Collaborators
app.get('/api/projects/:id/collaborators', async (req: Request, res: Response) => {
  try {
    const collabs = await getProjectCollaborators(req.params.id);
    res.json({ success: true, collaborators: collabs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch collaborators: ' + error.message });
  }
});

// 14i. Add Collaborator
app.post('/api/projects/:id/collaborators', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { email, role = 'Reviewer' } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Valid collaborator email is required.' });
      return;
    }

    const collab = await addProjectCollaborator(
      req.params.id,
      email,
      role,
      req.user?.id,
      req.user?.full_name || 'QS Lead'
    );

    res.status(201).json({ success: true, collaborator: collab });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add collaborator: ' + error.message });
  }
});

// 14j. Remove Collaborator
app.delete('/api/projects/:id/collaborators/:collabId', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { userEmail = '' } = req.query;
    await removeProjectCollaborator(
      req.params.collabId,
      req.params.id,
      String(userEmail),
      req.user?.id,
      req.user?.full_name || 'QS Lead'
    );
    res.json({ success: true, message: 'Collaborator removed.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to remove collaborator: ' + error.message });
  }
});

// 14k. Get Project Share Link
app.get('/api/projects/:id/share', async (req: Request, res: Response) => {
  try {
    const share = await getProjectShare(req.params.id);
    res.json({ success: true, share });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch share info: ' + error.message });
  }
});

// 14l. Create or Update Project Share Link
app.post('/api/projects/:id/share', async (req: Request, res: Response) => {
  try {
    const { accessLevel = 'viewer', passcode = '', isActive = true } = req.body;
    const share = await saveProjectShare(req.params.id, accessLevel, passcode, isActive);
    res.json({ success: true, share });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save share configuration: ' + error.message });
  }
});

// 14m. Public Shared Tender View
app.get('/api/share/:token', async (req: Request, res: Response) => {
  try {
    const project = await getProjectByShareToken(req.params.token);
    if (!project) {
      res.status(404).json({ error: 'Shared project not found or share link is deactivated.' });
      return;
    }

    res.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        project_type: project.project_type,
        client_name: project.client_name,
        location: project.location,
        state: project.state,
        gfa: project.gfa,
        status: project.status,
        subtotal: project.subtotal,
        po_percent: project.po_percent,
        po_amount: project.po_amount,
        vat_percent: project.vat_percent,
        vat_amount: project.vat_amount,
        swamp_premium_percent: project.swamp_premium_percent,
        grand_total: project.grand_total,
        items: project.items || []
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load shared project: ' + error.message });
  }
});

// ========================================================================
// PHASE 5: AI ESTIMATING & AUDITING API
// ========================================================================

// 15. Describe Project Estimate (Natural Language -> BOQ)
app.post('/api/ai/describe-estimate', async (req: Request, res: Response) => {
  try {
    const { description, location = 'Lagos, Nigeria' } = req.body;
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      res.status(400).json({ error: 'Please provide a clear description of the building project (at least 10 characters).' });
      return;
    }

    const result = await estimateFromDescription(description, location);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('AI Describe Estimate error:', error);
    res.status(500).json({ error: 'Failed to generate estimate: ' + error.message });
  }
});

// 16. Audit / Analyze BOQ items
app.post('/api/ai/analyze-boq', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Please provide BOQ items to audit.' });
      return;
    }

    const audit = await analyzeBoqItems(items);
    res.json({ success: true, audit });
  } catch (error: any) {
    console.error('AI BOQ Audit error:', error);
    res.status(500).json({ error: 'Failed to audit BOQ: ' + error.message });
  }
});

// Backward compatibility with legacy rates endpoint
app.get('/api/rates/standard', (_req: Request, res: Response) => {
  const library = getRateLibrary();
  res.json({ success: true, rates: library });
});

// ========================================================================
// PHASE 7: PROJECT CASH FLOW & S-CURVE FORECAST API
// ========================================================================

// 17a. Get project cash flow forecast and milestone schedule
app.get('/api/projects/:id/cashflow', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const duration = Number(req.query.durationMonths || 12);
    const forecast = await getCashFlowForecast(projectId, duration);
    res.json({ success: true, forecast });
  } catch (error: any) {
    console.error('Get cash flow forecast error:', error);
    res.status(500).json({ error: 'Failed to retrieve cash flow forecast: ' + error.message });
  }
});

// 17b. Regenerate/re-balance default cash flow schedule
app.post('/api/projects/:id/cashflow/generate', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const duration = Number(req.body.durationMonths || 12);
    const milestones = await generateDefaultCashFlow(projectId, duration);
    const forecast = await getCashFlowForecast(projectId, duration);
    res.json({ success: true, milestones, forecast });
  } catch (error: any) {
    console.error('Generate cash flow error:', error);
    res.status(500).json({ error: 'Failed to generate cash flow: ' + error.message });
  }
});

// 17c. Update single milestone
app.put('/api/projects/:id/cashflow/milestones/:milestoneId', async (req: Request, res: Response) => {
  try {
    const { milestoneId } = req.params;
    const success = await updateCashFlowMilestone(milestoneId, req.body);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update milestone: ' + error.message });
  }
});

// 17d. Add custom milestone
app.post('/api/projects/:id/cashflow/milestones', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const milestone = await addCashFlowMilestone({ ...req.body, project_id: projectId });
    res.json({ success: true, milestone });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add milestone: ' + error.message });
  }
});

// 17e. Delete milestone
app.delete('/api/projects/:id/cashflow/milestones/:milestoneId', async (req: Request, res: Response) => {
  try {
    const { milestoneId } = req.params;
    const success = await deleteCashFlowMilestone(milestoneId);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete milestone: ' + error.message });
  }
});

// ========================================================================
// PHASE 8: SUBCONTRACTOR TENDER COMPARISON & BID MATRIX API
// ========================================================================

// 18a. Get tender bidders and item comparison for a project
app.get('/api/projects/:id/tenders', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = await getProjectById(projectId);
    const bidders = await getTenderBidders(projectId);
    
    // Calculate comparative metrics
    const benchmarkTotal = project ? (project.subtotal || 1) : 1;
    const bidSums = bidders.map(b => Number(b.total_bid_amount || 0)).filter(s => s > 0);
    const averageBidSum = bidSums.length > 0 ? Math.round(bidSums.reduce((a, b) => a + b, 0) / bidSums.length) : benchmarkTotal;
    const highestBidSum = bidSums.length > 0 ? Math.max(...bidSums) : benchmarkTotal;
    const lowestBidSum = bidSums.length > 0 ? Math.min(...bidSums) : benchmarkTotal;

    // Lowest responsive bidder
    const compliant = bidders.filter(b => b.compliance_status === 'Compliant');
    const lowestResponsive = compliant.sort((a, b) => Number(a.total_bid_amount) - Number(b.total_bid_amount))[0];

    res.json({
      success: true,
      summary: {
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
      }
    });
  } catch (error: any) {
    console.error('Get tenders error:', error);
    res.status(500).json({ error: 'Failed to load tender bidders: ' + error.message });
  }
});

// 18b. Add new subcontractor bidder
app.post('/api/projects/:id/tenders/bidders', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const bidder = await createTenderBidder(projectId, req.body);
    res.json({ success: true, bidder });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create bidder: ' + error.message });
  }
});

// 18c. Update subcontractor bidder
app.put('/api/projects/:id/tenders/bidders/:bidderId', async (req: Request, res: Response) => {
  try {
    const { bidderId } = req.params;
    const success = await updateTenderBidder(bidderId, req.body);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update bidder: ' + error.message });
  }
});

// 18d. Delete subcontractor bidder
app.delete('/api/projects/:id/tenders/bidders/:bidderId', async (req: Request, res: Response) => {
  try {
    const { bidderId } = req.params;
    const success = await deleteTenderBidder(bidderId);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete bidder: ' + error.message });
  }
});

// 18e. Auto-populate realistic sample Nigerian subcontractors from active BOQ
app.post('/api/projects/:id/tenders/auto-populate', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const bidders = await autoPopulateBiddersFromBoq(projectId);
    res.json({ success: true, bidders });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to auto-populate bidders: ' + error.message });
  }
});

// ========================================================================
// PHASE 9: INFLATION FLUCTUATION & AI VALUE ENGINEERING API
// ========================================================================

// 19a. Get price adjustment fluctuation settings
app.get('/api/projects/:id/fluctuation', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const fluctuation = await getProjectFluctuation(projectId);
    res.json({ success: true, fluctuation });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get fluctuation record: ' + error.message });
  }
});

// 19b. Save/recalculate price adjustment fluctuation
app.post('/api/projects/:id/fluctuation', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const fluctuation = await saveProjectFluctuation(projectId, req.body);
    res.json({ success: true, fluctuation });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save fluctuation: ' + error.message });
  }
});

// 19c. AI Value Engineering and Cost Risk Audit
app.post('/api/ai/value-engineering', async (req: Request, res: Response) => {
  try {
    const { projectTitle = 'Building Project', location = 'Lagos, Nigeria', grandTotal = 100000000, items = [] } = req.body;
    const audit = await auditValueEngineeringAndRisks(projectTitle, location, Number(grandTotal), items);
    res.json({ success: true, audit });
  } catch (error: any) {
    console.error('AI Value Engineering error:', error);
    res.status(500).json({ error: 'Failed to generate value engineering audit: ' + error.message });
  }
});

// ========================================================================
// PHASE 10: BANK TRANSFER BILLING, 7-DAY TRIAL & SUBSCRIPTION ROUTES
// ========================================================================

// 20a. Get Current Subscription & Trial Status
app.get('/api/subscription/status', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'usr-lead-qs-01';
    const status = await getUserSubscriptionInfo(userId);
    res.json({
      success: true,
      subscription: status,
      bankDetails: {
        bankName: 'Access Bank',
        accountNumber: '081515121',
        accountName: 'Isaac Emmanuel'
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve subscription status: ' + error.message });
  }
});

// 20b. Get Subscription & License Packages
app.get('/api/subscription/plans', (_req: Request, res: Response) => {
  res.json({
    success: true,
    bankDetails: {
      bankName: 'Access Bank',
      accountNumber: '081515121',
      accountName: 'Isaac Emmanuel',
      transferInstructions: 'Make a direct bank transfer or USSD (*901# or your bank) to Isaac Emmanuel at Access Bank (081515121). Once transfer is made, submit the transaction reference below.'
    },
    plans: [
      {
        id: 'per_boq',
        name: 'Single BOQ Generation Pass',
        priceNaira: 3000,
        billingInterval: 'single',
        description: 'One-off full AI Vision takeoff & Bill of Quantities generation with unlimited Excel/PDF exports for one project.',
        features: [
          '1 Full AI Drawing Takeoff & BOQ Generation',
          'Access to NIQS Master Rate Library',
          'Material Schedule & Haulage Estimate',
          'Cash Flow & S-Curve Schedule',
          'Professional Excel & PDF Exports'
        ]
      },
      {
        id: 'monthly',
        name: 'Professional Monthly',
        priceNaira: 50000,
        billingInterval: 'month',
        popular: true,
        description: 'Full unlimited access for practicing Quantity Surveyors, civil engineers, and builders.',
        features: [
          'Unlimited AI BOQ Generation for 30 Days',
          'Unlimited Interim Payment Certificates (IPC)',
          'Tender Comparison Matrix & Bidder Scoring',
          'FIDIC 70 Inflation Fluctuation Simulator',
          'Full NIQS Final Account Closeout Module',
          'Priority WhatsApp QS Support by Isaac Emmanuel'
        ]
      },
      {
        id: 'yearly',
        name: 'Corporate Annual Plan',
        priceNaira: 400000,
        billingInterval: 'year',
        description: 'Complete cost engineering suite for consulting QS firms, contractors, and developers. Save ₦200,000 yearly.',
        features: [
          'Everything in Professional Monthly for 365 Days',
          'Unlimited Team Projects & Cloud Collaboration',
          'Custom Firm Watermark & NIQS Stamp Digital Seal',
          'Executive Audit Dossier & Master Report Pack',
          'Dedicated Cost Engineering Consultation',
          'Save ₦200,000 compared to monthly billing'
        ]
      },
      {
        id: 'lifetime_license',
        name: 'Enterprise One-Time License',
        priceNaira: 2000000,
        billingInterval: 'lifetime',
        description: 'Permanent perpetual license for construction firms, state ministries, and commercial developers. No recurring fees.',
        features: [
          'Lifetime Unlimited Access to All Features',
          'Zero Recurring Monthly or Annual Renewals',
          'Includes All Future Upgrades & AI Models',
          'Permanent Verified QS License Key Issued',
          'Multi-user Enterprise Deployment Support',
          'Direct Access to Principal QS Isaac Emmanuel'
        ]
      }
    ]
  });
});

// 20c. Submit Bank Transfer Proof
app.post('/api/subscription/bank-transfer', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      plan_id,
      plan_name,
      amount_naira,
      transfer_reference,
      sender_name,
      sender_bank,
      transfer_date,
      notes = '',
      autoApprove = false
    } = req.body;

    if (!transfer_reference || !sender_name || !amount_naira || !plan_id) {
      res.status(400).json({ error: 'Transfer reference, sender name, plan, and amount are required.' });
      return;
    }

    const userId = req.user?.id || 'usr-lead-qs-01';
    const userEmail = req.user?.email || 'emmanuelisaac888@gmail.com';
    const userName = req.user?.full_name || 'Emmanuel Isaac';

    const tx = await createPaymentTransfer({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      plan_id,
      plan_name: plan_name || 'Subscription Plan',
      amount_naira: Number(amount_naira),
      transfer_reference,
      sender_name,
      sender_bank: sender_bank || 'Nigerian Commercial Bank',
      transfer_date,
      notes,
      autoApprove: Boolean(autoApprove)
    });

    res.json({
      success: true,
      message: autoApprove 
        ? 'Payment verified and subscription activated successfully!' 
        : 'Payment transfer submitted. Isaac Emmanuel will verify and activate your account shortly.',
      transfer: tx
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit bank transfer: ' + error.message });
  }
});

// 20d. Get Payment History
app.get('/api/subscription/transfers', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const transfers = await getPaymentTransfers(userId);
    res.json({ success: true, transfers });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get transfers: ' + error.message });
  }
});

// 20e. Verify / Approve Transfer (Admin / Test Verification)
app.post('/api/subscription/transfers/:id/verify', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { status = 'approved', notes = '' } = req.body;
    const verifiedBy = req.user?.full_name || 'Isaac Emmanuel, Lead QS';
    const tx = await verifyPaymentTransfer(req.params.id, status, verifiedBy, notes);
    if (!tx) {
      res.status(404).json({ error: 'Transfer not found.' });
      return;
    }
    res.json({ success: true, transfer: tx });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to verify transfer: ' + error.message });
  }
});

// ========================================================================
// PHASE 11: FINAL ACCOUNT & CONTRACT CLOSEOUT STATEMENT (NIQS STANDARD)
// ========================================================================

// 21a. Get Project Final Account
app.get('/api/projects/:id/final-account', async (req: Request, res: Response) => {
  try {
    const finalAccount = await getProjectFinalAccount(req.params.id);
    res.json({ success: true, finalAccount });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve final account: ' + error.message });
  }
});

// 21b. Save/Update Final Account
app.post('/api/projects/:id/final-account', optionalAuth, async (req: Request, res: Response) => {
  try {
    const finalAccount = await saveProjectFinalAccount(req.params.id, req.body);
    res.json({ success: true, finalAccount });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save final account: ' + error.message });
  }
});

// 21c. Recalculate Final Account
app.post('/api/projects/:id/final-account/recalculate', async (req: Request, res: Response) => {
  try {
    const recalculated = await autoCalculateFinalAccount(req.params.id);
    res.json({ success: true, finalAccount: recalculated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to recalculate final account: ' + error.message });
  }
});

// ========================================================================
// PHASE 12: EXECUTIVE QS PROJECT DOSSIER & MASTER AUDIT PACK
// ========================================================================

// 22a. Compile & Retrieve Master Dossier
app.get('/api/projects/:id/dossier', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const dossier = await compileExecutiveProjectDossier(req.params.id, req.user);
    res.json({ success: true, dossier });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to compile project dossier: ' + error.message });
  }
});

// API 404 Catch-all: Ensure any unhandled /api route returns JSON, never HTML
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl || req.path}`,
  });
});

// Global API Error Handler
app.use((err: any, _req: Request, res: Response, next: any) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ========================================================================
// SERVER INITIALIZATION & VITE MIDDLEWARE
// ========================================================================

async function startServer() {
  // Initialize SQLite database and default lead QS user
  const database = await getDb();
  await ensureDefaultUser(database);

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
    console.log(` Auth: Active with scrypt password hashing & session store`);
    console.log(` Default QS Account: emmanuelisaac888@gmail.com`);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
});

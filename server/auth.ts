/**
 * Let's Estimate - Authentication & User Account Service
 * Server-side cryptographic authentication, sessions, and user management.
 */

import crypto from 'crypto';
import { Database } from 'sql.js';
import { getDb, saveDbToDisk } from './db';
import { Request, Response, NextFunction } from 'express';

export interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  profession: string;
  company: string;
  job_title: string;
  country: string;
  state: string;
  currency: string;
  measurement_system: string;
  avatar_url: string;
  email_verified: number; // 0 or 1
  role: string;
  company_type: string;
  created_at: string;
  updated_at: string;
}

export interface SessionRecord {
  token: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  user_agent: string;
  ip_address: string;
  last_active: string;
}

export interface LoginHistoryRecord {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  status: string;
  created_at: string;
}

export interface AuthRequest extends Request {
  user?: UserRecord;
  sessionToken?: string;
}

/**
 * Hash a password using scrypt with unique salt
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

/**
 * Verify password against stored hash and salt
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch (err) {
    return false;
  }
}

/**
 * Generate secure random token
 */
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<(UserRecord & { password_hash: string; salt: string; verification_token: string; reset_token: string; reset_token_expires: string | null }) | null> {
  const database = await getDb();
  const safeEmail = email.trim().toLowerCase().replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM users WHERE LOWER(email) = '${safeEmail}'`);
  if (res.length === 0 || res[0].values.length === 0) return null;

  const cols = res[0].columns;
  const row = res[0].values[0];
  const userObj: Record<string, any> = {};
  cols.forEach((col, idx) => {
    userObj[col] = row[idx];
  });
  return userObj as any;
}

/**
 * Get user by ID (sanitized, without password hash)
 */
export async function getUserById(id: string): Promise<UserRecord | null> {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  const res = database.exec(`SELECT id, email, full_name, phone, profession, company, job_title, country, state, currency, measurement_system, avatar_url, email_verified, role, company_type, created_at, updated_at FROM users WHERE id = '${safeId}'`);
  if (res.length === 0 || res[0].values.length === 0) return null;

  const cols = res[0].columns;
  const row = res[0].values[0];
  const userObj: Record<string, any> = {};
  cols.forEach((col, idx) => {
    userObj[col] = row[idx];
  });
  return userObj as UserRecord;
}

/**
 * Create a new user session in database
 */
export async function createSession(userId: string, userAgent = '', ipAddress = ''): Promise<string> {
  const database = await getDb();
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  database.run(
    `INSERT INTO sessions (token, user_id, expires_at, user_agent, ip_address, last_active)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [token, userId, expiresAt, userAgent.slice(0, 255), ipAddress.slice(0, 64)]
  );

  saveDbToDisk();
  return token;
}

/**
 * Validate session token and retrieve active user
 */
export async function validateSession(token: string): Promise<UserRecord | null> {
  if (!token) return null;
  const database = await getDb();
  const safeToken = token.replace(/'/g, "''");
  
  const res = database.exec(`SELECT * FROM sessions WHERE token = '${safeToken}' AND expires_at > CURRENT_TIMESTAMP`);
  if (res.length === 0 || res[0].values.length === 0) return null;

  const sessionRow: Record<string, any> = {};
  res[0].columns.forEach((col, idx) => {
    sessionRow[col] = res[0].values[0][idx];
  });

  // Touch last_active
  database.run(`UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE token = '${safeToken}'`);
  
  return getUserById(sessionRow.user_id);
}

/**
 * Invalidate a single session (Logout)
 */
export async function revokeSession(token: string): Promise<boolean> {
  const database = await getDb();
  const safeToken = token.replace(/'/g, "''");
  database.run(`DELETE FROM sessions WHERE token = '${safeToken}'`);
  saveDbToDisk();
  return true;
}

/**
 * Invalidate all sessions for a user (Logout all devices)
 */
export async function revokeAllUserSessions(userId: string): Promise<boolean> {
  const database = await getDb();
  const safeId = userId.replace(/'/g, "''");
  database.run(`DELETE FROM sessions WHERE user_id = '${safeId}'`);
  saveDbToDisk();
  return true;
}

/**
 * Record login history
 */
export async function recordLogin(userId: string, ipAddress = '', userAgent = '', status = 'success'): Promise<void> {
  try {
    const database = await getDb();
    const id = 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    database.run(
      `INSERT INTO login_history (id, user_id, ip_address, user_agent, status)
       VALUES (?, ?, ?, ?, ?)`,
      [id, userId, ipAddress.slice(0, 64), userAgent.slice(0, 255), status]
    );
    saveDbToDisk();
  } catch (err) {
    console.warn('Failed to record login history:', err);
  }
}

/**
 * Express Middleware: Require Authenticated User
 */
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query.auth_token) {
    token = String(req.query.auth_token);
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in to access your projects.' });
    return;
  }

  const user = await validateSession(token);
  if (!user) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }

  req.user = user;
  req.sessionToken = token;
  next();
}

/**
 * Express Middleware: Optional Auth (populates req.user if present, but doesn't block)
 */
export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query.auth_token) {
    token = String(req.query.auth_token);
  }

  if (token) {
    try {
      const user = await validateSession(token);
      if (user) {
        req.user = user;
        req.sessionToken = token;
      }
    } catch (e) {
      // Ignore
    }
  }
  next();
}

/**
 * Seed default Quantity Surveyor user if no users exist
 */
export async function ensureDefaultUser(database: Database): Promise<UserRecord> {
  const check = database.exec("SELECT COUNT(*) as count FROM users");
  const count = (check.length > 0 && check[0].values.length > 0) ? Number(check[0].values[0][0]) : 0;

  const defaultEmail = 'emmanuelisaac888@gmail.com';
  const existing = await getUserByEmail(defaultEmail);
  if (existing) {
    return getUserById(existing.id) as Promise<UserRecord>;
  }

  console.log('Seeding default professional QS account: emmanuelisaac888@gmail.com ...');
  const userId = 'usr-lead-qs-01';
  const { hash, salt } = hashPassword('Estimate@2026'); // Standard initial password

  database.run(
    `INSERT INTO users (
      id, email, password_hash, salt, full_name, phone, profession, company,
      job_title, country, state, currency, measurement_system, avatar_url, email_verified, role, company_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      defaultEmail,
      hash,
      salt,
      'Emmanuel Isaac, MNIQS',
      '+234 803 123 4567',
      'Registered Quantity Surveyor',
      'Niger Delta Cost Consultants',
      'Principal Cost Consultant & Estimator',
      'Nigeria',
      'Rivers (Port Harcourt)',
      'NGN',
      'Metric',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      1, // Verified
      'Owner',
      'Individual'
    ]
  );

  // Link sample hostel project to this user
  database.run(`UPDATE projects SET user_id = ? WHERE id = 'sample-hostel-ph'`, [userId]);

  saveDbToDisk();
  return (await getUserById(userId))!;
}

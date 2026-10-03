/**
 * Let's Estimate - Firebase Firestore Persistent Storage Service
 * Connects the backend server to the Google Cloud Firestore database
 * (databaseId: ai-studio-letsestimate-583c1ec4-fc5c-4578-9f20-a8372a218e00).
 * Ensures users, sessions, payments, and admin operations persist across all container instances
 * (Dev container, Preview/Shared container, and Production).
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  Firestore,
} from 'firebase/firestore';
import type { Database } from 'sql.js';
import { saveDbToDisk } from './db.js';

let firestoreDb: Firestore | null = null;
let isInitialized = false;

// Load firebase-applet-config.json safely
function getFirebaseConfig() {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[Firestore] Could not load firebase-applet-config.json:', err);
  }
  return null;
}

export function initFirestoreBackend(): Firestore | null {
  if (firestoreDb) return firestoreDb;
  const config = getFirebaseConfig();
  if (!config) {
    console.warn('[Firestore] No Firebase config available. Backend falling back to SQLite only.');
    return null;
  }

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    firestoreDb = getFirestore(app, config.firestoreDatabaseId);
    isInitialized = true;
    console.log('[Firestore] Successfully initialized connection to Firestore database:', config.firestoreDatabaseId);
    return firestoreDb;
  } catch (err) {
    console.error('[Firestore] Initialization error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 1. USERS COLLECTION
// ---------------------------------------------------------------------------

export interface FirestoreUserDoc {
  id: string;
  email: string;
  email_lower: string;
  password_hash: string;
  salt: string;
  full_name: string;
  phone?: string;
  profession?: string;
  company?: string;
  job_title?: string;
  country?: string;
  state?: string;
  currency?: string;
  measurement_system?: string;
  avatar_url?: string;
  email_verified: number;
  verification_token?: string;
  reset_token?: string;
  reset_token_expires?: string | null;
  role: string;
  company_type?: string;
  access_status: 'active' | 'pending' | 'suspended';
  subscription_tier: string;
  subscription_status: string;
  subscription_expires_at?: string;
  boq_credits: number;
  license_key?: string;
  admin_notes?: string;
  can_ai_takeoff: number;
  can_valuations: number;
  can_variations: number;
  can_export_pdf_excel: number;
  can_rates_library: number;
  can_team_collab: number;
  max_projects: number;
  created_at: string;
  updated_at: string;
}

export async function firestoreSaveUser(user: Partial<FirestoreUserDoc> & { id: string; email: string }): Promise<void> {
  const db = initFirestoreBackend();
  if (!db) return;

  try {
    const userRef = doc(db, 'users', user.id);
    const cleanEmail = (user.email || '').trim().toLowerCase();
    
    const payload: Record<string, any> = {
      ...user,
      email: user.email.trim(),
      email_lower: cleanEmail,
      updated_at: new Date().toISOString(),
    };

    if (!payload.created_at) {
      payload.created_at = new Date().toISOString();
    }

    // Clean undefined fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    await setDoc(userRef, payload, { merge: true });
    console.log(`[Firestore] User saved/updated: ${cleanEmail} (${user.id})`);
  } catch (err) {
    console.error(`[Firestore] Failed to save user ${user.email}:`, err);
  }
}

export async function firestoreGetUserByEmail(email: string): Promise<FirestoreUserDoc | null> {
  const db = initFirestoreBackend();
  if (!db) return null;

  try {
    const cleanEmail = email.trim().toLowerCase();
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('email_lower', '==', cleanEmail));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return docSnap.data() as FirestoreUserDoc;
    }

    // Fallback: check where email == original or lowercase
    const q2 = query(usersCol, where('email', '==', email.trim()));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      return snap2.docs[0].data() as FirestoreUserDoc;
    }

    // Comprehensive fallback: scan documents to guarantee no casing mismatch or legacy record is missed
    const allUsers = await firestoreGetAllUsers();
    for (const u of allUsers) {
      if (u.email && u.email.trim().toLowerCase() === cleanEmail) {
        return u;
      }
    }
  } catch (err) {
    console.error(`[Firestore] Error querying user by email ${email}:`, err);
  }
  return null;
}

export async function firestoreGetUserById(userId: string): Promise<FirestoreUserDoc | null> {
  const db = initFirestoreBackend();
  if (!db) return null;

  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as FirestoreUserDoc;
    }
  } catch (err) {
    console.error(`[Firestore] Error getting user by id ${userId}:`, err);
  }
  return null;
}

export async function firestoreGetAllUsers(): Promise<FirestoreUserDoc[]> {
  const db = initFirestoreBackend();
  if (!db) return [];

  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);
    const users: FirestoreUserDoc[] = [];
    snap.forEach(d => {
      users.push(d.data() as FirestoreUserDoc);
    });
    return users;
  } catch (err) {
    console.error('[Firestore] Error getting all users:', err);
    return [];
  }
}

export async function firestoreUpdateUser(userId: string, updates: Partial<FirestoreUserDoc>): Promise<void> {
  const db = initFirestoreBackend();
  if (!db) return;

  try {
    const userRef = doc(db, 'users', userId);
    const cleanUpdates = { ...updates, updated_at: new Date().toISOString() };
    Object.keys(cleanUpdates).forEach(k => {
      if ((cleanUpdates as any)[k] === undefined) {
        delete (cleanUpdates as any)[k];
      }
    });
    await setDoc(userRef, cleanUpdates, { merge: true });
    console.log(`[Firestore] User ${userId} updated.`);
  } catch (err) {
    console.error(`[Firestore] Error updating user ${userId}:`, err);
  }
}

export async function firestoreDeleteUser(userId: string): Promise<void> {
  const db = initFirestoreBackend();
  if (!db) return;

  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    console.log(`[Firestore] User ${userId} deleted.`);
  } catch (err) {
    console.error(`[Firestore] Error deleting user ${userId}:`, err);
  }
}

// ---------------------------------------------------------------------------
// 2. SESSIONS COLLECTION (Shared across Preview & Dev containers)
// ---------------------------------------------------------------------------

export interface FirestoreSessionDoc {
  token: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  user_agent: string;
  ip_address: string;
  last_active: string;
}

export async function firestoreSaveSession(session: FirestoreSessionDoc): Promise<void> {
  const db = initFirestoreBackend();
  if (!db) return;

  try {
    const sessionRef = doc(db, 'sessions', session.token);
    await setDoc(sessionRef, session);
  } catch (err) {
    console.error(`[Firestore] Error saving session:`, err);
  }
}

export async function firestoreGetSession(token: string): Promise<FirestoreSessionDoc | null> {
  const db = initFirestoreBackend();
  if (!db) return null;

  try {
    const sessionRef = doc(db, 'sessions', token);
    const snap = await getDoc(sessionRef);
    if (snap.exists()) {
      const data = snap.data() as FirestoreSessionDoc;
      if (new Date(data.expires_at).getTime() > Date.now()) {
        return data;
      }
    }
  } catch (err) {
    console.error(`[Firestore] Error getting session:`, err);
  }
  return null;
}

export async function firestoreDeleteSession(token: string): Promise<void> {
  const db = initFirestoreBackend();
  if (!db) return;

  try {
    const sessionRef = doc(db, 'sessions', token);
    await deleteDoc(sessionRef);
  } catch (err) {
    console.error(`[Firestore] Error deleting session:`, err);
  }
}

export async function firestoreDeleteAllUserSessions(userId: string): Promise<void> {
  const db = initFirestoreBackend();
  if (!db) return;

  try {
    const sessionsCol = collection(db, 'sessions');
    const q = query(sessionsCol, where('user_id', '==', userId));
    const snap = await getDocs(q);
    const promises = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(promises);
  } catch (err) {
    console.error(`[Firestore] Error deleting user sessions:`, err);
  }
}

// ---------------------------------------------------------------------------
// 3. PAYMENTS COLLECTION (Bank Transfers submitted on any instance)
// ---------------------------------------------------------------------------

export async function firestoreSavePayment(payment: any): Promise<void> {
  const db = initFirestoreBackend();
  if (!db) return;

  try {
    const payRef = doc(db, 'payments', payment.id);
    await setDoc(payRef, { ...payment, updated_at: new Date().toISOString() }, { merge: true });
    console.log(`[Firestore] Payment transfer saved: ${payment.id}`);
  } catch (err) {
    console.error('[Firestore] Error saving payment transfer:', err);
  }
}

export async function firestoreGetAllPayments(): Promise<any[]> {
  const db = initFirestoreBackend();
  if (!db) return [];

  try {
    const payCol = collection(db, 'payments');
    const snap = await getDocs(payCol);
    const list: any[] = [];
    snap.forEach(d => list.push(d.data()));
    return list;
  } catch (err) {
    console.error('[Firestore] Error fetching payments:', err);
    return [];
  }
}

export async function firestoreUpdatePayment(paymentId: string, updates: any): Promise<void> {
  const db = initFirestoreBackend();
  if (!db) return;

  try {
    const payRef = doc(db, 'payments', paymentId);
    await setDoc(payRef, { ...updates, updated_at: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error(`[Firestore] Error updating payment ${paymentId}:`, err);
  }
}

// ---------------------------------------------------------------------------
// 4. BI-DIRECTIONAL SQLITE <-> FIRESTORE SYNC
// ---------------------------------------------------------------------------

let syncLockPromise: Promise<{ pulled: number; pushed: number }> | null = null;

/**
 * Synchronizes users between Firestore and the local SQLite database.
 * 1. Pulls all users from Firestore into SQLite (so any user registered on Preview
 *    or another container is instantly available in SQLite).
 * 2. Pushes any users currently in SQLite that aren't yet in Firestore up to Firestore
 *    (e.g., seeded SuperAdmin Emmanuel Isaac).
 */
export async function syncUsersWithFirestore(sqliteDb: Database): Promise<{ pulled: number; pushed: number }> {
  if (syncLockPromise) {
    return syncLockPromise;
  }

  syncLockPromise = (async () => {
    const db = initFirestoreBackend();
    if (!db) return { pulled: 0, pushed: 0 };

    let pulled = 0;
    let pushed = 0;

    try {
      // 1. Fetch all Firestore users
      const firestoreUsers = await firestoreGetAllUsers();
      const firestoreUserMap = new Map<string, FirestoreUserDoc>();
      firestoreUsers.forEach(u => {
        firestoreUserMap.set(u.id, u);
        if (u.email_lower) {
          firestoreUserMap.set(u.email_lower, u);
        }
      });

      // 2. Fetch all SQLite users (deduplicated by user.id)
      const resSqlite = sqliteDb.exec(`SELECT * FROM users`);
      const sqliteUserMap = new Map<string, any>();
      const sqliteEmailMap = new Map<string, any>();
      if (resSqlite.length > 0 && resSqlite[0].values.length > 0) {
        const cols = resSqlite[0].columns;
        resSqlite[0].values.forEach(row => {
          const u: any = {};
          cols.forEach((c, idx) => { u[c] = row[idx]; });
          if (u.id) {
            sqliteUserMap.set(u.id, u);
          }
          if (u.email) {
            sqliteEmailMap.set(u.email.toLowerCase().trim(), u);
          }
        });
      }

      let sqliteChanged = false;

      // A. Pull from Firestore into SQLite
      for (const fUser of firestoreUsers) {
        const cleanFEmail = (fUser.email || '').toLowerCase().trim();
        const existingInSqlite = sqliteUserMap.get(fUser.id) || sqliteEmailMap.get(cleanFEmail);
        
        if (!existingInSqlite) {
          try {
            sqliteDb.run(
              `INSERT OR REPLACE INTO users (
                id, email, password_hash, salt, full_name, phone, profession, company,
                job_title, country, state, currency, measurement_system, avatar_url,
                email_verified, verification_token, role, company_type, access_status,
                subscription_tier, subscription_status, subscription_expires_at, boq_credits,
                license_key, admin_notes, can_ai_takeoff, can_valuations, can_variations,
                can_export_pdf_excel, can_rates_library, can_team_collab, max_projects,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                fUser.id,
                fUser.email,
                fUser.password_hash || '',
                fUser.salt || '',
                fUser.full_name || '',
                fUser.phone || '',
                fUser.profession || 'Quantity Surveyor',
                fUser.company || '',
                fUser.job_title || 'Principal QS',
                fUser.country || 'Nigeria',
                fUser.state || 'Lagos',
                fUser.currency || 'NGN',
                fUser.measurement_system || 'Metric',
                fUser.avatar_url || '',
                1, // Verified
                '',
                fUser.role || 'Owner',
                fUser.company_type || 'Individual',
                fUser.access_status || 'active',
                fUser.subscription_tier || 'free_trial',
                fUser.subscription_status || 'active',
                fUser.subscription_expires_at || '',
                fUser.boq_credits !== undefined ? fUser.boq_credits : 5,
                fUser.license_key || '',
                fUser.admin_notes || '',
                fUser.can_ai_takeoff !== undefined ? fUser.can_ai_takeoff : 1,
                fUser.can_valuations !== undefined ? fUser.can_valuations : 1,
                fUser.can_variations !== undefined ? fUser.can_variations : 1,
                fUser.can_export_pdf_excel !== undefined ? fUser.can_export_pdf_excel : 1,
                fUser.can_rates_library !== undefined ? fUser.can_rates_library : 1,
                fUser.can_team_collab !== undefined ? fUser.can_team_collab : 1,
                fUser.max_projects !== undefined ? fUser.max_projects : 10,
                fUser.created_at || new Date().toISOString(),
                fUser.updated_at || new Date().toISOString(),
              ]
            );
            pulled++;
            sqliteChanged = true;
          } catch (insertErr) {
            console.warn('[Firestore Sync] Could not insert Firestore user to SQLite:', insertErr);
          }
        } else {
          // Update user state if Firestore has newer information (e.g. plan change, status change)
          try {
            sqliteDb.run(
              `UPDATE users SET
                full_name = ?,
                role = ?,
                access_status = ?,
                subscription_tier = ?,
                subscription_status = ?,
                subscription_expires_at = ?,
                boq_credits = ?,
                email_verified = ?,
                password_hash = CASE WHEN (password_hash IS NULL OR password_hash = '') AND ? != '' THEN ? ELSE password_hash END,
                salt = CASE WHEN (salt IS NULL OR salt = '') AND ? != '' THEN ? ELSE salt END,
                updated_at = ?
               WHERE id = ?`,
              [
                fUser.full_name || existingInSqlite.full_name,
                fUser.role || existingInSqlite.role,
                fUser.access_status || existingInSqlite.access_status,
                fUser.subscription_tier || existingInSqlite.subscription_tier,
                fUser.subscription_status || existingInSqlite.subscription_status,
                fUser.subscription_expires_at || existingInSqlite.subscription_expires_at,
                fUser.boq_credits !== undefined ? fUser.boq_credits : existingInSqlite.boq_credits,
                1,
                fUser.password_hash || '',
                fUser.password_hash || '',
                fUser.salt || '',
                fUser.salt || '',
                fUser.updated_at || new Date().toISOString(),
                existingInSqlite.id
              ]
            );
            sqliteChanged = true;
          } catch (updateErr) {
            // Handled gracefully
          }
        }
      }

      if (sqliteChanged) {
        saveDbToDisk();
      }

      // B. Push from SQLite to Firestore (if any local user is missing from Firestore)
      for (const sqlUser of sqliteUserMap.values()) {
        const cleanSqlEmail = (sqlUser.email || '').toLowerCase().trim();
        const inFirestore = firestoreUserMap.get(sqlUser.id) || firestoreUserMap.get(cleanSqlEmail);
        if (!inFirestore) {
          await firestoreSaveUser({
            id: sqlUser.id,
            email: sqlUser.email,
            email_lower: cleanSqlEmail,
            password_hash: sqlUser.password_hash || '',
            salt: sqlUser.salt || '',
            full_name: sqlUser.full_name || '',
            phone: sqlUser.phone || '',
            profession: sqlUser.profession || 'Quantity Surveyor',
            company: sqlUser.company || '',
            job_title: sqlUser.job_title || '',
            country: sqlUser.country || 'Nigeria',
            state: sqlUser.state || 'Lagos',
            currency: sqlUser.currency || 'NGN',
            measurement_system: sqlUser.measurement_system || 'Metric',
            avatar_url: sqlUser.avatar_url || '',
            email_verified: sqlUser.email_verified || 0,
            verification_token: sqlUser.verification_token || '',
            role: sqlUser.role || 'Owner',
            company_type: sqlUser.company_type || 'Individual',
            access_status: sqlUser.access_status || 'active',
            subscription_tier: sqlUser.subscription_tier || 'free_trial',
            subscription_status: sqlUser.subscription_status || 'active',
            subscription_expires_at: sqlUser.subscription_expires_at || '',
            boq_credits: sqlUser.boq_credits !== undefined ? sqlUser.boq_credits : 5,
            license_key: sqlUser.license_key || '',
            admin_notes: sqlUser.admin_notes || '',
            can_ai_takeoff: sqlUser.can_ai_takeoff !== undefined ? sqlUser.can_ai_takeoff : 1,
            can_valuations: sqlUser.can_valuations !== undefined ? sqlUser.can_valuations : 1,
            can_variations: sqlUser.can_variations !== undefined ? sqlUser.can_variations : 1,
            can_export_pdf_excel: sqlUser.can_export_pdf_excel !== undefined ? sqlUser.can_export_pdf_excel : 1,
            can_rates_library: sqlUser.can_rates_library !== undefined ? sqlUser.can_rates_library : 1,
            can_team_collab: sqlUser.can_team_collab !== undefined ? sqlUser.can_team_collab : 1,
            max_projects: sqlUser.max_projects !== undefined ? sqlUser.max_projects : 10,
            created_at: sqlUser.created_at || new Date().toISOString(),
            updated_at: sqlUser.updated_at || new Date().toISOString(),
          });
          pushed++;
        }
      }

      console.log(`[Firestore Sync] Completed sync: pulled ${pulled} users from Firestore, pushed ${pushed} users to Firestore.`);
    } catch (err) {
      console.error('[Firestore Sync] Sync error:', err);
    }

    return { pulled, pushed };
  })();

  try {
    return await syncLockPromise;
  } finally {
    syncLockPromise = null;
  }
}

import fs from "fs";
import path from "path";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { saveDbToDisk } from "./db.js";
let firestoreDb = null;
let isInitialized = false;
function getFirebaseConfig() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("[Firestore] Could not load firebase-applet-config.json:", err);
  }
  return null;
}
function initFirestoreBackend() {
  if (firestoreDb) return firestoreDb;
  const config = getFirebaseConfig();
  if (!config) {
    console.warn("[Firestore] No Firebase config available. Backend falling back to SQLite only.");
    return null;
  }
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    firestoreDb = getFirestore(app, config.firestoreDatabaseId);
    isInitialized = true;
    console.log("[Firestore] Successfully initialized connection to Firestore database:", config.firestoreDatabaseId);
    return firestoreDb;
  } catch (err) {
    console.error("[Firestore] Initialization error:", err);
    return null;
  }
}
async function firestoreSaveUser(user) {
  const db = initFirestoreBackend();
  if (!db) return;
  try {
    const userRef = doc(db, "users", user.id);
    const cleanEmail = (user.email || "").trim().toLowerCase();
    const payload = {
      ...user,
      email: user.email.trim(),
      email_lower: cleanEmail,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!payload.created_at) {
      payload.created_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    Object.keys(payload).forEach((key) => {
      if (payload[key] === void 0) {
        delete payload[key];
      }
    });
    await setDoc(userRef, payload, { merge: true });
    console.log(`[Firestore] User saved/updated: ${cleanEmail} (${user.id})`);
  } catch (err) {
    console.error(`[Firestore] Failed to save user ${user.email}:`, err);
  }
}
async function firestoreGetUserByEmail(email) {
  const db = initFirestoreBackend();
  if (!db) return null;
  try {
    const cleanEmail = email.trim().toLowerCase();
    const usersCol = collection(db, "users");
    const q = query(usersCol, where("email_lower", "==", cleanEmail));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return docSnap.data();
    }
    const q2 = query(usersCol, where("email", "==", email.trim()));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      return snap2.docs[0].data();
    }
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
async function firestoreGetUserById(userId) {
  const db = initFirestoreBackend();
  if (!db) return null;
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.error(`[Firestore] Error getting user by id ${userId}:`, err);
  }
  return null;
}
async function firestoreGetAllUsers() {
  const db = initFirestoreBackend();
  if (!db) return [];
  try {
    const usersCol = collection(db, "users");
    const snap = await getDocs(usersCol);
    const users = [];
    snap.forEach((d) => {
      users.push(d.data());
    });
    return users;
  } catch (err) {
    console.error("[Firestore] Error getting all users:", err);
    return [];
  }
}
async function firestoreUpdateUser(userId, updates) {
  const db = initFirestoreBackend();
  if (!db) return;
  try {
    const userRef = doc(db, "users", userId);
    const cleanUpdates = { ...updates, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    Object.keys(cleanUpdates).forEach((k) => {
      if (cleanUpdates[k] === void 0) {
        delete cleanUpdates[k];
      }
    });
    await setDoc(userRef, cleanUpdates, { merge: true });
    console.log(`[Firestore] User ${userId} updated.`);
  } catch (err) {
    console.error(`[Firestore] Error updating user ${userId}:`, err);
  }
}
async function firestoreDeleteUser(userId) {
  const db = initFirestoreBackend();
  if (!db) return;
  try {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    console.log(`[Firestore] User ${userId} deleted.`);
  } catch (err) {
    console.error(`[Firestore] Error deleting user ${userId}:`, err);
  }
}
async function firestoreSaveSession(session) {
  const db = initFirestoreBackend();
  if (!db) return;
  try {
    const sessionRef = doc(db, "sessions", session.token);
    await setDoc(sessionRef, session);
  } catch (err) {
    console.error(`[Firestore] Error saving session:`, err);
  }
}
async function firestoreGetSession(token) {
  const db = initFirestoreBackend();
  if (!db) return null;
  try {
    const sessionRef = doc(db, "sessions", token);
    const snap = await getDoc(sessionRef);
    if (snap.exists()) {
      const data = snap.data();
      if (new Date(data.expires_at).getTime() > Date.now()) {
        return data;
      }
    }
  } catch (err) {
    console.error(`[Firestore] Error getting session:`, err);
  }
  return null;
}
async function firestoreDeleteSession(token) {
  const db = initFirestoreBackend();
  if (!db) return;
  try {
    const sessionRef = doc(db, "sessions", token);
    await deleteDoc(sessionRef);
  } catch (err) {
    console.error(`[Firestore] Error deleting session:`, err);
  }
}
async function firestoreDeleteAllUserSessions(userId) {
  const db = initFirestoreBackend();
  if (!db) return;
  try {
    const sessionsCol = collection(db, "sessions");
    const q = query(sessionsCol, where("user_id", "==", userId));
    const snap = await getDocs(q);
    const promises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(promises);
  } catch (err) {
    console.error(`[Firestore] Error deleting user sessions:`, err);
  }
}
async function firestoreSavePayment(payment) {
  const db = initFirestoreBackend();
  if (!db) return;
  try {
    const payRef = doc(db, "payments", payment.id);
    await setDoc(payRef, { ...payment, updated_at: (/* @__PURE__ */ new Date()).toISOString() }, { merge: true });
    console.log(`[Firestore] Payment transfer saved: ${payment.id}`);
  } catch (err) {
    console.error("[Firestore] Error saving payment transfer:", err);
  }
}
async function firestoreGetAllPayments() {
  const db = initFirestoreBackend();
  if (!db) return [];
  try {
    const payCol = collection(db, "payments");
    const snap = await getDocs(payCol);
    const list = [];
    snap.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    console.error("[Firestore] Error fetching payments:", err);
    return [];
  }
}
async function firestoreUpdatePayment(paymentId, updates) {
  const db = initFirestoreBackend();
  if (!db) return;
  try {
    const payRef = doc(db, "payments", paymentId);
    await setDoc(payRef, { ...updates, updated_at: (/* @__PURE__ */ new Date()).toISOString() }, { merge: true });
  } catch (err) {
    console.error(`[Firestore] Error updating payment ${paymentId}:`, err);
  }
}
let syncLockPromise = null;
async function syncUsersWithFirestore(sqliteDb) {
  if (syncLockPromise) {
    return syncLockPromise;
  }
  syncLockPromise = (async () => {
    const db = initFirestoreBackend();
    if (!db) return { pulled: 0, pushed: 0 };
    let pulled = 0;
    let pushed = 0;
    try {
      const firestoreUsers = await firestoreGetAllUsers();
      const firestoreUserMap = /* @__PURE__ */ new Map();
      firestoreUsers.forEach((u) => {
        firestoreUserMap.set(u.id, u);
        if (u.email_lower) {
          firestoreUserMap.set(u.email_lower, u);
        }
      });
      const resSqlite = sqliteDb.exec(`SELECT * FROM users`);
      const sqliteUserMap = /* @__PURE__ */ new Map();
      const sqliteEmailMap = /* @__PURE__ */ new Map();
      if (resSqlite.length > 0 && resSqlite[0].values.length > 0) {
        const cols = resSqlite[0].columns;
        resSqlite[0].values.forEach((row) => {
          const u = {};
          cols.forEach((c, idx) => {
            u[c] = row[idx];
          });
          if (u.id) {
            sqliteUserMap.set(u.id, u);
          }
          if (u.email) {
            sqliteEmailMap.set(u.email.toLowerCase().trim(), u);
          }
        });
      }
      let sqliteChanged = false;
      for (const fUser of firestoreUsers) {
        const cleanFEmail = (fUser.email || "").toLowerCase().trim();
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
                fUser.password_hash || "",
                fUser.salt || "",
                fUser.full_name || "",
                fUser.phone || "",
                fUser.profession || "Quantity Surveyor",
                fUser.company || "",
                fUser.job_title || "Principal QS",
                fUser.country || "Nigeria",
                fUser.state || "Lagos",
                fUser.currency || "NGN",
                fUser.measurement_system || "Metric",
                fUser.avatar_url || "",
                1,
                // Verified
                "",
                fUser.role || "Owner",
                fUser.company_type || "Individual",
                fUser.access_status || "active",
                fUser.subscription_tier || "free_trial",
                fUser.subscription_status || "active",
                fUser.subscription_expires_at || "",
                fUser.boq_credits !== void 0 ? fUser.boq_credits : 5,
                fUser.license_key || "",
                fUser.admin_notes || "",
                fUser.can_ai_takeoff !== void 0 ? fUser.can_ai_takeoff : 1,
                fUser.can_valuations !== void 0 ? fUser.can_valuations : 1,
                fUser.can_variations !== void 0 ? fUser.can_variations : 1,
                fUser.can_export_pdf_excel !== void 0 ? fUser.can_export_pdf_excel : 1,
                fUser.can_rates_library !== void 0 ? fUser.can_rates_library : 1,
                fUser.can_team_collab !== void 0 ? fUser.can_team_collab : 1,
                fUser.max_projects !== void 0 ? fUser.max_projects : 10,
                fUser.created_at || (/* @__PURE__ */ new Date()).toISOString(),
                fUser.updated_at || (/* @__PURE__ */ new Date()).toISOString()
              ]
            );
            pulled++;
            sqliteChanged = true;
          } catch (insertErr) {
            console.warn("[Firestore Sync] Could not insert Firestore user to SQLite:", insertErr);
          }
        } else {
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
                fUser.boq_credits !== void 0 ? fUser.boq_credits : existingInSqlite.boq_credits,
                1,
                fUser.password_hash || "",
                fUser.password_hash || "",
                fUser.salt || "",
                fUser.salt || "",
                fUser.updated_at || (/* @__PURE__ */ new Date()).toISOString(),
                existingInSqlite.id
              ]
            );
            sqliteChanged = true;
          } catch (updateErr) {
          }
        }
      }
      if (sqliteChanged) {
        saveDbToDisk();
      }
      for (const sqlUser of sqliteUserMap.values()) {
        const cleanSqlEmail = (sqlUser.email || "").toLowerCase().trim();
        const inFirestore = firestoreUserMap.get(sqlUser.id) || firestoreUserMap.get(cleanSqlEmail);
        if (!inFirestore) {
          await firestoreSaveUser({
            id: sqlUser.id,
            email: sqlUser.email,
            email_lower: cleanSqlEmail,
            password_hash: sqlUser.password_hash || "",
            salt: sqlUser.salt || "",
            full_name: sqlUser.full_name || "",
            phone: sqlUser.phone || "",
            profession: sqlUser.profession || "Quantity Surveyor",
            company: sqlUser.company || "",
            job_title: sqlUser.job_title || "",
            country: sqlUser.country || "Nigeria",
            state: sqlUser.state || "Lagos",
            currency: sqlUser.currency || "NGN",
            measurement_system: sqlUser.measurement_system || "Metric",
            avatar_url: sqlUser.avatar_url || "",
            email_verified: sqlUser.email_verified || 0,
            verification_token: sqlUser.verification_token || "",
            role: sqlUser.role || "Owner",
            company_type: sqlUser.company_type || "Individual",
            access_status: sqlUser.access_status || "active",
            subscription_tier: sqlUser.subscription_tier || "free_trial",
            subscription_status: sqlUser.subscription_status || "active",
            subscription_expires_at: sqlUser.subscription_expires_at || "",
            boq_credits: sqlUser.boq_credits !== void 0 ? sqlUser.boq_credits : 5,
            license_key: sqlUser.license_key || "",
            admin_notes: sqlUser.admin_notes || "",
            can_ai_takeoff: sqlUser.can_ai_takeoff !== void 0 ? sqlUser.can_ai_takeoff : 1,
            can_valuations: sqlUser.can_valuations !== void 0 ? sqlUser.can_valuations : 1,
            can_variations: sqlUser.can_variations !== void 0 ? sqlUser.can_variations : 1,
            can_export_pdf_excel: sqlUser.can_export_pdf_excel !== void 0 ? sqlUser.can_export_pdf_excel : 1,
            can_rates_library: sqlUser.can_rates_library !== void 0 ? sqlUser.can_rates_library : 1,
            can_team_collab: sqlUser.can_team_collab !== void 0 ? sqlUser.can_team_collab : 1,
            max_projects: sqlUser.max_projects !== void 0 ? sqlUser.max_projects : 10,
            created_at: sqlUser.created_at || (/* @__PURE__ */ new Date()).toISOString(),
            updated_at: sqlUser.updated_at || (/* @__PURE__ */ new Date()).toISOString()
          });
          pushed++;
        }
      }
      console.log(`[Firestore Sync] Completed sync: pulled ${pulled} users from Firestore, pushed ${pushed} users to Firestore.`);
    } catch (err) {
      console.error("[Firestore Sync] Sync error:", err);
    }
    return { pulled, pushed };
  })();
  try {
    return await syncLockPromise;
  } finally {
    syncLockPromise = null;
  }
}
export {
  firestoreDeleteAllUserSessions,
  firestoreDeleteSession,
  firestoreDeleteUser,
  firestoreGetAllPayments,
  firestoreGetAllUsers,
  firestoreGetSession,
  firestoreGetUserByEmail,
  firestoreGetUserById,
  firestoreSavePayment,
  firestoreSaveSession,
  firestoreSaveUser,
  firestoreUpdatePayment,
  firestoreUpdateUser,
  initFirestoreBackend,
  syncUsersWithFirestore
};

import crypto from "crypto";
import { getDb, saveDbToDisk } from "./db.js";
import {
  firestoreGetUserByEmail,
  firestoreGetUserById,
  firestoreSaveSession,
  firestoreGetSession,
  firestoreDeleteSession,
  firestoreDeleteAllUserSessions
} from "./firestore.js";
const MASTER_ADMIN_KEY = process.env.MASTER_ADMIN_KEY || "QS-MASTER-KEY-2026-EMMANUEL-ADMIN";
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}
function verifyPassword(password, storedHash, salt) {
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
  } catch (err) {
    return false;
  }
}
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}
async function getUserByEmail(email) {
  const database = await getDb();
  const safeEmail = email.trim().toLowerCase().replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM users WHERE LOWER(email) = '${safeEmail}'`);
  if (res.length > 0 && res[0].values.length > 0) {
    const cols = res[0].columns;
    const row = res[0].values[0];
    const userObj = {};
    cols.forEach((col, idx) => {
      userObj[col] = row[idx];
    });
    return userObj;
  }
  try {
    const firestoreUser = await firestoreGetUserByEmail(email);
    if (firestoreUser) {
      database.run(
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
          firestoreUser.id,
          firestoreUser.email,
          firestoreUser.password_hash || "",
          firestoreUser.salt || "",
          firestoreUser.full_name || "",
          firestoreUser.phone || "",
          firestoreUser.profession || "Quantity Surveyor",
          firestoreUser.company || "",
          firestoreUser.job_title || "Principal QS",
          firestoreUser.country || "Nigeria",
          firestoreUser.state || "Lagos",
          firestoreUser.currency || "NGN",
          firestoreUser.measurement_system || "Metric",
          firestoreUser.avatar_url || "",
          1,
          // Verified
          "",
          firestoreUser.role || "Owner",
          firestoreUser.company_type || "Individual",
          firestoreUser.access_status || "active",
          firestoreUser.subscription_tier || "free_trial",
          firestoreUser.subscription_status || "active",
          firestoreUser.subscription_expires_at || "",
          firestoreUser.boq_credits !== void 0 ? firestoreUser.boq_credits : 5,
          firestoreUser.license_key || "",
          firestoreUser.admin_notes || "",
          firestoreUser.can_ai_takeoff !== void 0 ? firestoreUser.can_ai_takeoff : 1,
          firestoreUser.can_valuations !== void 0 ? firestoreUser.can_valuations : 1,
          firestoreUser.can_variations !== void 0 ? firestoreUser.can_variations : 1,
          firestoreUser.can_export_pdf_excel !== void 0 ? firestoreUser.can_export_pdf_excel : 1,
          firestoreUser.can_rates_library !== void 0 ? firestoreUser.can_rates_library : 1,
          firestoreUser.can_team_collab !== void 0 ? firestoreUser.can_team_collab : 1,
          firestoreUser.max_projects !== void 0 ? firestoreUser.max_projects : 10,
          firestoreUser.created_at || (/* @__PURE__ */ new Date()).toISOString(),
          firestoreUser.updated_at || (/* @__PURE__ */ new Date()).toISOString()
        ]
      );
      saveDbToDisk();
      return firestoreUser;
    }
  } catch (err) {
    console.warn("[Auth] Firestore getUserByEmail fallback error:", err);
  }
  return null;
}
async function getUserById(id) {
  const database = await getDb();
  const safeId = id.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM users WHERE id = '${safeId}'`);
  if (res.length > 0 && res[0].values.length > 0) {
    const cols = res[0].columns;
    const row = res[0].values[0];
    const userObj = {};
    cols.forEach((col, idx) => {
      if (col !== "password_hash" && col !== "salt") {
        userObj[col] = row[idx];
      }
    });
    return userObj;
  }
  try {
    const firestoreUser = await firestoreGetUserById(id);
    if (firestoreUser) {
      database.run(
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
          firestoreUser.id,
          firestoreUser.email,
          firestoreUser.password_hash || "",
          firestoreUser.salt || "",
          firestoreUser.full_name || "",
          firestoreUser.phone || "",
          firestoreUser.profession || "Quantity Surveyor",
          firestoreUser.company || "",
          firestoreUser.job_title || "Principal QS",
          firestoreUser.country || "Nigeria",
          firestoreUser.state || "Lagos",
          firestoreUser.currency || "NGN",
          firestoreUser.measurement_system || "Metric",
          firestoreUser.avatar_url || "",
          1,
          // Verified
          "",
          firestoreUser.role || "Owner",
          firestoreUser.company_type || "Individual",
          firestoreUser.access_status || "active",
          firestoreUser.subscription_tier || "free_trial",
          firestoreUser.subscription_status || "active",
          firestoreUser.subscription_expires_at || "",
          firestoreUser.boq_credits !== void 0 ? firestoreUser.boq_credits : 5,
          firestoreUser.license_key || "",
          firestoreUser.admin_notes || "",
          firestoreUser.can_ai_takeoff !== void 0 ? firestoreUser.can_ai_takeoff : 1,
          firestoreUser.can_valuations !== void 0 ? firestoreUser.can_valuations : 1,
          firestoreUser.can_variations !== void 0 ? firestoreUser.can_variations : 1,
          firestoreUser.can_export_pdf_excel !== void 0 ? firestoreUser.can_export_pdf_excel : 1,
          firestoreUser.can_rates_library !== void 0 ? firestoreUser.can_rates_library : 1,
          firestoreUser.can_team_collab !== void 0 ? firestoreUser.can_team_collab : 1,
          firestoreUser.max_projects !== void 0 ? firestoreUser.max_projects : 10,
          firestoreUser.created_at || (/* @__PURE__ */ new Date()).toISOString(),
          firestoreUser.updated_at || (/* @__PURE__ */ new Date()).toISOString()
        ]
      );
      saveDbToDisk();
      const { password_hash, salt, ...safeUser } = firestoreUser;
      return safeUser;
    }
  } catch (err) {
    console.warn("[Auth] Firestore getUserById fallback error:", err);
  }
  return null;
}
async function createSession(userId, userAgent = "", ipAddress = "") {
  const database = await getDb();
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  database.run(
    `INSERT INTO sessions (token, user_id, expires_at, user_agent, ip_address, last_active)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [token, userId, expiresAt, userAgent.slice(0, 255), ipAddress.slice(0, 64)]
  );
  saveDbToDisk();
  firestoreSaveSession({
    token,
    user_id: userId,
    created_at: now,
    expires_at: expiresAt,
    user_agent: userAgent.slice(0, 255),
    ip_address: ipAddress.slice(0, 64),
    last_active: now
  }).catch((err) => console.warn("[Auth] Firestore save session error:", err));
  return token;
}
async function validateSession(token) {
  if (!token) return null;
  const database = await getDb();
  const safeToken = token.replace(/'/g, "''");
  const res = database.exec(`SELECT * FROM sessions WHERE token = '${safeToken}' AND expires_at > CURRENT_TIMESTAMP`);
  if (res.length > 0 && res[0].values.length > 0) {
    const sessionRow = {};
    res[0].columns.forEach((col, idx) => {
      sessionRow[col] = res[0].values[0][idx];
    });
    database.run(`UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE token = '${safeToken}'`);
    return getUserById(sessionRow.user_id);
  }
  try {
    const fsSession = await firestoreGetSession(token);
    if (fsSession) {
      database.run(
        `INSERT OR REPLACE INTO sessions (token, user_id, expires_at, user_agent, ip_address, last_active)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [fsSession.token, fsSession.user_id, fsSession.expires_at, fsSession.user_agent, fsSession.ip_address]
      );
      saveDbToDisk();
      return getUserById(fsSession.user_id);
    }
  } catch (err) {
    console.warn("[Auth] Firestore validateSession error:", err);
  }
  return null;
}
async function revokeSession(token) {
  const database = await getDb();
  const safeToken = token.replace(/'/g, "''");
  database.run(`DELETE FROM sessions WHERE token = '${safeToken}'`);
  saveDbToDisk();
  firestoreDeleteSession(token).catch(() => {
  });
  return true;
}
async function revokeAllUserSessions(userId) {
  const database = await getDb();
  const safeId = userId.replace(/'/g, "''");
  database.run(`DELETE FROM sessions WHERE user_id = '${safeId}'`);
  saveDbToDisk();
  firestoreDeleteAllUserSessions(userId).catch(() => {
  });
  return true;
}
async function recordLogin(userId, ipAddress = "", userAgent = "", status = "success") {
  try {
    const database = await getDb();
    const id = "log-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    database.run(
      `INSERT INTO login_history (id, user_id, ip_address, user_agent, status)
       VALUES (?, ?, ?, ?, ?)`,
      [id, userId, ipAddress.slice(0, 64), userAgent.slice(0, 255), status]
    );
    saveDbToDisk();
  } catch (err) {
    console.warn("Failed to record login history:", err);
  }
}
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.query.auth_token) {
    token = String(req.query.auth_token);
  }
  if (!token) {
    res.status(401).json({ error: "Authentication required. Please sign in to access your projects." });
    return;
  }
  const user = await validateSession(token);
  if (!user) {
    res.status(401).json({ error: "Session expired or invalid. Please sign in again." });
    return;
  }
  if (user.access_status === "suspended") {
    res.status(403).json({ error: "Your account access has been suspended. Please contact the administrator." });
    return;
  }
  req.user = user;
  req.sessionToken = token;
  next();
}
async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.query.auth_token) {
    token = String(req.query.auth_token);
  }
  if (!token) {
    res.status(401).json({ error: "Admin authentication required." });
    return;
  }
  const user = await validateSession(token);
  if (!user) {
    res.status(401).json({ error: "Session expired or invalid." });
    return;
  }
  const isAdmin = user.role === "admin" || user.role === "superadmin" || user.email.toLowerCase() === "emmanuelisaac888@gmail.com";
  if (!isAdmin) {
    res.status(403).json({ error: "Access denied. Master Admin privileges required to manage users and access." });
    return;
  }
  req.user = user;
  req.sessionToken = token;
  next();
}
async function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
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
    }
  }
  next();
}
async function ensureDefaultUser(database) {
  const defaultEmail = "emmanuelisaac888@gmail.com";
  const existing = await getUserByEmail(defaultEmail);
  if (existing) {
    database.run(
      `UPDATE users SET 
        role = 'superadmin', 
        access_status = 'active', 
        subscription_tier = 'lifetime_license', 
        subscription_status = 'active', 
        email_verified = 1 
       WHERE id = ?`,
      [existing.id]
    );
    saveDbToDisk();
    return await getUserById(existing.id);
  }
  console.log("Seeding Master Admin QS account: emmanuelisaac888@gmail.com ...");
  const userId = "usr-superadmin-emmanuel-01";
  const { hash, salt } = hashPassword("Estimate@2026");
  database.run(
    `INSERT INTO users (
      id, email, password_hash, salt, full_name, phone, profession, company,
      job_title, country, state, currency, measurement_system, avatar_url, email_verified,
      role, company_type, access_status, subscription_tier, subscription_status, boq_credits, license_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      defaultEmail,
      hash,
      salt,
      "Emmanuel Isaac, MYQSF",
      "+234 803 123 4567",
      "Registered Quantity Surveyor (MYQSF)",
      "Niger Delta Cost Consultants",
      "Principal Cost Consultant & Master Admin",
      "Nigeria",
      "Rivers (Port Harcourt)",
      "NGN",
      "Metric",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      1,
      // Verified
      "superadmin",
      "Individual",
      "active",
      "lifetime_license",
      "active",
      9999,
      "QS-MASTER-KEY-2026-EMMANUEL-ADMIN"
    ]
  );
  database.run(`UPDATE projects SET user_id = ? WHERE id = 'sample-hostel-ph'`, [userId]);
  saveDbToDisk();
  return await getUserById(userId);
}
export {
  MASTER_ADMIN_KEY,
  createSession,
  ensureDefaultUser,
  generateToken,
  getUserByEmail,
  getUserById,
  hashPassword,
  optionalAuth,
  recordLogin,
  requireAdmin,
  requireAuth,
  revokeAllUserSessions,
  revokeSession,
  validateSession,
  verifyPassword
};

import { getProjectById, getUserSubscriptionInfo, consumeBoqCredit } from "./db.js";
const rateLimitStore = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1e3);
function createRateLimiter(options) {
  const { windowMs, max, message = "Too many requests. Please try again shortly." } = options;
  return (req, res, next) => {
    const authReq = req;
    const identifier = authReq.user?.id || req.ip || req.socket.remoteAddress || "unknown-client";
    const routeKey = `${req.baseUrl || ""}${req.path}:${identifier}`;
    const now = Date.now();
    let entry = rateLimitStore.get(routeKey);
    if (!entry || now > entry.resetAt) {
      entry = {
        count: 1,
        resetAt: now + windowMs
      };
      rateLimitStore.set(routeKey, entry);
    } else {
      entry.count += 1;
    }
    if (entry.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1e3));
      res.setHeader("Retry-After", retryAfterSeconds);
      res.status(429).json({
        error: message,
        retryAfter: retryAfterSeconds
      });
      return;
    }
    next();
  };
}
async function verifyProjectOwnership(projectId, user) {
  if (!projectId || projectId === "proj-temp" || projectId === "sample-hostel-ph") {
    return { allowed: true };
  }
  const project = await getProjectById(projectId);
  if (!project) {
    return { allowed: false, error: "Project not found.", status: 404 };
  }
  if (!project.user_id) {
    return { allowed: true };
  }
  const isOwner = project.user_id === user.id;
  const isAdmin = user.role === "Admin" || user.role === "Owner";
  if (!isOwner && !isAdmin) {
    return {
      allowed: false,
      error: "Access denied: You do not have permission to modify or analyze this project.",
      status: 403
    };
  }
  return { allowed: true };
}
async function verifyTakeoffEntitlement(userId) {
  try {
    const subInfo = await getUserSubscriptionInfo(userId);
    if (!subInfo.canGenerateBoq) {
      return {
        allowed: false,
        error: "Subscription or BOQ credit required. Your 30-day free trial has concluded. Please upgrade your plan or purchase a single BOQ pass to generate AI drawing takeoffs.",
        status: 402
      };
    }
    await consumeBoqCredit(userId);
    return { allowed: true };
  } catch (err) {
    console.warn("Subscription check error, permitting default trial access:", err.message);
    return { allowed: true };
  }
}
export {
  createRateLimiter,
  verifyProjectOwnership,
  verifyTakeoffEntitlement
};

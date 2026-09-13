/**
 * Let's Estimate - Security & Authorization Guard
 * Rate limiting, project ownership verification, and subscription entitlement checks.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { getProjectById, getUserSubscriptionInfo, consumeBoqCredit } from './db.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Creates a sliding-window rate limiter middleware
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const { windowMs, max, message = 'Too many requests. Please try again shortly.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    const identifier = authReq.user?.id || req.ip || req.socket.remoteAddress || 'unknown-client';
    const routeKey = `${req.baseUrl || ''}${req.path}:${identifier}`;
    const now = Date.now();

    let entry = rateLimitStore.get(routeKey);
    if (!entry || now > entry.resetAt) {
      entry = {
        count: 1,
        resetAt: now + windowMs,
      };
      rateLimitStore.set(routeKey, entry);
    } else {
      entry.count += 1;
    }

    if (entry.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        error: message,
        retryAfter: retryAfterSeconds,
      });
      return;
    }

    next();
  };
}

/**
 * Verify project ownership middleware.
 * Ensures the authenticated user owns the requested project, or has admin/owner privileges.
 */
export async function verifyProjectOwnership(
  projectId: string,
  user: { id: string; role?: string }
): Promise<{ allowed: boolean; error?: string; status?: number }> {
  if (!projectId || projectId === 'proj-temp' || projectId === 'sample-hostel-ph') {
    return { allowed: true };
  }

  const project = await getProjectById(projectId);
  if (!project) {
    return { allowed: false, error: 'Project not found.', status: 404 };
  }

  // If project has no assigned owner yet, allow current user to claim or work on it
  if (!project.user_id) {
    return { allowed: true };
  }

  // Check ownership or elevated role
  const isOwner = project.user_id === user.id;
  const isAdmin = user.role === 'Admin' || user.role === 'Owner';

  if (!isOwner && !isAdmin) {
    return {
      allowed: false,
      error: 'Access denied: You do not have permission to modify or analyze this project.',
      status: 403,
    };
  }

  return { allowed: true };
}

/**
 * Verify takeoff subscription and credits.
 * Deducts credit if applicable.
 */
export async function verifyTakeoffEntitlement(
  userId: string
): Promise<{ allowed: boolean; error?: string; status?: number }> {
  try {
    const subInfo = await getUserSubscriptionInfo(userId);

    if (!subInfo.canGenerateBoq) {
      return {
        allowed: false,
        error:
          'Subscription or BOQ credit required. Your 7-day free trial has concluded. Please upgrade your plan or purchase a single BOQ pass to generate AI drawing takeoffs.',
        status: 402,
      };
    }

    // Consume a credit if applicable
    await consumeBoqCredit(userId);
    return { allowed: true };
  } catch (err: any) {
    console.warn('Subscription check error, permitting default trial access:', err.message);
    return { allowed: true };
  }
}

import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { db, users, type User } from "@workspace/db";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export const SUPER_ADMIN_EMAILS = new Set([
  "keithjunior152@gmail.com",
  "keithkungwara@gmail.com",
]);

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function serializeUser(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    grade: u.grade,
    curriculum: u.curriculum,
    subjects: Array.isArray(u.subjects) ? u.subjects : [],
    school: u.school,
    phone: u.phone,
    status: u.status,
    rejectionReason: u.rejectionReason,
    subscriptionStatus: u.subscriptionStatus,
    subscriptionExpiry: u.subscriptionExpiry?.toISOString() ?? null,
    trialStartDate: u.trialStartDate?.toISOString() ?? null,
    referralCode: u.referralCode,
    profilePhotoUrl: u.profilePhotoUrl,
    coverPhotoUrl: u.coverPhotoUrl,
    studyStreak: u.studyStreak,
    totalStudyMinutes: u.totalStudyMinutes,
    isSuperAdmin: u.isSuperAdmin,
    createdAt: (u.createdAt ?? new Date()).toISOString(),
    lastActiveAt: u.lastActiveAt?.toISOString() ?? null,
  };
}

export async function getCurrentUser(req: Request): Promise<User | null> {
  const userId = req.session?.userId;
  if (!userId) return null;
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return u ?? null;
}

export function requireAuth() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    (req as Request & { user: User }).user = user;
    next();
  };
}

export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (user.isSuperAdmin) {
      (req as Request & { user: User }).user = user;
      next();
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    (req as Request & { user: User }).user = user;
    next();
  };
}

export function requireSuperAdmin() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await getCurrentUser(req);
    if (!user || !user.isSuperAdmin) {
      res.status(403).json({ error: "Super admin only" });
      return;
    }
    (req as Request & { user: User }).user = user;
    next();
  };
}

// Whether a student currently has access (active sub not expired, or a live trial).
// Non-students (teacher/parent/school_admin/super_admin) always have access.
export function hasStudentAccess(user: User): boolean {
  if (user.isSuperAdmin || user.role !== "student") return true;
  const now = Date.now();
  if (user.subscriptionStatus === "active") {
    return !user.subscriptionExpiry || user.subscriptionExpiry.getTime() > now;
  }
  if (user.subscriptionStatus === "trial") {
    if (!user.trialStartDate) return true;
    return user.trialStartDate.getTime() + 7 * 86400 * 1000 > now;
  }
  return false;
}

// Server-side paywall: blocks locked students from premium endpoints so the
// client-side lock cannot be bypassed via direct API calls.
export function requireStudentAccess() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!hasStudentAccess(user)) {
      res.status(402).json({ error: "Subscription required" });
      return;
    }
    (req as Request & { user: User }).user = user;
    next();
  };
}

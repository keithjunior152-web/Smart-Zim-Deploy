import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, announcements, users, notifications, type User } from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

function serialize(a: typeof announcements.$inferSelect) {
  return {
    id: a.id,
    title: a.title,
    message: a.message,
    target: a.target,
    priority: a.priority,
    createdBy: a.createdBy,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/announcements", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const rows = await db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(50);
  // Filter by target/role
  const filtered = rows.filter((a) => {
    if (a.target === "all") return true;
    if (a.target === "students" && me.role === "student") return true;
    if (a.target === "teachers" && me.role === "teacher") return true;
    if (a.target === "parents" && me.role === "parent") return true;
    if (a.target === "admins" && (me.role === "school_admin" || me.role === "super_admin" || me.isSuperAdmin)) return true;
    return false;
  });
  res.json(filtered.map(serialize));
});

router.post("/announcements", requireRole("school_admin", "super_admin"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const b = req.body;
  const [a] = await db
    .insert(announcements)
    .values({
      title: b.title,
      message: b.message,
      target: b.target ?? "all",
      priority: b.priority ?? "normal",
      createdBy: me.name,
    })
    .returning();

  // Fan out to notifications
  let recipients = await db.select().from(users);
  if (a.target !== "all") {
    const targetRoleMap: Record<string, string[]> = {
      students: ["student"],
      teachers: ["teacher"],
      parents: ["parent"],
      admins: ["school_admin", "super_admin"],
    };
    const allowed = targetRoleMap[a.target] ?? [];
    recipients = recipients.filter((u) => allowed.includes(u.role) || u.isSuperAdmin);
  }
  for (const r of recipients) {
    await db.insert(notifications).values({
      userId: r.id,
      type: "announcement",
      title: a.title,
      message: a.message,
      link: "/app/announcements",
    });
  }
  res.status(201).json(serialize(a));
});

router.delete("/announcements/:id", requireRole("school_admin", "super_admin"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(announcements).where(eq(announcements.id, id));
  res.status(204).end();
});

export default router;

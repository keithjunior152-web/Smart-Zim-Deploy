import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, curricula, type Curriculum, type CurriculumLevel } from "@workspace/db";
import { requireSuperAdmin } from "../lib/auth";

const router: IRouter = Router();

function serialize(c: Curriculum) {
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    country: c.country,
    levels: Array.isArray(c.levels) ? c.levels : [],
    active: c.active,
    sortOrder: c.sortOrder,
  };
}

function sanitizeLevels(input: unknown): CurriculumLevel[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((l): l is Record<string, unknown> => !!l && typeof l === "object")
    .map((l) => ({
      value: String(l.value ?? ""),
      label: String(l.label ?? ""),
      grades: Array.isArray(l.grades) ? l.grades.map((g) => String(g)) : [],
      subjects: Array.isArray(l.subjects) ? l.subjects.map((s) => String(s)) : [],
    }))
    .filter((l) => l.value && l.label);
}

router.get("/curricula", async (req, res): Promise<void> => {
  const includeInactive = req.query.includeInactive === "true";
  const rows = await db.select().from(curricula).orderBy(asc(curricula.sortOrder), asc(curricula.name));
  const filtered = includeInactive ? rows : rows.filter((c) => c.active);
  res.json(filtered.map(serialize));
});

router.get("/curricula/:code", async (req, res): Promise<void> => {
  const [row] = await db.select().from(curricula).where(eq(curricula.code, String(req.params.code))).limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row));
});

router.post("/curricula", requireSuperAdmin(), async (req, res): Promise<void> => {
  const b = req.body;
  if (!b?.code || !b?.name) {
    res.status(400).json({ error: "code and name are required" });
    return;
  }
  const [existing] = await db.select().from(curricula).where(eq(curricula.code, b.code)).limit(1);
  if (existing) {
    res.status(409).json({ error: "A curriculum with that code already exists" });
    return;
  }
  const [c] = await db
    .insert(curricula)
    .values({
      code: String(b.code),
      name: String(b.name),
      country: b.country ?? null,
      levels: sanitizeLevels(b.levels),
      active: typeof b.active === "boolean" ? b.active : true,
      sortOrder: typeof b.sortOrder === "number" ? b.sortOrder : 0,
    })
    .returning();
  res.status(201).json(serialize(c));
});

router.patch("/curricula/:code", requireSuperAdmin(), async (req, res): Promise<void> => {
  const b = req.body;
  const update: Partial<typeof curricula.$inferInsert> = {};
  if (typeof b?.name === "string") update.name = b.name;
  if (b?.country !== undefined) update.country = b.country ?? null;
  if (b?.levels !== undefined) update.levels = sanitizeLevels(b.levels);
  if (typeof b?.active === "boolean") update.active = b.active;
  if (typeof b?.sortOrder === "number") update.sortOrder = b.sortOrder;
  const [c] = await db.update(curricula).set(update).where(eq(curricula.code, String(req.params.code))).returning();
  if (!c) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(c));
});

export default router;

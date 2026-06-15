import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, paymentSettings } from "@workspace/db";
import { requireAuth, requireSuperAdmin } from "../lib/auth";

const router: IRouter = Router();

function serialize(s: typeof paymentSettings.$inferSelect) {
  return {
    ecocashNumber: s.ecocashNumber,
    innbucksNumber: s.innbucksNumber,
    onemoneyNumber: s.onemoneyNumber,
    whatsappNumber: s.whatsappNumber,
    instructions: s.instructions,
  };
}

async function getOrCreateSettings() {
  const [existing] = await db.select().from(paymentSettings).where(eq(paymentSettings.id, 1)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(paymentSettings).values({ id: 1 }).returning();
  return created;
}

// Any authenticated user can read the payment numbers
router.get("/payment-settings", requireAuth(), async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json(serialize(settings));
});

// Super admin can edit the payment numbers
router.patch("/payment-settings", requireSuperAdmin(), async (req, res): Promise<void> => {
  const b = req.body ?? {};
  await getOrCreateSettings();
  const [updated] = await db
    .update(paymentSettings)
    .set({
      ecocashNumber: String(b.ecocashNumber ?? ""),
      innbucksNumber: String(b.innbucksNumber ?? ""),
      onemoneyNumber: String(b.onemoneyNumber ?? ""),
      whatsappNumber: String(b.whatsappNumber ?? ""),
      instructions: String(b.instructions ?? ""),
    })
    .where(eq(paymentSettings.id, 1))
    .returning();
  res.json(serialize(updated));
});

export default router;

import express from "express";
import { supabaseAdmin } from "./utils/supabase-admin";
import { verifySupabaseJwt } from "./utils/auth";

const router = express.Router();

// GET /api/admin/settings - returns app settings (e.g., referral_reward)
router.get("/settings", verifySupabaseJwt(true), async (req: any, res) => {
  try {
    const { data } = await supabaseAdmin.from("app_settings").select("key, value");
    res.json({ settings: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/settings - update a setting
router.put("/settings", verifySupabaseJwt(true), async (req: any, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: "Missing key" });
  try {
    await supabaseAdmin.from("app_settings").upsert({ key, value });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/signed-url?path=... - returns signed GET URL for private bucket
router.get("/signed-url", verifySupabaseJwt(true), async (req: any, res) => {
  const { path } = req.query;
  if (!path) return res.status(400).json({ error: "Missing path" });
  try {
    const PRIVATE_BUCKET = process.env.NEXT_PUBLIC_BUCKET_PRIVATE ?? "payments-proofs";
    const { data } = await supabaseAdmin.storage.from(PRIVATE_BUCKET).createSignedUrl(path, 60 * 10); // 10 minutes
    res.json({ signedUrl: data.signedUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

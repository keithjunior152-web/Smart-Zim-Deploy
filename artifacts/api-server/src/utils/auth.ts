import { supabaseAdmin } from "./utils/supabase-admin";

// Express middleware factory to verify Supabase JWT and optionally require admin
export function verifySupabaseJwt(requireAdmin = false) {
  return async (req: any, res: any, next: any) => {
    try {
      const authHeader = (req.headers?.authorization || req.headers?.Authorization) as string | undefined;
      if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing Authorization header" });
      const token = authHeader.slice("Bearer ".length);

      // Get user from Supabase using the service role client
      // Note: supabaseAdmin.auth.getUser expects { access_token }
      const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token as string);
      if (userErr || !userData?.user) return res.status(401).json({ error: "Invalid token" });

      req.user = userData.user;

      if (requireAdmin) {
        // Check is_admin flag in auth.users
        const { data: rows, error: qErr } = await supabaseAdmin
          .from("users")
          .select("is_admin")
          .eq("id", req.user.id)
          .limit(1)
          .single();
        if (qErr || !rows || rows.is_admin !== true) return res.status(403).json({ error: "Admin required" });
      }

      return next();
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };
}

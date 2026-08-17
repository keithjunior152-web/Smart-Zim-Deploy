import { useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

export type UploadResult = {
  objectPath: string;
  publicUrl?: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const PUBLIC_BUCKET = process.env.NEXT_PUBLIC_BUCKET_PUBLIC ?? "user-uploads";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

export function useUploadSupabase() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const uploadFile = useCallback(async (file: File, userId: string): Promise<UploadResult | null> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const allowed = ["image/png", "image/jpeg", "image/webp"];
      if (!allowed.includes(file.type)) throw new Error("Invalid file type");
      const maxBytes = 200 * 1024 * 1024; // 200MB
      if (file.size > maxBytes) throw new Error("File too large (max 200MB)");

      const ext = file.name.split(".").pop() ?? "bin";
      const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage.from(PUBLIC_BUCKET).upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(filename);
      setProgress(100);
      return { objectPath: filename, publicUrl: data.publicUrl };
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Upload failed"));
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { uploadFile, isUploading, progress, error };
}

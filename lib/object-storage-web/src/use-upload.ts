import { useState, useCallback } from "react";

export interface UploadResponse {
  objectPath: string;
}

interface UseUploadOptions {
  basePath?: string;
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const basePath = options.basePath ?? "/api/storage";
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResponse | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        // Step 1: ask the server for a short-lived signed upload URL.
        const urlRes = await fetch(`${basePath}/upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: file.type || "application/octet-stream" }),
        });

        if (!urlRes.ok) {
          const body = await urlRes.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `Failed to prepare upload (${urlRes.status})`);
        }

        const { uploadUrl, objectPath } = (await urlRes.json()) as { uploadUrl: string; objectPath: string };

        // Step 2: upload the file straight to storage from the browser,
        // bypassing this server (and any serverless body-size limits).
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed (${xhr.status})`));
          };
          xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
          xhr.send(file);
        });

        const data: UploadResponse = { objectPath };
        setProgress(100);
        options.onSuccess?.(data);
        return data;
      } catch (err) {
        const e = err instanceof Error ? err : new Error("Upload failed");
        setError(e);
        options.onError?.(e);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [basePath, options],
  );

  return { uploadFile, isUploading, error, progress };
}

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
        const formData = new FormData();
        formData.append("file", file);

        const data = await new Promise<UploadResponse>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `${basePath}/uploads`);
          xhr.withCredentials = true;
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText) as UploadResponse);
              } catch {
                reject(new Error("Invalid response from server"));
              }
            } else {
              let msg = `Upload failed (${xhr.status})`;
              try { msg = (JSON.parse(xhr.responseText) as { error?: string }).error ?? msg; } catch { /* ignore */ }
              reject(new Error(msg));
            }
          };
          xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
          xhr.send(formData);
        });

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

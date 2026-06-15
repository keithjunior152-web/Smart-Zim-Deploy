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
      setProgress(10);

      try {
        const formData = new FormData();
        formData.append("file", file);

        setProgress(30);

        const res = await fetch(`${basePath}/uploads`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `Upload failed (${res.status})`);
        }

        const data: UploadResponse = await res.json();
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

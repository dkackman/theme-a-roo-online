import { useCallback, useState } from "react";
import { toast } from "sonner";
import { uploadThemeFile, type UploadOptions } from "../lib/theme-files";

export interface UseUploadThemeFileReturn {
  upload: (options: UploadOptions) => Promise<unknown>;
  progress: number;
  loading: boolean;
  error: Error | null;
}

export function useUploadThemeFile(): UseUploadThemeFileReturn {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(async (options: UploadOptions) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const result = await uploadThemeFile({
        ...options,
        onProgress: (p) => setProgress(p),
      });

      setLoading(false);
      setProgress(100);
      toast.success("File uploaded successfully");

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(err instanceof Error ? err : new Error(errorMessage));
      setLoading(false);
      setProgress(0);

      // Show error toast
      if (typeof err === "object" && err !== null && "body" in err) {
        const errorBody = (err as { body: { error?: string } }).body;
        toast.error(errorBody?.error || "Upload failed");
      } else {
        toast.error(errorMessage);
      }

      throw err;
    }
  }, []);

  return { upload, progress, loading, error };
}

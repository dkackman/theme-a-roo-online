import { supabase } from "./supabaseClient";

export type FileUseType = "background" | "preview" | "banner";

// Get the Supabase URL from environment variable
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

export interface UploadOptions {
  file: File;
  theme_id: string;
  file_use_type?: FileUseType;
  onProgress?: (percentage: number) => void;
  maxRetries?: number;
}

export interface ThemeFileResponse {
  id?: string;
  storage_path?: string;
  file_url?: string;
  message?: string;
  [key: string]: unknown;
}

export interface UploadError {
  status: number;
  body: {
    error?: string;
    [key: string]: unknown;
  };
}

/**
 * Upload a theme file using the Edge Function
 */
export async function uploadThemeFile({
  file,
  theme_id,
  file_use_type = "preview",
  onProgress,
  maxRetries = 2,
}: UploadOptions): Promise<ThemeFileResponse> {
  if (!file) {
    throw new Error("File is required");
  }
  if (!theme_id) {
    throw new Error("theme_id is required");
  }

  // Get JWT token from supabase client
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(`Session error: ${sessionError.message}`);
  }

  const jwt = session?.access_token;
  if (!jwt) {
    throw new Error("Not authenticated");
  }

  // Debug logging - following Supabase's recommendation
  console.log("Session user:", session?.user?.id);
  console.log("access_token:", session?.access_token);
  console.log("JWT token segments:", jwt.split('.').length);
  console.log("JWT token preview:", jwt.substring(0, 50) + "...");

  // Build form data
  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("theme_id", theme_id);
  formData.append("file_use_type", file_use_type);

  // Use XMLHttpRequest to enable upload progress
  async function sendRequest(): Promise<ThemeFileResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Use the Supabase Edge Functions URL
      // The edge function should be named "theme-files" and have an "upload" handler
      // Note: The edge function path is just "/upload", not "/theme-files/upload"
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/theme-files/upload`;
      console.log("Edge Function URL:", edgeFunctionUrl);
      console.log("Full Authorization header:", `Bearer ${jwt}`);

      xhr.open("POST", edgeFunctionUrl, true);
      xhr.setRequestHeader("Authorization", `Bearer ${jwt}`);

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable || !onProgress) {
          return;
        }
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText);
            resolve(json);
          } catch (err) {
            resolve(xhr.responseText as unknown as ThemeFileResponse);
          }
        } else {
          let errorBody: { error?: string;[key: string]: unknown };
          try {
            errorBody = JSON.parse(xhr.responseText);
          } catch (e) {
            errorBody = { error: xhr.responseText || xhr.statusText };
          }
          console.error("Edge Function Error:", xhr.status, errorBody);
          const error: UploadError = { status: xhr.status, body: errorBody };
          reject(error);
        }
      };

      xhr.onerror = () => {
        const error: UploadError = { status: xhr.status || 0, body: { error: "Network error" } };
        reject(error);
      };

      xhr.ontimeout = () => {
        const error: UploadError = { status: xhr.status || 0, body: { error: "Timeout" } };
        reject(error);
      };

      xhr.send(formData);
    });
  }

  // Retry loop with exponential backoff
  let attempts = 0;
  while (attempts <= maxRetries) {
    try {
      const result = await sendRequest();
      return result;
    } catch (err) {
      attempts += 1;
      if (attempts > maxRetries) {
        throw err;
      }
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 500 * attempts));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error("Upload failed after all retries");
}

/**
 * Delete a theme file
 * TODO: Implement once Edge Function endpoint is available
 */
export async function deleteThemeFile(
  theme_id: string,
  file_use_type: FileUseType
): Promise<void> {
  // Get JWT token from supabase client
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(`Session error: ${sessionError.message}`);
  }

  const jwt = session?.access_token;
  if (!jwt) {
    throw new Error("Not authenticated");
  }

  // TODO: Implement DELETE request to Edge Function
  // For now, just throw an error indicating it's not implemented
  throw new Error("Delete functionality not yet implemented");

  // Example implementation:
  /*
  const response = await fetch(`/functions/theme-files/${theme_id}/${file_use_type}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete file");
  }
  */
}

/**
 * Get theme files for a given theme
 * TODO: Implement once Edge Function or storage query is available
 */
export async function getThemeFiles(theme_id: string): Promise<{
  background?: string;
  preview?: string;
  banner?: string;
}> {
  // TODO: Implement fetch from storage or Edge Function
  // For now, return empty object
  return {};
}

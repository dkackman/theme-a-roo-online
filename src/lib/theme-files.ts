import { supabase } from "./supabase-client";

export type FileUseType = "background" | "preview" | "banner";

// Get the Supabase URL from environment variable
const SUPABASE_URL =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_SUPABASE_DEV_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      ""
    : process.env.NEXT_PUBLIC_SUPABASE_URL || "";

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

  // Build form data
  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("theme_id", theme_id);
  formData.append("file_use_type", file_use_type);

  // Use XMLHttpRequest to enable upload progress
  function sendRequest(): Promise<ThemeFileResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Use the Supabase Edge Functions URL
      // The edge function should be named "theme-files" and have an "upload" handler
      // Note: The edge function path is just "/upload", not "/theme-files/upload"
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/theme-files/upload`;
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
          } catch {
            resolve(xhr.responseText as unknown as ThemeFileResponse);
          }
        } else {
          let errorBody: { error?: string; [key: string]: unknown };
          try {
            errorBody = JSON.parse(xhr.responseText);
          } catch {
            errorBody = { error: xhr.responseText || xhr.statusText };
          }
          console.error("Edge Function Error:", xhr.status, errorBody);
          const error: UploadError = { status: xhr.status, body: errorBody };
          reject(error);
        }
      };

      xhr.onerror = () => {
        const error: UploadError = {
          status: xhr.status || 0,
          body: { error: "Network error" },
        };
        reject(error);
      };

      xhr.ontimeout = () => {
        const error: UploadError = {
          status: xhr.status || 0,
          body: { error: "Timeout" },
        };
        reject(error);
      };

      xhr.send(formData);
    });
  }

  // Retry loop with exponential backoff
  let attempts = 0;
  while (attempts <= maxRetries) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await sendRequest();
      return result;
    } catch (err) {
      attempts += 1;
      if (attempts > maxRetries) {
        throw err;
      }
      // Exponential backoff
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 500 * attempts));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error("Upload failed after all retries");
}

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

  // Find the file ID by theme_id, file_use_type, and user_id
  const { data: file, error: fileError } = await supabase
    .from("theme_files")
    .select("id")
    .eq("theme_id", theme_id)
    .eq("file_use_type", file_use_type)
    .eq("user_id", session.user.id)
    .single();

  if (fileError || !file) {
    throw new Error(`File not found: ${fileError?.message || "No file found"}`);
  }

  // Call the edge function to delete the file
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/theme-files/delete?id=${encodeURIComponent(file.id)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      error: response.statusText,
    }));
    throw new Error(errorBody.error || "Failed to delete file");
  }
}

async function getThemeFileUrl(
  fileId: string,
  jwt: string
): Promise<string | undefined> {
  try {
    const url = new URL(`${SUPABASE_URL}/functions/v1/theme-files/url`);
    url.searchParams.set("id", fileId);
    url.searchParams.set("public", "true");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!res.ok) {
      return undefined;
    }

    const json = (await res.json()) as { url?: string };
    return json.url;
  } catch {
    return undefined;
  }
}

export async function getThemeFiles(theme_id: string): Promise<{
  background?: string;
  preview?: string;
  banner?: string;
}> {
  try {
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

    // Fetch theme files for this user/theme
    const { data: files, error: filesError } = await supabase
      .from("theme_files")
      .select("id, file_use_type")
      .eq("theme_id", theme_id)
      .eq("user_id", session.user.id);

    if (filesError) {
      throw new Error(`Failed to fetch theme files: ${filesError.message}`);
    }

    const result: {
      background?: string;
      preview?: string;
      banner?: string;
    } = {};

    if (!files || files.length === 0) {
      return result;
    }

    // Get both full-size URLs and thumbnail URLs
    const [fullSizeUrls] = await Promise.all([
      // Full-size URLs (no width parameter)
      Promise.all(
        files.map(async (f) => {
          const url = await getThemeFileUrl(f.id, jwt);
          return { type: f.file_use_type as FileUseType, url };
        })
      ),
    ]);

    // Map full-size URLs
    for (const { type, url } of fullSizeUrls) {
      if (url) {
        switch (type) {
          case "background":
            result.background = url;
            break;
          case "preview":
            result.preview = url;
            break;
          case "banner":
            result.banner = url;
            break;
        }
      }
    }

    return result;
  } catch (error) {
    console.error("Error fetching theme files:", error);
    return {};
  }
}

export async function getThemeFilePublicUrl(
  theme_id: string,
  file_use_type: FileUseType
): Promise<string | undefined> {
  try {
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

    const { data: file, error: fileError } = await supabase
      .from("theme_files")
      .select("id")
      .eq("theme_id", theme_id)
      .eq("file_use_type", file_use_type)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (fileError) {
      throw new Error(fileError.message);
    }

    if (!file) {
      return undefined;
    }

    return getThemeFileUrl(file.id, jwt);
  } catch (error) {
    console.error("Error fetching theme file url:", error);
    return undefined;
  }
}

export async function updateThemeFileIpfsUrl(
  theme_id: string,
  file_use_type: FileUseType,
  ipfs_url: string
): Promise<void> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(`Session error: ${sessionError.message}`);
    }

    if (!session?.user) {
      throw new Error("Not authenticated");
    }

    const { error: updateError } = await supabase
      .from("theme_files")
      .update({ ipfs_url })
      .eq("theme_id", theme_id)
      .eq("file_use_type", file_use_type)
      .eq("user_id", session.user.id);

    if (updateError) {
      throw new Error(`Failed to update IPFS URL: ${updateError.message}`);
    }
  } catch (error) {
    console.error("Error updating theme file IPFS URL:", error);
    throw error;
  }
}

export async function getThemeFileIpfsUrls(theme_id: string): Promise<{
  background?: string;
  preview?: string;
  banner?: string;
}> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(`Session error: ${sessionError.message}`);
    }

    if (!session?.user) {
      throw new Error("Not authenticated");
    }

    const { data: files, error: filesError } = await supabase
      .from("theme_files")
      .select("file_use_type, ipfs_url")
      .eq("theme_id", theme_id)
      .eq("user_id", session.user.id);

    if (filesError) {
      throw new Error(`Failed to fetch IPFS URLs: ${filesError.message}`);
    }

    const result: {
      background?: string;
      preview?: string;
      banner?: string;
    } = {};

    if (files) {
      for (const file of files) {
        if (file.ipfs_url) {
          const fileType = file.file_use_type as FileUseType;
          switch (fileType) {
            case "background":
              result.background = file.ipfs_url;
              break;
            case "preview":
              result.preview = file.ipfs_url;
              break;
            case "banner":
              result.banner = file.ipfs_url;
              break;
          }
        }
      }
    }

    return result;
  } catch (error) {
    console.error("Error fetching theme file IPFS URLs:", error);
    return {};
  }
}

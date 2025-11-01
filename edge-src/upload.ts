import type { SupabaseClient } from "@supabase/supabase-js";
import { JSON_HEADERS } from "./headers.ts";

export async function upload(
  req: Request,
  rlsClient: SupabaseClient,
  user_id: string,
  supabase: SupabaseClient
) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return new Response(
      JSON.stringify({
        error: "Content-Type must be multipart/form-data",
      }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }
  const form = await req.formData();
  const file = form.get("file");
  const theme_id = form.get("theme_id");
  const file_use_type = form.get("file_use_type") || "preview";
  if (!file || !(file instanceof File)) {
    return new Response(
      JSON.stringify({
        error: "Missing file",
      }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }
  if (!theme_id) {
    return new Response(
      JSON.stringify({
        error: "Missing theme_id",
      }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }

  // Check for existing file and delete it if present (to replace/overwrite)
  const existingFile = await rlsClient
    .from("theme_files")
    .select("id, storage_path")
    .eq("theme_id", theme_id)
    .eq("file_use_type", file_use_type)
    .eq("user_id", user_id)
    .maybeSingle();

  if (existingFile.data) {
    // Delete old file from storage if it exists
    if (existingFile.data.storage_path) {
      const [bucket, ...parts] = existingFile.data.storage_path.split("/");
      const pathKey = parts.join("/");
      await supabase.storage.from(bucket).remove([pathKey]);
    }
    // Delete old database record
    await rlsClient.from("theme_files").delete().eq("id", existingFile.data.id);
  }

  // User is already validated above, use the user object
  const insert = await rlsClient
    .from("theme_files")
    .insert([
      {
        theme_id,
        user_id,
        file_use_type,
      },
    ])
    .select("id")
    .single();
  if (insert.error) {
    return new Response(
      JSON.stringify({
        error: insert.error.message,
      }),
      {
        status: 500,
        headers: JSON_HEADERS,
      }
    );
  }
  const id = insert.data.id;
  const mime = file.type || "application/octet-stream";
  const ext = mime.split("/").pop()?.split("+")[0] || "bin";
  const key = `${user_id}/${theme_id}/${id}.${ext}`;
  const BUCKET = "theme-files";
  const body = await file.arrayBuffer();
  const upload = await supabase.storage
    .from(BUCKET)
    .upload(key, new Uint8Array(body), {
      contentType: mime,
    });
  if (upload.error) {
    await rlsClient.from("theme_files").delete().eq("id", id);
    return new Response(
      JSON.stringify({
        error: upload.error.message,
      }),
      {
        status: 500,
        headers: JSON_HEADERS,
      }
    );
  }
  const storage_path = `${BUCKET}/${key}`;
  const size = body.byteLength;
  // Update the record with all metadata at once
  const { error: updErr } = await rlsClient
    .from("theme_files")
    .update({
      storage_path,
      mime_type: mime,
      size,
    })
    .eq("id", id);
  if (updErr) {
    console.error("Failed to update metadata:", updErr);
    return new Response(
      JSON.stringify({
        error: updErr.message,
      }),
      {
        status: 500,
        headers: JSON_HEADERS,
      }
    );
  }
  return new Response(
    JSON.stringify({
      id,
      storage_path,
    }),
    {
      status: 201,
      headers: JSON_HEADERS,
    }
  );
}

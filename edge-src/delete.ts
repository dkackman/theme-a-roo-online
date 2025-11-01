import type { SupabaseClient } from "@supabase/supabase-js";
import { JSON_HEADERS } from "./headers.ts";

export async function deleteFile(
  url: URL,
  rlsClient: SupabaseClient,
  supabase: SupabaseClient
) {
  const id = url.searchParams.get("id");
  if (!id) {
    return new Response(
      JSON.stringify({
        error: "Missing id",
      }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }
  const meta = await rlsClient
    .from("theme_files")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (meta.error) {
    return new Response(
      JSON.stringify({
        error: meta.error.message,
      }),
      {
        status: 404,
        headers: JSON_HEADERS,
      }
    );
  }
  const storage_path = meta.data.storage_path;
  const del = await rlsClient.from("theme_files").delete().eq("id", id);
  if (del.error) {
    return new Response(
      JSON.stringify({
        error: del.error.message,
      }),
      {
        status: 500,
        headers: JSON_HEADERS,
      }
    );
  }
  if (storage_path) {
    const [bucket, ...parts] = storage_path.split("/");
    const pathKey = parts.join("/");
    await supabase.storage.from(bucket).remove([pathKey]);
  }
  return new Response(
    JSON.stringify({
      success: true,
    }),
    {
      status: 200,
      headers: JSON_HEADERS,
    }
  );
}

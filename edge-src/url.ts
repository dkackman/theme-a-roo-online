import type { SupabaseClient } from "@supabase/supabase-js";
import { CORS_HEADERS } from "./cors.ts";

export async function getUrl(
  url: URL,
  rlsClient: SupabaseClient,
  supabase: SupabaseClient,
) {
  const id = url.searchParams.get("id");
  if (!id) {
    return new Response(
      JSON.stringify({
        error: "Missing id",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      },
    );
  }
  const meta = await rlsClient.from("theme_files").select("storage_path")
    .eq("id", id).single();
  if (meta.error) {
    return new Response(
      JSON.stringify({
        error: meta.error.message,
      }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      },
    );
  }
  const storage_path = meta.data.storage_path;
  if (!storage_path) {
    return new Response(
      JSON.stringify({
        error: "No storage_path set",
      }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      },
    );
  }
  const [bucket, ...parts] = storage_path.split("/");
  const pathKey = parts.join("/");
  const { data } = await supabase.storage.from(bucket).createSignedUrl(
    pathKey,
    60,
  );
  if (data?.signedUrl) {
    return new Response(
      JSON.stringify({
        url: data.signedUrl,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      },
    );
  }

  return new Response(
    JSON.stringify({
      error: "Could not create signed URL",
    }),
    {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    },
  );
}

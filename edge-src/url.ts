import type { SupabaseClient } from "@supabase/supabase-js";
import { JSON_HEADERS } from "./headers.ts";

export async function getUrl(
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

  // Optional parameters
  const usePublic = url.searchParams.get("public") === "true";

  const meta = await rlsClient
    .from("theme_files")
    .select("storage_path, mime_type")
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
  if (!storage_path) {
    return new Response(
      JSON.stringify({
        error: "No storage_path set",
      }),
      {
        status: 404,
        headers: JSON_HEADERS,
      }
    );
  }
  const [bucket, ...parts] = storage_path.split("/");
  const pathKey = parts.join("/");

  // Use public URL if requested (requires bucket to be public)
  if (usePublic) {
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(pathKey);

    // getPublicUrl always returns a URL, but we verify it's in the correct format
    // Public URLs should be: /storage/v1/object/public/...
    // Signed URLs have: /storage/v1/object/sign/... with token parameter
    if (publicUrlData?.publicUrl) {
      const publicUrl = publicUrlData.publicUrl;
      // Verify it's actually a public URL format (not a signed URL)
      if (
        publicUrl.includes("/object/public/") &&
        !publicUrl.includes("token=")
      ) {
        return new Response(
          JSON.stringify({
            url: publicUrl,
          }),
          {
            status: 200,
            headers: JSON_HEADERS,
          }
        );
      }
    }
    // If public URL format is incorrect or missing, fall through to signed URL
  }

  // Regular signed URL (no transformation)
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(pathKey, 3600);
  if (data?.signedUrl) {
    return new Response(
      JSON.stringify({
        url: data.signedUrl,
      }),
      {
        status: 200,
        headers: JSON_HEADERS,
      }
    );
  }

  return new Response(
    JSON.stringify({
      error: "Could not create signed URL",
    }),
    {
      status: 500,
      headers: JSON_HEADERS,
    }
  );
}

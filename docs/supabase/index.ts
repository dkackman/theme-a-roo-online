import { createClient } from "npm:@supabase/supabase-js@2.33.0";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_URL || !SERVICE_ROLE)
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: {
    persistSession: false,
  },
});

// Configure CORS
const ALLOW_ORIGIN = "*"; // <-- For production, replace '*' with your frontend origin
const ALLOW_METHODS = "GET,POST,DELETE,OPTIONS";
const ALLOW_HEADERS = "Authorization,Content-Type";
const EXPOSE_HEADERS = "Content-Length,Content-Type";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOW_ORIGIN,
    "Access-Control-Allow-Methods": ALLOW_METHODS,
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Access-Control-Expose-Headers": EXPOSE_HEADERS,
    // Allow credentials if you need to send cookies or HTTP auth credentials (note: Access-Control-Allow-Origin cannot be '*' when credentials are true)
    // 'Access-Control-Allow-Credentials': 'true',
  };
}

Deno.serve(
  async (req) => {
    const url = new URL(req.url);
    const pathname = url.pathname.replace(/\/$/, "");
    // Handle preflight requests early
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    // simple auth: expect Authorization: Bearer <jwt>
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(),
        },
      });
    }
    const jwt = authHeader.split(" ")[1];

    // Validate the JWT token using the service role client
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(jwt);
    if (error || !user) {
      return new Response(
        JSON.stringify({
          error: "Invalid user - bad JWT",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(),
          },
        }
      );
    }

    // Create a client for RLS-protected reads using the user's JWT
    const rlsClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    });

    try {
      if (req.method === "POST" && pathname.endsWith("/upload")) {
        const contentType = req.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) {
          return new Response(
            JSON.stringify({
              error: "Content-Type must be multipart/form-data",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders() },
            }
          );
        }
        const form = await req.formData();
        const file = form.get("file");
        const theme_id = form.get("theme_id");
        const file_use_type = form.get("file_use_type") || "preview";
        if (!file || !(file instanceof File))
          return new Response(JSON.stringify({ error: "Missing file" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders() },
          });
        if (!theme_id)
          return new Response(JSON.stringify({ error: "Missing theme_id" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders() },
          });

        // User is already validated above, use the user object
        const user_id = user.id;

        const insert = await rlsClient
          .from("theme_files")
          .insert([{ theme_id, user_id, file_use_type }])
          .select("id")
          .single();
        if (insert.error)
          return new Response(JSON.stringify({ error: insert.error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders() },
          });
        const id = insert.data.id;

        const mime = (file as File).type || "application/octet-stream";
        const ext = mime.split("/").pop()?.split("+")[0] || "bin";
        const key = `${user_id}/${theme_id}/${id}.${ext}`;
        const BUCKET = "theme-files";

        const body = await (file as File).arrayBuffer();
        const upload = await supabase.storage
          .from(BUCKET)
          .upload(key, new Uint8Array(body), { contentType: mime });
        if (upload.error) {
          await rlsClient.from("theme_files").delete().eq("id", id);
          return new Response(JSON.stringify({ error: upload.error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders() },
          });
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
          return new Response(JSON.stringify({ error: updErr.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders() },
          });
        }

        return new Response(JSON.stringify({ id, storage_path }), {
          status: 201,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      if (req.method === "GET" && pathname.endsWith("/url")) {
        const id = url.searchParams.get("id");
        if (!id)
          return new Response(JSON.stringify({ error: "Missing id" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders() },
          });

        const meta = await rlsClient
          .from("theme_files")
          .select("storage_path")
          .eq("id", id)
          .single();
        if (meta.error)
          return new Response(JSON.stringify({ error: meta.error.message }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders() },
          });

        const storage_path = meta.data.storage_path;
        if (!storage_path)
          return new Response(
            JSON.stringify({ error: "No storage_path set" }),
            {
              status: 404,
              headers: { "Content-Type": "application/json", ...corsHeaders() },
            }
          );

        const [bucket, ...parts] = storage_path.split("/");
        const pathKey = parts.join("/");
        const { data } = await supabase.storage
          .from(bucket)
          .createSignedUrl(pathKey, 60);
        if (data?.signedURL) {
          return new Response(JSON.stringify({ url: data.signedURL }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders() },
          });
        }
        return new Response(
          JSON.stringify({ error: "Could not create signed URL" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders() },
          }
        );
      }

      if (req.method === "DELETE" && pathname.endsWith("/delete")) {
        const id = url.searchParams.get("id");
        if (!id)
          return new Response(JSON.stringify({ error: "Missing id" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders() },
          });

        const meta = await rlsClient
          .from("theme_files")
          .select("storage_path")
          .eq("id", id)
          .single();
        if (meta.error)
          return new Response(JSON.stringify({ error: meta.error.message }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders() },
          });

        const storage_path = meta.data.storage_path;
        const del = await rlsClient.from("theme_files").delete().eq("id", id);
        if (del.error)
          return new Response(JSON.stringify({ error: del.error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders() },
          });

        if (storage_path) {
          const [bucket, ...parts] = storage_path.split("/");
          const pathKey = parts.join("/");
          await supabase.storage.from(bucket).remove([pathKey]);
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (err) {
      console.error(err);
      return new Response(
        JSON.stringify({ error: err.message || String(err) }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      );
    }
  },
  { port: 8080 }
);

import { createClient } from "@supabase/supabase-js";
import { deleteFile } from "./delete.ts";
import { CORS_HEADERS, JSON_HEADERS } from "./headers.ts";
import { upload } from "./upload.ts";
import { getUrl } from "./url.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: {
    persistSession: false,
  },
});

Deno.serve(
  {
    port: 8080,
  },
  async (req) => {
    const url = new URL(req.url);
    const pathname = url.pathname.replace(/\/$/, "");
    // Handle preflight requests early
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // simple auth: expect Authorization: Bearer <jwt>
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          error: "Missing Authorization",
        }),
        {
          status: 401,
          headers: JSON_HEADERS,
        }
      );
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
          error: "Invalid user",
        }),
        {
          status: 401,
          headers: JSON_HEADERS,
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
        return await upload(req, rlsClient, user.id, supabase);
      }

      if (req.method === "GET" && pathname.endsWith("/url")) {
        return await getUrl(url, rlsClient, supabase);
      }

      if (req.method === "DELETE" && pathname.endsWith("/delete")) {
        return await deleteFile(url, rlsClient, supabase);
      }

      return new Response(
        JSON.stringify({
          error: "Not found",
        }),
        {
          status: 404,
          headers: JSON_HEADERS,
        }
      );
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      return new Response(
        JSON.stringify({
          error: errorMessage,
        }),
        {
          status: 500,
          headers: JSON_HEADERS,
        }
      );
    }
  }
);

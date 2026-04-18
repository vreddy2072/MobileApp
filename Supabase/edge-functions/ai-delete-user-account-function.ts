import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireSupabaseUser } from "./_shared/auth.ts";

const DEBUG_LOG = Deno.env.get("DEBUG_LOG") === "true";
function log(...args: unknown[]) {
  if (DEBUG_LOG) console.log(...args);
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info, x-app-name",
};

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { status: 200, headers: JSON_HEADERS });
    }
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST allowed" }), {
        status: 405,
        headers: JSON_HEADERS,
      });
    }

    const auth = await requireSupabaseUser(req, JSON_HEADERS);
    if (!auth.ok) return auth.response;
    const userId = auth.user_id;
    log("Authenticated user:", userId);

    let body: { app_name?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const rawName = body.app_name;
    if (!rawName || typeof rawName !== "string" || rawName.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "Missing or invalid 'app_name' in request body",
        }),
        { status: 400, headers: JSON_HEADERS }
      );
    }
    const appName = rawName.trim();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({
          error: "Server configuration error: Supabase credentials missing",
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: appRow, error: appErr } = await supabase
      .from("apps")
      .select("app_name")
      .eq("app_name", appName)
      .maybeSingle();

    if (appErr) {
      console.error("apps lookup error:", appErr);
      return new Response(
        JSON.stringify({ error: "Failed to validate app", details: appErr.message }),
        { status: 500, headers: JSON_HEADERS }
      );
    }
    if (!appRow) {
      return new Response(
        JSON.stringify({
          error: `Unknown or unregistered app_name: ${appName}`,
        }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const { error: delErr } = await supabase
      .from("users")
      .delete()
      .eq("user_id", userId)
      .eq("app_name", appName);

    if (delErr) {
      console.error("delete public.users error:", delErr);
      return new Response(
        JSON.stringify({
          error: "Failed to delete app user data",
          details: delErr.message,
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    const { count, error: countErr } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countErr) {
      console.error("count users error:", countErr);
      return new Response(
        JSON.stringify({
          error: "Failed to verify remaining user records",
          details: countErr.message,
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    if (count === 0) {
      const { error: adminErr } = await supabase.auth.admin.deleteUser(userId);
      if (adminErr) {
        console.error("auth.admin.deleteUser error:", adminErr);
        return new Response(
          JSON.stringify({
            error: "App data removed but auth user deletion failed",
            details: adminErr.message,
          }),
          { status: 500, headers: JSON_HEADERS }
        );
      }
      log("Deleted auth user", userId);
    } else {
      log("Skipped auth delete; user has other app rows", { userId, remaining: count });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        auth_user_deleted: count === 0,
      }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (err) {
    console.error("ai-delete-user-account-function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
});

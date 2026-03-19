import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireSupabaseUser } from "./_shared/auth.ts";
const DEBUG_LOG = Deno.env.get("DEBUG_LOG") === "true";
function log(...args) {
  if (DEBUG_LOG) {
    console.log(...args);
  }
}
log("upsert-user-login-function started");
const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info"
};
// ---------- Main Handler ----------
Deno.serve(async (req)=>{
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        status: 200,
        headers: JSON_HEADERS
      });
    }
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: "Only POST allowed"
      }), {
        status: 405,
        headers: JSON_HEADERS
      });
    }
    // 1. Verify Supabase Auth and get userId from the token
    const auth = await requireSupabaseUser(req, JSON_HEADERS);
    if (!auth.ok) {
      return auth.response;
    }
    const userId = auth.user_id;
    log(`Authenticated user: ${userId}`);
    // No body parsing is needed as user_id is retrieved from the JWT token.
    // 2. Initialize Supabase client using explicit environment variables
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error("Supabase configuration missing");
      return new Response(JSON.stringify({
        error: "Server configuration error: Supabase credentials missing"
      }), {
        status: 500,
        headers: JSON_HEADERS
      });
    }
    // 2. Parse body to get app_name
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return new Response(JSON.stringify({
        error: "Invalid JSON in request body"
      }), {
        status: 400,
        headers: JSON_HEADERS
      });
    }
    const appName = body.app_name;
    // 3. Validate app_name from client
    if (!appName || typeof appName !== 'string' || appName.trim().length === 0) {
      return new Response(JSON.stringify({
        error: "Missing or invalid 'app_name' in request body"
      }), {
        status: 400,
        headers: JSON_HEADERS
      });
    }
    const supabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    // 3. Call the PostgreSQL function via RPC
    const { error: rpcError } = await supabaseClient.rpc('upsert_user_login', {
      // The key 'p_user_id' MUST match the parameter name in your SQL function
      p_user_id: userId,
      p_app_name: appName
    });
    // 4. Handle RPC errors (e.g., database issues)
    if (rpcError) {
      console.error("Error calling upsert_user_login:", rpcError);
      return new Response(JSON.stringify({
        error: "Database operation failed",
        details: rpcError.message
      }), {
        status: 500,
        headers: JSON_HEADERS
      });
    }
    // 5. Return success response
    log(`User ${userId} login recorded successfully for app ${appName}.`);
    return new Response(JSON.stringify({
      message: `User ${userId} login recorded successfully.`,
      operation: "upserted"
    }), {
      status: 200,
      headers: JSON_HEADERS
    });
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(JSON.stringify({
      error: "Internal server error"
    }), {
      status: 500,
      headers: JSON_HEADERS
    });
  }
});

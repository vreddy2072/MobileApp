import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireSupabaseUser } from "./_shared/auth.ts";
const DEBUG_LOG = Deno.env.get("DEBUG_LOG") === "true";
function log(...args) {
  if (DEBUG_LOG) {
    console.log(...args);
  }
}
log("get-user-balance-function started");
const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info"
};
// ---------- Main Handler ----------
Deno.serve(async (req)=>{
  try {
    // Handle OPTIONS pre-flight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
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
    // 1. Verify Supabase Auth and get userId
    const auth = await requireSupabaseUser(req, JSON_HEADERS);
    if (!auth.ok) {
      return auth.response;
    }
    const userId = auth.user_id;
    log(`Authenticated user: ${userId}`);
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
    // 4. Initialize Supabase client
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
    const supabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    // 5. Call the PostgreSQL function via RPC
    // The function handles app existence check, wallet creation/initialization, and balance retrieval.
    const { data: balance, error: rpcError } = await supabaseClient.rpc('get_user_balance', {
      p_user_id: userId,
      p_app_name: appName
    });
    // 6. Handle RPC errors
    if (rpcError) {
      console.error("Error calling get_or_create_user_balance:", rpcError);
      return new Response(JSON.stringify({
        code: 500,
        error: "Database operation failed",
        message: rpcError.message
      }), {
        status: 500,
        headers: JSON_HEADERS
      });
    }
    // 7. Return the balance
    log(`User ${userId} balance retrieved successfully for app ${appName}.`);
    return new Response(JSON.stringify({
      balance: balance // 'balance' is a numeric value returned directly by the RPC
    }), {
      status: 200,
      headers: JSON_HEADERS
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Unexpected error:", errorMessage);
    return new Response(JSON.stringify({
      code: 500,
      error: "Internal server error",
      message: errorMessage
    }), {
      status: 500,
      headers: JSON_HEADERS
    });
  }
});

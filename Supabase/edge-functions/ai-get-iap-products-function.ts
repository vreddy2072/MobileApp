import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireSupabaseUser } from "./_shared/auth.ts";
const DEBUG_LOG = Deno.env.get("DEBUG_LOG") === "true";
function log(...args) {
  if (DEBUG_LOG) {
    console.log(...args);
  }
}
log("get-iap-products-function started");
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
    log("Supabase Auth verification started");
    const auth = await requireSupabaseUser(req, JSON_HEADERS);
    if (!auth.ok) {
      return auth.response;
    }
    log("Supabase Auth verification completed");
    // 2. Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(JSON.stringify({
        code: 400,
        error: "Invalid JSON in request body"
      }), {
        status: 400,
        headers: JSON_HEADERS
      });
    }
    const { app_name } = body;
    // 3. Validate app_name
    if (!app_name || typeof app_name !== 'string' || app_name.trim().length === 0) {
      return new Response(JSON.stringify({
        code: 400,
        error: "Missing or invalid 'app_name' in request body"
      }), {
        status: 400,
        headers: JSON_HEADERS
      });
    }
    // 4. Supabase env setup
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
    log("Creating supabase client to retrieve IAP products");
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    // 5. Call the PostgreSQL function via RPC
    // The function handles the app existence check and product query.
    const { data: products, error: rpcError } = await supabase.rpc('get_iap_products', {
      p_app_name: app_name
    });
    // 6. Handle RPC errors
    if (rpcError) {
      console.error('RPC Error calling get_iap_products_by_app:', rpcError);
      // The SQL function raises an explicit exception (like 404), which appears here.
      return new Response(JSON.stringify({
        code: 500,
        error: 'Database function call failed',
        details: rpcError.message
      }), {
        status: 500,
        headers: JSON_HEADERS
      });
    }
    // 7. Return the products array
    console.log("Returning products:", {
      count: products.length
    });
    log("Returning products:", {
      products
    });
    log("IAP products returned successfully");
    return new Response(JSON.stringify({
      products: products
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

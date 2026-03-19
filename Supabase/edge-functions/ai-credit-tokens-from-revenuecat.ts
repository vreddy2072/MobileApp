import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization"
};
const DEBUG_LOG = Deno.env.get("DEBUG_LOG") === "true";
function log(...args) {
  if (DEBUG_LOG) console.log(...args);
}
Deno.serve(async (req)=>{
  try {
    // Handle preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: JSON_HEADERS
      });
    }
    // Only POST allowed
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: "Method not allowed"
      }), {
        status: 405,
        headers: JSON_HEADERS
      });
    }
    // Authenticate webhook
    const secret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
    if (!secret) {
      console.error("Missing REVENUECAT_WEBHOOK_SECRET");
      return new Response(JSON.stringify({
        error: "Server configuration error"
      }), {
        status: 500,
        headers: JSON_HEADERS
      });
    }
    const authHeader = req.headers.get("Authorization") || req.headers.get("X-Authorization");
    const expectedAuth = `Bearer ${secret}`;
    const isValid = authHeader === secret || authHeader === expectedAuth;
    if (!isValid) {
      log("Unauthorized webhook access:", authHeader);
      return new Response(JSON.stringify({
        error: "Unauthorized"
      }), {
        status: 401,
        headers: JSON_HEADERS
      });
    }
    // Parse RevenueCat event
    const body = await req.json().catch(()=>null);
    if (!body?.event) {
      log("Invalid webhook body:", body);
      return new Response(JSON.stringify({
        error: "Invalid payload"
      }), {
        status: 400,
        headers: JSON_HEADERS
      });
    }
    const event = body.event;
    log("Received RevenueCat event:", event.type, event);
    const userId = event.app_user_id;
    const productId = event.product_id;
    const transactionId = event.transaction_id;
    const appId = event.app_id;
    if (!userId || !productId) {
      return new Response(JSON.stringify({
        error: "Missing user_id or product_id"
      }), {
        status: 400,
        headers: JSON_HEADERS
      });
    }
    // Initialize Supabase client
    log("Initialize Supabase client");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing Supabase configuration");
      return new Response(JSON.stringify({
        error: "Server configuration error"
      }), {
        status: 500,
        headers: JSON_HEADERS
      });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    // Call add_tokens RPC
    const { error: rpcError } = await supabase.rpc("add_tokens_rc", {
      p_user_id: userId,
      p_app_id: appId,
      p_source: "revenuecat",
      p_product_id: productId,
      p_receipt: transactionId ?? null
    });
    if (rpcError) {
      console.error("RPC error:", rpcError);
      // Detect duplicate receipts (idempotent behavior)
      if (rpcError.message.includes("duplicate")) {
        return new Response(JSON.stringify({
          success: true,
          duplicate: true
        }), {
          status: 200,
          headers: JSON_HEADERS
        });
      }
      return new Response(JSON.stringify({
        error: rpcError.message
      }), {
        status: 500,
        headers: JSON_HEADERS
      });
    }
    log("Tokens added successfully!");
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: JSON_HEADERS
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: err.message
    }), {
      status: 500,
      headers: JSON_HEADERS
    });
  }
});

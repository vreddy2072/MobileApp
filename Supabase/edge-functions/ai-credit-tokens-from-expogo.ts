import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireSupabaseUser } from "./_shared/auth.ts";
const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey"
};
Deno.serve(async (req)=>{
  try {
    // Handle OPTIONS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: JSON_HEADERS
      });
    }
    // Only allow POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        code: 405,
        error: "Method not allowed: Only POST allowed"
      }), {
        status: 405,
        headers: JSON_HEADERS
      });
    }
    // Check DEV_MODE
    const DEV_MODE = Deno.env.get("DEV_MODE") === "true";
    // Block this function completely in production
    if (!DEV_MODE) {
      console.warn("add-tokens-function called in production mode (DEV_MODE=false)");
      return new Response(JSON.stringify({
        code: 403,
        error: "dev-add-tokens disabled in production"
      }), {
        status: 403,
        headers: JSON_HEADERS
      });
    }
    // Verify Supabase Auth
    const auth = await requireSupabaseUser(req, JSON_HEADERS);
    if (!auth.ok) {
      return auth.response;
    }
    const user_id = auth.user_id;
    // Parse request body
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
    const { app_name, product_id } = body;
    // Validate and limit quantity
    if (!product_id || typeof product_id !== 'string' || product_id.trim().length === 0) {
      return new Response(JSON.stringify({
        code: 400,
        error: "Missing or invalid 'product_id' in request body"
      }), {
        status: 400,
        headers: JSON_HEADERS
      });
    }
    // 🌟 CHANGE 2: Add validation for app_name
    if (!app_name || typeof app_name !== 'string' || app_name.trim().length === 0) {
      return new Response(JSON.stringify({
        code: 400,
        error: "Missing or invalid 'app_name' in request body"
      }), {
        status: 400,
        headers: JSON_HEADERS
      });
    }
    console.log("Adding tokens", {
      user_id: user_id,
      app_name: app_name,
      product_id: product_id
    });
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing Supabase configuration");
      return new Response(JSON.stringify({
        code: 500,
        error: "Server configuration error: Supabase credentials not set"
      }), {
        status: 500,
        headers: JSON_HEADERS
      });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    // Call the RPC function to add tokens
    const { data, error } = await supabase.rpc("add_tokens", {
      p_user_id: user_id,
      p_app_name: app_name,
      p_source: "Expo Go",
      p_product_id: product_id,
      p_receipt: null
    });
    if (error) {
      console.error("RPC add_tokens failed:", error);
      return new Response(JSON.stringify({
        code: 500,
        error: "Failed to add tokens",
        message: error.message
      }), {
        status: 500,
        headers: JSON_HEADERS
      });
    }
    console.log("Tokens added successfully", {
      user_id,
      app_name,
      product_id: product_id,
      data
    });
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: JSON_HEADERS
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    console.error("Unexpected error in add-tokens-function:", {
      errorMessage,
      errorStack
    });
    return new Response(JSON.stringify({
      code: 500,
      error: "Internal server error",
      message: errorMessage
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});

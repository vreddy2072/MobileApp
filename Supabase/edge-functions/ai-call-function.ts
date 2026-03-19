// ai-call-function: Modular Pricing + Flat UTU Billing (Round Up)
// Supports multi-model billing: gpt-4o-mini (default) and gpt-4.1-mini
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireSupabaseUser } from "./_shared/auth.ts";
const DEBUG_LOG = Deno.env.get("DEBUG_LOG") === "true";
function log(...args) {
  if (DEBUG_LOG) {
    console.log(...args);
  }
}
// ---------------------------------------------------------
// ENVIRONMENT
// ---------------------------------------------------------
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  // Must match the headers injected by `src/services/supabaseApi.ts`
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, x-app-name"
};
const JSON_HEADERS = {
  ...CORS_HEADERS,
  "Content-Type": "application/json"
};
// ---------------------------------------------------------
// GLOBAL PRICING CONSTANTS
// ---------------------------------------------------------
const TOTAL_REVENUE_USD = 0.99;
const TOTAL_TOKENS_BOUGHT = 200;
const PRICE_PER_USER_TOKEN = TOTAL_REVENUE_USD / TOTAL_TOKENS_BOUGHT; // 0.0099 USD
const PROFIT_MARGIN_M = 2.0; // 200%
const REVENUE_MULTIPLIER = 1 + PROFIT_MARGIN_M; // => 3.00
const MILLION = 1_000_000;
// ---------------------------------------------------------
// MODEL PRICING TABLE (per 1M tokens)
// ---------------------------------------------------------
const MODEL_PRICES = {
  "gpt-4o-mini": {
    input: 0.15,
    output: 0.60
  },
  "gpt-4.1-mini": {
    input: 0.40,
    output: 1.60
  }
};
// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------
function roundToTwoDecimals(n) {
  return Math.round(n * 100) / 100;
}
function calculateTokenDeduction(model, input_tokens, output_tokens) {
  const price = MODEL_PRICES[model];
  if (!price) {
    console.error(`Unsupported model: ${model}`);
    return 1; // fallback – guaranteed safe
  }
  const cost_in_usd = input_tokens * price.input / MILLION;
  const cost_out_usd = output_tokens * price.output / MILLION;
  const C_API = cost_in_usd + cost_out_usd;
  const R_Target = C_API * REVENUE_MULTIPLIER;
  const D_raw = R_Target / PRICE_PER_USER_TOKEN;
  return roundToTwoDecimals(D_raw);
}
// ---------------------------------------------------------
// PROFANITY CHECK LIST
// ---------------------------------------------------------
const BAD_WORDS = [
  "fuck",
  "shit",
  "kill",
  "rape",
  "suicide"
];
// ---------------------------------------------------------
// OPENAI DEFAULTS
// ---------------------------------------------------------
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 1000; // Output cap for safety
const MAX_INPUT_CHARS = 4000;
// ---------------------------------------------------------
// UTILITY FUNCTIONS
// ---------------------------------------------------------
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: JSON_HEADERS
  });
}
function tryParse(str) {
  try {
    return JSON.parse(str);
  } catch  {
    return null;
  }
}
// ---------------------------------------------------------
// MAIN FUNCTION
// ---------------------------------------------------------
Deno.serve(async (req)=>{
  try {
    // OPTIONS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }
    if (req.method !== "POST") {
      return json({
        code: 405,
        error: "Method not allowed: Only POST allowed"
      }, 405);
    }
    // Check environment variables
    if (!OPENAI_API_KEY || !SUPABASE_URL || !SERVICE_KEY) {
      console.error("Missing environment variables", {
        hasOpenAI: !!OPENAI_API_KEY,
        hasSupabaseUrl: !!SUPABASE_URL,
        hasServiceKey: !!SERVICE_KEY
      });
      return json({
        code: 500,
        error: "Server misconfigured: Missing required environment variables"
      }, 500);
    }
    // Validate Content-Type
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return json({
        code: 400,
        error: "Content-Type must be application/json"
      }, 400);
    }
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return json({
        code: 400,
        error: "Invalid JSON in request body"
      }, 400);
    }
    if (!body || typeof body.prompt !== "string") {
      return json({
        code: 400,
        error: 'JSON must include "prompt" as a string'
      }, 400);
    }
    if (!body.app_name || typeof body.app_name !== "string" || body.app_name.trim().length === 0) {
      return json({
        code: 400,
        error: "Missing or invalid 'app_name' in request body"
      }, 400);
    }
    // Verify Supabase Auth
    const auth = await requireSupabaseUser(req, JSON_HEADERS);
    if (!auth.ok) {
      return auth.response;
    }
    const user_id = auth.user_id;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const prompt = body.prompt.trim();
    const app_name = body.app_name.trim();
    // ---------------------------
    // INPUT VALIDATION
    // ---------------------------
    // Load per-app prompt config (system prompt, model, limits, and active flag)
    // Table is expected to be present as part of the `app-based prompts` enhancement.
    const { data: config, error: configError } = await supabase
      .from("ai_app_configs")
      .select("app_name, system_prompt, model, temperature, max_tokens, max_input_chars, is_active")
      .eq("app_name", app_name)
      .single();

    if (configError || !config) {
      return json({ code: 404, error: "App configuration not found" }, 404);
    }

    const appConfig = config as any;
    if (appConfig.is_active === false) {
      return json({ code: 403, error: "App is not active" }, 403);
    }

    const system_prompt = typeof appConfig.system_prompt === "string" ? appConfig.system_prompt : "";
    if (!system_prompt) {
      return json({ code: 500, error: "Missing system_prompt for app configuration" }, 500);
    }

    const model =
      typeof appConfig.model === "string" && appConfig.model.trim().length > 0
        ? appConfig.model.trim()
        : DEFAULT_MODEL;
    const temperature =
      typeof appConfig.temperature === "number" ? appConfig.temperature : DEFAULT_TEMPERATURE;
    const max_tokens =
      typeof appConfig.max_tokens === "number" ? appConfig.max_tokens : DEFAULT_MAX_TOKENS;
    const max_input_chars =
      typeof appConfig.max_input_chars === "number" ? appConfig.max_input_chars : MAX_INPUT_CHARS;

    if (prompt.length > max_input_chars) {
      return json({
        code: 413,
        error: `Input too long. Please shorten to under ${max_input_chars} characters.`,
        limit: max_input_chars,
        received: prompt.length
      }, 413);
    }
    const lower = prompt.toLowerCase();
    if (BAD_WORDS.some((w)=>lower.includes(w))) {
      console.warn("Inappropriate content detected", {
        user_id,
        promptLength: prompt.length
      });
      return json({
        code: 400,
        error: "Inappropriate content detected"
      }, 400);
    }
    // ---------------------------
    // OPENAI CALL
    // ---------------------------
    const payload = {
      model,
      messages: [
        {
          role: "system",
          content: system_prompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature,
      max_tokens,
      stream: false
    };
    log("Calling OpenAI API", {
      user_id,
      app_name,
      model,
      promptLength: prompt.length,
      temperature,
      maxTokens: max_tokens
    });
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), 30000);
    let openai;
    try {
      openai = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("OpenAI network error:", errorMessage);
      if (err instanceof Error && err.name === "AbortError") {
        return json({
          code: 504,
          error: "OpenAI timeout: Request took longer than 30 seconds"
        }, 504);
      }
      return json({
        code: 502,
        error: "OpenAI network error",
        message: errorMessage
      }, 502);
    }
    clearTimeout(timeoutId);
    const raw = await openai.text();
    if (!openai.ok) {
      console.error("OpenAI API error:", {
        status: openai.status,
        statusText: openai.statusText,
        response: raw.substring(0, 500)
      });
      return json({
        code: openai.status,
        error: "OpenAI API error",
        status: openai.status
      }, openai.status);
    }
    const data = tryParse(raw);
    const text = data?.choices?.[0]?.message?.content ?? "";
    const usage = data?.usage;
    if (!usage) {
      console.error("Missing usage data from OpenAI response", {
        data
      });
      return json({
        code: 500,
        error: "Missing usage data from OpenAI response"
      }, 500);
    }
    const inputTokens = usage.prompt_tokens ?? 0;
    const outputTokens = usage.completion_tokens ?? 0;
    // ---------------------------------------------------------
    // BILLING (Flat UTU with Rounding Up)
    // ---------------------------------------------------------
    const rawDeduction = calculateTokenDeduction(model, inputTokens, outputTokens);
    const utu = Math.max(1, Math.ceil(rawDeduction)); // round up to nearest UTU
    log("Calculating token deduction", {
      user_id,
      app_name,
      model,
      inputTokens,
      outputTokens,
      rawDeduction,
      utu
    });
    // Deduct tokens
    const { error: deductError } = await supabase.rpc("deduct_tokens", {
      p_user_id: user_id,
      p_app_name: app_name,
      p_cost: utu
    });
    if (deductError) {
      console.error("Failed to deduct tokens:", deductError);
      return json({
        code: 500,
        error: "Failed to deduct tokens",
        message: deductError.message
      }, 500);
    }
    // ---------------------------------------------------------
    // LOGGING
    // ---------------------------------------------------------
    const { error: logError } = await supabase.from("ai_usage_log").insert({
      user_id,
      app_name: app_name,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_tokens: utu,
      model
    });
    if (logError) {
      console.error("Failed to log usage:", logError);
    // Don't fail the request if logging fails, just log the error
    }
    log("AI call completed successfully", {
      user_id,
      app_name,
      model,
      tokensCharged: utu,
      inputTokens,
      outputTokens
    });
    return json({
      model,
      text,
      tokens_charged: utu,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens
      }
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    console.error("Internal error in ai-call-function:", {
      errorMessage,
      errorStack
    });
    return json({
      code: 500,
      error: "Internal server error",
      message: errorMessage
    }, 500);
  }
});

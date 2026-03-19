/**
 * Supabase JWT verification for Edge Functions.
 * user_id = payload.sub (Supabase Auth UUID).
 *
 * Supabase Auth access tokens are HS256-signed using the project's JWT secret.
 * Verify using JWT_SECRET (and optional SB_JWT_ISSUER).
 */
import * as jose from "jsr:@panva/jose@6.1.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const JWT_ISSUER = Deno.env.get("SB_JWT_ISSUER") ?? (SUPABASE_URL ? `${SUPABASE_URL}/auth/v1` : "");
const JWT_SECRET = Deno.env.get("JWT_SECRET");

export async function requireSupabaseUser(
  req: Request,
  jsonHeaders: Record<string, string>
): Promise<
  | { ok: true; user_id: string }
  | { ok: false; response: Response }
> {
  if (!SUPABASE_URL || !JWT_ISSUER || !JWT_SECRET) {
    console.error("[auth] config missing: SUPABASE_URL=" + !!SUPABASE_URL + " JWT_ISSUER=" + !!JWT_ISSUER + " JWT_SECRET=" + !!JWT_SECRET);
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          code: 500,
          error: "Server configuration error: SUPABASE_URL/JWT_ISSUER/JWT_SECRET not set",
        }),
        { status: 500, headers: jsonHeaders }
      ),
    };
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    console.error("[auth] 401: Missing Authorization header");
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ code: 401, error: "Unauthorized: Missing Authorization header" }),
        { status: 401, headers: jsonHeaders }
      ),
    };
  }
  if (!authHeader.startsWith("Bearer ")) {
    console.error("[auth] 401: Invalid Authorization format (expected Bearer <token>)");
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ code: 401, error: "Unauthorized: Invalid Authorization header format" }),
        { status: 401, headers: jsonHeaders }
      ),
    };
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    console.error("[auth] 401: Empty token after Bearer");
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ code: 401, error: "Unauthorized: Empty token" }),
        { status: 401, headers: jsonHeaders }
      ),
    };
  }

  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secretKey, {
      issuer: JWT_ISSUER,
    });
    const sub = payload.sub;
    if (!sub || typeof sub !== "string") {
      console.error("[auth] 401: JWT missing or invalid sub claim");
      return {
        ok: false,
        response: new Response(
          JSON.stringify({ code: 401, error: "Invalid JWT: Missing user ID (sub)" }),
          { status: 401, headers: jsonHeaders }
        ),
      };
    }
    return { ok: true, user_id: sub };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    let errorCode = "Invalid JWT";
    if (message.includes("expired") || message.toLowerCase().includes("exp")) errorCode = "JWT expired";
    else if (message.includes("signature") || message.includes("sign")) errorCode = "Invalid JWT signature";
    console.error("[auth] 401: JWT verification failed:", message);
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ code: 401, error: errorCode, message }),
        { status: 401, headers: jsonHeaders }
      ),
    };
  }
}

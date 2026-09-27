import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://bastionfall-web-production.up.railway.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {})
  };
}

function json(req: Request, body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), ...extraHeaders }
  });
}

function getClientIp(req: Request) {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return json(req, { error: "origin_not_allowed" }, 403);
  }

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);

  try {
    const contentLength = Number(req.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > 4096) {
      return json(req, { error: "request_too_large" }, 413);
    }

    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const displayName = String(body?.displayName || "").trim();

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(req, { error: "invalid_email" }, 400);
    }
    if (password.length < 8 || password.length > 72) {
      return json(req, { error: "password_length" }, 400);
    }
    if (displayName.length < 1 || displayName.length > 40 || /[\u0000-\u001f\u007f]/.test(displayName)) {
      return json(req, { error: "invalid_display_name" }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceRole, { auth: { persistSession: false } });

    const ipHash = await sha256("ip:" + getClientIp(req));
    const emailHash = await sha256("email:" + email);

    const [ipLimit, emailLimit] = await Promise.all([
      admin.rpc("consume_registration_rate_limit", {
        p_key: "register:ip:" + ipHash,
        p_window_seconds: 600,
        p_max_attempts: 5
      }),
      admin.rpc("consume_registration_rate_limit", {
        p_key: "register:email:" + emailHash,
        p_window_seconds: 3600,
        p_max_attempts: 3
      })
    ]);

    if (ipLimit.error || emailLimit.error) {
      console.error("registration_rate_limit_error");
      return json(req, { error: "signup_temporarily_unavailable" }, 503);
    }

    if (ipLimit.data !== true || emailLimit.data !== true) {
      return json(req, { error: "rate_limited" }, 429, { "Retry-After": "600" });
    }

    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName }
    });

    if (error) {
      const duplicate = /already|registered|exists/i.test(error.message);
      return json(req, { error: duplicate ? "email_in_use" : "signup_failed" }, duplicate ? 409 : 400);
    }

    return json(req, { ok: true }, 201);
  } catch {
    return json(req, { error: "invalid_request" }, 400);
  }
});
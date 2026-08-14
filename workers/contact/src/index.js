import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext/browser";

const MAX_LEN = { name: 100, email: 254, message: 4000 };
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function parseAllowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
}

function corsHeaders(origin, allowedOrigins) {
  const headers = { "Vary": "Origin" };
  if (allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return headers;
}

function jsonResponse(status, body, origin, allowedOrigins) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin, allowedOrigins),
    },
  });
}

async function verifyTurnstile(token, secret, remoteip) {
  if (!token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (remoteip) form.append("remoteip", remoteip);

  const res = await fetch(TURNSTILE_VERIFY_URL, { method: "POST", body: form });
  const data = await res.json();
  return data.success === true;
}

function truncate(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = parseAllowedOrigins(env);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin, allowedOrigins) });
    }

    if (request.method !== "POST") {
      return jsonResponse(405, { ok: false, error: "method_not_allowed" }, origin, allowedOrigins);
    }

    if (!allowedOrigins.includes(origin)) {
      return jsonResponse(403, { ok: false, error: "forbidden_origin" }, origin, allowedOrigins);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse(400, { ok: false, error: "invalid_json" }, origin, allowedOrigins);
    }

    if (truncate(payload.website, 1)) {
      return jsonResponse(200, { ok: true }, origin, allowedOrigins);
    }

    const name = truncate(payload.name, MAX_LEN.name);
    const email = truncate(payload.email, MAX_LEN.email);
    const message = truncate(payload.message, MAX_LEN.message);

    if (!message) {
      return jsonResponse(400, { ok: false, error: "message_required" }, origin, allowedOrigins);
    }

    const verified = await verifyTurnstile(
      payload.turnstileToken,
      env.TURNSTILE_SECRET,
      request.headers.get("CF-Connecting-IP")
    );
    if (!verified) {
      return jsonResponse(403, { ok: false, error: "turnstile_failed" }, origin, allowedOrigins);
    }

    const msg = createMimeMessage();
    msg.setSender({ name: "טופס יצירת קשר - כוכב נופל", addr: env.FROM_ADDRESS });
    msg.setRecipient(env.TO_ADDRESS);
    if (email) msg.setHeader("Reply-To", email);
    msg.setSubject(`הודעה חדשה מהאתר${name ? ` מאת ${name}` : ""}`);
    msg.addMessage({
      contentType: "text/plain",
      data: `שם: ${name || "לא צוין"}\nדוא"ל לתשובה: ${email || "לא צוין"}\n\n${message}`,
    });

    const email_message = new EmailMessage(env.FROM_ADDRESS, env.TO_ADDRESS, msg.asRaw());

    try {
      await env.SEND_EMAIL.send(email_message);
    } catch (err) {
      return jsonResponse(502, { ok: false, error: "send_failed" }, origin, allowedOrigins);
    }

    return jsonResponse(200, { ok: true }, origin, allowedOrigins);
  },
};

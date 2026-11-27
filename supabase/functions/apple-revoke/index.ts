// Відкликання Sign in with Apple перед видаленням акаунта (App Review 5.1.1(v)).
//
// Клієнт (js/cloud.js → revokeApple) щойно ще раз пройшов Sign in with Apple на iPhone
// і передає свіжий authorization code. Тут:
//   1. перевіряємо сесію Supabase (той, хто видаляє акаунт);
//   2. міняємо code на refresh token в Apple;
//   3. переконуємось, що це той самий Apple ID, що привʼязаний до акаунта;
//   4. відкликаємо токен — гра зникає з «Вхід через Apple» у налаштуваннях Apple ID.
// Сам акаунт потім видаляє клієнт через rpc/delete_me.
//
// Секрети (Edge Functions → Secrets): APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (вміст файлу .p8).
// Деплой: supabase functions deploy apple-revoke --no-verify-jwt  (сесію перевіряємо самі, крок 1)

const CLIENT_ID = "ua.dvoryk.app"; // нативний вхід → client_id = bundle ID
const APPLE = "https://appleid.apple.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const b64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const part = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)));

function claims(jwt: string | undefined): Record<string, unknown> {
  try {
    const p = (jwt || "").split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(p + "=".repeat((4 - p.length % 4) % 4)));
  } catch {
    return {};
  }
}

/** client_secret для Apple: JWT ES256, підписаний ключем .p8 (живе 5 хв — нам більше не треба). */
export async function clientSecret(teamId: string, keyId: string, pem: string, now = Math.floor(Date.now() / 1000)) {
  const b64 = pem.replace(/\\n/g, "").replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const signing = part({ alg: "ES256", kid: keyId }) + "." +
    part({ iss: teamId, iat: now, exp: now + 300, aud: APPLE, sub: CLIENT_ID });
  // WebCrypto віддає підпис у форматі r‖s — саме те, що потрібно JWS
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(signing));
  return signing + "." + b64url(sig);
}

async function apple(path: string, params: Record<string, string>) {
  const r = await fetch(APPLE + path, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "POST only" });

  // 1. хто це
  const auth = req.headers.get("authorization") || "";
  const apikey = req.headers.get("apikey") || Deno.env.get("SUPABASE_ANON_KEY") || "";
  const ur = await fetch(Deno.env.get("SUPABASE_URL") + "/auth/v1/user", { headers: { authorization: auth, apikey } });
  if (!ur.ok) return json(401, { error: "not authenticated" });
  const user = await ur.json();
  const ident = (user.identities || []).find((i: { provider: string }) => i.provider === "apple");
  if (!ident) return json(200, { revoked: false, reason: "no apple identity" });

  let code = "";
  try { code = (await req.json()).code; } catch { /* порожнє тіло */ }
  if (!code || typeof code !== "string") return json(400, { error: "code required" });

  const team = Deno.env.get("APPLE_TEAM_ID"), kid = Deno.env.get("APPLE_KEY_ID"), p8 = Deno.env.get("APPLE_PRIVATE_KEY");
  if (!team || !kid || !p8) return json(500, { error: "Apple key is not configured" });
  const secret = await clientSecret(team, kid, p8);
  const base = { client_id: CLIENT_ID, client_secret: secret };

  // 2. code → refresh token
  const t = await apple("/auth/token", { ...base, grant_type: "authorization_code", code });
  if (!t.ok || !t.body.refresh_token) return json(502, { error: "apple token: " + (t.body.error || t.status) });

  // 3. той самий Apple ID
  const sub = claims(t.body.id_token).sub;
  const linked = [ident.id, ident.provider_id, ident.identity_data && ident.identity_data.sub];
  if (!sub || !linked.includes(sub)) return json(409, { error: "different Apple ID" });

  // 4. відкликаємо
  const r = await apple("/auth/revoke", { ...base, token: t.body.refresh_token, token_type_hint: "refresh_token" });
  if (!r.ok) return json(502, { error: "apple revoke: " + (r.body.error || r.status) });
  return json(200, { revoked: true });
}

Deno.serve(handler);

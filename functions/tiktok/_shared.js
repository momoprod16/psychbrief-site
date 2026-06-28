// Shared helpers for the Psych Brief TikTok Login Kit serverless flow.
// Runs as Cloudflare Pages Functions (functions/tiktok/*.js) or adaptable to a Worker.
// Secrets (TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET) are provided by the host as encrypted
// environment variables and are NEVER sent to the browser. Access/refresh tokens are never
// exposed in any HTTP response.

export const AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
export const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
export const USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/";

// Login Kit only. Do NOT add video.* here.
export const SCOPE = "user.info.basic";

export function redirectUri(env) {
  return env.TIKTOK_REDIRECT_URI || "https://psychbrief.online/tiktok/callback";
}

// Random URL-safe state for CSRF protection.
export function randomState() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function cookie(name, value, { maxAge = 600, clear = false } = {}) {
  const attrs = [
    `${name}=${clear ? "" : value}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${clear ? 0 : maxAge}`,
  ];
  return attrs.join("; ");
}

export function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

export function esc(s) {
  return String(s == null ? "" : s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// On-brand page shell matching styles.css tokens.
export function page({ title, body, status = 200, headers = {} }) {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)} | Psych Brief</title>
    <meta name="robots" content="noindex" />
    <link rel="canonical" href="https://psychbrief.online/tiktok/callback" />
    <link rel="icon" type="image/png" sizes="1024x1024" href="/psychbrief-app-icon.png" />
    <link rel="stylesheet" href="/styles.css" />
    <style>
      .auth-shell { max-width: 760px; margin: 48px auto 90px; }
      .auth-card {
        border: 1px solid var(--line);
        background: rgba(255, 250, 240, 0.9);
        box-shadow: 0 18px 48px rgba(42, 44, 36, 0.1);
        padding: clamp(28px, 5vw, 52px);
      }
      .who { display: flex; align-items: center; gap: 18px; margin: 18px 0 6px; }
      .who img { width: 72px; height: 72px; border-radius: 50%; border: 1px solid var(--line); object-fit: cover; }
      .who .name { font-family: Georgia, serif; font-size: 1.9rem; line-height: 1.1; }
      .who .sub { color: var(--muted); font-weight: 700; }
      .pill { display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--line); background: rgba(255,255,255,.55); padding: 8px 12px; font-weight: 800; font-size: .9rem; }
      .ok { color: var(--moss); }
      .err { color: var(--coral); }
      .auth-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 26px; }
      .btn { display: inline-flex; align-items: center; min-height: 46px; padding: 0 18px; border: 1px solid var(--ink); font-weight: 800; text-decoration: none; }
      .btn.primary { color: #fff; background: var(--ink); }
      .btn.secondary { background: rgba(255,255,255,.5); }
      .muted { color: var(--muted); }
    </style>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="/" aria-label="Psych Brief home">
        <span class="brand-mark" aria-hidden="true">PB</span>
        <span>Psych Brief</span>
      </a>
      <nav aria-label="Primary navigation">
        <a href="/tiktok">TikTok Integration</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <a href="/contact">Contact</a>
      </nav>
    </header>
    <main class="auth-shell">
      <section class="auth-card">
        ${body}
      </section>
    </main>
    <footer>
      <span>Psych Brief</span>
      <a href="/tiktok">TikTok Integration</a>
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="mailto:amosher16@gmail.com">amosher16@gmail.com</a>
    </footer>
  </body>
</html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", ...headers },
  });
}

export async function exchangeCodeForToken(env, code) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body: new URLSearchParams({
      client_key: env.TIKTOK_CLIENT_KEY,
      client_secret: env.TIKTOK_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri(env),
    }),
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`token_exchange_failed: ${json.error || res.status} ${json.error_description || ""}`);
  }
  return json; // { access_token, open_id, scope, expires_in, refresh_token, ... }
}

export async function fetchUserInfo(accessToken) {
  const url = `${USER_INFO_URL}?fields=open_id,display_name,avatar_url`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const json = await res.json();
  if (!res.ok || (json.error && json.error.code && json.error.code !== "ok")) {
    throw new Error(`user_info_failed: ${JSON.stringify(json.error || {})}`);
  }
  return json.data && json.data.user ? json.data.user : {};
}

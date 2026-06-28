// GET /tiktok/login — starts the real TikTok Login Kit OAuth flow.
// Generates a CSRF state, stores it in an HttpOnly cookie, and redirects to TikTok.
import { AUTH_URL, SCOPE, redirectUri, randomState, cookie } from "./_shared.js";

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.TIKTOK_CLIENT_KEY) {
    return new Response("TikTok app not configured (missing TIKTOK_CLIENT_KEY).", { status: 500 });
  }
  const state = randomState();
  const url = new URL(AUTH_URL);
  url.searchParams.set("client_key", env.TIKTOK_CLIENT_KEY);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("redirect_uri", redirectUri(env));
  url.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      "Set-Cookie": cookie("tt_state", state, { maxAge: 600 }),
      "Cache-Control": "no-store",
    },
  });
}

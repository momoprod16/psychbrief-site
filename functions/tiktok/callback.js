// GET /tiktok/callback — real TikTok Login Kit redirect URI.
// Verifies CSRF state, exchanges the one-time code for a token SERVER-SIDE, fetches
// user.info.basic, and renders a clean "Connected as @display_name" screen.
// Tokens are never sent to the browser. On Cloudflare Pages this Function takes
// precedence over the static /tiktok/callback.html for this exact route.
import {
  esc, page, cookie, readCookie, exchangeCodeForToken, fetchUserInfo,
} from "./_shared.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const qp = url.searchParams;

  const oauthError = qp.get("error");
  if (oauthError) {
    return page({
      title: "Sign-in cancelled",
      status: 400,
      body: `
        <p class="eyebrow err">TikTok Login Kit</p>
        <h1>Sign-in didn&rsquo;t complete</h1>
        <p class="muted">TikTok returned: <strong>${esc(oauthError)}</strong> ${esc(qp.get("error_description") || "")}</p>
        <div class="auth-actions"><a class="btn primary" href="/tiktok/login">Try again</a><a class="btn secondary" href="/">Home</a></div>`,
    });
  }

  const code = qp.get("code");
  const state = qp.get("state");
  const expected = readCookie(request, "tt_state");
  if (!code || !state || !expected || state !== expected) {
    return page({
      title: "Sign-in error",
      status: 400,
      body: `
        <p class="eyebrow err">TikTok Login Kit</p>
        <h1>Could not verify this sign-in</h1>
        <p class="muted">The authorization could not be validated (missing or mismatched security token). Please start again.</p>
        <div class="auth-actions"><a class="btn primary" href="/tiktok/login">Sign in with TikTok</a></div>`,
    });
  }

  try {
    const token = await exchangeCodeForToken(env, code);
    const user = await fetchUserInfo(token.access_token);
    const name = user.display_name || "your TikTok account";
    const avatar = user.avatar_url || "";
    const openId = token.open_id || user.open_id || "";

    const clearState = cookie("tt_state", "", { clear: true });
    const setSession = cookie("tt_open_id", esc(openId), { maxAge: 3600 });

    const avatarTag = avatar
      ? `<img src="${esc(avatar)}" alt="${esc(name)} avatar" referrerpolicy="no-referrer" />`
      : `<span class="brand-mark" aria-hidden="true" style="width:72px;height:72px;font-size:1.4rem;">PB</span>`;

    return page({
      title: "Connected",
      headers: { "Set-Cookie": [clearState, setSession] },
      body: `
        <p class="eyebrow ok">TikTok Login Kit &middot; user.info.basic</p>
        <h1>You&rsquo;re connected</h1>
        <div class="who">
          ${avatarTag}
          <div>
            <div class="name">${esc(name)}</div>
            <div class="sub">Connected to your Psych Brief workspace</div>
          </div>
        </div>
        <p class="pill ok">&#10003; Account verified via TikTok Login Kit</p>
        <p class="muted">Your TikTok account is now linked to Psych Brief so you can prepare and manage
        source-cited educational psychology videos for this account. We received only your basic public
        profile (open ID, display name and avatar) via <strong>user.info.basic</strong>. The one-time
        code was exchanged for an access token <strong>on our server</strong>; access and refresh tokens
        are never shown in your browser.</p>
        <div class="auth-actions">
          <a class="btn primary" href="/tiktok">How Psych Brief uses TikTok</a>
          <a class="btn secondary" href="/tiktok/disconnect">Disconnect</a>
        </div>`,
    });
  } catch (e) {
    return page({
      title: "Sign-in error",
      status: 502,
      body: `
        <p class="eyebrow err">TikTok Login Kit</p>
        <h1>We couldn&rsquo;t finish connecting</h1>
        <p class="muted">The secure token exchange with TikTok did not complete. No account was connected. Please try again.</p>
        <div class="auth-actions"><a class="btn primary" href="/tiktok/login">Sign in with TikTok</a><a class="btn secondary" href="/contact">Contact support</a></div>`,
    });
  }
}

// GET /tiktok/disconnect — clears the local Psych Brief session marker and explains
// how to fully revoke access in TikTok settings.
import { page, cookie } from "./_shared.js";

export async function onRequestGet() {
  return page({
    title: "Disconnected",
    headers: { "Set-Cookie": cookie("tt_open_id", "", { clear: true }) },
    body: `
      <p class="eyebrow">TikTok Login Kit</p>
      <h1>Disconnected</h1>
      <p class="muted">Your TikTok account has been disconnected from this Psych Brief session. To fully
      revoke Psych Brief&rsquo;s access, you can also remove it under
      <strong>TikTok &rsaquo; Settings &rsaquo; Security &amp; login &rsaquo; Manage app permissions</strong>.
      You may request deletion of any associated records via our
      <a href="/privacy">Privacy Policy</a> contact.</p>
      <div class="auth-actions"><a class="btn primary" href="/tiktok/login">Sign in with TikTok</a><a class="btn secondary" href="/">Home</a></div>`,
  });
}

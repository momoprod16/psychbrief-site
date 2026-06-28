# Psych Brief — Official Website

Static website for **Psych Brief** (https://psychbrief.online), an educational psychology
media service. This repository is the public, app-review-facing site and is deployed via
**Cloudflare Pages**.

## Structure

Plain static HTML/CSS at the repository root (no build step). The Cloudflare Pages build
output directory is the repository root.

| Path | URL |
|------|-----|
| `index.html` | `/` |
| `tiktok/index.html` | `/tiktok` |
| `tiktok/callback/index.html` | `/tiktok/callback` |
| `review-demo.html` | `/review-demo` |
| `privacy.html` | `/privacy` |
| `terms.html` | `/terms` |
| `contact.html` | `/contact` |

`_redirects` sends `www.psychbrief.online` → apex. `404.html` is the branded not-found page.

## TikTok developer integration

Psych Brief uses TikTok **Login Kit** (`user.info.basic`) and the **Content Posting API**
(`video.upload`, inbox/draft upload only — no Direct Post). See `/tiktok` and `/review-demo`.

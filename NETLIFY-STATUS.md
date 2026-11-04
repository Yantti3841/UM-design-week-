# Deployment

Frontend: https://umdesignweekgenerator.netlify.app
Cloudflare Worker: https://umdw-flower-api.guanxer.workers.dev
Database: umdw-2026-production (DB binding)

Netlify /api/* proxies HTTP to the Worker. The wall connects directly to its secure WebSocket endpoint, with HTTP polling as fallback. /admin redirects to the Worker for same-origin Cloudflare Access authentication.

Admin uses a password login at /admin/login. PBKDF2 password hashing, signed eight-hour secure HttpOnly SameSite cookies, same-origin form checks and a rate limiting binding protect access. Secret values are stored only as Cloudflare Worker secrets; never commit passwords or secret JSON. Access setup and payment-method activation are no longer needed.

The exhibition closes at 2026-11-18 00:00 Asia/Shanghai. A daily 16:00 UTC cron enforces retention; requests also enforce it. Prior Sites records are not automatically copied to this new database.

## Backend deployment
Install dependencies, then run npx wrangler@4 login, npx wrangler@4 d1 migrations apply umdw-2026-production --remote, and npx wrangler@4 deploy. wrangler.jsonc rebuilds the Worker automatically. Confirm the configured account and database IDs before deploying from another account.

Validated: Netlify generator UI submitted a test flower, D1 persisted it, Netlify wall displayed the image, direct WebSocket returned its snapshot. Test record was removed by its exact UUID and name after verification.

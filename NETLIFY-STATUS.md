# Deployment

Frontend: https://umdesignweekgenerator.netlify.app
Cloudflare Worker: https://umdw-flower-api.guanxer.workers.dev
Database: umdw-2026-production (DB binding)

Netlify /api/* proxies HTTP to the Worker. The wall connects directly to its secure WebSocket endpoint, with HTTP polling as fallback. /admin redirects to the Worker for same-origin Cloudflare Access authentication.

Admin API fails closed unless Cloudflare Access supplies a verified ctx.access identity matching ADMIN_EMAIL. Never trust client-supplied oai-authenticated headers: the Worker strips them first.

Required Access setup: protect /admin and /api/admin/* on the Worker hostname, permit only the administrator email. Regular participants do not log in.

The exhibition closes at 2026-11-18 00:00 Asia/Shanghai. A daily 16:00 UTC cron enforces retention; requests also enforce it. Prior Sites records are not automatically copied to this new database.

# RSVPguide — Environment Variables Reference

This file documents every environment variable required to run RSVPguide.
**Never put real values here.** Use `.env.local` for local development and  
Hostinger's VPS environment manager (or GitHub Secrets) for production.

Copy `.env.example` to `.env.local` and fill in your real values to get started.

---

## Supabase

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anon key (safe in browser) | Supabase Dashboard → Settings → API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key — bypasses RLS | Supabase Dashboard → Settings → API → `service_role` `secret` — **never expose to browser** |

---

## Google Places API

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `GOOGLE_PLACES_API_KEY` | ✅ | Server-side only key for venue photo and detail lookups | [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → API key — restrict to Places API |

> **Security:** This key is server-side only. It is NOT prefixed with `NEXT_PUBLIC_`  
> and will never be sent to the browser.

---

## Eventbrite

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `EVENTBRITE_API_KEY` | Optional | OAuth token for Eventbrite event search | [eventbrite.com/platform/api-keys](https://www.eventbrite.com/platform/api-keys) |

> If this key is missing, the Eventbrite sync is silently skipped.

---

## Site URL

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical base URL — used for sitemap, OG tags, and email links | `https://rsvpguide.com` |

---

## Secret keys

These are random secrets you generate yourself. Use `openssl rand -hex 32` to create each one.

| Variable | Required | Description | Usage |
|---|---|---|---|
| `SEED_SECRET_KEY` | ✅ (setup only) | Protects `POST /api/seed` — insert the 30 venue records | Passed as `x-seed-key` header. Only needed once during initial setup. Can be rotated or removed after seeding. |
| `SYNC_SECRET_KEY` | ✅ | Protects `POST /api/sync-events` — the external cron job trigger | Passed as `x-sync-key` header in the weekly cron job |
| `ADMIN_SECRET_KEY` | ✅ | Protects all `/api/admin/*` routes and the admin dashboard login | Entered in the admin dashboard login form; also passed as `x-admin-key` header for API calls |

**Generate secure values:**
```bash
openssl rand -hex 32   # generates a 64-character hex string
```

---

## Full `.env.local` template

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Places (server-side only)
GOOGLE_PLACES_API_KEY=AIzaSy...

# Eventbrite (optional)
EVENTBRITE_API_KEY=your_eventbrite_token_here

# Site
NEXT_PUBLIC_SITE_URL=https://rsvpguide.com

# Generated secrets
SEED_SECRET_KEY=<openssl rand -hex 32>
SYNC_SECRET_KEY=<openssl rand -hex 32>
ADMIN_SECRET_KEY=<openssl rand -hex 32>
```

---

## Which variables are safe to commit?

| Variable | Safe to commit? | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ⚠ Usually yes | It's in your Supabase dashboard and technically public, but keep it out of public repos |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⚠ Limited risk | Anon key is public by design; RLS policies restrict what it can access |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ Never | Bypasses all RLS — treat like a database root password |
| `GOOGLE_PLACES_API_KEY` | ❌ Never | API costs real money if leaked |
| `EVENTBRITE_API_KEY` | ❌ Never | |
| `NEXT_PUBLIC_SITE_URL` | ✅ Safe | Not sensitive |
| `SEED_SECRET_KEY` | ❌ Never | |
| `SYNC_SECRET_KEY` | ❌ Never | Used in cron jobs |
| `ADMIN_SECRET_KEY` | ❌ Never | Grants full admin access |

`.env.local` is listed in `.gitignore` and will never be committed.  
The committed `.env.example` contains only placeholder strings.

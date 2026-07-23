# RSVPguide — Deployment Setup Guide

Complete step-by-step instructions for getting RSVPguide running in production on Hostinger.

---

## Prerequisites

- Node.js 18+ installed locally
- A [Supabase](https://supabase.com) account (free tier is fine to start)
- A [Google Cloud](https://console.cloud.google.com) account for the Places API
- A Hostinger VPS or Business hosting plan
- Your domain `rsvpguide.com` pointed to Hostinger's nameservers

---

## STEP 1 — Supabase setup

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Name the project **rsvpguide**, choose the Singapore (ap-southeast-1) region
3. Copy your **Project URL** and **anon/public key** from  
   `Settings → API → Project URL / Project API keys`
4. Open `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
5. Copy the **service_role secret** key (same page, expand "Reveal"):
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
6. In Supabase, go to **SQL Editor → New query**
7. Paste the entire contents of [`/lib/database.sql`](./lib/database.sql) and click **Run**
8. Verify that the four tables (`venues`, `events`, `submissions`, `digest_subscribers`)  
   appear in the **Table Editor**

---

## STEP 2 — Google Places API

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services → Library**
4. Search for and **enable**:
   - **Places API** (required for venue photos and details)
5. Go to **APIs & Services → Credentials → Create credentials → API key**
6. Click **Restrict key**:
   - Under **API restrictions**, select **Restrict key → Places API**
   - Under **Application restrictions**, optionally restrict to your server IPs
7. Copy the key into `.env.local`:
   ```
   GOOGLE_PLACES_API_KEY=AIzaSy...
   ```

---

## STEP 3 — Seed the database with venue data

```bash
# Start the dev server
npm run dev
```

In a second terminal:

```bash
# Replace YOUR_SEED_SECRET with the value of SEED_SECRET_KEY in .env.local
curl -s -X POST http://localhost:3000/api/seed \
  -H "x-seed-key: YOUR_SEED_SECRET" | jq
```

Expected response: `{ "success": true, "count": 30, "venues": [...] }`

Verify that all **30 venues** appear in your Supabase **Table Editor → venues**.

---

## STEP 4 — Fetch venue photos from Google Places

With the dev server still running and `GOOGLE_PLACES_API_KEY` set:

```bash
npx tsx scripts/update-photos.ts
```

This script:
- Queries all venues where `photo_url IS NULL`
- Calls Google Places Text Search + Place Details for each
- Writes the photo URL back to Supabase
- Logs `[1/30] Zouk … ✓` progress to the console

After it completes, refresh the Supabase Table Editor — the `photo_url` column  
should be populated for most venues.

> **API quota note:** The free tier allows 200 USD of usage per month.  
> 30 × 2 API calls = 60 requests, well within the free limit.

---

## STEP 5 — Eventbrite API (optional — for auto event sync)

1. Go to [eventbrite.com/platform/api-keys](https://www.eventbrite.com/platform/api-keys)
2. Create a new API key
3. Add to `.env.local`:
   ```
   EVENTBRITE_API_KEY=your_key_here
   ```
4. Test the sync:
   ```bash
   curl -s -X POST http://localhost:3000/api/sync-events \
     -H "x-sync-key: YOUR_SYNC_SECRET" | jq
   ```

---

## STEP 6 — Deploy to Hostinger VPS

### 6a. Provision the VPS

1. Log in to [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Go to **VPS** → choose a plan (KVM 1 or KVM 2 is sufficient)
3. Select **Ubuntu 22.04** as the OS
4. Note your VPS IP address

### 6b. Install Node.js on the VPS

SSH into your VPS and run:

```bash
# Install Node.js 18 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
node --version  # should print v18.x.x

# Install PM2 (process manager — keeps the app running after disconnects)
npm install -g pm2
```

### 6c. Set environment variables on the VPS

Option A — Hostinger hPanel environment manager:  
Go to **VPS → Manage → Environment Variables** and add each variable from `ENV_REFERENCE.md`.

Option B — `.env` file on the server:
```bash
# Create /var/www/rsvpguide/.env.production.local
nano /var/www/rsvpguide/.env.production.local
```

### 6d. Point your domain

1. In **Hostinger hPanel → Domains**, add `rsvpguide.com`
2. Update your domain registrar's nameservers to Hostinger's (or add an A record  
   pointing to your VPS IP)
3. Enable a **free SSL certificate** via hPanel → SSL

### 6e. Deploy with GitHub Actions (recommended)

1. Push your code to the `main` branch on GitHub
2. Go to **GitHub → Settings → Secrets → Actions → New repository secret**  
   and add the secrets listed in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):
   - `VPS_HOST` — your VPS IP
   - `VPS_USER` — `root` (or your VPS username)
   - `VPS_SSH_KEY` — contents of `~/.ssh/id_rsa` (your local private key)
   - All `NEXT_PUBLIC_*` and server-side env vars listed in `ENV_REFERENCE.md`
3. Trigger a deployment by pushing to `main` — GitHub Actions will build and deploy automatically

### 6f. Deploy manually

```bash
# Edit TARGET_HOST, TARGET_USER, TARGET_DIR in deploy.sh first, then:
bash deploy.sh
```

### 6g. Start the app on the VPS (first time only)

```bash
ssh root@YOUR_VPS_IP
cd /var/www/rsvpguide
PORT=3000 pm2 start node --name rsvpguide -- .next/standalone/server.js
pm2 save
pm2 startup  # auto-start after VPS reboots
```

### 6h. Configure Nginx reverse proxy (optional but recommended)

```nginx
# /etc/nginx/sites-available/rsvpguide
server {
    server_name rsvpguide.com www.rsvpguide.com;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # SSL config added automatically by Certbot / hPanel
}
```

```bash
ln -s /etc/nginx/sites-available/rsvpguide /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## STEP 7 — Set up weekly event sync (cron job)

1. In Hostinger **hPanel → Advanced → Cron Jobs**, add a new job:
   - **Minute:** `0`
   - **Hour:** `0` *(= midnight UTC = 8am Singapore time, SGT = UTC+8)*
   - **Day:** `*`
   - **Month:** `*`
   - **Weekday:** `1` *(Monday)*
2. **Command:**
   ```
   /usr/bin/curl -s -X POST https://rsvpguide.com/api/sync-events -H "x-sync-key: YOUR_SYNC_KEY" >> /var/log/rsvpguide-sync.log 2>&1
   ```
3. Replace `YOUR_SYNC_KEY` with the value of `SYNC_SECRET_KEY` from your env

Or run the provided shell script manually:

```bash
SYNC_SECRET_KEY=your_key NEXT_PUBLIC_SITE_URL=https://rsvpguide.com \
  bash scripts/sync-events.sh
```

---

## STEP 8 — Verify everything is working

| Check | URL |
|---|---|
| Homepage | `https://rsvpguide.com` |
| All venues | `https://rsvpguide.com/venues` |
| Venue detail | `https://rsvpguide.com/venues/zouk` |
| Events calendar | `https://rsvpguide.com/calendar` |
| Submit a venue | `https://rsvpguide.com/submit` |
| Admin dashboard | `https://rsvpguide.com/admin` |
| Sitemap | `https://rsvpguide.com/sitemap.xml` |
| Robots | `https://rsvpguide.com/robots.txt` |

---

## Post-launch checklist

- [ ] Supabase RLS policies are active (check in Supabase → Authentication → Policies)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never committed to git
- [ ] `og-image.png` created at 1200×630 px and placed in `/public/`
- [ ] Google Search Console — submit sitemap URL
- [ ] Test venue submission form end-to-end
- [ ] Test admin approve/reject workflow
- [ ] Confirm weekly cron job fires and logs to file
- [ ] PM2 `startup` command run so the app survives VPS reboots

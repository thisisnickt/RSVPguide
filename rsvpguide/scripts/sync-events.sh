#!/usr/bin/env bash
# =============================================================================
# scripts/sync-events.sh
# Manual or cron-triggered event sync for RSVPguide.com
#
# Usage (manual):
#   SYNC_SECRET_KEY=your_key NEXT_PUBLIC_SITE_URL=https://rsvpguide.com \
#     bash scripts/sync-events.sh
#
# Or export the vars first:
#   export SYNC_SECRET_KEY=your_key
#   export NEXT_PUBLIC_SITE_URL=https://rsvpguide.com
#   bash scripts/sync-events.sh
#
# =============================================================================
# HOW TO SET UP A WEEKLY CRON JOB ON HOSTINGER
# =============================================================================
#
# Singapore time (SGT) is UTC+8. To run every Monday at 8:00am SGT:
#
#   1. Log in to Hostinger hPanel → Advanced → Cron Jobs
#
#   2. Click "Add new cron job" and choose "Custom":
#        Minute:     0
#        Hour:       0     ← 00:00 UTC = 08:00 SGT
#        Day:        *
#        Month:      *
#        Weekday:    1     ← 1 = Monday
#
#   3. In the Command field, enter the full curl command:
#
#        /usr/bin/curl -s -X POST https://rsvpguide.com/api/sync-events \
#          -H "x-sync-key: YOUR_SYNC_KEY_HERE" \
#          -H "Content-Type: application/json" \
#          --max-time 120 \
#          >> /home/YOUR_HOSTINGER_USER/logs/rsvpguide-sync.log 2>&1
#
#      Replace YOUR_SYNC_KEY_HERE with the value of your SYNC_SECRET_KEY env var.
#      Replace YOUR_HOSTINGER_USER with your Hostinger account username.
#
#   4. Save. The job will fire every Monday at midnight UTC (8am Singapore time).
#
# NOTE: Hostinger shared hosting uses UTC. Adjust the hour accordingly for
# other timezones (e.g. 22 for SGT day-before-at-10pm = next day 6am SGT).
#
# =============================================================================

set -euo pipefail

SYNC_KEY="${SYNC_SECRET_KEY:-}"
SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://rsvpguide.com}"
ENDPOINT="${SITE_URL}/api/sync-events"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"

if [[ -z "$SYNC_KEY" ]]; then
  echo "[$TIMESTAMP] ERROR: SYNC_SECRET_KEY is not set."
  echo "  Export it before running: export SYNC_SECRET_KEY=your_key"
  exit 1
fi

echo "[$TIMESTAMP] Starting event sync → $ENDPOINT"

RESPONSE=$(
  curl -s \
    -X POST "$ENDPOINT" \
    -H "x-sync-key: $SYNC_KEY" \
    -H "Content-Type: application/json" \
    --max-time 120 \
    -w "\nHTTP_STATUS:%{http_code}"
)

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1 | sed 's/HTTP_STATUS://')
BODY=$(echo "$RESPONSE" | sed '$d')

TIMESTAMP_END="$(date '+%Y-%m-%d %H:%M:%S')"

if [[ "$HTTP_STATUS" == "200" ]]; then
  echo "[$TIMESTAMP_END] Sync complete (HTTP $HTTP_STATUS)"
  echo "  Response: $BODY"
else
  echo "[$TIMESTAMP_END] Sync FAILED (HTTP $HTTP_STATUS)"
  echo "  Response: $BODY"
  exit 1
fi

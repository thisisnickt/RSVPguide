#!/usr/bin/env bash
# =============================================================================
# deploy.sh — RSVPguide manual deployment script
#
# Usage:
#   bash deploy.sh
#
# Requirements:
#   - SSH access to your Hostinger VPS (key-based auth recommended)
#   - rsync installed locally
#   - .env.local configured with all required variables
#   - TARGET_HOST / TARGET_USER / TARGET_DIR exported, or edit below
# =============================================================================

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
# Edit these or export them from your shell before running.
TARGET_HOST="${TARGET_HOST:-YOUR_VPS_IP}"
TARGET_USER="${TARGET_USER:-root}"
TARGET_DIR="${TARGET_DIR:-/var/www/rsvpguide}"
# ─────────────────────────────────────────────────────────────────────────────

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RESET='\033[0m'

log()  { echo -e "${BOLD}[$(date '+%H:%M:%S')]${RESET} $*"; }
ok()   { echo -e "${GREEN}✓${RESET} $*"; }
warn() { echo -e "${YELLOW}⚠${RESET} $*"; }

# ── Step 1: Build ─────────────────────────────────────────────────────────────
log "Building RSVPguide..."
NEXT_TELEMETRY_DISABLED=1 npm run build
ok "Build complete"

# ── Step 2: Upload standalone bundle ─────────────────────────────────────────
log "Uploading to ${TARGET_USER}@${TARGET_HOST}:${TARGET_DIR}..."

# Sync only the files the standalone server needs
rsync -avz --delete \
  .next/standalone/ \
  "${TARGET_USER}@${TARGET_HOST}:${TARGET_DIR}/"

rsync -avz --delete \
  .next/static/ \
  "${TARGET_USER}@${TARGET_HOST}:${TARGET_DIR}/.next/static/"

rsync -avz --delete \
  public/ \
  "${TARGET_USER}@${TARGET_HOST}:${TARGET_DIR}/public/"

ok "Upload complete"

# ── Step 3: Restart the server process ───────────────────────────────────────
log "Restarting server on VPS..."

ssh "${TARGET_USER}@${TARGET_HOST}" bash <<REMOTE
  set -e
  cd "${TARGET_DIR}"

  # Copy env file if it doesn't exist on the server yet
  # You should set env vars directly in Hostinger's panel instead.

  # Restart with PM2 (recommended) — install with: npm install -g pm2
  if command -v pm2 &>/dev/null; then
    pm2 restart rsvpguide 2>/dev/null \
      || pm2 start node --name rsvpguide -- "${TARGET_DIR}/server.js"
    pm2 save
  else
    # Fallback: kill existing process and start fresh (no pm2)
    pkill -f "node.*server.js" 2>/dev/null || true
    nohup node "${TARGET_DIR}/server.js" \
      >> "${TARGET_DIR}/app.log" 2>&1 &
    echo "Started Node process (PID \$!)"
  fi
REMOTE

ok "Server restarted"

# ── Step 4: Health check ──────────────────────────────────────────────────────
log "Running health check..."
sleep 3
SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://rsvpguide.com}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${SITE_URL}" || echo "000")

if [[ "${HTTP_CODE}" == "200" ]]; then
  ok "Site is live: ${SITE_URL}  (HTTP ${HTTP_CODE})"
else
  warn "Health check returned HTTP ${HTTP_CODE} — check server logs"
fi

echo ""
echo -e "${GREEN}${BOLD}✓ Deployment complete.${RESET}"
echo "  Visit: ${SITE_URL}"

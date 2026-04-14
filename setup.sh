#!/usr/bin/env bash
# ============================================================
# Pulse — Expense Manager  |  Local Development Setup Script
# ============================================================
# Usage:
#   chmod +x setup.sh
#   ./setup.sh
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_step()  { echo -e "\n${CYAN}${BOLD}▶ $1${NC}"; }
print_ok()    { echo -e "  ${GREEN}✓${NC} $1"; }
print_warn()  { echo -e "  ${YELLOW}⚠${NC}  $1"; }
print_error() { echo -e "  ${RED}✗${NC} $1"; }

echo -e "${BOLD}"
echo "  ██████╗ ██╗   ██╗██╗     ███████╗███████╗"
echo "  ██╔══██╗██║   ██║██║     ██╔════╝██╔════╝"
echo "  ██████╔╝██║   ██║██║     ███████╗█████╗  "
echo "  ██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝  "
echo "  ██║     ╚██████╔╝███████╗███████║███████╗"
echo "  ╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝"
echo -e "${NC}"
echo -e "  ${CYAN}Expense Manager — Setup Script${NC}"
echo ""

# ── 1. Check prerequisites ─────────────────────────────────

print_step "Checking prerequisites"

check_cmd() {
  if command -v "$1" &>/dev/null; then
    print_ok "$1 found ($(command -v "$1"))"
  else
    print_error "$1 not found. Please install it before running this script."
    echo "  → $2"
    exit 1
  fi
}

check_node_version() {
  local ver
  ver=$(node -e "process.stdout.write(process.versions.node)")
  local major
  major=$(echo "$ver" | cut -d. -f1)
  if [ "$major" -ge 20 ]; then
    print_ok "Node.js $ver"
  else
    print_error "Node.js 20+ required (found $ver). Please upgrade."
    echo "  → https://nodejs.org/"
    exit 1
  fi
}

check_pnpm_version() {
  local ver
  ver=$(pnpm --version)
  local major
  major=$(echo "$ver" | cut -d. -f1)
  if [ "$major" -ge 9 ]; then
    print_ok "pnpm $ver"
  else
    print_warn "pnpm $ver found — pnpm 9+ recommended. Run: npm install -g pnpm@latest"
  fi
}

check_cmd "node" "https://nodejs.org/"
check_node_version
check_cmd "pnpm" "npm install -g pnpm"
check_pnpm_version
check_cmd "psql" "https://www.postgresql.org/download/ (or use a managed DB like Neon/Supabase)"

# ── 2. Environment file ────────────────────────────────────

print_step "Setting up environment variables"

if [ -f ".env" ]; then
  print_ok ".env already exists — skipping (delete it to regenerate)"
else
  if [ -f ".env.example" ]; then
    cp .env.example .env
    print_ok "Copied .env.example → .env"
  else
    print_warn ".env.example not found — creating a blank .env"
    touch .env
  fi
  echo ""
  print_warn "Open .env and fill in these required values before continuing:"
  echo ""
  echo "    DATABASE_URL            — PostgreSQL connection string"
  echo "    CLERK_SECRET_KEY        — from https://dashboard.clerk.com"
  echo "    CLERK_PUBLISHABLE_KEY   — from https://dashboard.clerk.com"
  echo "    VITE_CLERK_PUBLISHABLE_KEY — same as above (Vite build-time)"
  echo "    SESSION_SECRET          — any random string (min 32 chars)"
  echo ""
  read -rp "  Press Enter once you have filled in .env to continue..."
fi

# Source the .env to validate required vars
set -a
# shellcheck disable=SC1091
source .env 2>/dev/null || true
set +a

MISSING=()
for var in DATABASE_URL CLERK_SECRET_KEY CLERK_PUBLISHABLE_KEY VITE_CLERK_PUBLISHABLE_KEY SESSION_SECRET; do
  if [ -z "${!var}" ]; then
    MISSING+=("$var")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  print_error "Missing required environment variables in .env:"
  for v in "${MISSING[@]}"; do
    echo "      - $v"
  done
  echo ""
  echo "  Please fill them in and re-run this script."
  exit 1
else
  print_ok "All required environment variables are set"
fi

# ── 3. Install dependencies ────────────────────────────────

print_step "Installing dependencies"

pnpm install
print_ok "Dependencies installed"

# ── 4. Database setup ──────────────────────────────────────

print_step "Setting up the database"

echo "  Pushing Drizzle schema to PostgreSQL..."
pnpm --filter @workspace/db run push
print_ok "Database schema synced"

# ── 5. Build type-checked libraries ───────────────────────

print_step "Building shared libraries"

pnpm run typecheck:libs 2>&1 | tail -3 || true
print_ok "TypeScript project references compiled"

# ── 6. Done ────────────────────────────────────────────────

echo ""
echo -e "${GREEN}${BOLD}  ✓ Setup complete!${NC}"
echo ""
echo -e "  ${BOLD}Start the development servers:${NC}"
echo ""
echo -e "    ${CYAN}# Terminal 1 — API server (port 8080)${NC}"
echo -e "    pnpm --filter @workspace/api-server run dev"
echo ""
echo -e "    ${CYAN}# Terminal 2 — Frontend (port 5173)${NC}"
echo -e "    pnpm --filter @workspace/pulse run dev"
echo ""
echo -e "  Then open ${BOLD}http://localhost:5173${NC} in your browser."
echo ""
echo -e "  ${YELLOW}Tip:${NC} On first boot the API server seeds demo data automatically."
echo -e "  ${YELLOW}Tip:${NC} Sign in via Clerk — your account is created in the DB on first login."
echo ""

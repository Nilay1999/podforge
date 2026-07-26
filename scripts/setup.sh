#!/usr/bin/env bash
#
# Podforge one-shot setup for Linux/macOS.
#
#   ./scripts/setup.sh            # interactive: prompts for an admin password
#   ./scripts/setup.sh --yes      # non-interactive: admin password defaults to "admin"
#
# Checks prerequisites, seeds backend/config.yaml (JWT secret + admin user) and
# .env, then installs all dependencies. Safe to re-run — existing config is kept.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# --- pretty output -----------------------------------------------------------
if [ -t 1 ]; then
  BOLD=$'\033[1m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; DIM=$'\033[2m'; RESET=$'\033[0m'
else
  BOLD=""; GREEN=""; YELLOW=""; RED=""; DIM=""; RESET=""
fi
info()  { printf "%s==>%s %s\n" "$GREEN$BOLD" "$RESET" "$*"; }
warn()  { printf "%s warn%s %s\n" "$YELLOW$BOLD" "$RESET" "$*"; }
err()   { printf "%serror%s %s\n" "$RED$BOLD" "$RESET" "$*" >&2; }
step()  { printf "%s  -%s %s\n" "$DIM" "$RESET" "$*"; }

ASSUME_YES=0
for arg in "$@"; do
  case "$arg" in
    -y|--yes) ASSUME_YES=1 ;;
    -h|--help) sed -n '2,9p' "$0" | sed 's/^#\s\?//'; exit 0 ;;
    *) err "unknown option: $arg"; exit 1 ;;
  esac
done

# --- prerequisites -----------------------------------------------------------
info "Checking prerequisites"
MISSING=0

need() {
  local name="$1" hint="$2" ver=""
  if command -v "$name" >/dev/null 2>&1; then
    ver="$("$name" version 2>/dev/null | head -n1 || true)"
    [ -z "$ver" ] && ver="$("$name" --version 2>/dev/null | head -n1 || true)"
    step "$name ${ver}"
  else
    err "$name not found — $hint"
    MISSING=1
  fi
}

need go   "install Go 1.25+  : https://go.dev/dl/"
need node "install Node 20+  : https://nodejs.org/  (or use nvm)"

if command -v pnpm >/dev/null 2>&1; then
  step "pnpm $(pnpm --version)"
else
  err "pnpm not found — enable it with: corepack enable && corepack prepare pnpm@latest --activate"
  MISSING=1
fi

# kubectl is optional (the backend talks to the cluster via client-go directly).
if command -v kubectl >/dev/null 2>&1; then
  step "kubectl $(kubectl version --client -o yaml 2>/dev/null | grep -m1 gitVersion | awk '{print $2}' || true)"
else
  warn "kubectl not found (optional, but handy for inspecting your cluster)"
fi

if [ "$MISSING" -ne 0 ]; then
  err "Install the missing tools above, then re-run ./scripts/setup.sh"
  exit 1
fi

# --- kubeconfig sanity -------------------------------------------------------
KUBECONFIG_PATH="${KUBECONFIG:-$HOME/.kube/config}"
if [ -f "$KUBECONFIG_PATH" ]; then
  info "Found kubeconfig at $KUBECONFIG_PATH"
else
  warn "No kubeconfig at $KUBECONFIG_PATH"
  warn "Podforge needs a cluster. Spin one up locally, e.g.:"
  step "minikube start      # https://minikube.sigs.k8s.io/"
  step "k3d cluster create  # https://k3d.io/"
fi

# --- .env --------------------------------------------------------------------
if [ -f .env ]; then
  step ".env already exists — keeping it"
elif [ -f .env.example ]; then
  cp .env.example .env
  info "Created .env from .env.example"
fi

# --- backend/config.yaml -----------------------------------------------------
CONFIG=backend/config.yaml
if [ -f "$CONFIG" ]; then
  info "$CONFIG already exists — keeping it"
else
  info "Generating $CONFIG"

  # JWT secret
  if command -v openssl >/dev/null 2>&1; then
    JWT_SECRET="$(openssl rand -hex 32)"
  else
    JWT_SECRET="$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  fi
  step "JWT secret generated"

  # Admin password. Stored as plaintext in the gitignored local config; use
  # password_hash (cd backend && go run ./cmd/hashpw) for real deployments.
  ADMIN_PW="admin"
  if [ "$ASSUME_YES" -eq 0 ] && [ -t 0 ]; then
    printf "%s  -%s Admin password [admin]: " "$DIM" "$RESET"
    read -rs ADMIN_PW_INPUT || true
    printf "\n"
    ADMIN_PW="${ADMIN_PW_INPUT:-admin}"
  else
    step "Admin password: \"admin\" (change it after first login)"
  fi

  sed -e "s|__JWT_SECRET__|$JWT_SECRET|" \
      -e "s|__ADMIN_PASSWORD__|$ADMIN_PW|" \
      backend/config.example.yaml > "$CONFIG"
  info "Wrote $CONFIG (login: admin / your password)"
fi

# --- dependencies ------------------------------------------------------------
info "Installing dependencies (pnpm install)"
pnpm install

info "Tidying Go modules"
( cd backend && go mod download )

# --- done --------------------------------------------------------------------
printf "\n%sSetup complete.%s Start Podforge with:\n\n" "$GREEN$BOLD" "$RESET"
printf "    ./scripts/run.sh\n\n"
printf "  Backend  -> http://localhost:8080\n"
printf "  UI       -> http://localhost:5173\n"
printf "  Login    -> admin / (the password you set)\n\n"

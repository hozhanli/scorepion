#!/usr/bin/env bash
#
# stack-status.sh — Print the status of all three Scorepion dev services.
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT/logs"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_port() {
  local name="$1"; local port="$2"
  if command -v nc >/dev/null 2>&1; then
    if nc -z localhost "$port" 2>/dev/null; then
      echo -e "  ${GREEN}●${NC} $name  ${BLUE}:$port${NC}  ${GREEN}up${NC}"
      return 0
    fi
  fi
  if (echo >/dev/tcp/localhost/"$port") >/dev/null 2>&1; then
    echo -e "  ${GREEN}●${NC} $name  ${BLUE}:$port${NC}  ${GREEN}up${NC}"
  else
    echo -e "  ${RED}●${NC} $name  ${BLUE}:$port${NC}  ${RED}down${NC}"
  fi
}

echo ""
echo -e "${YELLOW}Scorepion dev stack:${NC}"
check_port "Expo web " 13290
check_port "Backend  " 13291
check_port "Postgres " 13292
echo ""

if command -v docker >/dev/null 2>&1; then
  if docker ps --filter "name=scorepion-db" --format '{{.Status}}' | grep -q .; then
    echo -e "  docker:  ${GREEN}$(docker ps --filter "name=scorepion-db" --format '{{.Status}}')${NC}"
  fi
fi

for p in expo server; do
  if [ -f "$LOG_DIR/$p.pid" ]; then
    pid=$(cat "$LOG_DIR/$p.pid")
    if kill -0 "$pid" 2>/dev/null; then
      echo -e "  $p.pid:  ${GREEN}$pid alive${NC}"
    else
      echo -e "  $p.pid:  ${RED}$pid dead${NC}"
    fi
  fi
done
echo ""

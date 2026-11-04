#!/usr/bin/env bash
# Richtet die Inti Klientenverwaltung auf einem frischen Ubuntu-Server ein.
# Aufruf auf dem Server (als root):
#   curl -fsSL https://raw.githubusercontent.com/onetonebeck00-lab/inti-klientenverwaltung/main/deploy/einrichten.sh | bash
# Optional: DOMAIN=klienten.example.de vorher setzen. Ohne Domain wird <IP>.sslip.io verwendet.
set -euo pipefail

REPO="https://github.com/onetonebeck00-lab/inti-klientenverwaltung.git"
ZIEL="/opt/inti"

echo "1/5 Docker installieren"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi

echo "2/5 Firewall: nur SSH, HTTP und HTTPS"
if command -v ufw >/dev/null; then
  ufw allow OpenSSH >/dev/null; ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null
  ufw --force enable >/dev/null
fi

echo "3/5 Programm herunterladen"
if [ -d "$ZIEL/.git" ]; then git -C "$ZIEL" pull --ff-only; else git clone "$REPO" "$ZIEL"; fi
cd "$ZIEL/deploy"

echo "4/5 Einstellungen"
if [ ! -f .env ]; then
  IP=$(curl -fsS https://api.ipify.org || hostname -I | awk '{print $1}')
  DOMAIN="${DOMAIN:-${IP//./-}.sslip.io}"
  printf 'DOMAIN=%s\nDB_PASSWORT=%s\n' "$DOMAIN" "$(openssl rand -hex 24)" > .env
  chmod 600 .env
fi
. ./.env

echo "5/5 Starten (der erste Start dauert einige Minuten)"
docker compose up -d --build

echo "Warte auf die Datenbank-Migration ..."
for i in $(seq 1 60); do
  docker compose logs app 2>/dev/null | grep -q "Ready in\|started server\|Local:" && break
  sleep 5
done

if [ "${TESTDATEN:-ja}" = "ja" ] && [ ! -f .testdaten-geladen ]; then
  docker compose exec -T -e TESTDATEN=ja app npx tsx prisma/seed.ts
  touch .testdaten-geladen
fi

echo
echo "Fertig. Die Klientenverwaltung ist erreichbar unter: https://$DOMAIN"
echo "Anmeldung (Testdaten): frank@inti.test / Inti-Test-2026!"

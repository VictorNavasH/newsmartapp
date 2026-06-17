#!/usr/bin/env bash
# Reconstruye y recrea el contenedor del Smart Assistant en el VPS.
# Uso (en el VPS):  cd /opt/smart-assistant-service && bash redeploy.sh
set -e
cd "$(dirname "$0")"

echo "🔨 Construyendo imagen..."
docker build -t nua-smart-assistant .

echo "♻️  Recreando contenedor (relee .env y archivos nuevos)..."
docker rm -f nua-smart-assistant 2>/dev/null || true
docker run -d --name nua-smart-assistant \
  --env-file .env --restart unless-stopped -p 127.0.0.1:8645:8645 \
  --label 'traefik.enable=true' \
  --label 'traefik.http.routers.smartassistant.rule=Host(`smartassistant.nuasmartrestaurant.com`)' \
  --label 'traefik.http.routers.smartassistant.entrypoints=websecure' \
  --label 'traefik.http.routers.smartassistant.tls.certresolver=letsencrypt' \
  --label 'traefik.http.services.smartassistant.loadbalancer.server.port=8645' \
  nua-smart-assistant

sleep 2
echo "✅ Listo. Health:"
curl -s localhost:8645/health; echo

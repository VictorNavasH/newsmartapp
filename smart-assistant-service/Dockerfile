# Servicio del Smart Assistant de NÜA — Claude Agent SDK + MCP Postgres (solo lectura)
FROM node:22-slim

# git y ca-certificates: algunos paquetes MCP los necesitan al resolver con npx
RUN apt-get update && apt-get install -y --no-install-recommends \
    git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.mjs ./
COPY data-dictionary.md ./

# Pre-descargar el MCP de Postgres para que el primer arranque no tarde
RUN npm install @modelcontextprotocol/server-postgres || true

EXPOSE 8645
CMD ["node", "server.mjs"]

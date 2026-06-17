# NÜA Smart Assistant — Servicio (VPS)

Servicio que da cerebro al chat **Smart Assistant** de la Smart App. Corre en el VPS
(no en Vercel) porque usa la **suscripción de Claude** vía el Claude Agent SDK, que
necesita un proceso persistente con el token de suscripción.

```
Chat (Vercel) → /api/chat → ESTE servicio (VPS) → Claude Agent SDK (Sonnet 4.6, suscripción)
                                                 → MCP Postgres (solo lectura) → Supabase
                                                 ← respuesta síncrona
```

## Requisitos previos

1. **Token de suscripción.** En tu Mac (con Claude Code logueado):
   ```bash
   claude setup-token
   ```
   Copia el token (dura 1 año). Irá en `CLAUDE_CODE_OAUTH_TOKEN`.

2. **Cadena de conexión de Supabase.** Supabase → Project Settings → Database →
   *Connection string (URI)*. Idealmente crea antes un **usuario de solo lectura**
   (recomendado, ver abajo).

3. **Secreto compartido.** Inventa uno largo y aleatorio (p. ej. `openssl rand -hex 32`).
   El mismo valor va en el `.env` de aquí (`ASSISTANT_SHARED_SECRET`) y en Vercel
   (`ASSISTANT_API_SECRET`).

## Despliegue en el VPS

```bash
# 1. Copia esta carpeta al VPS (scp, git clone del repo, etc.)
# 2. Crea el .env a partir del ejemplo y rellénalo
cp .env.example .env
nano .env        # pega CLAUDE_CODE_OAUTH_TOKEN, SUPABASE_DB_URL, ASSISTANT_SHARED_SECRET

# 3. Levanta el contenedor (junto a hermes y traefik)
docker compose up -d --build

# 4. Comprueba que está vivo
docker logs -f nua-smart-assistant
curl http://localhost:8645/health        # si expusiste el puerto
```

Ajusta `docker-compose.yml`: el `Host(...)` con tu dominio y el nombre de la red
externa de Traefik (`docker network ls` para verlo).

## Conectar la Smart App

En **Vercel** (Project → Settings → Environment Variables) añade:

| Variable | Valor |
|---|---|
| `ASSISTANT_API_URL` | `https://assistant.tudominio.com/chat` |
| `ASSISTANT_API_SECRET` | el mismo secreto que `ASSISTANT_SHARED_SECRET` |

Redeploy de la app y el chat queda conectado.

## Usuario Postgres de solo lectura (recomendado)

Para que el asistente NO pueda escribir aunque algo falle, crea un rol de solo lectura
en Supabase (SQL editor) y usa SUS credenciales en `SUPABASE_DB_URL`:

```sql
CREATE ROLE asistente_ro LOGIN PASSWORD 'una-password-larga';
GRANT CONNECT ON DATABASE postgres TO asistente_ro;
GRANT USAGE ON SCHEMA public TO asistente_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO asistente_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO asistente_ro;
```

## Notas

- El servicio restringe el agente a **solo la herramienta de consulta** (`mcp__db__query`):
  sin Bash, sin escritura, sin internet.
- El `CLAUDE_CODE_OAUTH_TOKEN` caduca al año — habrá que regenerarlo con `claude setup-token`.
- Versiones de paquetes (`@anthropic-ai/claude-agent-sdk`, `@modelcontextprotocol/server-postgres`):
  son las del primer arranque; si npm avisa de una más nueva, se actualiza en el `package.json`.

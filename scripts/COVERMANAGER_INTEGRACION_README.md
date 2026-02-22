# Integración Supabase → CoverManager

## Resumen

Esta integración envía automáticamente los tickets de consumo a CoverManager cuando se crea una factura en `cuentica_transactions`.

```
TPV Dotyk → cuentica_transactions (INSERT) → pg_net trigger → n8n webhook → CoverManager set_ticket
```

## Archivos incluidos

| Archivo | Descripción |
|---------|-------------|
| `covermanager_integration.sql` | Script SQL con trigger y funciones para Supabase |
| `n8n_workflow_covermanager_supabase.json` | Workflow de n8n para importar |

---

## Paso 1: Habilitar pg_net en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Database** → **Extensions**
3. Busca **pg_net**
4. Haz clic en **Enable**

Para verificar que está activo, ejecuta en el SQL Editor:

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

---

## Paso 2: Configurar n8n

### 2.1 Importar el workflow

1. En n8n, ve a **Workflows** → **Import from file**
2. Selecciona `n8n_workflow_covermanager_supabase.json`
3. El workflow se importará con todos los nodos configurados

### 2.2 Obtener la URL del webhook

1. Abre el workflow importado
2. Haz clic en el nodo **"Webhook Supabase"**
3. Copia la **Production URL** (algo como `https://tu-n8n.com/webhook/covermanager-ticket`)
4. **IMPORTANTE**: Guarda esta URL, la necesitarás en el paso 3

### 2.3 Activar el workflow

1. En la esquina superior derecha, activa el toggle **"Active"**

---

## Paso 3: Ejecutar el script SQL en Supabase

### 3.1 Editar la URL del webhook

Abre `covermanager_integration.sql` y busca esta línea:

```sql
v_webhook_url TEXT := 'https://TU-INSTANCIA-N8N.com/webhook/covermanager-ticket';
```

Reemplázala con tu URL de n8n del paso 2.2.

### 3.2 Ejecutar el script

1. Ve a **SQL Editor** en Supabase Dashboard
2. Copia y pega todo el contenido de `covermanager_integration.sql`
3. Haz clic en **Run**

El script creará:
- Tabla `covermanager_ticket_log` para debugging
- Función `fn_enviar_ticket_covermanager()`
- Trigger `trg_enviar_ticket_covermanager`
- Función auxiliar `fn_extraer_items_ticket()`

---

## Paso 4: Verificar la instalación

### 4.1 Verificar el trigger

```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'trg_enviar_ticket_covermanager';
```

Debe devolver una fila con `tgenabled = 'O'` (habilitado).

### 4.2 Test manual

Inserta un registro de prueba en `cuentica_transactions` y verifica el log:

```sql
-- Ver últimos logs
SELECT * FROM covermanager_ticket_log
ORDER BY created_at DESC
LIMIT 10;
```

---

## Flujo de datos

### Datos que envía Supabase a n8n

```json
{
  "transaction_id": "TRX-123456",
  "table_name": "Mesa 5",
  "table_id": "table-uuid",
  "total_amount": 78.50,
  "base_amount": 65.00,
  "tips_amount": 13.50,
  "payment_method": "card",
  "cuentica_invoice_date": "2025-02-01",
  "cuentica_identifier": "F-2025-001234",
  "webhook_payload": { /* Datos originales del TPV */ },
  "created_at": "2025-02-01T14:30:00Z"
}
```

### Datos que n8n envía a CoverManager (set_ticket)

```json
{
  "id_reserv": "rHtD4q",
  "items": [
    {
      "productName": "Hamburguesa Classic",
      "amount": "1",
      "unitPrice": "12.50",
      "totalPrice": "12.50"
    }
  ],
  "payments": [
    {
      "type": "Tarjeta",
      "amount": "78.50"
    }
  ],
  "printDate": "2025-02-01 14:30:00",
  "status": "PAID",
  "total": "78.50",
  "idTicketExt": "F-2025-001234"
}
```

---

## Debugging

### Ver logs de envíos

```sql
-- Todos los envíos
SELECT * FROM covermanager_ticket_log ORDER BY created_at DESC LIMIT 20;

-- Solo errores
SELECT * FROM covermanager_ticket_log WHERE status = 'error' ORDER BY created_at DESC;

-- Estadísticas
SELECT status, COUNT(*) FROM covermanager_ticket_log GROUP BY status;
```

### Logs en n8n

1. Ve a **Executions** en n8n
2. Revisa las ejecuciones del workflow
3. Cada nodo muestra su input/output

---

## Estados de CoverManager

El workflow busca reservas con estos estados:

| Código | Estado |
|--------|--------|
| 3 | Confirmada |
| 4 | Recordada |
| 5 | Sentada |
| 6 | En barra |
| 7 | Postre |
| 8 | Pagado |
| 9 | Otro |

---

## Solución de problemas

### "No se encontró reserva activa para mesa X"

1. Verificar que la mesa tiene una reserva activa en CoverManager
2. Verificar que el nombre de la mesa coincide exactamente
3. Verificar que el estado de la reserva está en [3,4,5,6,7,8,9]

### El trigger no se ejecuta

1. Verificar que pg_net está habilitado
2. Verificar que el trigger está activo:
   ```sql
   SELECT tgname, tgenabled FROM pg_trigger WHERE tgname LIKE '%covermanager%';
   ```

### Error de conexión en pg_net

1. Verificar que la URL del webhook es correcta
2. Verificar que n8n está accesible desde internet
3. Revisar los logs en la tabla `covermanager_ticket_log`

---

## Credenciales

| Servicio | Credencial |
|----------|------------|
| CoverManager API Key | `6JCRyjq4ZrnK5pJPQSxf` |
| CoverManager Slug | `NUA-Smart-Restaurant` |

---

## Contacto

- **CoverManager soporte**: Eric (según email del 26/09/2025)
- **Documentación API**: https://doc-api.covermanager.com/

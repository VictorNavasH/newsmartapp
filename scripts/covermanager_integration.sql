-- ============================================================
-- INTEGRACIÓN SUPABASE → COVERMANAGER
-- Trigger para enviar tickets automáticamente al crear factura
-- ============================================================

-- PASO 1: Verificar y habilitar pg_net
-- Ejecutar esto en el SQL Editor de Supabase
-- ============================================================

-- Verificar si pg_net está disponible
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- Si no existe, habilitarlo (requiere permisos de superuser)
-- En Supabase, ve a Database > Extensions > busca "pg_net" y actívalo
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- PASO 2: Crear tabla de log para debugging (opcional pero recomendado)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.covermanager_ticket_log (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR NOT NULL,
    table_name VARCHAR,
    total_amount NUMERIC(10,2),
    status VARCHAR DEFAULT 'pending',
    request_payload JSONB,
    response_payload JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_cm_log_status ON covermanager_ticket_log(status);
CREATE INDEX IF NOT EXISTS idx_cm_log_transaction ON covermanager_ticket_log(transaction_id);

-- ============================================================
-- PASO 3: Función que envía el ticket a n8n
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_enviar_ticket_covermanager()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_webhook_url TEXT := 'https://TU-INSTANCIA-N8N.com/webhook/covermanager-ticket'; -- CAMBIAR POR TU URL
    v_payload JSONB;
    v_request_id BIGINT;
BEGIN
    -- Solo procesar si hay mesa y es un INSERT nuevo
    IF NEW.table_name IS NULL OR NEW.table_name = '' THEN
        RAISE NOTICE 'Transacción % sin mesa asignada, omitiendo CoverManager', NEW.transaction_id;
        RETURN NEW;
    END IF;

    -- Solo procesar si el total es mayor a 0
    IF NEW.total_amount IS NULL OR NEW.total_amount <= 0 THEN
        RAISE NOTICE 'Transacción % con total 0, omitiendo CoverManager', NEW.transaction_id;
        RETURN NEW;
    END IF;

    -- Construir payload para n8n
    v_payload := jsonb_build_object(
        'transaction_id', NEW.transaction_id,
        'table_name', NEW.table_name,
        'table_id', NEW.table_id,
        'total_amount', NEW.total_amount,
        'base_amount', NEW.base_amount,
        'tips_amount', NEW.tips_amount,
        'payment_method', NEW.payment_method,
        'cuentica_invoice_date', NEW.cuentica_invoice_date,
        'cuentica_identifier', NEW.cuentica_identifier,
        'webhook_payload', NEW.webhook_payload,
        'created_at', NEW.created_at
    );

    -- Log de la petición
    INSERT INTO covermanager_ticket_log (
        transaction_id,
        table_name,
        total_amount,
        status,
        request_payload
    ) VALUES (
        NEW.transaction_id,
        NEW.table_name,
        NEW.total_amount,
        'sending',
        v_payload
    );

    -- Enviar petición HTTP a n8n via pg_net
    SELECT net.http_post(
        url := v_webhook_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json'
        ),
        body := v_payload
    ) INTO v_request_id;

    -- Actualizar log con el request_id
    UPDATE covermanager_ticket_log
    SET status = 'sent',
        processed_at = NOW()
    WHERE transaction_id = NEW.transaction_id
    AND status = 'sending';

    RAISE NOTICE 'Ticket enviado a CoverManager para transacción %, mesa %, request_id: %',
        NEW.transaction_id, NEW.table_name, v_request_id;

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    -- Log del error
    UPDATE covermanager_ticket_log
    SET status = 'error',
        error_message = SQLERRM,
        processed_at = NOW()
    WHERE transaction_id = NEW.transaction_id
    AND status = 'sending';

    RAISE WARNING 'Error enviando ticket a CoverManager: %', SQLERRM;
    RETURN NEW; -- No bloquear la transacción original
END;
$$;

-- ============================================================
-- PASO 4: Crear el trigger en cuentica_transactions
-- ============================================================

-- Primero eliminar si existe
DROP TRIGGER IF EXISTS trg_enviar_ticket_covermanager ON cuentica_transactions;

-- Crear trigger AFTER INSERT
CREATE TRIGGER trg_enviar_ticket_covermanager
    AFTER INSERT ON cuentica_transactions
    FOR EACH ROW
    EXECUTE FUNCTION fn_enviar_ticket_covermanager();

-- ============================================================
-- PASO 5: Función auxiliar para extraer items del webhook_payload
-- (Útil para el workflow de n8n)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_extraer_items_ticket(p_webhook_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_items JSONB := '[]'::JSONB;
    v_order JSONB;
    v_item JSONB;
    v_options TEXT;
BEGIN
    -- Iterar sobre todas las órdenes
    FOR v_order IN SELECT * FROM jsonb_array_elements(
        COALESCE(p_webhook_payload->'Transaction'->'Orders', '[]'::JSONB)
    )
    LOOP
        -- Iterar sobre todos los items de cada orden
        FOR v_item IN SELECT * FROM jsonb_array_elements(
            COALESCE(v_order->'Items', '[]'::JSONB)
        )
        LOOP
            -- Extraer opciones si existen
            SELECT string_agg(opt->>'Name', ', ')
            INTO v_options
            FROM jsonb_array_elements(COALESCE(v_item->'ItemOptions', '[]'::JSONB)) opt;

            -- Construir item para CoverManager
            v_items := v_items || jsonb_build_object(
                'productName',
                    CASE
                        WHEN v_options IS NOT NULL AND v_options != ''
                        THEN (v_item->'ItemData'->>'Name') || ' (' || v_options || ')'
                        ELSE v_item->'ItemData'->>'Name'
                    END,
                'amount', '1',
                'unitPrice', (v_item->>'PriceTotal')::TEXT,
                'totalPrice', (v_item->>'PriceTotal')::TEXT
            );
        END LOOP;
    END LOOP;

    RETURN v_items;
END;
$$;

-- ============================================================
-- CONSULTAS ÚTILES PARA DEBUGGING
-- ============================================================

-- Ver últimos logs
-- SELECT * FROM covermanager_ticket_log ORDER BY created_at DESC LIMIT 20;

-- Ver errores
-- SELECT * FROM covermanager_ticket_log WHERE status = 'error' ORDER BY created_at DESC;

-- Verificar que el trigger existe
-- SELECT tgname, tgtype, tgenabled FROM pg_trigger WHERE tgname = 'trg_enviar_ticket_covermanager';

-- Test manual de la función de extracción de items
-- SELECT fn_extraer_items_ticket(webhook_payload) FROM cuentica_transactions LIMIT 1;

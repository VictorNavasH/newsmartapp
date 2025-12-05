-- Query to inspect the structure of vw_metricas_diarias_base
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vw_metricas_diarias_base'
ORDER BY ordinal_position;

-- Sample query to see actual data structure
SELECT *
FROM vw_metricas_diarias_base
WHERE fecha >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY fecha DESC
LIMIT 5;

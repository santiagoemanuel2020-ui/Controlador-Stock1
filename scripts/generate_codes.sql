-- Generar 5000 códigos de acceso únicos
-- Ejecutar en el SQL Editor de Supabase

INSERT INTO access_codes (code, max_uses)
SELECT 
  'SC-' || TO_CHAR(generate_series(1, 5000), 'FM0000000'),
  1
FROM generate_series(1, 1);
```

Pero primero necesito saber si tenés la columna `company_id` o no, porque el schema cambió varias veces.

Ejecutá esto en el SQL Editor para ver la estructura:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'access_codes';
```
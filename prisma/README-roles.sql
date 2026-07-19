-- Ejecutar UNA VEZ contra la base de datos (Supabase: SQL editor / Neon: consola SQL).
-- Crea dos roles con permisos distintos: uno de solo lectura para la API pública,
-- y uno de lectura/escritura para el panel admin.

-- 1. Rol de solo lectura (API pública)
CREATE ROLE public_readonly WITH LOGIN PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
GRANT CONNECT ON DATABASE arcade_signal TO public_readonly;
GRANT USAGE ON SCHEMA public TO public_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO public_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO public_readonly;
-- Explícitamente sin INSERT/UPDATE/DELETE.

-- 2. Rol admin (lectura/escritura, usado solo por /api/admin/** y el panel)
CREATE ROLE admin_role WITH LOGIN PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
GRANT CONNECT ON DATABASE arcade_signal TO admin_role;
GRANT USAGE ON SCHEMA public TO admin_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO admin_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO admin_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO admin_role;

-- Usa las contraseñas generadas en DATABASE_URL_PUBLIC y DATABASE_URL respectivamente.

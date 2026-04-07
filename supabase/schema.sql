-- ==========================================
-- StockControl - Schema de Base de Datos (Multi-Tenancy)
-- ==========================================
-- Ejecutar en el SQL Editor de Supabase
-- ==========================================

-- Tabla: companies (Multi-tenancy)
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'employee' NOT NULL CHECK (role IN ('owner', 'employee')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, email)
);

-- Tabla: access_codes
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  max_uses INTEGER DEFAULT 1 NOT NULL,
  used_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, code)
);

-- Tabla: products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) DEFAULT 0 NOT NULL,
  stock INTEGER DEFAULT 0 NOT NULL,
  category TEXT DEFAULT '' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: movements
CREATE TABLE IF NOT EXISTS movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_company_id ON access_codes(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_movements_company_id ON movements(company_id);
CREATE INDEX IF NOT EXISTS idx_movements_user_id ON movements(user_id);
CREATE INDEX IF NOT EXISTS idx_movements_product_id ON movements(product_id);

-- Función para incrementar el uso de un código de acceso
CREATE OR REPLACE FUNCTION increment_code_usage(code_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE access_codes
  SET used_count = used_count + 1
  WHERE id = code_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- EJEMPLO: Insertar un código de acceso
-- ==========================================
-- Descomentar y ejecutar para crear un código de prueba:
-- INSERT INTO access_codes (code, max_uses) VALUES ('DEMO-2024-XXXX', 1);
-- ==========================================

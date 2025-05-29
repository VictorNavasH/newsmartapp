-- EJECUTA ESTE SQL EN SUPABASE SQL EDITOR AHORA MISMO
-- Esto creará todas las tablas necesarias

-- 1. Tabla de instituciones
CREATE TABLE IF NOT EXISTS institutions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bic TEXT,
  logo TEXT,
  countries TEXT[],
  transaction_total_days INTEGER DEFAULT 90,
  supported_features TEXT[],
  supported_payments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de cuentas
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  institution_id TEXT,
  name TEXT NOT NULL,
  iban TEXT,
  currency TEXT DEFAULT 'EUR',
  balance DECIMAL(15,2) DEFAULT 0,
  account_type TEXT,
  status TEXT DEFAULT 'active',
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de transacciones
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  description TEXT,
  date DATE,
  creditor_name TEXT,
  debtor_name TEXT,
  merchant TEXT,
  category TEXT,
  type TEXT CHECK (type IN ('credit', 'debit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de requisitions
CREATE TABLE IF NOT EXISTS requisitions (
  id TEXT PRIMARY KEY,
  institution_id TEXT,
  agreement_id TEXT,
  status TEXT,
  link TEXT,
  reference TEXT,
  accounts TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_accounts_institution ON accounts(institution_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_requisitions_institution ON requisitions(institution_id);

-- 6. Mensaje de confirmación
SELECT 'TABLAS CREADAS CORRECTAMENTE - PUEDES PROCEDER' as mensaje;

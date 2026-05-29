CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT DEFAULT '',
  client_address TEXT DEFAULT '',
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue')),
  notes TEXT DEFAULT '',
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS billing_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro')),
  status TEXT NOT NULL DEFAULT 'free',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_counters (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  next_number INTEGER NOT NULL DEFAULT 1 CHECK (next_number > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);
CREATE INDEX IF NOT EXISTS clients_user_archived_name_idx ON clients(user_id, archived_at, name);
CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_client_id_idx ON invoices(client_id);
CREATE INDEX IF NOT EXISTS invoices_user_created_at_idx ON invoices(user_id, created_at);
CREATE INDEX IF NOT EXISTS invoices_user_archived_created_idx ON invoices(user_id, archived_at, created_at DESC);
CREATE INDEX IF NOT EXISTS billing_profiles_stripe_customer_id_idx ON billing_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS billing_profiles_stripe_subscription_id_idx ON billing_profiles(stripe_subscription_id);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own clients" ON clients;
CREATE POLICY "Users manage own clients"
  ON clients
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own invoices" ON invoices;
CREATE POLICY "Users manage own invoices"
  ON invoices
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON clients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON invoices TO authenticated;

DROP POLICY IF EXISTS "Users view own billing profile" ON billing_profiles;
CREATE POLICY "Users view own billing profile"
  ON billing_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own invoice counter" ON invoice_counters;
CREATE POLICY "Users manage own invoice counter"
  ON invoice_counters
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON invoice_counters TO authenticated;

CREATE OR REPLACE FUNCTION public.create_invoice_atomic(
  p_client_id UUID,
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_address TEXT,
  p_line_items JSONB,
  p_subtotal NUMERIC,
  p_tax_rate NUMERIC,
  p_tax_amount NUMERIC,
  p_total NUMERIC,
  p_notes TEXT,
  p_invoice_date DATE,
  p_due_date DATE,
  p_free_invoice_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  invoice_number TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_client_id UUID := p_client_id;
  v_client_name TEXT := COALESCE(NULLIF(trim(p_client_name), ''), '');
  v_client_email TEXT := COALESCE(trim(p_client_email), '');
  v_client_address TEXT := COALESCE(trim(p_client_address), '');
  v_is_pro BOOLEAN := false;
  v_used_this_month INTEGER := 0;
  v_next_number INTEGER;
  v_invoice_number TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized'
      USING ERRCODE = '28000';
  END IF;

  INSERT INTO invoice_counters (user_id, next_number)
  VALUES (v_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET updated_at = invoice_counters.updated_at
  RETURNING next_number INTO v_next_number;

  SELECT EXISTS (
    SELECT 1
    FROM billing_profiles
    WHERE user_id = v_user_id
      AND plan = 'pro'
      AND status IN ('active', 'trialing')
  ) INTO v_is_pro;

  IF NOT v_is_pro THEN
    SELECT COUNT(*)::INTEGER
    INTO v_used_this_month
    FROM invoices
    WHERE user_id = v_user_id
      AND created_at >= date_trunc('month', now());

    IF v_used_this_month >= p_free_invoice_limit THEN
      RAISE EXCEPTION 'FREE_LIMIT_REACHED'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF v_client_id IS NOT NULL THEN
    SELECT clients.name, COALESCE(clients.email, ''), COALESCE(clients.address, '')
    INTO v_client_name, v_client_email, v_client_address
    FROM clients
    WHERE clients.id = v_client_id
      AND clients.user_id = v_user_id
      AND clients.archived_at IS NULL;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Selected client was not found.'
        USING ERRCODE = 'P0001';
    END IF;
  ELSE
    IF v_client_name = '' THEN
      RAISE EXCEPTION 'Client name is required.'
        USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO clients (
      user_id,
      name,
      email,
      address
    )
    VALUES (
      v_user_id,
      v_client_name,
      v_client_email,
      v_client_address
    )
    RETURNING clients.id INTO v_client_id;
  END IF;

  v_invoice_number := 'INV-' || EXTRACT(YEAR FROM now())::INTEGER || '-' || lpad(v_next_number::TEXT, 3, '0');

  INSERT INTO invoices (
    user_id,
    invoice_number,
    client_name,
    client_email,
    client_address,
    client_id,
    line_items,
    subtotal,
    tax_rate,
    tax_amount,
    total,
    status,
    notes,
    invoice_date,
    due_date
  )
  VALUES (
    v_user_id,
    v_invoice_number,
    v_client_name,
    v_client_email,
    v_client_address,
    v_client_id,
    p_line_items,
    p_subtotal,
    p_tax_rate,
    p_tax_amount,
    p_total,
    'draft',
    COALESCE(p_notes, ''),
    p_invoice_date,
    p_due_date
  )
  RETURNING invoices.id, invoices.invoice_number
  INTO id, invoice_number;

  UPDATE invoice_counters
  SET
    next_number = v_next_number + 1,
    updated_at = now()
  WHERE user_id = v_user_id;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.create_invoice_atomic(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  TEXT,
  DATE,
  DATE,
  INTEGER
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_invoice_atomic(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  TEXT,
  DATE,
  DATE,
  INTEGER
) TO authenticated;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS clients_user_archived_name_idx
  ON clients(user_id, archived_at, name);

CREATE INDEX IF NOT EXISTS invoices_user_archived_created_idx
  ON invoices(user_id, archived_at, created_at DESC);

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

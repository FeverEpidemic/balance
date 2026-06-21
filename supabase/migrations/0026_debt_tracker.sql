-- Migration 0025: Debt Tracker (Utang-Piutang)
-- Mencatat utang/piutang informal dengan person_name text bebas (bisa orang luar wallet)
-- Mendukung cicilan (partial payment) dengan trigger auto-update status

-- 1. Custom types
CREATE TYPE debt_direction AS ENUM ('borrowed', 'lent');
CREATE TYPE debt_status AS ENUM ('unpaid', 'partially_paid', 'settled', 'cancelled');

-- 2. Tabel debts
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  direction debt_direction NOT NULL,
  person_name TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  note TEXT,
  due_date DATE,
  status debt_status NOT NULL DEFAULT 'unpaid',
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  updated_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ
);

-- 3. Tabel debt_payments (cicilan)
CREATE TABLE debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  happened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Indexes
CREATE INDEX idx_debts_wallet ON debts(wallet_id);
CREATE INDEX idx_debts_direction ON debts(direction);
CREATE INDEX idx_debts_status ON debts(status);
CREATE INDEX idx_debt_payments_debt ON debt_payments(debt_id);

-- 5. Enable RLS
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies (mengikuti pola wallet-scoped yang sudah ada)
CREATE POLICY "Select debts in member wallets" ON debts
  FOR SELECT USING (private.is_wallet_member(wallet_id));

CREATE POLICY "Insert debts in member wallets" ON debts
  FOR INSERT WITH CHECK (
    private.is_wallet_member(wallet_id) AND
    private.has_wallet_role(wallet_id, ARRAY['owner'::wallet_role, 'editor'::wallet_role])
  );

CREATE POLICY "Update debts in member wallets" ON debts
  FOR UPDATE USING (
    private.is_wallet_member(wallet_id) AND
    private.has_wallet_role(wallet_id, ARRAY['owner'::wallet_role, 'editor'::wallet_role])
  );

CREATE POLICY "Delete debts in member wallets" ON debts
  FOR DELETE USING (
    private.is_wallet_member(wallet_id) AND
    private.has_wallet_role(wallet_id, ARRAY['owner'::wallet_role, 'editor'::wallet_role])
  );

CREATE POLICY "Select payments in member wallets" ON debt_payments
  FOR SELECT USING (private.is_wallet_member(wallet_id));

CREATE POLICY "Insert payments in member wallets" ON debt_payments
  FOR INSERT WITH CHECK (
    private.is_wallet_member(wallet_id) AND
    private.has_wallet_role(wallet_id, ARRAY['owner'::wallet_role, 'editor'::wallet_role])
  );

CREATE POLICY "Update payments in member wallets" ON debt_payments
  FOR UPDATE USING (
    private.is_wallet_member(wallet_id) AND
    private.has_wallet_role(wallet_id, ARRAY['owner'::wallet_role, 'editor'::wallet_role])
  );

CREATE POLICY "Delete payments in member wallets" ON debt_payments
  FOR DELETE USING (
    private.is_wallet_member(wallet_id) AND
    private.has_wallet_role(wallet_id, ARRAY['owner'::wallet_role, 'editor'::wallet_role])
  );

-- 7. Trigger: auto-update debt status on payment changes
CREATE OR REPLACE FUNCTION private.update_debt_status_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_target_debt_id UUID;
  v_total_paid NUMERIC(14,2);
  v_debt_amount NUMERIC(14,2);
BEGIN
  -- Determine which debt_id to process
  v_target_debt_id := COALESCE(NEW.debt_id, OLD.debt_id);

  -- Get total paid amount
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM public.debt_payments
  WHERE debt_id = v_target_debt_id;

  -- Get original debt amount
  SELECT amount INTO v_debt_amount
  FROM public.debts
  WHERE id = v_target_debt_id;

  -- Auto-update status based on total paid
  IF v_total_paid <= 0 THEN
    UPDATE public.debts
    SET status = 'unpaid', settled_at = NULL, updated_at = now()
    WHERE id = v_target_debt_id;
  ELSIF v_total_paid < v_debt_amount THEN
    UPDATE public.debts
    SET status = 'partially_paid', settled_at = NULL, updated_at = now()
    WHERE id = v_target_debt_id;
  ELSE
    UPDATE public.debts
    SET status = 'settled', settled_at = now(), updated_at = now()
    WHERE id = v_target_debt_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_debt_status_on_payment
AFTER INSERT OR UPDATE OR DELETE ON debt_payments
FOR EACH ROW EXECUTE FUNCTION private.update_debt_status_on_payment();

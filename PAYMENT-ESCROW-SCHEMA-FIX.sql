-- YOUTENT payment/escrow schema repair
-- This migration keeps Razorpay verification, webhook capture and freelancer escrow in sync.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS escrow_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS released_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.payments ADD CONSTRAINT payments_escrow_status_check
    CHECK (escrow_status IN ('pending','funded','released','refunded'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available_balance numeric(12,2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance numeric(12,2) NOT NULL DEFAULT 0 CHECK (pending_balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('credit','debit','hold','release','refund','withdrawal')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wallet_transactions_user_idx
  ON public.wallet_transactions(user_id, created_at DESC);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wallets_select_own ON public.wallets;
CREATE POLICY wallets_select_own ON public.wallets
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS wallet_transactions_select_own ON public.wallet_transactions;
CREATE POLICY wallet_transactions_select_own ON public.wallet_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

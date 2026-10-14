-- Additive YOUTENT payout/KYC foundation. Does not alter or delete existing wallet/payment records.
CREATE TABLE IF NOT EXISTS public.creator_payout_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'razorpay_route',
  kyc_status text NOT NULL DEFAULT 'not_started'
    CHECK (kyc_status IN ('not_started','in_progress','pending_review','verified','rejected','needs_clarification')),
  provider_account_id text UNIQUE,
  provider_stakeholder_id text,
  provider_product_config_id text,
  provider_status text,
  rejection_reason text,
  onboarding_started_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','processing','paid','rejected','failed','cancelled')),
  provider text NOT NULL DEFAULT 'razorpay',
  provider_payout_id text UNIQUE,
  idempotency_key text NOT NULL UNIQUE,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS withdrawal_requests_user_created_idx
  ON public.withdrawal_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS withdrawal_requests_status_created_idx
  ON public.withdrawal_requests(status, created_at DESC);

ALTER TABLE public.creator_payout_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS creator_payout_profiles_select_own ON public.creator_payout_profiles;
CREATE POLICY creator_payout_profiles_select_own ON public.creator_payout_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS creator_payout_profiles_insert_own ON public.creator_payout_profiles;
CREATE POLICY creator_payout_profiles_insert_own ON public.creator_payout_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS creator_payout_profiles_update_own ON public.creator_payout_profiles;
CREATE POLICY creator_payout_profiles_update_own ON public.creator_payout_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS withdrawal_requests_select_own ON public.withdrawal_requests;
CREATE POLICY withdrawal_requests_select_own ON public.withdrawal_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Users cannot directly insert/update payout requests. A server-side, authenticated API must
-- validate KYC, balance, idempotency, and provider readiness before writing these rows.
REVOKE INSERT, UPDATE, DELETE ON public.withdrawal_requests FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.creator_payout_profiles FROM anon, authenticated;
GRANT SELECT ON public.creator_payout_profiles, public.withdrawal_requests TO authenticated;
GRANT ALL ON public.creator_payout_profiles, public.withdrawal_requests TO service_role;
NOTIFY pgrst, 'reload schema';

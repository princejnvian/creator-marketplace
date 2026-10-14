-- YOUTENT: prevent browser clients from self-verifying payout KYC.
-- Additive-only: does not change or delete existing marketplace, wallet, or payout records.

CREATE OR REPLACE FUNCTION public.youtent_guard_creator_payout_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'Payout onboarding records must be created by the trusted server';
    END IF;

    IF NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.provider IS DISTINCT FROM OLD.provider
       OR NEW.provider_account_id IS DISTINCT FROM OLD.provider_account_id
       OR NEW.provider_stakeholder_id IS DISTINCT FROM OLD.provider_stakeholder_id
       OR NEW.provider_product_config_id IS DISTINCT FROM OLD.provider_product_config_id
       OR NEW.provider_status IS DISTINCT FROM OLD.provider_status
       OR NEW.kyc_status IS DISTINCT FROM OLD.kyc_status
       OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
       OR NEW.onboarding_started_at IS DISTINCT FROM OLD.onboarding_started_at
       OR NEW.verified_at IS DISTINCT FROM OLD.verified_at THEN
      RAISE EXCEPTION 'KYC and payout status are managed by the trusted provider integration';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS youtent_guard_creator_payout_profile ON public.creator_payout_profiles;
CREATE TRIGGER youtent_guard_creator_payout_profile
BEFORE INSERT OR UPDATE ON public.creator_payout_profiles
FOR EACH ROW EXECUTE FUNCTION public.youtent_guard_creator_payout_profile();

DROP POLICY IF EXISTS creator_payout_profiles_insert_own ON public.creator_payout_profiles;

REVOKE ALL ON FUNCTION public.youtent_guard_creator_payout_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.youtent_guard_creator_payout_profile() FROM anon;
REVOKE ALL ON FUNCTION public.youtent_guard_creator_payout_profile() FROM authenticated;

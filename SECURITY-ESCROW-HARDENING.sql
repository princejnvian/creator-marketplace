-- YOUTENT security hardening for payment escrow.
-- Apply after PAYMENT-ESCROW-SCHEMA-FIX.sql.

CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_payment_type_unique
  ON public.wallet_transactions(payment_id, type)
  WHERE payment_id IS NOT NULL AND type IN ('hold','release');

CREATE OR REPLACE FUNCTION public.hold_project_payment(p_payment_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE p public.payments%ROWTYPE; v_amount numeric(12,2);
BEGIN
  SELECT * INTO p FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
  IF p.status <> 'paid' THEN RAISE EXCEPTION 'Payment is not captured'; END IF;
  v_amount := COALESCE(p.project_amount, p.amount - COALESCE(p.platform_fee, 0));
  IF v_amount <= 0 THEN RAISE EXCEPTION 'Invalid project payment amount'; END IF;
  INSERT INTO public.wallets(user_id) VALUES (p.freelancer_id) ON CONFLICT (user_id) DO NOTHING;
  IF p.escrow_status <> 'funded' THEN
    UPDATE public.wallets SET pending_balance = pending_balance + v_amount, updated_at = now() WHERE user_id = p.freelancer_id;
    INSERT INTO public.wallet_transactions(user_id, project_id, payment_id, type, amount, description)
    VALUES (p.freelancer_id, p.project_id, p.id, 'hold', v_amount, 'Project payment held until client accepts delivery')
    ON CONFLICT (payment_id, type) DO NOTHING;
    UPDATE public.payments SET escrow_status = 'funded', updated_at = now() WHERE id = p.id;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.release_project_payment(p_project_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE p public.payments%ROWTYPE; v_project public.projects%ROWTYPE; v_amount numeric(12,2);
BEGIN
  SELECT * INTO v_project FROM public.projects WHERE id = p_project_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Project not found'; END IF;
  IF auth.uid() IS NULL OR auth.uid() <> v_project.client_id THEN RAISE EXCEPTION 'Only the project client can release payment'; END IF;
  IF v_project.status <> 'active' THEN RAISE EXCEPTION 'Project is not active'; END IF;
  SELECT * INTO p FROM public.payments WHERE project_id = p_project_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
  IF p.status <> 'paid' THEN RAISE EXCEPTION 'Payment is not captured'; END IF;
  IF p.escrow_status = 'released' THEN RETURN; END IF;
  IF p.escrow_status <> 'funded' THEN RAISE EXCEPTION 'Payment is not held in escrow'; END IF;
  v_amount := COALESCE(p.project_amount, p.amount - COALESCE(p.platform_fee, 0));
  IF v_amount <= 0 THEN RAISE EXCEPTION 'Invalid project payment amount'; END IF;
  INSERT INTO public.wallets(user_id) VALUES (p.freelancer_id) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.wallets SET available_balance = available_balance + v_amount, pending_balance = GREATEST(pending_balance - v_amount, 0), updated_at = now() WHERE user_id = p.freelancer_id;
  INSERT INTO public.wallet_transactions(user_id, project_id, payment_id, type, amount, description)
  VALUES (p.freelancer_id, p.project_id, p.id, 'release', v_amount, 'Project payment released after client approval')
  ON CONFLICT (payment_id, type) DO NOTHING;
  UPDATE public.payments SET escrow_status = 'released', released_at = now(), updated_at = now() WHERE id = p.id;
  UPDATE public.projects SET status = 'completed', updated_at = now() WHERE id = p.project_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.hold_project_payment(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hold_project_payment(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.release_project_payment(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.release_project_payment(uuid) TO authenticated;

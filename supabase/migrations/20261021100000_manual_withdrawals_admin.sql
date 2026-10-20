-- Additive manual withdrawal workflow for YOUTENT.
-- Existing wallet balances and historical transactions are not deleted or reset.
ALTER TABLE public.withdrawal_requests
  ADD COLUMN IF NOT EXISTS manual_payment_reference text,
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS processed_by text;

-- Atomically reserve funds and create a withdrawal request. Caller is an authenticated
-- server API which passes the verified session user id; direct client writes remain revoked.
CREATE OR REPLACE FUNCTION public.request_manual_withdrawal(
  p_user_id uuid,
  p_amount numeric,
  p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wallet public.wallets%ROWTYPE;
  v_withdrawal public.withdrawal_requests%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR p_amount IS NULL OR p_amount < 100 OR round(p_amount,2) <> p_amount THEN
    RAISE EXCEPTION 'Withdrawal amount must be at least INR 100 with up to two decimal places';
  END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 10 THEN
    RAISE EXCEPTION 'A valid idempotency key is required';
  END IF;
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found';
  END IF;
  IF COALESCE(v_wallet.available_balance,0) < p_amount THEN
    RAISE EXCEPTION 'Insufficient available balance';
  END IF;

  UPDATE public.wallets SET available_balance=available_balance-p_amount, updated_at=now()
   WHERE user_id=p_user_id;

  INSERT INTO public.withdrawal_requests(user_id,amount,status,provider,idempotency_key)
  VALUES(p_user_id,p_amount,'requested','manual',p_idempotency_key)
  RETURNING * INTO v_withdrawal;

  INSERT INTO public.wallet_transactions(user_id,type,amount,description)
  VALUES(p_user_id,'withdrawal',p_amount,'Withdrawal requested; amount reserved pending admin review');

  RETURN jsonb_build_object('id',v_withdrawal.id,'amount',v_withdrawal.amount,'status',v_withdrawal.status,'created_at',v_withdrawal.created_at);
END;
$$;
REVOKE ALL ON FUNCTION public.request_manual_withdrawal(uuid,numeric,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_manual_withdrawal(uuid,numeric,text) TO service_role;

-- Admin state transitions run only through a server endpoint using the service role and
-- ADMIN_EMAILS allowlist. A rejected request atomically returns its reserved amount.
CREATE OR REPLACE FUNCTION public.admin_process_withdrawal(
  p_withdrawal_id uuid,
  p_action text,
  p_admin_email text,
  p_reference text DEFAULT NULL,
  p_note text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v public.withdrawal_requests%ROWTYPE;
BEGIN
  IF p_action NOT IN ('processing','paid','reject') THEN RAISE EXCEPTION 'Unsupported action'; END IF;
  SELECT * INTO v FROM public.withdrawal_requests WHERE id=p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal request not found'; END IF;
  IF v.status IN ('paid','rejected','cancelled') THEN RAISE EXCEPTION 'This withdrawal is already finalized'; END IF;

  IF p_action='processing' THEN
    UPDATE public.withdrawal_requests SET status='processing', admin_note=COALESCE(p_note,admin_note),
      processed_by=p_admin_email, updated_at=now() WHERE id=v.id;
  ELSIF p_action='paid' THEN
    IF length(trim(COALESCE(p_reference,''))) < 4 THEN RAISE EXCEPTION 'Bank transfer reference is required'; END IF;
    UPDATE public.withdrawal_requests SET status='paid', manual_payment_reference=trim(p_reference),
      admin_note=COALESCE(p_note,admin_note), processed_by=p_admin_email, processed_at=now(), updated_at=now()
      WHERE id=v.id;
    INSERT INTO public.wallet_transactions(user_id,type,amount,description)
    VALUES(v.user_id,'withdrawal_paid',v.amount,'Manual withdrawal marked paid; reference: '||trim(p_reference));
  ELSE
    UPDATE public.wallets SET available_balance=COALESCE(available_balance,0)+v.amount, updated_at=now()
      WHERE user_id=v.user_id;
    UPDATE public.withdrawal_requests SET status='rejected', failure_reason=COALESCE(NULLIF(trim(p_note),''),'Rejected by YOUTENT admin; reserved amount refunded'),
      admin_note=COALESCE(p_note,admin_note), processed_by=p_admin_email, processed_at=now(), updated_at=now()
      WHERE id=v.id;
    INSERT INTO public.wallet_transactions(user_id,type,amount,description)
    VALUES(v.user_id,'withdrawal_refund',v.amount,'Withdrawal rejected; reserved balance returned to available wallet');
  END IF;
  RETURN jsonb_build_object('id',v.id,'action',p_action,'status',CASE WHEN p_action='reject' THEN 'rejected' ELSE p_action END);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_process_withdrawal(uuid,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_process_withdrawal(uuid,text,text,text,text) TO service_role;

NOTIFY pgrst, 'reload schema';

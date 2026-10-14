-- YOUTENT: atomically release a freelancer's held project amount after client approval.
-- The platform fee is deliberately excluded from the freelancer wallet credit.
CREATE OR REPLACE FUNCTION public.release_project_payment(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_project public.projects%ROWTYPE;
  v_payment public.payments%ROWTYPE;
  v_wallet public.wallets%ROWTYPE;
  v_amount numeric(12,2);
BEGIN
  IF p_project_id IS NULL THEN
    RAISE EXCEPTION 'Project ID is required';
  END IF;

  SELECT *
    INTO v_project
    FROM public.projects
   WHERE id = p_project_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Only the client who owns the project can approve/release it.
  IF auth.uid() IS NULL OR auth.uid() <> v_project.client_id THEN
    RAISE EXCEPTION 'Only the project client can release this payment';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.project_deliveries d
     WHERE d.project_id = v_project.id
       AND d.client_id = v_project.client_id
       AND d.freelancer_id = v_project.freelancer_id
       AND d.status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Delivery must be approved before funds can be released';
  END IF;

  SELECT *
    INTO v_payment
    FROM public.payments
   WHERE project_id = v_project.id
     AND status = 'paid'
   ORDER BY paid_at DESC NULLS LAST
   LIMIT 1
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No paid project payment was found';
  END IF;

  -- A retry after a completed release must not credit the wallet twice.
  IF v_payment.escrow_status = 'released' THEN
    UPDATE public.projects
       SET status = 'completed'
     WHERE id = v_project.id
       AND status IS DISTINCT FROM 'completed';
    RETURN;
  END IF;

  IF v_payment.escrow_status IS DISTINCT FROM 'funded' THEN
    RAISE EXCEPTION 'Payment is not held in escrow (current status: %)', v_payment.escrow_status;
  END IF;

  v_amount := round(
    COALESCE(
      v_payment.project_amount,
      v_payment.amount - COALESCE(v_payment.platform_fee, 0)
    ),
    2
  );

  IF v_amount <= 0 THEN
    RAISE EXCEPTION 'Freelancer release amount is invalid';
  END IF;

  SELECT *
    INTO v_wallet
    FROM public.wallets
   WHERE user_id = v_payment.freelancer_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Freelancer wallet was not found';
  END IF;

  IF COALESCE(v_wallet.pending_balance, 0) < v_amount THEN
    RAISE EXCEPTION 'Wallet pending balance is lower than the held project amount';
  END IF;

  -- Record first within this transaction; any later error rolls everything back.
  INSERT INTO public.wallet_transactions
    (user_id, project_id, payment_id, type, amount, description)
  VALUES
    (v_payment.freelancer_id, v_project.id, v_payment.id, 'release', v_amount,
     'Project payment released after client approved delivery')
  ON CONFLICT (payment_id, type)
  WHERE payment_id IS NOT NULL
    AND type IN ('hold', 'release')
  DO NOTHING;

  UPDATE public.wallets
     SET pending_balance = pending_balance - v_amount,
         available_balance = available_balance + v_amount,
         updated_at = now()
   WHERE user_id = v_payment.freelancer_id;

  UPDATE public.payments
     SET escrow_status = 'released'
   WHERE id = v_payment.id;

  UPDATE public.projects
     SET status = 'completed'
   WHERE id = v_project.id;

  IF v_project.request_id IS NOT NULL THEN
    UPDATE public.project_requests
       SET status = 'completed',
           updated_at = now()
     WHERE id = v_project.request_id;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.release_project_payment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_project_payment(uuid) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';

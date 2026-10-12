-- YOUTENT checkout finalization: keep RPC argument names aligned with the
-- application and the previously deployed canonical function.
-- This migration is intentionally transactional and idempotent at the function level.

DROP FUNCTION IF EXISTS public.finalize_checkout_payment(uuid, text, text, numeric);
DROP FUNCTION IF EXISTS public.finalize_checkout_payment(uuid, text, text, numeric);

CREATE FUNCTION public.finalize_checkout_payment(
  p_checkout_id uuid,
  p_razorpay_order_id text,
  p_razorpay_payment_id text,
  p_expected_total numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  c public.checkout_orders%ROWTYPE;
  v_project_id uuid;
  v_payment_id uuid;
  v_existing public.payments%ROWTYPE;
  v_total numeric(12,2);
  v_deadline date;
BEGIN
  IF p_checkout_id IS NULL
     OR NULLIF(trim(p_razorpay_order_id), '') IS NULL
     OR NULLIF(trim(p_razorpay_payment_id), '') IS NULL THEN
    RAISE EXCEPTION 'Missing checkout/payment identifiers';
  END IF;

  SELECT * INTO c
  FROM public.checkout_orders
  WHERE id = p_checkout_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Checkout not found'; END IF;
  IF c.razorpay_order_id IS DISTINCT FROM p_razorpay_order_id THEN
    RAISE EXCEPTION 'Razorpay order does not match checkout';
  END IF;

  -- Idempotency: a retry after successful finalization returns the same project.
  IF c.status = 'paid' AND c.project_id IS NOT NULL THEN
    RETURN c.project_id;
  END IF;
  IF c.status NOT IN ('created', 'processing') THEN
    RAISE EXCEPTION 'Checkout is not payable';
  END IF;

  v_total := round(c.package_price + c.platform_fee, 2);
  IF p_expected_total IS NULL OR round(p_expected_total, 2) <> v_total THEN
    RAISE EXCEPTION 'Payment amount does not match checkout';
  END IF;

  -- Recover only a precisely matching legacy ledger record.
  SELECT * INTO v_existing
  FROM public.payments
  WHERE gateway_order_id = p_razorpay_order_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.gateway_payment_id IS DISTINCT FROM p_razorpay_payment_id
       OR v_existing.client_id IS DISTINCT FROM c.client_id
       OR v_existing.freelancer_id IS DISTINCT FROM c.freelancer_id
       OR round(v_existing.amount, 2) <> v_total
       OR round(COALESCE(v_existing.project_amount, v_existing.amount - COALESCE(v_existing.platform_fee, 0)), 2) <> round(c.package_price, 2)
       OR v_existing.project_id IS NULL THEN
      RAISE EXCEPTION 'Existing payment does not exactly match this checkout; manual reconciliation required';
    END IF;
    IF v_existing.status <> 'paid' THEN
      RAISE EXCEPTION 'Existing payment is not marked paid; manual reconciliation required';
    END IF;
    PERFORM public.hold_project_payment(v_existing.id);
    UPDATE public.checkout_orders
       SET status = 'paid', paid_at = COALESCE(paid_at, now()), project_id = v_existing.project_id
     WHERE id = c.id;
    RETURN v_existing.project_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.payments
    WHERE gateway_payment_id = p_razorpay_payment_id
       OR gateway_order_id = p_razorpay_order_id
  ) THEN
    RAISE EXCEPTION 'Razorpay payment/order is already linked to a different payment record';
  END IF;

  v_deadline := current_date + c.delivery_days;
  INSERT INTO public.projects
    (request_id, client_id, freelancer_id, title, description, budget, deadline, status)
  VALUES
    (NULL, c.client_id, c.freelancer_id,
     CASE WHEN NULLIF(trim(c.gig_title), '') IS NOT NULL
       THEN c.gig_title || ' — ' || c.package_name ELSE c.package_name END,
     COALESCE(c.package_description, ''), c.package_price, v_deadline, 'active')
  RETURNING id INTO v_project_id;

  INSERT INTO public.payments
    (project_id, client_id, freelancer_id, amount, project_amount, platform_fee,
     escrow_status, currency, status, payment_gateway, gateway_payment_id,
     gateway_order_id, paid_at)
  VALUES
    (v_project_id, c.client_id, c.freelancer_id, v_total, c.package_price,
     c.platform_fee, 'pending', 'INR', 'paid', 'razorpay',
     p_razorpay_payment_id, p_razorpay_order_id, now())
  RETURNING id INTO v_payment_id;

  PERFORM public.hold_project_payment(v_payment_id);

  UPDATE public.checkout_orders
     SET status = 'paid', paid_at = now(), project_id = v_project_id
   WHERE id = c.id;

  RETURN v_project_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.finalize_checkout_payment(uuid, text, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_checkout_payment(uuid, text, text, numeric) TO service_role;
NOTIFY pgrst, 'reload schema';

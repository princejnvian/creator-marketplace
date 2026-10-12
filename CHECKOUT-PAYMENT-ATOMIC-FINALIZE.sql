-- Atomic YOUTENT gig checkout finalization.
-- Run once in Supabase SQL Editor. Both the browser callback and webhook call this function.
DROP FUNCTION IF EXISTS public.finalize_checkout_payment(uuid, text, text, bigint, text);

CREATE OR REPLACE FUNCTION public.finalize_checkout_payment(
  p_checkout_id uuid,
  p_expected_total numeric,
  p_razorpay_order_id text,
  p_razorpay_payment_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  c public.checkout_orders%ROWTYPE;
  v_project_id uuid;
  v_payment_id uuid;
  v_project_amount numeric(12,2);
  v_fee numeric(12,2);
  v_total numeric(12,2);
  v_deadline date;
BEGIN
  SELECT * INTO c
  FROM public.checkout_orders
  WHERE id = p_checkout_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Checkout not found'; END IF;
  IF c.razorpay_order_id IS DISTINCT FROM p_razorpay_order_id THEN
    RAISE EXCEPTION 'Razorpay order does not match checkout';
  END IF;

  IF c.status = 'paid' AND c.project_id IS NOT NULL THEN
    RETURN c.project_id;
  END IF;

  v_project_amount := c.package_price;
  v_fee := c.platform_fee;
  v_total := v_project_amount + v_fee;

  IF v_project_amount <= 0 OR v_fee < 0 THEN RAISE EXCEPTION 'Invalid checkout amount'; END IF;
  IF p_expected_total IS NULL OR round(p_expected_total, 2) <> round(v_total, 2) THEN
    RAISE EXCEPTION 'Expected payment total does not match checkout';
  END IF;

  -- Reuse an already-created payment/project if a previous implementation
  -- completed part of this checkout before this migration was deployed.
  SELECT id, project_id INTO v_payment_id, v_project_id
  FROM public.payments
  WHERE gateway_order_id = p_razorpay_order_id
  LIMIT 1;

  IF v_payment_id IS NOT NULL AND v_project_id IS NOT NULL THEN
    PERFORM public.hold_project_payment(v_payment_id);
    UPDATE public.checkout_orders
      SET status = 'paid', paid_at = COALESCE(paid_at, now()), project_id = v_project_id
      WHERE id = c.id;
    RETURN v_project_id;
  END IF;

  v_deadline := current_date + GREATEST(COALESCE(c.delivery_days, 1), 1);

  INSERT INTO public.projects (
    request_id, client_id, freelancer_id, title, description, budget, deadline, status
  ) VALUES (
    NULL, c.client_id, c.freelancer_id,
    COALESCE(NULLIF(c.gig_title, ''), 'Gig') || ' — ' || COALESCE(NULLIF(c.package_name, ''), 'Package'),
    c.package_description, v_project_amount, v_deadline, 'active'
  )
  RETURNING id INTO v_project_id;

  INSERT INTO public.payments (
    project_id, client_id, freelancer_id, amount, project_amount, platform_fee,
    escrow_status, currency, status, payment_gateway, gateway_payment_id,
    gateway_order_id, paid_at
  ) VALUES (
    v_project_id, c.client_id, c.freelancer_id, v_total, v_project_amount, v_fee,
    'pending', 'INR', 'paid', 'razorpay', p_razorpay_payment_id,
    p_razorpay_order_id, now()
  )
  RETURNING id INTO v_payment_id;

  PERFORM public.hold_project_payment(v_payment_id);

  UPDATE public.checkout_orders
    SET status = 'paid', paid_at = COALESCE(paid_at, now()), project_id = v_project_id
    WHERE id = c.id;

  RETURN v_project_id;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_checkout_payment(uuid, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_checkout_payment(uuid, numeric, text, text) TO service_role;

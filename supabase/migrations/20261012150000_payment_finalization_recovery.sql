-- YOUTENT direct gig checkout: projects created from gigs have no project_requests row.
-- The request_id foreign key remains enforced for non-NULL values.
ALTER TABLE public.projects
  ALTER COLUMN request_id DROP NOT NULL;

-- Compatibility wrapper for app versions that send paise/currency.
-- The wrapper verifies the amount against the immutable checkout record, then calls
-- the canonical four-argument finalizer which creates the project/payment/hold atomically.
CREATE OR REPLACE FUNCTION public.finalize_checkout_payment(
  p_amount_paise bigint,
  p_checkout_id uuid,
  p_currency text,
  p_razorpay_order_id text,
  p_razorpay_payment_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_expected_total numeric(12,2);
BEGIN
  IF upper(coalesce(p_currency, '')) <> 'INR' THEN
    RAISE EXCEPTION 'Unsupported checkout currency: %', p_currency;
  END IF;

  SELECT round(package_price + platform_fee, 2)
    INTO v_expected_total
  FROM public.checkout_orders
  WHERE id = p_checkout_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Checkout not found';
  END IF;

  IF p_amount_paise IS NULL OR p_amount_paise <> round(v_expected_total * 100)::bigint THEN
    RAISE EXCEPTION 'Payment amount in paise does not match checkout total';
  END IF;

  RETURN public.finalize_checkout_payment(
    p_checkout_id,
    p_razorpay_order_id,
    p_razorpay_payment_id,
    v_expected_total
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.finalize_checkout_payment(bigint, uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_checkout_payment(bigint, uuid, text, text, text) TO service_role;

NOTIFY pgrst, 'reload schema';

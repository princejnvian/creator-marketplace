-- YOUTENT complete workflow repair: project chat, wallet release, and activity notifications.
-- Safe to re-run. Does not manually alter wallet balances or delete business records.

CREATE TABLE IF NOT EXISTS public.project_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(trim(content)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_messages_project_created_idx
  ON public.project_messages(project_id, created_at ASC);
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_messages_select_members ON public.project_messages;
CREATE POLICY project_messages_select_members ON public.project_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id=project_messages.project_id AND (p.client_id=auth.uid() OR p.freelancer_id=auth.uid())));
DROP POLICY IF EXISTS project_messages_insert_members ON public.project_messages;
CREATE POLICY project_messages_insert_members ON public.project_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id=auth.uid() AND EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id=project_messages.project_id
      AND (p.client_id=auth.uid() OR p.freelancer_id=auth.uid())
      AND receiver_id=CASE WHEN p.client_id=auth.uid() THEN p.freelancer_id ELSE p.client_id END
  ));
GRANT SELECT, INSERT ON public.project_messages TO authenticated;

CREATE OR REPLACE FUNCTION public.hold_project_payment(p_payment_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public, pg_temp AS $function$
DECLARE p public.payments%ROWTYPE; v_amount numeric(12,2);
BEGIN
  SELECT * INTO p FROM public.payments WHERE id=p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
  IF p.status <> 'paid' THEN RAISE EXCEPTION 'Payment is not captured'; END IF;
  IF p.escrow_status IN ('funded','released') THEN RETURN; END IF;
  v_amount := round(COALESCE(p.project_amount, p.amount-COALESCE(p.platform_fee,0)),2);
  IF v_amount <= 0 THEN RAISE EXCEPTION 'Invalid project payment amount'; END IF;
  IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE payment_id=p.id AND type='hold') THEN
    UPDATE public.payments SET escrow_status='funded', updated_at=now() WHERE id=p.id;
    RETURN;
  END IF;
  INSERT INTO public.wallets(user_id) VALUES(p.freelancer_id) ON CONFLICT(user_id) DO NOTHING;
  UPDATE public.wallets SET pending_balance=COALESCE(pending_balance,0)+v_amount, updated_at=now() WHERE user_id=p.freelancer_id;
  INSERT INTO public.wallet_transactions(user_id,project_id,payment_id,type,amount,description)
  VALUES(p.freelancer_id,p.project_id,p.id,'hold',v_amount,'Project payment held until client accepts delivery');
  UPDATE public.payments SET escrow_status='funded', updated_at=now() WHERE id=p.id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.release_project_payment(p_project_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public, pg_temp AS $function$
DECLARE
  v_project public.projects%ROWTYPE;
  v_payment public.payments%ROWTYPE;
  v_wallet public.wallets%ROWTYPE;
  v_amount numeric(12,2);
BEGIN
  IF p_project_id IS NULL THEN RAISE EXCEPTION 'Project ID is required'; END IF;
  SELECT * INTO v_project FROM public.projects WHERE id=p_project_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Project not found'; END IF;
  IF auth.uid() IS NULL OR auth.uid() <> v_project.client_id THEN
    RAISE EXCEPTION 'Only the project client can release this payment';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.project_deliveries d
    WHERE d.project_id=v_project.id AND d.client_id=v_project.client_id
      AND d.freelancer_id=v_project.freelancer_id AND d.status='approved'
      AND d.created_at = (SELECT max(d2.created_at) FROM public.project_deliveries d2 WHERE d2.project_id=v_project.id)
  ) THEN RAISE EXCEPTION 'Latest delivery must be approved before funds can be released'; END IF;

  SELECT * INTO v_payment FROM public.payments
  WHERE project_id=v_project.id AND status='paid'
  ORDER BY paid_at DESC NULLS LAST LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'No paid project payment was found'; END IF;

  IF v_payment.escrow_status='released' OR EXISTS (
    SELECT 1 FROM public.wallet_transactions WHERE payment_id=v_payment.id AND type='release'
  ) THEN
    UPDATE public.payments SET escrow_status='released', released_at=COALESCE(released_at,now()), updated_at=now() WHERE id=v_payment.id;
    UPDATE public.projects SET status='completed', updated_at=now() WHERE id=v_project.id AND status IS DISTINCT FROM 'completed';
    IF v_project.request_id IS NOT NULL THEN
      UPDATE public.project_requests SET status='completed', updated_at=now() WHERE id=v_project.request_id;
    END IF;
    RETURN;
  END IF;

  -- Older paid checkouts may be marked pending even though their approved delivery
  -- has no hold ledger. Hold and release within this same transaction.
  IF v_payment.escrow_status IS DISTINCT FROM 'funded' THEN
    PERFORM public.hold_project_payment(v_payment.id);
    SELECT * INTO v_payment FROM public.payments WHERE id=v_payment.id FOR UPDATE;
  END IF;
  IF v_payment.escrow_status IS DISTINCT FROM 'funded' THEN RAISE EXCEPTION 'Payment could not be moved into escrow'; END IF;

  v_amount := round(COALESCE(v_payment.project_amount, v_payment.amount-COALESCE(v_payment.platform_fee,0)),2);
  IF v_amount <= 0 THEN RAISE EXCEPTION 'Freelancer release amount is invalid'; END IF;
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id=v_payment.freelancer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Freelancer wallet was not found'; END IF;
  IF COALESCE(v_wallet.pending_balance,0) < v_amount THEN RAISE EXCEPTION 'Wallet pending balance is lower than the held project amount'; END IF;

  UPDATE public.wallets SET pending_balance=COALESCE(pending_balance,0)-v_amount,
    available_balance=COALESCE(available_balance,0)+v_amount, updated_at=now()
  WHERE user_id=v_payment.freelancer_id;

  -- Payment row lock serializes release attempts; no partial-index conflict target is used.
  INSERT INTO public.wallet_transactions(user_id,project_id,payment_id,type,amount,description)
  VALUES(v_payment.freelancer_id,v_project.id,v_payment.id,'release',v_amount,
    'Project payment released after client approved delivery');

  UPDATE public.payments SET escrow_status='released', released_at=COALESCE(released_at,now()), updated_at=now()
    WHERE id=v_payment.id;
  UPDATE public.projects SET status='completed', updated_at=now() WHERE id=v_project.id;
  IF v_project.request_id IS NOT NULL THEN
    UPDATE public.project_requests SET status='completed', updated_at=now() WHERE id=v_project.request_id;
  END IF;
END;
$function$;
REVOKE ALL ON FUNCTION public.release_project_payment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_project_payment(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.hold_project_payment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hold_project_payment(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.youtent_notify_project_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public, pg_temp AS $fn$
DECLARE v_recipient uuid; v_sender uuid; v_title text; v_message text; v_link text; v_type text;
BEGIN
  IF TG_TABLE_NAME='projects' THEN
    v_recipient:=NEW.freelancer_id; v_sender:=NEW.client_id;
    v_title:='New project order'; v_message:='A new paid project has been created for you.';
    v_link:='/projects/'||NEW.id::text; v_type:='project';
  ELSIF TG_TABLE_NAME='project_messages' THEN
    v_recipient:=NEW.receiver_id; v_sender:=NEW.sender_id;
    v_title:='New project message'; v_message:='You received a new message in a project conversation.';
    v_link:='/projects/'||NEW.project_id::text||'/messages'; v_type:='message';
  ELSIF TG_TABLE_NAME='project_deliveries' THEN
    IF TG_OP='INSERT' OR (TG_OP='UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
      IF NEW.status='submitted' THEN v_recipient:=NEW.client_id; v_sender:=NEW.freelancer_id; v_title:='Delivery ready for review'; v_message:='Your freelancer submitted a delivery. Review the files and approve or request a revision.'; v_type:='delivery';
      ELSIF NEW.status='revision_requested' THEN v_recipient:=NEW.freelancer_id; v_sender:=NEW.client_id; v_title:='Revision requested'; v_message:='The client requested changes to your delivery.'; v_type:='delivery';
      ELSIF NEW.status='approved' THEN v_recipient:=NEW.freelancer_id; v_sender:=NEW.client_id; v_title:='Delivery approved'; v_message:='The client approved your delivery.'; v_type:='delivery';
      ELSE RETURN NEW; END IF;
      v_link:='/projects/'||NEW.project_id::text||'/delivery';
    ELSE RETURN NEW; END IF;
  ELSE RETURN NEW; END IF;
  IF v_recipient IS NOT NULL AND v_recipient IS DISTINCT FROM v_sender THEN
    INSERT INTO public.notifications(user_id,type,title,message,link,created_at,read_at)
    VALUES(v_recipient,v_type,v_title,v_message,v_link,now(),NULL);
  END IF;
  RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS youtent_new_project_notification ON public.projects;
CREATE TRIGGER youtent_new_project_notification AFTER INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.youtent_notify_project_activity();
DROP TRIGGER IF EXISTS youtent_project_message_notification ON public.project_messages;
CREATE TRIGGER youtent_project_message_notification AFTER INSERT ON public.project_messages
FOR EACH ROW EXECUTE FUNCTION public.youtent_notify_project_activity();
DROP TRIGGER IF EXISTS youtent_project_delivery_notification ON public.project_deliveries;
CREATE TRIGGER youtent_project_delivery_notification AFTER INSERT OR UPDATE OF status ON public.project_deliveries
FOR EACH ROW EXECUTE FUNCTION public.youtent_notify_project_activity();

CREATE OR REPLACE FUNCTION public.youtent_notify_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public, pg_temp AS $fn$
BEGIN
  INSERT INTO public.notifications(user_id,type,title,message,link,created_at,read_at)
  VALUES(NEW.freelancer_id,'review','New client review','A client left a rating and review for your completed project.',
    '/creators/'||(SELECT COALESCE(username, id::text) FROM public.profiles WHERE id=NEW.freelancer_id),now(),NULL);
  RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS youtent_review_notification ON public.reviews;
CREATE TRIGGER youtent_review_notification AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.youtent_notify_review();

NOTIFY pgrst, 'reload schema';

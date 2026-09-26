-- YOUTENT notifications + project payment-state + project-message notification fix
-- Run once in Supabase SQL Editor for a fresh/other environment.

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_status_check;

UPDATE public.projects
SET status = 'pending_payment'
WHERE status = 'pending';

ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('pending_payment', 'active', 'completed', 'cancelled'));

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications(user_id, read_at) WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can mark own notifications read" ON public.notifications;
CREATE POLICY "Users can mark own notifications read" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.youtent_add_notification(p_user_id uuid, p_type text, p_title text, p_message text, p_link text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications(user_id, type, title, message, link) VALUES (p_user_id, p_type, p_title, p_message, p_link);
END;
$$;
REVOKE ALL ON FUNCTION public.youtent_add_notification(uuid, text, text, text, text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.youtent_project_request_notifications()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_project_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.youtent_add_notification(NEW.creator_id, 'project_request', 'New project request', COALESCE('You received a new project request: ' || NULLIF(NEW.project_title, ''), 'You received a new project request.'), '/requests?request=' || NEW.id::text || '#request-' || NEW.id::text);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'accepted' THEN
      SELECT id INTO v_project_id FROM public.projects WHERE request_id = NEW.id LIMIT 1;
      PERFORM public.youtent_add_notification(NEW.client_id, 'request_status', 'Your request was accepted', COALESCE('Your project request "' || NULLIF(NEW.project_title, '') || '" was accepted by the creator.', 'Your project request was accepted by the creator.'), COALESCE('/projects/' || v_project_id::text, '/my-requests?request=' || NEW.id::text));
    ELSIF NEW.status = 'declined' THEN
      PERFORM public.youtent_add_notification(NEW.client_id, 'request_status', 'Your request was rejected', COALESCE('Your project request "' || NULLIF(NEW.project_title, '') || '" was rejected by the creator.', 'Your project request was rejected by the creator.'), '/my-requests?request=' || NEW.id::text);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS youtent_project_request_notifications_insert ON public.project_requests;
CREATE TRIGGER youtent_project_request_notifications_insert AFTER INSERT ON public.project_requests FOR EACH ROW EXECUTE FUNCTION public.youtent_project_request_notifications();
DROP TRIGGER IF EXISTS youtent_project_request_notifications_update ON public.project_requests;
CREATE TRIGGER youtent_project_request_notifications_update AFTER UPDATE OF status ON public.project_requests FOR EACH ROW EXECUTE FUNCTION public.youtent_project_request_notifications();

CREATE OR REPLACE FUNCTION public.youtent_project_message_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_project_id uuid; v_project_title text;
BEGIN
  IF NEW.project_request_id IS NULL THEN RETURN NEW; END IF;
  SELECT id, title INTO v_project_id, v_project_title FROM public.projects WHERE request_id = NEW.project_request_id LIMIT 1;
  PERFORM public.youtent_add_notification(NEW.receiver_id, 'message', 'New project message', COALESCE('You received a new message in "' || NULLIF(v_project_title, '') || '".', 'You received a new project message.'), CASE WHEN v_project_id IS NOT NULL THEN '/projects/' || v_project_id::text || '/messages' ELSE '/dashboard/messages' END);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS youtent_project_message_notification_insert ON public.messages;
CREATE TRIGGER youtent_project_message_notification_insert AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.youtent_project_message_notification();

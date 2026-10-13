-- Reviews table and activity notifications for YOUTENT.
-- Safe to apply more than once; does not alter or delete existing business records.
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  freelancer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_one_per_project UNIQUE (project_id)
);

CREATE INDEX IF NOT EXISTS reviews_freelancer_created_idx
  ON public.reviews (freelancer_id, created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.reviews;
CREATE POLICY "Reviews are publicly readable" ON public.reviews
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Clients can create own project reviews" ON public.reviews;
CREATE POLICY "Clients can create own project reviews" ON public.reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.client_id = auth.uid()
        AND p.freelancer_id = reviews.freelancer_id
        AND p.status = 'completed'
    )
  );

-- Notifications are inserted by trusted database triggers so the header badge
-- can show counts for real project activity, not only manually-created alerts.
CREATE OR REPLACE FUNCTION public.youtent_notify_project_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_recipient uuid;
  v_sender uuid;
  v_title text;
  v_message text;
  v_link text;
  v_type text;
  v_project_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'projects' THEN
    v_recipient := NEW.freelancer_id;
    v_sender := NEW.client_id;
    v_project_id := NEW.id;
    v_title := 'New project order';
    v_message := 'A new paid project has been created for you.';
    v_link := '/projects/' || NEW.id::text;
    v_type := 'project';
  ELSIF TG_TABLE_NAME = 'project_messages' THEN
    v_recipient := NEW.receiver_id;
    v_sender := NEW.sender_id;
    v_project_id := NEW.project_id;
    v_title := 'New project message';
    v_message := 'You received a new message in a project conversation.';
    v_link := '/projects/' || NEW.project_id::text || '/messages';
    v_type := 'message';
  ELSIF TG_TABLE_NAME = 'project_deliveries' THEN
    v_project_id := NEW.project_id;
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
      IF NEW.status = 'submitted' THEN
        v_recipient := NEW.client_id;
        v_sender := NEW.freelancer_id;
        v_title := 'Delivery ready for review';
        v_message := 'Your freelancer submitted a delivery. Review the files and approve or request a revision.';
        v_type := 'delivery';
      ELSIF NEW.status = 'revision_requested' THEN
        v_recipient := NEW.freelancer_id;
        v_sender := NEW.client_id;
        v_title := 'Revision requested';
        v_message := 'The client requested changes to your delivery.';
        v_type := 'delivery';
      ELSIF NEW.status = 'approved' THEN
        v_recipient := NEW.freelancer_id;
        v_sender := NEW.client_id;
        v_title := 'Delivery approved';
        v_message := 'The client approved your submitted delivery.';
        v_type := 'delivery';
      ELSE
        RETURN NEW;
      END IF;
      v_link := '/projects/' || NEW.project_id::text || '/delivery';
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  IF v_recipient IS NOT NULL AND v_recipient IS DISTINCT FROM v_sender THEN
    INSERT INTO public.notifications(user_id, type, title, message, link, created_at, read_at)
    VALUES (v_recipient, v_type, v_title, v_message, v_link, now(), NULL);
  END IF;
  RETURN NEW;
END;
$fn$;

DO $do$
BEGIN
  IF to_regclass('public.projects') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS youtent_new_project_notification ON public.projects;
    CREATE TRIGGER youtent_new_project_notification
      AFTER INSERT ON public.projects
      FOR EACH ROW EXECUTE FUNCTION public.youtent_notify_project_activity();
  END IF;

  IF to_regclass('public.project_messages') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_messages' AND column_name='receiver_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_messages' AND column_name='project_id') THEN
    DROP TRIGGER IF EXISTS youtent_project_message_notification ON public.project_messages;
    CREATE TRIGGER youtent_project_message_notification
      AFTER INSERT ON public.project_messages
      FOR EACH ROW EXECUTE FUNCTION public.youtent_notify_project_activity();
  END IF;

  IF to_regclass('public.project_deliveries') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS youtent_project_delivery_notification ON public.project_deliveries;
    CREATE TRIGGER youtent_project_delivery_notification
      AFTER INSERT OR UPDATE OF status ON public.project_deliveries
      FOR EACH ROW EXECUTE FUNCTION public.youtent_notify_project_activity();
  END IF;
END;
$do$;

NOTIFY pgrst, 'reload schema';

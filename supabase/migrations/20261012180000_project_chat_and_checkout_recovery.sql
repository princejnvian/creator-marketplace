-- Direct gig checkout projects can have request_id = NULL. Use project_id for chat.
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
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_messages.project_id
      AND (p.client_id = auth.uid() OR p.freelancer_id = auth.uid())
  ));

DROP POLICY IF EXISTS project_messages_insert_members ON public.project_messages;
CREATE POLICY project_messages_insert_members ON public.project_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_messages.project_id
        AND (p.client_id = auth.uid() OR p.freelancer_id = auth.uid())
        AND receiver_id = CASE WHEN p.client_id = auth.uid() THEN p.freelancer_id ELSE p.client_id END
    )
  );

GRANT SELECT, INSERT ON public.project_messages TO authenticated;
NOTIFY pgrst, 'reload schema';

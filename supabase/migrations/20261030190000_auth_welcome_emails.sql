-- One-time welcome email delivery ledger for verified YOUTENT signups.
-- Writes are performed only by the server using the Supabase service-role key.
CREATE TABLE IF NOT EXISTS public.auth_welcome_emails (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'sending'
    CHECK (status IN ('sending', 'sent', 'failed')),
  resend_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

ALTER TABLE public.auth_welcome_emails ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.auth_welcome_emails FROM anon, authenticated;
GRANT ALL ON TABLE public.auth_welcome_emails TO service_role;

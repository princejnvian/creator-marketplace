-- YOUTENT request + direct-message database fix
-- Run once in Supabase SQL Editor if creator_messages does not exist.
-- Safe to run repeatedly.

CREATE TABLE IF NOT EXISTS public.creator_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS creator_messages_pair_idx
  ON public.creator_messages(sender_id, creator_id, created_at DESC);

ALTER TABLE public.creator_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS creator_messages_select_pair ON public.creator_messages;
CREATE POLICY creator_messages_select_pair
  ON public.creator_messages
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR creator_id = auth.uid());

DROP POLICY IF EXISTS creator_messages_insert_sender ON public.creator_messages;
CREATE POLICY creator_messages_insert_sender
  ON public.creator_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Required profile fields used by Profile Studio.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS primary_category text,
  ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS starting_price numeric(12,2),
  ADD COLUMN IF NOT EXISTS service_packages jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS portfolio jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_starting_price_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_starting_price_check
  CHECK (
    starting_price IS NULL
    OR (starting_price >= 0 AND starting_price <= 10000000)
  );

-- Portfolio media must exist as a public-read bucket because the app stores
-- portfolio URLs in profiles.portfolio.
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-media', 'portfolio-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

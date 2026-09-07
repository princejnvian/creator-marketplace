-- YOUTENT 2.0 marketplace profile expansion
-- Run this once in Supabase SQL Editor.

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
  CHECK (starting_price IS NULL OR (starting_price >= 0 AND starting_price <= 10000000));

-- Public portfolio media is readable by anyone, while uploads are performed
-- through the authenticated server route using the service role.
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-media', 'portfolio-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Keep the existing secure handle_new_user behavior, while also carrying
-- freelancer categories from signup metadata when they are provided.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_categories text[] := '{}';
BEGIN
  IF jsonb_typeof(NEW.raw_user_meta_data->'categories') = 'array' THEN
    SELECT COALESCE(array_agg(value), '{}')
    INTO v_categories
    FROM jsonb_array_elements_text(NEW.raw_user_meta_data->'categories')
    WHERE length(value) <= 80;
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    username,
    account_type,
    categories,
    primary_category
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    CASE
      WHEN NEW.raw_user_meta_data->>'account_type' IN ('client', 'freelancer')
        THEN NEW.raw_user_meta_data->>'account_type'
      ELSE 'client'
    END,
    v_categories,
    NULLIF(NEW.raw_user_meta_data->>'primary_category', '')
  );

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

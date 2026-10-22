-- Freelancer KYC uploads and payout account details. Existing wallet/payment rows are untouched.
ALTER TABLE public.creator_payout_profiles
  ADD COLUMN IF NOT EXISTS account_holder_name text,
  ADD COLUMN IF NOT EXISTS bank_account_number text,
  ADD COLUMN IF NOT EXISTS bank_ifsc text,
  ADD COLUMN IF NOT EXISTS upi_id text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS selfie_path text,
  ADD COLUMN IF NOT EXISTS aadhaar_path text,
  ADD COLUMN IF NOT EXISTS manual_review_status text NOT NULL DEFAULT 'not_submitted'
    CHECK (manual_review_status IN ('not_submitted','pending_review','approved','rejected')),
  ADD COLUMN IF NOT EXISTS manual_review_note text,
  ADD COLUMN IF NOT EXISTS documents_submitted_at timestamptz;

-- Private bucket: files are never public. Object names start with the authenticated user's UUID.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('freelancer-kyc-private', 'freelancer-kyc-private', false, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];

DROP POLICY IF EXISTS "Freelancers upload own KYC files" ON storage.objects;
CREATE POLICY "Freelancers upload own KYC files" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'freelancer-kyc-private' AND (storage.foldername(name))[1] = auth.uid()::text
);
DROP POLICY IF EXISTS "Freelancers update own KYC files" ON storage.objects;
CREATE POLICY "Freelancers update own KYC files" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'freelancer-kyc-private' AND (storage.foldername(name))[1] = auth.uid()::text
) WITH CHECK (
  bucket_id = 'freelancer-kyc-private' AND (storage.foldername(name))[1] = auth.uid()::text
);
DROP POLICY IF EXISTS "Freelancers read own KYC files" ON storage.objects;
CREATE POLICY "Freelancers read own KYC files" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'freelancer-kyc-private' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Do not grant public access to payout details or KYC metadata. The authenticated API validates ownership.
NOTIFY pgrst, 'reload schema';

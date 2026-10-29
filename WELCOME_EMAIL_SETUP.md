# YOUTENT one-time welcome email setup

This update sends a branded welcome email after a new signup's email-confirmation link is completed.

## 1. Apply the Supabase migration

In Supabase Dashboard → SQL Editor, run the complete SQL from:
`supabase/migrations/20261030190000_auth_welcome_emails.sql`

The table has RLS enabled and no client policies. The server uses the service-role key to write delivery records.

## 2. Add the Resend key to Vercel

Vercel → YOUTENT project → Settings → Environment Variables:

- Name: `RESEND_API_KEY`
- Value: the YOUTENT Resend API key (sending access for `youtent.in`)
- Environments: Production (and Preview only if you want preview deployments to send real emails)

Do not use a `NEXT_PUBLIC_` prefix. Do not put this key in browser code or commit it to Git.

The sender is `YOUTENT <no-reply@youtent.in>` and the logo is loaded from the existing public image `https://youtent.in/youtent-logo.png.png`.

## 3. Deploy

Commit/push the updated project or deploy it through your usual Vercel workflow. A new deployment is required for the environment variable to take effect.

## 4. Test with a new signup

Use a fresh email address, sign up, open the verification email, and click its confirmation button. The callback exchanges the Supabase PKCE code, checks that the email is confirmed, then sends the welcome email through Resend. The user is redirected to `/dashboard` even if the welcome email provider reports an error.

A unique `user_id` in `auth_welcome_emails` prevents duplicate sends for the same account. A failed attempt is recorded as `failed` and is not automatically retried; inspect the row and Vercel logs if delivery fails.

## Important behavior

- Google OAuth callback behavior is preserved; OAuth redirects do not include `welcome=1` and therefore do not send signup welcome emails.
- The signup flow now sets `emailRedirectTo` to the existing `/auth/callback?welcome=1` URL.
- The existing callback paths are allowlisted, but this update adds the `?welcome=1` query parameter. In Supabase → Authentication → URL Configuration → Redirect URLs, add both exact URLs:

- `https://youtent.in/auth/callback?welcome=1`
- `https://www.youtent.in/auth/callback?welcome=1`

Keep the existing callback URLs and Site URL unchanged.

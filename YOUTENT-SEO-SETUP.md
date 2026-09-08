# YOUTENT SEO + Google Indexing Setup

This version adds a production-ready Next.js SEO foundation for `https://youtent.in`.

## Added

- `app/sitemap.ts` — dynamic XML sitemap with the homepage, public creator directory, and freelancer profile URLs from Supabase.
- `app/robots.ts` — robots rules with the sitemap URL and private-area exclusions.
- `metadataBase` + canonical URL in `app/layout.tsx`.
- SEO metadata for `/creators`.
- Dynamic SEO metadata for `/creators/[username]`.
- Open Graph metadata for creator profiles.
- Schema.org JSON-LD profile data for public creator pages.
- Public creator discovery pages now load through the server-side Supabase admin client so search-engine crawlers can access intended public marketplace content without weakening database RLS policies.

## Important security note

The Supabase service-role key is used only in server-side code. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or commit a real secret into source control.

## After deployment

Check these URLs:

- `https://youtent.in/robots.txt`
- `https://youtent.in/sitemap.xml`
- `https://youtent.in/creators`
- `https://youtent.in/creators/<username>` for an existing freelancer

Then in Google Search Console:

1. Add/verify the `youtent.in` Domain property.
2. Open **Sitemaps**.
3. Submit `sitemap.xml`.
4. Use **URL Inspection** for `https://youtent.in/` and request indexing.
5. Test one public creator profile URL as well.

The sitemap is revalidated hourly so newly created freelancer profiles can appear without requiring a code deployment every time.

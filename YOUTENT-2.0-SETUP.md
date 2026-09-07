# YOUTENT 2.0 Premium Marketplace

## Before running
1. Keep your existing `.env.local` file. Never commit it.
2. Keep your existing `node_modules` optional; if missing, run `npm install`.
3. Run `supabase-youtent-marketplace.sql` once in the Supabase SQL Editor.
4. Then run `npm run dev`.

## New marketplace capabilities
- Fiverr-style top marketplace navigation with hover mega menus.
- Freelancer category selection (up to 3) and primary category.
- Freelancer skills selection (up to 8).
- Public portfolio with image, video and audio samples.
- Starting price and Basic / Standard / Premium packages.
- Public creator profile now displays categories, portfolio and packages.
- Portfolio uploads use the authenticated server route and the public `portfolio-media` bucket.

## Portfolio upload limits
- Maximum 12 portfolio items per profile.
- Maximum 30MB per media file.
- Images: JPG, PNG, WEBP, GIF.
- Video: MP4, WEBM, MOV.
- Audio: MP3, WAV, OGG, M4A/MP4 audio.

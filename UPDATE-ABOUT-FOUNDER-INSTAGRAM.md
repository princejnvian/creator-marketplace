# YOUTENT About / Founder / Instagram update

This update changes only:
- `app/about/page.tsx` — expanded About page with the supplied founder portrait, Prince JNVian's Founder & CEO credit, platform mission/how-it-works sections, and Instagram links.
- `app/layout.tsx` — site-wide metadata identifying YOUTENT and Prince JNVian, plus Open Graph/Twitter metadata.
- `components/SiteFooter.tsx` — founder credit and “Follow us on Instagram” link.
- `public/prince-jnvian-founder.webp` — optimized WebP version of the portrait supplied for this update.

Instagram: https://www.instagram.com/youtent.in

## Apply
1. Back up your current project.
2. Extract this ZIP and copy/merge the `youtent/` project files into your existing project folder, replacing files when prompted.
3. Keep your existing `.env.local` locally. It is intentionally NOT included in this ZIP.
4. Run in PowerShell:
   ```powershell
   npm.cmd run build
   ```
5. If the build succeeds, review the About page at `/about`, then commit and push.

No database migrations or payment code were changed. The build could not be independently completed in this environment because dependency installation did not finish; please run the build locally before pushing.

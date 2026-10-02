@AGENTS.md

# Publishing

Production is https://adrielcolaco.com (Vercel project `adriel-portfolio`, Hobby plan,
team "Gabriel Leonardo's projects"). The repo is connected to Vercel through its GitHub integration.

**To publish, commit and push to `main`.** Vercel builds and deploys it to production. Any other
branch gets its own preview URL, posted on the commit and on its pull request. Nothing needs to be
installed, linked or logged in locally.

- Before pushing, run `npm run build` and fix any error. A failed build leaves the previous version
  online, but the change does not ship.
- After pushing, check the result on the commit: `gh api repos/{owner}/{repo}/commits/main/status`
  shows the `Vercel` status and a link to the build log.
- **The repo must stay public.** Hobby only deploys commits from GitHub organization repos, and from
  authors who are not members of the Vercel team, because the repo is public. Making it private
  stops every deploy by anyone except the Vercel team owner.
- Never run `vercel link` or `vercel --prod` against another team. The CLI may also be logged into
  an unrelated work team.
- Since the repo is public, never commit secrets, `.env` files or anything private. Everything in
  the history is readable by anyone.

Domain `adrielcolaco.com` is registered on Cloudflare (account "Adriel Colaço"), with DNS there
pointing to Vercel. Both records must stay "DNS only" (grey cloud): turning the Cloudflare proxy on
breaks Vercel's SSL certificate. `www` redirects to the apex with a 308, configured in Vercel.

# Usage limits

Vercel Hobby is free with hard caps. Hitting one blocks the feature, it does not charge.

| Resource | Limit |
| --- | --- |
| Deployments | 100 per day |
| Builds | 100 per hour, 1 at a time, 45 min max each |
| Fast Data Transfer | 100 GB per month |
| CDN requests | 1,000,000 per month |
| Image transformations | 5,000 per month |
| Image cache reads / writes | 300,000 / 100,000 per month |
| Runtime logs | kept 1 hour |

When a monthly limit is exceeded, Vercel pauses that feature for up to 30 days. The ones this site
can realistically hit:

- **Image transformations.** Every `next/image` source at a new width or quality counts once. Adding
  many images, or new `sizes`/`quality` values, burns through it fastest. Keep images in `public/`
  already compressed and avoid generating extra variants.
- **Data transfer.** `public/` is about 20 MB of images. Large uncompressed files multiply transfer
  on every visit, so compress before committing.
- **Deployments.** Every push to any branch is a deployment. Batch small changes into fewer pushes
  rather than pushing each tweak.

Hobby is for personal, non-commercial use. If the site starts selling something directly, the
project needs to move to Pro.

Current usage: Vercel dashboard, team settings, Usage.

@AGENTS.md

# Publishing

Production is https://adrielcolaco.com (Vercel project `adriel-portfolio`, Hobby plan,
team "Gabriel Leonardo's projects").

**To publish, commit and push to `main`.** The `Deploy` workflow in `.github/workflows/deploy.yml`
builds and deploys with the Vercel CLI. Nothing needs to be installed, linked or logged in locally,
and any commit author can publish.

- Before pushing, run `npm run build` and fix any error. A failed build in CI leaves the previous
  version online, but the change does not ship.
- After pushing, check the result with `gh run list --limit 1` and, if it failed,
  `gh run view <id> --log-failed`.
- To redeploy without a new commit, use `gh workflow run Deploy`.
- `npm run deploy` deploys from the local machine. It only works for someone logged into the Vercel
  CLI with access to the team above, so it is a fallback, not the normal path.
- Never run `vercel link` or `vercel --prod` against another team. The CLI may also be logged into
  an unrelated work team.
- Secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` live in the repo settings. Never
  print, commit or ask for their values.
- The Vercel dashboard shows this project with no Git repository connected. That is intended:
  Hobby cannot connect a repo owned by a GitHub organization, which is why deploys go through the CLI.

# Usage limits

Both services are on free plans with hard caps. Hitting one blocks the service, it does not charge.

## GitHub Actions (free organization, private repo)

| Resource | Included per month |
| --- | --- |
| Linux runner minutes | 2,000 |
| Artifact storage | 500 MB |
| Cache storage | 10 GB per repo |

One deploy takes about 1.5 minutes, so the budget is roughly 1,000 deploys a month. When minutes run
out, workflows stop until the next month. Avoid adding workflows that run on every push beyond
`Deploy`, and do not switch the runner to Windows or macOS, which consume minutes faster.

## Vercel Hobby

| Resource | Limit |
| --- | --- |
| Deployments | 100 per day |
| Builds | 100 per hour, 1 at a time, 45 min max each |
| CLI upload size | 100 MB of source files |
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
- **Upload size.** The CLI uploads the repo. Keep `public/` well under 100 MB; put video on an
  external host instead of the repo.

Hobby is for personal, non-commercial use. If the site starts selling something directly, the
project needs to move to Pro.

Domain `adrielcolaco.com` is registered on Cloudflare (account "Adriel Colaço"), with DNS there pointing
to Vercel. Both records must stay "DNS only" (grey cloud): turning the Cloudflare proxy on breaks
Vercel's SSL certificate. `www` redirects to the apex with a 308, configured in Vercel.

Current usage: Vercel dashboard, team settings, Usage. GitHub: organization settings, Billing.

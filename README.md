# STEM-Accessibility frontend

React + TypeScript + Vite single-page app for making diagrams accessible:
upload a flowchart image, edit the extracted structure, and publish an
accessible representation (alt text, long description, shareable page).

The API lives in [`stem-accessibility/backend`](https://github.com/stem-accessibility/backend).
Sign-in uses Supabase Auth directly from the browser; the access token is sent
to the backend as a Bearer token (`src/lib/api.ts`).

## Run locally

```bash
npm install
cp .env.example .env.local     # fill in the values below
npm run dev                    # http://localhost:5173
```

Run the backend too (see its README) so uploads and saving work.

**No Supabase or Vercel account needed.** For local development set
`VITE_AUTH_MODE=dev` in `.env.local` and run the backend with `AUTH_MODE=dev`
(see the backend README). You are signed in as a fixed local user and no
Supabase call is made. Dev mode is ignored in production builds.

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the project's publishable key (`sb_publishable_…`). Never use the secret/service-role key. |
| `VITE_API_URL` | backend base URL, e.g. `http://localhost:4999` |

Use `.env.local`, which is git-ignored. `VITE_*` values are baked in at build
time, so changing them in Vercel needs a redeploy.

The `/grafari` chart playground also calls a separate service at
`http://localhost:5055` (hard-coded in `GrafariOutputsCard.tsx` and
`VizResultsPage.tsx`); that is unrelated to the backend above.

## Build

```bash
npm run build     # tsc -b && vite build, output in dist/
```

## Deploy (Vercel)

Import this repo in Vercel (Vite preset, defaults for build and output), set
the three variables above for Production/Preview, and deploy. `vercel.json`
rewrites all routes to `/` for the SPA. After deploying, add the Vercel URL to
the backend's `CORS_ORIGINS` and to Supabase → Authentication → URL
Configuration (Site URL and redirect URLs).

## Accessibility

We aim for WCAG 2.2 AA and treat accessibility reports as expertise. See
[ACCESSIBILITY.md](ACCESSIBILITY.md) for our commitments, contributor
expectations, and how to report a barrier.

## License

See [LICENSE](LICENSE). Copyright (c) 2025 University of Washington.

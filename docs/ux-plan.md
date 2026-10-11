# UX plan (branch `arboretum-integration`)

Edit freely. Check items off as they land. Items marked **Q** need a decision before work starts.
Decisions already made are listed under "Decided".

## Decided

- Headline: "Make STEM images accessible."
- Signed-in nav: Dashboard + Create. No Home, no Upload. Scratch is hidden.
- Signed-out visitors keep the landing page, and can also (a) search public diagrams and (b) try it out
  without an account and without AI.
- Create: name, type, public (default) or private, then **Upload image** or **Edit markdown**.
- Markdown editor preview shows the graph, the alt text, and the long description, all visible.
- Dashboard stays as is, with search by title (plus ID and slug).

## 1. Wording

- [ ] `src/components/Hero.tsx`: headline becomes "Make STEM images accessible."
- [ ] Other "diagram" / "flowchart" wording that should say "STEM image(s)": hero subtitle and bullets,
      `index.html` title and description, About page, README tagline.
- **Q** Scope: headline only, or also the body copy and meta tags? (Suggest headline, subtitle, `<title>`,
  description, README tagline. Leave "diagram type" labels in the editor alone.)

## 2. Navigation

Today (`src/components/Header.tsx`): Home, About; signed in adds Dashboard, Upload.

- [ ] Signed in: **Dashboard** and a **Create** button (primary style). Drop "Home" and "Upload".
- [ ] Signed in: brand link and `/` go to `/dashboard`.
- [ ] Signed out: nav is **About**, **Browse** (public diagrams, section 6), **Try it** (section 7), **Log in**.
      The brand link goes to the landing page.
- [ ] Rename route `/upload` to `/create`; keep `/upload` as a redirect. Update Hero CTA, Dashboard empty
      state, and any `navigate("/upload")`.

## 3. What "published" means (the part to think through)

How it works today (backend `models.py`, `routes/api.py`):

- Two independent flags. `is_published` + `public_slug` make the `/p/<slug>` page work. `visibility`
  ("public" or "private") controls whether it appears in the public listing (`/repo`).
- A diagram is listed only if **both** are set (`/repo` filters on `visibility="public"` AND
  `is_published=True`).
- New diagrams start as `visibility="private"`, `is_published=False`.
- Publishing is a separate explicit action (`POST /publish/<id>`, a button in the editor/export).
- So someone who sets "public" and never presses Publish gets a diagram that **looks** public to them
  and is invisible to everyone. That is exactly the failure to design out.

Proposal: **one setting, Public or Private, and it does both jobs.**

- [ ] Public = published (has a `/p/<slug>` link) and listed. Private = unpublished and unlisted. Owner can
      always open their own diagrams from the Dashboard.
- [ ] Backend: one endpoint (extend `POST /research/<id>` or add `POST /flowcharts/<id>/visibility`) that sets
      `visibility`, `is_published`, `public_slug`, and `published_at` together in one transaction. No code path
      can leave them out of sync.
- [ ] `POST /flowcharts` accepts `visibility` and applies the same rule at creation, so Create with "Public"
      is published immediately, with no second step.
- [ ] Remove the separate "Publish" button; the editor and Dashboard show a Public/Private toggle that
      reads "Public: anyone can find and view this" / "Private: only you".
- [ ] Editing a public diagram updates the public page on save (no "republish" step). Show the public link
      and a "Last saved" time in the editor so people see that it is live.
- [ ] Disclosure at the choice point, in plain words next to the radio: "Public diagrams, and the image you
      upload, can be seen by anyone."
- [ ] Existing data (one-time, needs your OK because it touches production): rows with `visibility="public"`
      but `is_published=false` were intended to be public but are invisible; rows with `is_published=true`
      and `visibility="private"` are "link only". Option A: publish the first group, show the second as
      "Link only" in the Dashboard. Option B: leave all as is and show a "Public but not published" fix-it
      banner. Run a read-only count first.
- **Q** Keep a third state, "Anyone with the link" (published, not listed)? Today's data already has some.
  Suggest: not offered on Create (only Public/Private), but kept and shown on the Dashboard and in the
  editor toggle so nothing silently changes.
- **Q** Public by default also publishes the uploaded image (`/p/<slug>/image`). Is that what you want, or
  should the image stay private unless the owner opts in? (Copyright and privacy of source images.)

## 4. Create page (signed in)

Replaces the tabbed Upload page (`src/pages/DiagramUpload.tsx`).

1. **Diagram name** (required) → `title`.
2. **Diagram type** (Flowchart, Tree, Binary tree, Linked list, Array, 2D array; default Flowchart)
   → `flowchart_type`, from `DIAGRAM_TYPES`.
3. **Visibility**: Public (default) / Private, with the disclosure above.
4. Buttons: **Upload image** and **Edit markdown**.

- [ ] Upload image: file chooser, existing upload job (`UploadJobStatus`) with title, type, visibility, then
      opens `/editor/:id`.
- [ ] Edit markdown: opens the markdown editor (section 5) carrying the three settings.
- [ ] Both disabled until a name is entered, with a visible message saying why.
- [ ] Remove Scratch and the unreachable "existing" mode; drop the "Better for screen reader users" note
      (the markdown button replaces it, labeled with what it does).
- **Q** "Markdown" = the Mermaid text we accept today (`/parse-mermaid`, flowcharts only)? Suggest: Mermaid
  first, button "Edit markdown (Mermaid)", type-specific input (Arboretum's parsers) as a follow-up.

## 5. Markdown editor with live preview

Left: text editor. Right: preview with **three visible parts**: the graph, the alt text, and the long
description. Wide screens side by side; narrow screens stacked (editor, then preview).

- [ ] Graph: read-only `ReactFlowViewer`, updated after a debounce (about 500 ms) via `POST /parse-mermaid`
      and `layoutWithDagre` (move the duplicated copies in `DiagramUpload.tsx` and `MermaidUploadEditor.tsx`
      to one module in `src/lib/`).
- [ ] Alt text and long description: generated **without AI** by `autoDescribe` (Arboretum-based,
      deterministic, runs in the browser, so it updates instantly and costs nothing). Verify it yields a
      short alt text as well as the long description; add that output if not.
- [ ] Alt text and long description are editable text areas under their labels, so the author can adjust
      them before saving. Show "Auto-generated" until edited.
- [ ] Parse error: keep the last good preview, show the error under the editor (`role="alert"`).
- [ ] Screen reader behavior: the preview region is not a live region (no re-announcing on every
      keystroke). A polite status line says "5 nodes, 6 edges" after each successful parse.
- [ ] **Save and continue** creates the record (title, type, visibility, Mermaid text, alt text, long
      description) and opens `/editor/:id`.
- [ ] Type-specific preview: for Tree / Linked list / Array types, show the typed navigable view instead of
      the plain graph, so the preview matches what viewers get.

## 6. Signed-out: search public diagrams

`/examples` (`PublicRepoPage.tsx`) already lists `/repo`, public and no login, with search and a type filter.

- [ ] Add it to the landing page and the signed-out nav as **Browse** (rename the route to `/browse`, keep
      `/examples` redirecting).
- [ ] Search matches title, summary, and type (check that title is covered); add a result count and an
      empty state with a link to Try it.
- [ ] Each card opens `/p/<slug>` (the representation browser) with no login.

## 7. Signed-out: try it (no account, no AI)

Same flow as section 5, without an account. The result can be saved as a public diagram tied to a token
stored in the visitor's browser.

- [ ] Route `/try`: the markdown editor from section 5, with a note "No account needed. Nothing here uses AI."
      Diagram name and type fields as on Create; visibility fixed to Public (stated clearly).
- [ ] **Where the "cookie" lives:** the backend is on a different site (`run.app`) from the frontend
      (`vercel.app`), so a cookie set by the backend is third-party and increasingly blocked (Safari, Chrome
      settings). Use a random token generated in the browser and kept in first-party storage (a cookie on the
      frontend's own domain, or localStorage), sent to the backend as an `X-Guest-Token` header.
- [ ] Backend: guest endpoints (create, update, delete, list "mine") with `owner_id = "guest:" + sha256(token)`.
      No AI routes (upload, generate-summary) for guests. Reuse the same visibility rule (Public).
- [ ] "My try-it diagrams": a small list on `/try` for the same browser, so they can reopen and edit.
      Honest note: clearing site data loses access (the diagram stays public).
- [ ] **Claim on sign-up:** after sign up or login, offer "Add the N diagrams you made here to your
      account" (token proves ownership; rewrites `owner_id`).
- [ ] Abuse controls (public and anonymous means spam is the main risk): per-IP and per-token rate limits,
      size caps (nodes, characters), a CAPTCHA (e.g. Cloudflare Turnstile) before first save, a "Report"
      link on public pages, and a way for you to unpublish by ID. Guest diagrams get a "Guest" badge.
- **Q** Should guest diagrams appear in the public Browse list immediately, or only be reachable by link until
  you approve them? (Immediately = simplest; spam risk. Link-only = safer; deviates from "saved as a public
  diagram".) Suggest: listed immediately, rate-limited, with report and takedown.
- **Q** Cookie consent: a functional token is usually exempt, but UW counsel may want a line in the privacy
  note. Needs a short statement on the Try page.

## 8. Dashboard

- [ ] Search already matches title, ID, and slug (`Dashboard.tsx`). Placeholder in `DashboardToolbar.tsx`
      still says "Flowchart ID or public slug": change to "Title, ID, or public slug".
- [ ] Show each diagram's state as Public / Private / Link only (section 3), with the toggle.
- [ ] Verify mixed-case and extra-space titles match.

## Order of work

1. Wording, nav (1, 2), Dashboard label (8). Small and low risk.
2. Publish model (3): backend endpoint and Create default. This is the foundation for 4 and 7.
3. Create page (4), without markdown.
4. Markdown editor with preview (5).
5. Browse for signed-out (6).
6. Try it (7): backend guest routes first, then the page, then claim-on-signup, then abuse controls.
7. Remove dead code (Scratch, Upload tabs), update CHANGELOG, README, `ACCESSIBILITY.md`.

Backend changes (3 and 7) need a Cloud Run redeploy and likely a migration; do both before the frontend merge.

## Out of scope for this pass

- Arboretum Mermaid/Graphviz typed-input parsers, share/embed pages, "ordering" output.
- Changing how uploads detect diagram type.
- Merging to `main` (needs your go-ahead; merging auto-deploys the public site).

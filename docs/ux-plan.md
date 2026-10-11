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
- Three sharing states (Public / Link only / Private), chosen in plain-language terms (section 3), plus a
  separate switch for whether the source image is shown.
- Try it has no AI and no image upload, which also limits abuse.
- Wording change applies throughout the user-visible text (section 1).
- Guest diagrams appear in Browse immediately, with rate limits, a Report link, and a takedown path.
- Edited alt text / long description is protected: once edited it stops regenerating, is marked
  "Edited by you", and offers "Regenerate (replaces your edits)".

## 1. Wording (throughout)

The thing a person creates and shares is a **STEM image**. "Flowchart", "tree", and so on remain the names of
**image types** (a STEM image has a type).

- [ ] Rule: user-visible strings only. Code identifiers, routes' internal names, API fields
      (`flowchart_id`, `flowchart_type`), and the research event names stay as they are.
- [ ] Replace "diagram" / "flowchart" with "STEM image" where it names the user's item: headings, buttons,
      empty states, status and error messages, `aria-label`s, and page titles. Examples:
      "Make STEM images accessible", "Create a STEM image", "No STEM images match your filters",
      "Delete this STEM image?", "Your STEM images".
- [ ] The type select's label becomes **"Image type"** (was "Diagram type") on Create, in the editor
      toolbar, and in mismatch warnings. Values stay Flowchart, Tree, Binary tree, Linked list, Array,
      2D array.
- [ ] Files with the most user-visible text (from a grep, includes code identifiers): `DiagramEditorPage.tsx`,
      `DiagramUpload.tsx`, `Dashboard.tsx`, `FlowchartCard.tsx`, `ExportAccessibleRepsModal.tsx`, `About.tsx`,
      `EditorToolbar.tsx`, `Permalink.tsx`, `PublicFlowchart.tsx`, `PublicRepoPage.tsx`, `Hero.tsx`,
      `HowItWorks.tsx`, `Guidance.tsx`, `RepoFlowchartCard.tsx`, `AccessibleMarkdown.tsx`, exports text.
- [ ] Also: `index.html` title and description, README and `ACCESSIBILITY.md` prose, About page, footer,
      CHANGELOG.
- [ ] Do the pass in one commit with a before/after list of strings, so it can be reviewed as text rather
      than as code.
- [ ] Check: a grep for remaining user-visible "flowchart"/"diagram" outside the type names.
- Note: exported HTML, `.md`, and permalinks quote this wording too (`export-utils.ts`); update those so
  shared output matches the app.

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

Proposal: **one sharing setting that does both jobs, plus one image switch.**

Names that say what happens (labels, with the description shown under each radio):

| State | Label | Shown under it | Stored as |
|---|---|---|---|
| Public | **Public** | "Anyone can find it in Browse and search, and anyone with the link can view it." | `visibility=public`, `is_published=true` |
| Link only | **Anyone with the link** | "Not listed in Browse or search. Only people you send the link to can view it." | `visibility=private`, `is_published=true` |
| Private | **Only me** | "Nobody else can see it. You can change this later." | `visibility=private`, `is_published=false` |

- [ ] Default on Create: **Public**. The Dashboard and editor show the same three labels as a select.
- [ ] Backend: one endpoint (extend `POST /research/<id>` or add `POST /flowcharts/<id>/sharing`) takes
      `{sharing: "public" | "link" | "private"}` and sets `visibility`, `is_published`, `public_slug`, and
      `published_at` in one transaction. No other code path touches those fields, so they cannot drift.
- [ ] `POST /flowcharts` accepts `sharing` and applies the same rule, so Create with "Public" is live
      immediately with no second step. The separate "Publish" button goes away.
- [ ] Editing a shared diagram updates the public page on save (no "republish"). The editor shows the page
      link and "Last saved" time so people can see that it is live.
- [ ] Unpublishing keeps the slug, so re-sharing restores the same link.

**Source image: its own switch** (only shown when the diagram has an uploaded image):

- [ ] Checkbox "Show the source image on the shared page" with help text: "The image you uploaded stays
      private unless you check this. Check it only if you have the right to share it."
- [ ] Default: **off**. (Sharing an uploaded image is the one choice that can't be undone once copied, and
      the rights to it are often not the uploader's. Public sharing of the generated description and
      representations works without it.)
- [ ] Backend: new column `image_public` (boolean, default false) with a migration. `/p/<slug>/image` and
      `has_image` in the public payload honor it; `/get/<id>/image` for the owner is unchanged.
- [ ] Existing published diagrams: backfill `image_public=true` so nothing already public changes (you can
      review and turn individual ones off). Needs your OK, since it is a production data change.
- [ ] Public pages without a shared image drop the "Original image" view cleanly (no broken link).

**Existing data** (one-time, needs your OK; run a read-only count first):

- Rows with `visibility=public` but `is_published=false` were meant to be public but are invisible.
  Publish them (they become Public) or surface a "fix" banner on the Dashboard.
- Rows with `is_published=true` and `visibility=private` map to "Anyone with the link", unchanged.

## 4. Create page (signed in)

Replaces the tabbed Upload page (`src/pages/DiagramUpload.tsx`).

1. **Diagram name** (required) → `title`.
2. **Image type** (Flowchart, Tree, Binary tree, Linked list, Array, 2D array; default Flowchart)
   → `flowchart_type`, from `DIAGRAM_TYPES`.
3. **Who can see it**: Public (default) / Anyone with the link / Only me (section 3). For image
   uploads, the "Show the source image" checkbox appears after a file is chosen.
4. Buttons: **Upload image** and **Edit markdown**.

- [ ] Upload image: file chooser, existing upload job (`UploadJobStatus`) with title, type, visibility, then
      opens `/editor/:id`.
- [ ] Edit markdown: opens the markdown editor (section 5) carrying the three settings.
- [ ] Both disabled until a name is entered, with a visible message saying why.
- [ ] Remove Scratch and the unreachable "existing" mode; drop the "Better for screen reader users" note
      (the markdown button replaces it, labeled with what it does).
- Text format: **Mermaid**. What Arboretum adds (checked in `vendor/arboretum/lib/inputs`):
  - It parses text **in the browser** (no backend): Mermaid via the `mermaid` package (`getDiagramFromText`),
    and Graphviz DOT via `ts-graphviz`.
  - Mermaid works for all five of its structures: binary tree, tree, linked list (`flowchart`), and array and
    2D array (`block-beta`). Graphviz works for binary tree, tree, and linked list only.
  - Our `/parse-mermaid` (backend) handles flowcharts only. Arboretum's parser does not do flowcharts, so
    the two are complementary.
  - Plan: Flowchart type uses the existing backend parse; Tree, Binary tree, Linked list, Array, and 2D
    array use Arboretum's in-browser Mermaid parser. Each type gets Arboretum's example text as a starter
    ("Insert example" button). Graphviz can be added later as a second format for the three types it covers.
  - Costs: the `mermaid` package is large, so load it only on the editor route (lazy import). Arboretum
    initializes it with `securityLevel: "loose"`; we would use `"strict"`.

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
- [ ] **Say it plainly next to the fields:** "These are generated from the diagram. If you change the
      diagram, they are regenerated and your edits to them are replaced." (Visible text, not a tooltip,
      and associated with both fields via `aria-describedby`.)
- [ ] **Protect edited text** (decided): once the author edits a field it stops regenerating, is marked
      "Edited by you", and offers **Regenerate (replaces your edits)**. The note above stays as the
      explanation. Regeneration runs on every parse, so this prevents losing text mid-typing.
- [ ] Same rule in the main editor: opening an existing STEM image whose text was edited does not
      overwrite it. Track with a `description_source` flag ("auto" | "edited") stored with the record
      (backend field or inside `json_data`; decide at implementation time).
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
      Diagram name and type fields as on Create; sharing fixed to Public (stated clearly).
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
- [ ] Abuse controls. Public plus anonymous still means spam is the main risk, but with no AI routes and no
      image upload for guests, there is no cost exposure and no hosted image content. What remains is text:
      per-IP and per-token rate limits, size caps (nodes, characters), a "Report" link on public pages, and a
      way for you to unpublish by ID. Guest diagrams get a "Guest" badge. Add a CAPTCHA only if spam shows up.
- [ ] Guests cannot set "Anyone with the link" or "Only me" (always Public) and have no image switch.
- **Q** Cookie consent: a functional token is usually exempt, but UW counsel may want a line in the privacy
  note. Needs a short statement on the Try page.

## 8. Dashboard

- [ ] Search already matches title, ID, and slug (`Dashboard.tsx`). Placeholder in `DashboardToolbar.tsx`
      still says "Flowchart ID or public slug": change to "Title, ID, or public slug".
- [ ] Show each diagram's state with the section 3 labels (Public / Anyone with the link / Only me) as a
      select, and show whether the source image is shared.
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
- Changing how uploads detect the image type.
- Merging to `main` (needs your go-ahead; merging auto-deploys the public site).

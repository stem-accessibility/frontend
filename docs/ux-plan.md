# UX plan (branch `arboretum-integration`)

Edit freely. Check items off as they land. Items marked **Q** need a decision before work starts.

## 1. Wording: "Make STEM images accessible"

- [ ] `src/components/Hero.tsx`: headline "Make diagrams accessible." becomes "Make STEM images accessible."
- [ ] Check for other "diagram" / "flowchart" wording that should now say "STEM image(s)": hero subtitle and
      bullets, `index.html` title and meta description, About page, README tagline, header `aria-label`.
- **Q** Scope: change only the headline, or also the body copy and meta tags? (Suggest: headline, subtitle,
  `<title>`/description, README tagline. Leave "diagram type" labels in the editor alone.)

## 2. Navigation: Dashboard + Create, no Home

Today (`src/components/Header.tsx`): left nav = Home, About; right nav when signed in = Dashboard, Upload.

- [ ] Signed in: nav is **Dashboard** and a **Create** button (primary style). Remove the "Home" and "Upload" items.
- [ ] Brand link goes to `/dashboard` when signed in, `/` when signed out.
- [ ] `/dashboard` redirect for signed-in users who land on `/`.
- [ ] Rename route `/upload` to `/create` (keep `/upload` as a redirect so old links work). Update Hero CTA, the
      Dashboard empty state, and any `navigate("/upload")`.
- [ ] Keep About in the nav (and the footer links).
- **Q** Signed-out visitors: keep the current landing page at `/` (hero, "See what you get", Log in)? That is the
  only place the product is explained, so I suggest keeping it and only dropping "Home" from the signed-in nav.

## 3. Create page

One page, one flow. Replaces the current tabbed Upload page (`src/pages/DiagramUpload.tsx`: Image / Mermaid /
Scratch tabs, plus the "Better for screen reader users" note).

Fields, in order:

1. **Diagram name** (text, required). Saved as `title`.
2. **Diagram type** (select: Flowchart, Tree, Binary tree, Linked list, Array, 2D array; default Flowchart).
   Saved as `flowchart_type`. Uses `DIAGRAM_TYPES` in `src/arboretum/diagramTypes.ts`, same list as the editor.
3. **Visibility**: Public (default) or Private. Radio group.
4. Two buttons: **Upload image** and **Edit markdown**.

Behavior:

- [ ] **Upload image**: shows a file chooser, then runs the existing upload job (`UploadJobStatus`) with title,
      type, and visibility attached, then opens the editor at `/editor/:id`.
- [ ] **Edit markdown**: opens the markdown editor (section 4) with the same three settings carried over.
- [ ] Both buttons are disabled until a name is entered, with an inline message saying why (not just disabled).
- [ ] Image upload for non-flowchart types: the image pipeline only produces flowcharts. Store the chosen type
      anyway and let the typed views take over (as now).
- [ ] Hide "Scratch" (remove the tab and the `scratch` branch of the upload page; leave `/editor` reachable for
      a blank canvas via the editor's own "new" path only if something still links to it, otherwise delete).
- [ ] Remove the "load existing by ID" mode from the page if it is unreachable (`"existing"` has no tab today).
- **Q** What does "public" mean? The backend has two separate things:
  `visibility` ("public" = listed in the open repository, default "private" in the DB) and
  `is_published` / `public_slug` (the `/p/<slug>` link). Suggest: **Public** = set `visibility: "public"` and
  publish (so the diagram gets a `/p/<slug>` link); **Private** = neither. Confirm, or say if you want
  them separate.
- **Q** "Markdown" here: is it the Mermaid text we accept today (`/parse-mermaid`, flowcharts only)? Or should
  it also take Arboretum-style text input for trees, lists, and arrays (needs the Mermaid/Graphviz parsers from
  Arboretum, not brought over yet)? Suggest: Mermaid first, label the button "Edit markdown (Mermaid)", and add
  type-specific input as a follow-up.

## 4. Markdown editor with live visual

New view reached from Create. Two panes, side by side on wide screens, stacked on narrow ones.

- Left: the text editor (monospace textarea, label, syntax help link to mermaid.js.org).
- Right: the generated visual (read-only `ReactFlowViewer`), updating as the text changes.
- [ ] Reuse `layoutWithDagre` (currently duplicated in `DiagramUpload.tsx` and `MermaidUploadEditor.tsx`; move to
      one shared module in `src/lib/`).
- [ ] Debounce (about 500 ms) calls to `POST /parse-mermaid`; show "Updating…" and keep the last good visual while
      a parse fails, with the error shown under the text box (`role="alert"`).
- [ ] Accessibility: the visual pane is `aria-live="off"`, with a visible text summary above it ("5 nodes, 6
      edges") that is announced politely, so screen reader users get feedback without the diagram re-announcing.
- [ ] A **Save and continue** button creates the record (title, type, visibility, Mermaid text) and opens the
      editor at `/editor/:id`.
- [ ] Mark the typed Arboretum view for non-flowchart types in the preview if the type is not Flowchart
      (so the preview matches what viewers will get).
- **Q** Preview pane: show the flowchart graph only, or the same representation browser viewers see
  (summary, navigable, table, tactile)? Suggest the graph only at first; it is cheaper and updates faster.

## 5. Dashboard

Stay as is, plus search by title.

- [ ] Search already matches title, ID, and slug in code (`Dashboard.tsx`, `hay` string). What is missing is the
      label: the placeholder in `DashboardToolbar.tsx` still says "Flowchart ID or public slug". Change it to
      "Title, ID, or public slug".
- [ ] Verify with a real list that a title with mixed case or extra spaces matches (`toLowerCase` and `trim`
      are applied today).
- [ ] Rename "No flowcharts match your filters." and similar copy if the type filter or wording changes.

## Order of work

1. Wording and nav (sections 1, 2). Small and low risk.
2. Dashboard search label (5).
3. Create page without markdown (3), with Upload image wired to the existing job.
4. Markdown editor with live visual (4).
5. Remove Scratch and dead code, update CHANGELOG, README, and `ACCESSIBILITY.md` if flows change.

## Out of scope for this pass

- Arboretum Mermaid/Graphviz typed-input parsers, share/embed pages, "ordering" output.
- Changing how uploads detect diagram type.
- Merging to `main` (needs your go-ahead; merging auto-deploys the public site).

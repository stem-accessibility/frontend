# Changelog

All notable changes to the frontend. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries that change the
API contract name the matching backend release.

## [Unreleased]

### Added
- Diagram types: flowchart, tree, binary tree, linked list, array and 2D array, chosen in the editor
  toolbar and stored as `flowchart_type`. The type decides which representations are offered (and
  which comes first) and which renderer draws them.
- Arboretum (https://github.com/ritesh-kanchi/Arboretum, MIT) as a submodule at `vendor/arboretum`,
  with its tree layout, intermediate representation and braille generation imported through
  `src/arboretum/vendor.ts`. Navigable, table and tactile views for data structures follow its designs.
- "Describe without AI": deterministic alt text and long description for any diagram type
  (`src/arboretum/autoDescription.ts`).
- Warnings when a diagram does not look like its chosen type.
- Credits for Arboretum in the footer, README, LICENSE and About page.

### Changed
- Public and permalink pages share one `RepresentationBrowser`; tactile output uses braille labels
  for data structures with short labels and the numbered key otherwise.
- `verbatimModuleSyntax` is off so the vendored library type-checks.

### Fixed
- The editor no longer crashes on diagrams whose edges have no `id`.

### Fixed
- Automatically generated alt text and long description are now saved right after generation.
  Before, they existed only in the open page and were lost (and regenerated) on every reload.

### Added
- Editor toolbar: **Alt text** button (reads "Alt text (missing)" when empty) opens the accessibility
  editor, where alt text is generated or edited.
- "Alt text" option in the "Choose a representation" menu (published pages and permalinks): shows
  the short alt text on its own, with a copy button.

### Added
- `VITE_AUTH_MODE=dev`: run locally without a Supabase project (pairs with backend `AUTH_MODE=dev`;
  ignored in production builds).

### Changed
- Editor: a diagram with no alt text or long description now gets one automatic generation when it
  is opened (previously only the "Generate / Regenerate" button did).
- Home page: "Request a pilot" replaced by "Upload a diagram" for signed-in users and
  "Log in or sign up to upload" for everyone else.
- Contact address is now `stem-accessibility@uw.edu` (footer, login footnote, pilot button,
  ACCESSIBILITY.md).

### Changed
- Product name shown to users is now "STEM-Accessibility" (was "AccessFlow"): page title, header,
  footer, copy, README and ACCESSIBILITY.md. Internal identifiers (the `/p/` permalink host,
  export file names, the `accessflow` anchor id) are unchanged.

### Added
- `ACCESSIBILITY.md`: accessibility commitments, contributor expectations and issue-reporting
  process (adapted from the Open Source Accessibility Toolkit template).

## [0.2.0] — 2026-10-11

First public release. History was squashed to a single commit; 0.1.x tags were removed.

### Added
- `LICENSE` (University of Washington).
- Footer: contact email, source-code link and a "Submit an issue" button.

### Removed
- Study diary page (`/diary`) and its embedded Google Form.
- Google Form links: the "Request a pilot" button and login footnote now point to
  `stem-accessibility@uw.edu`. The footer's personal email was replaced with it too.

## [0.1.1] — 2026-10-11

### Added
- Sign up and password reset are available again on `/login` (the Log in / Sign up /
  Forgot tabs had been commented out). Registration is open; to close it, turn off
  "Allow new users to sign up" in Supabase.

## [0.1.0] — 2026-10-11

Deployed on Vercel against backend 0.1.0.

### Changed
- Upload page sends the Supabase access token on `/jobs/process-upload` and job
  polling (the backend now requires a login for `/jobs/*`).
- README documents local run, env vars and the Vercel deploy.

### Removed
- Tracked `.env` (it held values for a deleted Supabase project); use
  `.env.local` — see `.env.example`.

## 0.0.0 — 2026-10-11
Snapshot of `stem-accessibility/grafari` at `main`, without history.

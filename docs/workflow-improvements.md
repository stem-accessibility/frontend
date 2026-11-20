# Workflow improvements (frontend)

The recommendations for organizing both repositories are in the backend repository:
[`docs/workflow-improvements.md`](https://github.com/stem-accessibility/backend/blob/main/docs/workflow-improvements.md).
They cover:

- a merge order for the open pull requests;
- CI and branch protection;
- changelog fragments;
- `CONTRIBUTING.md` and a PR template;
- `CODEOWNERS`;
- issues before non-trivial work;
- database migration rules;
- accessibility checks in CI;
- one canonical pair of repositories;
- AI-assisted pull requests;
- private security reports;
- dependency updates;
- the decisions maintainers need to make.

The parts that concern this repository most:

- **CI first.** `main` had 179 lint errors and a lockfile out of step with `package.json`, so
  every pull request inherited failures. Merge the CI pull request (#7) before the others, then
  require it to pass on `main`.
- **Changelog conflicts.** Every pull request adds lines at the top of the same `CHANGELOG.md`
  section, so after the first merge the others conflict. The recommendation is one fragment file
  per pull request in `changelog.d/`, merged into `CHANGELOG.md` at release.
- **Accessibility checks in CI.** Reviewers keep asking for the same things: `role="status"` and
  `role="alert"`, visible focus rings, contrast, and nothing focusable inside `aria-hidden`.
  Running `e2e/a11y.mjs` (axe) and the contrast test in CI, against a build with the backend
  mocked, would catch these before review.

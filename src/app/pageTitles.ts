import { matchPath } from "react-router-dom";

/**
 * Page titles (WCAG 2.2 SC 2.4.2 Page Titled). This is a single-page app, so without these every
 * route kept the <title> from index.html, and screen reader users heard the same title on every page.
 * Titles put the page first and the site last, so the part that changes is heard first.
 */
export const SITE_NAME = "STEM-Accessibility";

/** Same as the <title> in index.html. */
export const HOME_TITLE = "STEM-Accessibility: make STEM images accessible";

export function formatPageTitle(page: string): string {
  return `${page} | ${SITE_NAME}`;
}

// Keep in step with the routes in AppRoutes.tsx. Redirect-only routes are listed too, so the
// title is right for the moment before the redirect.
const ROUTE_TITLES: ReadonlyArray<readonly [pattern: string, title: string]> = [
  ["/about", "About"],
  ["/charts", "Charts"],
  ["/charts/:slug", "Shared chart"],
  ["/guidance", "Alt text guidance"],
  ["/login", "Log in or sign up"],
  ["/auth/callback", "Signing in"],
  ["/browse", "Browse public STEM images"],
  ["/examples", "Browse public STEM images"],
  ["/try", "Try it"],
  ["/grafari", "Grafari playground"],
  ["/viz/:id", "Visualization results"],
  ["/ld", "Long description builder"],
  ["/ld/:slug", "Long description"],
  ["/p/:public_slug", "Shared STEM image"],
  ["/p/:public_slug/json", "STEM image data (JSON)"],
  ["/dashboard", "My STEM images"],
  ["/account", "Account"],
  ["/upload", "Create a STEM image"],
  ["/create/markdown", "Create a STEM image"],
  ["/create", "Create a STEM image"],
  ["/editor", "STEM image editor"],
  ["/editor/:id", "STEM image editor"],
  ["/flowchart/:id", "STEM image"],
  ["/flowchart/:id/json", "STEM image data (JSON)"],
];

export const NOT_FOUND_TITLE = formatPageTitle("Page not found");

/** The document title for a route, from its path alone. Pages may refine it once their data loads. */
export function pageTitleFor(pathname: string): string {
  if (matchPath({ path: "/", end: true }, pathname)) return HOME_TITLE;
  for (const [pattern, title] of ROUTE_TITLES) {
    if (matchPath({ path: pattern, end: true }, pathname)) return formatPageTitle(title);
  }
  return NOT_FOUND_TITLE;
}

import { describe, expect, it } from "vitest";
import indexHtml from "../../index.html?raw";
import appRoutesSource from "./AppRoutes.tsx?raw";
import { HOME_TITLE, NOT_FOUND_TITLE, formatPageTitle, pageTitleFor } from "./pageTitles";

describe("pageTitleFor", () => {
  it("keeps the home page's title from index.html", () => {
    expect(indexHtml).toContain(`<title>${HOME_TITLE}</title>`);
    expect(pageTitleFor("/")).toBe(HOME_TITLE);
  });

  it("names the page first and the site last", () => {
    expect(pageTitleFor("/about")).toBe("About | STEM-Accessibility");
    expect(pageTitleFor("/browse")).toBe(formatPageTitle("Browse public STEM images"));
    expect(pageTitleFor("/try")).toBe(formatPageTitle("Try it"));
  });

  it("matches routes with parameters and tells nested routes apart", () => {
    expect(pageTitleFor("/p/25db9b236623")).toBe(formatPageTitle("Shared STEM image"));
    expect(pageTitleFor("/p/25db9b236623/json")).toBe(formatPageTitle("STEM image data (JSON)"));
    expect(pageTitleFor("/editor/abc")).toBe(formatPageTitle("STEM image editor"));
  });

  it("allows a trailing slash", () => {
    expect(pageTitleFor("/about/")).toBe(formatPageTitle("About"));
  });

  it("says when a page does not exist", () => {
    expect(pageTitleFor("/doesnotexist")).toBe(NOT_FOUND_TITLE);
    expect(pageTitleFor("/about/extra")).toBe(NOT_FOUND_TITLE);
  });

  it("has a title for every route in AppRoutes.tsx", () => {
    const paths = [...appRoutesSource.matchAll(/path="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== "*");
    expect(paths.length).toBeGreaterThan(10);
    for (const path of paths) {
      // Fill in parameters so the path is a real URL.
      const url = path.replace(/:[A-Za-z_]+/g, "x");
      expect(pageTitleFor(url), `no title for ${path}`).not.toBe(NOT_FOUND_TITLE);
    }
  });
});

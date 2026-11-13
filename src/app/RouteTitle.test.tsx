// @vitest-environment jsdom
// The document title follows the route, and a page can name itself once its data loads.
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import RouteTitle from "./RouteTitle";
import { useDocumentTitle } from "../lib/useDocumentTitle";

afterEach(cleanup);

function SharedImage({ title }: { title: string | null }) {
  useDocumentTitle(title ? `${title} | STEM-Accessibility` : null);
  return <p>shared image</p>;
}

function renderAt(path: string, imageTitle: string | null = null) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RouteTitle />
      <Routes>
        <Route path="/" element={<Link to="/about">About</Link>} />
        <Route path="/about" element={<Link to="/nowhere">Broken link</Link>} />
        <Route path="/p/:public_slug" element={<SharedImage title={imageTitle} />} />
        <Route path="*" element={<p>not found</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("RouteTitle", () => {
  it("changes the title on every navigation", async () => {
    const user = userEvent.setup();
    renderAt("/");
    expect(document.title).toBe("STEM-Accessibility: make STEM images accessible");

    await user.click(screen.getByRole("link", { name: "About" }));
    expect(document.title).toBe("About | STEM-Accessibility");

    await user.click(screen.getByRole("link", { name: "Broken link" }));
    expect(document.title).toBe("Page not found | STEM-Accessibility");
  });

  it("lets a page replace the route's title with its own", () => {
    renderAt("/p/abc", "Class assignment");
    expect(document.title).toBe("Class assignment | STEM-Accessibility");
  });

  it("keeps the route's title while the page has no title of its own", () => {
    renderAt("/p/abc", null);
    expect(document.title).toBe("Shared STEM image | STEM-Accessibility");
  });
});

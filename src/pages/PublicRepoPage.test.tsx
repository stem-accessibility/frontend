// @vitest-environment jsdom
// /browse: while the list is loading it must say so (not "No matches"), a failed or stalled
// request offers "Try again", and the request is sent with a timeout so it cannot hang forever.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../lib/api", () => ({ publicFetch: vi.fn() }));
// The thumbnail loads lazily with IntersectionObserver, which jsdom does not have.
vi.mock("../components/dashboard/FlowchartThumbnail", () => ({ default: () => null }));

import { publicFetch } from "../lib/api";
import PublicRepoPage from "./PublicRepoPage";

afterEach(() => {
  cleanup();
  vi.mocked(publicFetch).mockReset();
});

function renderBrowse() {
  return render(
    <MemoryRouter initialEntries={["/browse"]}>
      <PublicRepoPage />
    </MemoryRouter>
  );
}

const row = {
  flowchart_id: "1",
  title: "Class assignment",
  flowchart_type: "flowchart",
  has_image: false,
  is_published: true,
  public_slug: "abc",
};

describe("PublicRepoPage", () => {
  it("shows a loading state, not 'No matches', while the list is loading", async () => {
    vi.mocked(publicFetch).mockReturnValue(new Promise(() => {}));
    renderBrowse();

    expect(await screen.findByText("Loading public STEM images…")).toBeTruthy();
    expect(screen.queryByText("No matches")).toBeNull();
    expect(screen.queryByText(/Try a different search/)).toBeNull();
  });

  it("asks for the list with a timeout", async () => {
    vi.mocked(publicFetch).mockReturnValue(new Promise(() => {}));
    renderBrowse();

    expect(publicFetch).toHaveBeenCalledWith(
      "/repo",
      expect.objectContaining({ timeoutMs: expect.any(Number) })
    );
  });

  it("explains a timeout and loads the list again on 'Try again'", async () => {
    vi.mocked(publicFetch)
      .mockRejectedValueOnce(new DOMException("signal is aborted without reason", "AbortError"))
      .mockResolvedValueOnce([row]);
    const user = userEvent.setup();
    renderBrowse();

    expect(await screen.findByText(/The server did not answer in time/)).toBeTruthy();
    expect(screen.queryByText("No matches")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    // The button goes away while reloading; focus stays in the list instead of the page top.
    expect(document.activeElement).toBe(screen.getByRole("region", { name: "Public STEM images" }));

    expect(await screen.findByText("Class assignment")).toBeTruthy();
    expect(screen.getByText("Showing 1 of 1 STEM image")).toBeTruthy();
    expect(publicFetch).toHaveBeenCalledTimes(2);
  });

  it("still says 'No matches' when a search finds nothing", async () => {
    vi.mocked(publicFetch).mockResolvedValue([row]);
    const user = userEvent.setup();
    renderBrowse();

    await screen.findByText("Class assignment");
    await user.type(screen.getByPlaceholderText(/Search title/), "zzz");

    expect(screen.getByText("No matches for “zzz”")).toBeTruthy();
  });
});

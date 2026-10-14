// @vitest-environment jsdom
// Renders the real panel with the network helpers replaced. Checks what a person is shown and what
// is sent, and runs axe over the rendered markup. (axe cannot judge colour contrast in jsdom; that
// is covered by the browser pass in e2e/a11y.mjs.)
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";

vi.mock("../../lib/api", () => ({
  apiFetch: vi.fn(),
  apiUpload: vi.fn(),
  publicFetch: vi.fn(),
}));
vi.mock("../../lib/guest", () => ({ guestFetch: vi.fn() }));

import { apiFetch, apiUpload, publicFetch } from "../../lib/api";
import { guestFetch } from "../../lib/guest";
import { ChartImageUploadPanel, type ChartExtractionResult } from "./ChartImageUploadPanel";

const RESULT: ChartExtractionResult = {
  dataset: { columns: ["Region", "Units"], rows: [{ Region: "North", Units: 21 }] },
  config: { preset: "bar", title: null, xLabel: null, yLabel: null },
  spec: null,
  extractor: "unichart",
  sent_to_ai_model: false,
  values_are_estimated: false,
  warnings: [],
};

const png = () => new File([new Uint8Array([137, 80, 78, 71])], "chart.png", { type: "image/png" });

function optionsAre(o: { local: boolean; llm: boolean; mode: string }) {
  vi.mocked(publicFetch).mockResolvedValue(o);
}

async function choosePicture(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(await screen.findByLabelText(/Choose a chart image/), png());
}

beforeEach(() => {
  vi.mocked(apiFetch).mockResolvedValue({ status: "done", result: RESULT, error: null });
  vi.mocked(apiUpload).mockResolvedValue({ job_id: 7 });
  vi.mocked(guestFetch).mockResolvedValue(RESULT);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ChartImageUploadPanel", () => {
  it("signed in: the AI choice is a labelled group, nothing is preselected, and reading waits for it", async () => {
    optionsAre({ local: true, llm: true, mode: "unichart" });
    const user = userEvent.setup();
    render(<ChartImageUploadPanel signedIn onExtracted={vi.fn()} />);
    await choosePicture(user);

    const group = await screen.findByRole("group", { name: "How should this chart be read?" });
    const radios = screen.getAllByRole("radio");
    expect(group).toBeTruthy();
    expect(radios).toHaveLength(2);
    expect(radios.every((r) => !(r as HTMLInputElement).checked)).toBe(true);
    // The notice is tied to every choice, so it is read with each one.
    for (const r of radios) expect(r.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText(/may not be private/)).toBeTruthy();

    const read = screen.getByRole("button", { name: "Read chart" }) as HTMLButtonElement;
    expect(read.disabled).toBe(true);
    expect(screen.getByText("Choose how to read the chart to continue.")).toBeTruthy();
  });

  it("sends allow_llm=false when the built-in reader only is chosen", async () => {
    optionsAre({ local: true, llm: true, mode: "unichart" });
    const onExtracted = vi.fn();
    const user = userEvent.setup();
    render(<ChartImageUploadPanel signedIn onExtracted={onExtracted} />);
    await choosePicture(user);
    await user.click(await screen.findByRole("radio", { name: /Built-in reader only/ }));
    await user.click(screen.getByRole("button", { name: "Read chart" }));

    await waitFor(() => expect(onExtracted).toHaveBeenCalledTimes(1));
    const [path, form] = vi.mocked(apiUpload).mock.calls[0];
    expect(path).toBe("/jobs/extract-chart");
    expect((form as FormData).get("allow_llm")).toBe("false");
  });

  it("sends allow_llm=true only after the AI model is chosen", async () => {
    optionsAre({ local: true, llm: true, mode: "unichart" });
    const user = userEvent.setup();
    render(<ChartImageUploadPanel signedIn onExtracted={vi.fn()} />);
    await choosePicture(user);
    await user.click(await screen.findByRole("radio", { name: /and the AI model when/ }));
    await user.click(screen.getByRole("button", { name: "Read chart" }));

    await waitFor(() => expect(apiUpload).toHaveBeenCalled());
    const [, form] = vi.mocked(apiUpload).mock.calls[0];
    expect((form as FormData).get("allow_llm")).toBe("true");
  });

  it("offers a way to decline when only the AI model exists, and declining reads nothing", async () => {
    optionsAre({ local: false, llm: true, mode: "llm" });
    const user = userEvent.setup();
    render(<ChartImageUploadPanel signedIn onExtracted={vi.fn()} />);
    await choosePicture(user);
    await user.click(await screen.findByRole("radio", { name: /Do not use the AI model/ }));

    expect((screen.getByRole("button", { name: "Read chart" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Use the CSV upload below/)).toBeTruthy();
    expect(apiUpload).not.toHaveBeenCalled();
  });

  it("guest: no AI choice at all, the guest route is used and no allow_llm is sent", async () => {
    optionsAre({ local: true, llm: true, mode: "unichart" });
    const onExtracted = vi.fn();
    const user = userEvent.setup();
    render(<ChartImageUploadPanel signedIn={false} onExtracted={onExtracted} />);
    await choosePicture(user);

    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByRole("group")).toBeNull();
    expect(screen.queryByText(/Gemini/)).toBeNull();

    await user.click(screen.getByRole("button", { name: "Read chart" }));
    await waitFor(() => expect(onExtracted).toHaveBeenCalledTimes(1));
    const [path, init] = vi.mocked(guestFetch).mock.calls[0];
    expect(path).toBe("/guest/extract-chart");
    expect(((init as RequestInit).body as FormData).has("allow_llm")).toBe(false);
    expect(apiUpload).not.toHaveBeenCalled();
  });

  it("guest with only the AI model configured is told it is unavailable and given the CSV route", async () => {
    optionsAre({ local: false, llm: true, mode: "llm" });
    render(<ChartImageUploadPanel signedIn={false} onExtracted={vi.fn()} />);
    expect(await screen.findByText(/not available right now/)).toBeTruthy();
    expect(screen.queryByLabelText(/Choose a chart image/)).toBeNull();
  });

  it("announces a failure to the person and keeps the button usable", async () => {
    optionsAre({ local: true, llm: false, mode: "unichart" });
    vi.mocked(guestFetch).mockRejectedValue(new Error("400 BAD REQUEST: not a chart"));
    const user = userEvent.setup();
    render(<ChartImageUploadPanel signedIn={false} onExtracted={vi.fn()} />);
    await choosePicture(user);
    await user.click(screen.getByRole("button", { name: "Read chart" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("not a chart");
    expect((screen.getByRole("button", { name: "Read chart" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("has no axe violations with the choice shown (colour contrast is checked in the browser)", async () => {
    optionsAre({ local: true, llm: true, mode: "unichart" });
    const user = userEvent.setup();
    const { container } = render(<ChartImageUploadPanel signedIn onExtracted={vi.fn()} />);
    await choosePicture(user);
    await screen.findByRole("group");

    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(
      result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)
    ).toEqual([]);
  });
});

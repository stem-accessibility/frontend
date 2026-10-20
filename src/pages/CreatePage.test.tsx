// @vitest-environment jsdom
// The chart branch of /create: pick "Chart", name it, Upload turns on, and a CSV or a picture is
// chosen and handed to the chart tool. Nothing is read or sent from this page.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import axe from "axe-core";

vi.mock("../lib/api", () => ({ apiFetch: vi.fn(), apiUpload: vi.fn(), publicFetch: vi.fn() }));
vi.mock("../lib/logResearchEvent", () => ({ logResearchEvent: vi.fn() }));
// Who is signed in is decided per test.
let signedIn = true;
vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({ user: signedIn ? { email: "a@example.org" } : null }),
}));

import { apiUpload, publicFetch } from "../lib/api";
import CreatePage from "./CreatePage";

function ChartsProbe() {
  const { state } = useLocation() as {
    state: { title?: string; file?: File; choice?: string } | null;
  };
  return (
    <p>
      charts: title={state?.title ?? "none"} file={state?.file?.name ?? "none"} choice=
      {state?.choice ?? "none"}
    </p>
  );
}

/** What the server says it can read charts with. */
function readersAre(o: { local: boolean; llm: boolean; mode: string }) {
  vi.mocked(publicFetch).mockResolvedValue(o);
}

beforeEach(() => {
  signedIn = true;
  readersAre({ local: true, llm: false, mode: "unichart" });
});

function renderCreate() {
  return render(
    <MemoryRouter initialEntries={["/create"]}>
      <Routes>
        <Route path="/create" element={<CreatePage />} />
        <Route path="/charts" element={<ChartsProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

const csv = () => new File(["name,value\nA,1\nB,2\n"], "data.csv", { type: "text/csv" });
const png = () => new File([new Uint8Array([137, 80, 78, 71])], "chart.png", { type: "image/png" });

async function chooseChart(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText("Image type"), "chart");
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("/create: Chart", () => {
  it("keeps the menu entry plain and turns Upload on only once there is a name", async () => {
    const user = userEvent.setup();
    renderCreate();
    expect(screen.getByRole("option", { name: "Chart" })).toBeTruthy();
    await chooseChart(user);

    const upload = screen.getByRole("button", { name: "Upload" }) as HTMLButtonElement;
    expect(upload.disabled).toBe(true);
    expect(screen.getByText(/Enter a name to enable Upload/)).toBeTruthy();

    await user.type(screen.getByLabelText("Name"), "Sales");
    expect(upload.disabled).toBe(false);
    expect(screen.queryByText(/Enter a name to enable Upload/)).toBeNull();
    // The chart tool can still be opened without a name or a file.
    expect(screen.getByRole("button", { name: "Open chart tool" })).toBeTruthy();
  });

  it("Upload opens a file chooser that is announced as expanded, and Continue waits for a file", async () => {
    const user = userEvent.setup();
    renderCreate();
    await chooseChart(user);
    await user.type(screen.getByLabelText("Name"), "Sales");
    const upload = screen.getByRole("button", { name: "Upload" });
    expect(upload.getAttribute("aria-expanded")).toBe("false");

    await user.click(upload);
    expect(upload.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByLabelText("CSV file or picture of a chart")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Continue to the chart tool" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Choose a CSV file or a picture to continue.")).toBeTruthy();
  });

  it("a CSV is handed to the chart tool with the name", async () => {
    const user = userEvent.setup();
    renderCreate();
    await chooseChart(user);
    await user.type(screen.getByLabelText("Name"), "Sales");
    await user.click(screen.getByRole("button", { name: "Upload" }));
    await user.upload(screen.getByLabelText("CSV file or picture of a chart"), csv());

    expect(screen.getByText("data.csv")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Continue to the chart tool" }));
    expect(await screen.findByText(/charts: title=Sales file=data\.csv choice=none/)).toBeTruthy();
  });

  it("a picture is handed over the same way, and nothing is sent from this page", async () => {
    const user = userEvent.setup();
    renderCreate();
    await chooseChart(user);
    await user.type(screen.getByLabelText("Name"), "Rainfall");
    await user.click(screen.getByRole("button", { name: "Upload" }));
    await user.upload(screen.getByLabelText("CSV file or picture of a chart"), png());
    // Signed in, so the page first finds out what can read a picture; Extract turns on after that.
    const go = (await screen.findByRole("button", { name: "Extract" })) as HTMLButtonElement;
    await waitFor(() => expect(go.disabled).toBe(false));
    await user.click(go);

    // No AI model is configured here, so there is nothing to decide: Extract alone, no choice sent.
    expect(await screen.findByText(/charts: title=Rainfall file=chart\.png choice=none/)).toBeTruthy();
    expect(apiUpload).not.toHaveBeenCalled();
  });

  async function chooseAPicture(user: ReturnType<typeof userEvent.setup>) {
    await chooseChart(user);
    await user.type(screen.getByLabelText("Name"), "Rainfall");
    await user.click(screen.getByRole("button", { name: "Upload" }));
    await user.upload(screen.getByLabelText("CSV file or picture of a chart"), png());
  }

  it("with the AI model on offer, a picture gets Extract and Extract with AI support instead of Continue", async () => {
    readersAre({ local: true, llm: true, mode: "unichart" });
    const user = userEvent.setup();
    renderCreate();
    await chooseAPicture(user);

    expect(await screen.findByRole("button", { name: "Extract with AI support" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Extract" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Continue to the chart tool" })).toBeNull();
    // Nothing has been sent or chosen yet.
    expect(apiUpload).not.toHaveBeenCalled();
  });

  it("both buttons are described by the notice that says where the picture goes", async () => {
    readersAre({ local: true, llm: true, mode: "unichart" });
    const user = userEvent.setup();
    renderCreate();
    await chooseAPicture(user);

    for (const name of ["Extract with AI support", "Extract"]) {
      const button = await screen.findByRole("button", { name });
      const notice = document.getElementById(button.getAttribute("aria-describedby") ?? "");
      expect(notice?.textContent).toMatch(/Gemini, through OpenRouter/);
      expect(notice?.textContent).toMatch(/may not be private/);
      expect(notice?.textContent).toMatch(/only when the built-in reader is not sure/);
    }
  });

  it("Extract with AI support hands the picture over with choice=ai", async () => {
    readersAre({ local: true, llm: true, mode: "unichart" });
    const user = userEvent.setup();
    renderCreate();
    await chooseAPicture(user);
    await user.click(await screen.findByRole("button", { name: "Extract with AI support" }));
    expect(await screen.findByText(/charts: title=Rainfall file=chart\.png choice=ai/)).toBeTruthy();
  });

  it("Extract, with the AI model on offer, hands the picture over with choice=local", async () => {
    readersAre({ local: true, llm: true, mode: "unichart" });
    const user = userEvent.setup();
    renderCreate();
    await chooseAPicture(user);
    await user.click(await screen.findByRole("button", { name: "Extract" }));
    expect(await screen.findByText(/charts: title=Rainfall file=chart\.png choice=local/)).toBeTruthy();
  });

  it("when only the AI model exists there is no Extract button and the notice says so", async () => {
    readersAre({ local: false, llm: true, mode: "llm" });
    const user = userEvent.setup();
    renderCreate();
    await chooseAPicture(user);

    expect(await screen.findByRole("button", { name: "Extract with AI support" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Extract" })).toBeNull();
    expect(screen.queryByText(/tries the built-in reader first/)).toBeNull();
  });

  it("a guest gets Extract only, never the AI button, whatever the server has", async () => {
    signedIn = false;
    readersAre({ local: true, llm: true, mode: "unichart" });
    const user = userEvent.setup();
    renderCreate();
    await chooseAPicture(user);

    expect(await screen.findByRole("button", { name: "Extract" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Extract with AI support" })).toBeNull();
    expect(screen.getByText(/not sent to a third party/)).toBeTruthy();
  });

  it("a CSV has nothing to extract: Continue only, even when the AI model is on offer", async () => {
    readersAre({ local: true, llm: true, mode: "unichart" });
    const user = userEvent.setup();
    renderCreate();
    await chooseChart(user);
    await user.type(screen.getByLabelText("Name"), "Sales");
    await user.click(screen.getByRole("button", { name: "Upload" }));
    await user.upload(screen.getByLabelText("CSV file or picture of a chart"), csv());

    expect(screen.getByRole("button", { name: "Continue to the chart tool" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Extract" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Extract with AI support" })).toBeNull();
  });

  it("if what is on offer cannot be found out, a picture still gets Extract, and no AI button", async () => {
    vi.mocked(publicFetch).mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    renderCreate();
    await chooseAPicture(user);
    const go = (await screen.findByRole("button", { name: "Extract" })) as HTMLButtonElement;
    await waitFor(() => expect(go.disabled).toBe(false));
    expect(screen.queryByRole("button", { name: "Extract with AI support" })).toBeNull();
  });

  it("another kind of file is refused with a message, and Continue stays off", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderCreate();
    await chooseChart(user);
    await user.type(screen.getByLabelText("Name"), "Sales");
    await user.click(screen.getByRole("button", { name: "Upload" }));
    await user.upload(
      screen.getByLabelText("CSV file or picture of a chart"),
      new File(["x"], "notes.pdf", { type: "application/pdf" })
    );

    expect((await screen.findByRole("alert")).textContent).toMatch(/notes\.pdf is not a CSV file or a PNG, JPEG or WebP picture/);
    expect((screen.getByRole("button", { name: "Continue to the chart tool" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("Open chart tool still goes straight there with just the name", async () => {
    const user = userEvent.setup();
    renderCreate();
    await chooseChart(user);
    await user.type(screen.getByLabelText("Name"), "Sales");
    await user.click(screen.getByRole("button", { name: "Open chart tool" }));
    expect(await screen.findByText(/charts: title=Sales file=none choice=none/)).toBeTruthy();
  });

  it("the file chooser is fully described and has no axe violations (colour contrast is checked in the browser)", async () => {
    const user = userEvent.setup();
    const { container } = renderCreate();
    await chooseChart(user);
    await user.type(screen.getByLabelText("Name"), "Sales");
    await user.click(screen.getByRole("button", { name: "Upload" }));
    await user.upload(screen.getByLabelText("CSV file or picture of a chart"), csv());

    // The privacy explanation is attached to the file field, so it is read with it.
    const input = screen.getByLabelText("CSV file or picture of a chart");
    const help = document.getElementById(input.getAttribute("aria-describedby") ?? "");
    expect(help?.textContent).toMatch(/only happens if you choose it/);

    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(
      result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)
    ).toEqual([]);
  });
});

// @vitest-environment jsdom
// A CSV chosen on /create arrives as a file prop and is read once when the panel first shows.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { CsvUploadPanel } from "./CsvUploadPanel";

afterEach(cleanup);

describe("CsvUploadPanel with a file handed over", () => {
  it("reads it once and announces the result", async () => {
    const onLoaded = vi.fn();
    const file = new File(["name,value\nA,1\nB,2\n"], "data.csv", { type: "text/csv" });
    render(<CsvUploadPanel onDatasetLoaded={onLoaded} initialFile={file} />);

    await waitFor(() => expect(onLoaded).toHaveBeenCalledTimes(1));
    expect(onLoaded.mock.calls[0][0].rows).toHaveLength(2);
    expect(screen.getByRole("status").textContent).toMatch(/Loaded 2 rows and 2 columns from data\.csv/);
  });

  it("reads nothing when no file is handed over", () => {
    const onLoaded = vi.fn();
    render(<CsvUploadPanel onDatasetLoaded={onLoaded} />);
    expect(onLoaded).not.toHaveBeenCalled();
  });
});

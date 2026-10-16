// Browser end-to-end test of chart image upload on /charts: a real picture goes through the page,
// the backend and the built-in reader (UniChart), and the table appears.
//
// Needs the whole local stack (see e2e/smoke.mjs for the first two):
//   reader:   backend/services/unichart:  UNICHART_ALLOW_NO_TOKEN=1 python app.py   (port 5060)
//   backend:  AUTH_MODE=dev AUTO_CREATE_TABLES=1 DATABASE_URL=sqlite:///e2e.sqlite RUN_JOBS_INLINE=1 \
//             UNICHART_URL=http://127.0.0.1:5060 CORS_ORIGINS=http://localhost:<vite-port> \
//             FLASK_APP=backend.app_factory:create_app flask run --port 4999
//   frontend: VITE_AUTH_MODE=dev VITE_API_URL=http://localhost:4999 npm run dev
// Then:  npm run test:e2e:chart
// Env: FRONTEND_URL (default http://localhost:5173), CHROME_PATH (default: macOS Chrome),
//      CHART_TIMEOUT_MS (default 180000: the first read after the reader starts loads the model).
// It never chooses the AI model, so nothing is sent to a third party. It creates jobs in whatever
// database the backend uses, so point the backend at a throwaway SQLite file.
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TIMEOUT = Number(process.env.CHART_TIMEOUT_MS || 180000);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// Pictures with known answers (the project's evaluation set and the first test picture).
const CASES = [
  { name: "single-series bar", file: "barchart.png", rows: 8, cols: 2, warning: false },
  {
    name: "two-series grouped bar",
    file: "tmp/chart-eval/data/synth/grouped_0.png",
    rows: 4,
    cols: 3,
    warning: true, // the reader flags several series as possibly incomplete
  },
];

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `  -> ${detail}`}`);
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const pageErrors = [];
try {
  for (const c of CASES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    page.on("pageerror", (e) => pageErrors.push(`${c.name}: ${String(e)}`));

    // Record what the page sends, to prove the AI model was not requested.
    const uploads = [];
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (req.method() === "POST" && /extract-chart/.test(req.url())) {
        uploads.push(req.postData() || "");
      }
      req.continue();
    });

    await page.goto(FRONTEND + "/charts", { waitUntil: "networkidle0" });
    const input = await page.waitForSelector('input[type="file"][accept*="image/png"]', { timeout: 10000 }).catch(() => null);
    check(`${c.name}: the chart image panel is offered`, !!input, "no file input; is the backend reachable and CORS set for this port?");
    if (!input) {
      await page.close();
      continue;
    }

    await input.uploadFile(path.join(ROOT, c.file));

    // With the AI model on offer the page needs a choice. Pick the built-in reader only.
    const local = await page.$('input[type="radio"][value="local"]');
    if (await page.$('input[type="radio"]')) {
      check(`${c.name}: the built-in reader is offered`, !!local, "start the backend with UNICHART_URL");
      if (!local) {
        await page.close();
        continue;
      }
      await local.click();
    }

    const [read] = await page.$$("xpath/.//button[normalize-space()='Read chart']");
    check(`${c.name}: Read chart is enabled`, read && !(await read.evaluate((b) => b.disabled)));
    if (!read) {
      await page.close();
      continue;
    }
    await read.click();

    const outcome = await page
      .waitForFunction(
        () => {
          const err = document.querySelector('[role="alert"]');
          if (err && err.textContent.trim()) return "error: " + err.textContent.trim();
          const st = document.querySelector('[role="status"]');
          if (st && /^Read \d+/.test(st.textContent.trim())) return "ok: " + st.textContent.trim();
          return false;
        },
        { timeout: TIMEOUT, polling: 500 }
      )
      .then((h) => h.jsonValue())
      .catch(() => "timeout");
    check(`${c.name}: the chart was read`, String(outcome).startsWith("ok"), String(outcome));
    if (!String(outcome).startsWith("ok")) {
      await page.close();
      continue;
    }

    const status = String(outcome);
    check(`${c.name}: the status says the image was not sent to a third party`, /built-in reader/.test(status) && /not sent to a third party/.test(status), status);
    const m = status.match(/Read (\d+) rows? and (\d+) columns?/);
    check(`${c.name}: ${c.rows} rows and ${c.cols} columns announced`, m && +m[1] === c.rows && +m[2] === c.cols, status);

    const llmField = (uploads[0] || "").match(/name="allow_llm"\r\n\r\n([^\r]*)/);
    const allowed = llmField ? ["1", "true", "yes"].includes(llmField[1].toLowerCase()) : false;
    check(`${c.name}: the request did not allow the AI model`, uploads.length === 1 && !allowed, llmField ? `allow_llm=${llmField[1]}` : "");

    const tableRows = await page.$$eval(".chart-table tbody tr", (r) => r.length).catch(() => 0);
    check(`${c.name}: the table shows ${c.rows} rows`, tableRows === c.rows, `found ${tableRows}`);

    const warned = await page.$$eval("h3", (hs) => hs.some((h) => h.textContent.trim() === "Check this"));
    check(`${c.name}: ${c.warning ? "a \"Check this\" warning is shown" : "no warning is shown"}`, warned === c.warning);

    await page.close();
  }
} catch (e) {
  check("the run finished", false, e && e.message ? e.message : String(e));
} finally {
  await browser.close();
}

check("no uncaught page errors", pageErrors.length === 0, pageErrors.join(" | "));
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${failed ? `${failed} check(s) failed` : "All checks passed"} (${results.length} checks).`);
console.log("Still needed by hand: a keyboard-only pass and a screen reader pass of /charts.");
process.exit(failed ? 1 : 0);

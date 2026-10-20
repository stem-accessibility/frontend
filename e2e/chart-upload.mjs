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
// For the /create case the backend also needs an AI key set (any value, e.g. ACCESSFLOW_OPENROUTER_API_KEY=x)
// so that the two choices appear; the key is never used.
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
    // The same picture, but chosen on /create (name, Chart, Upload) and handed to /charts.
    name: "single-series bar, started from /create",
    file: "barchart.png",
    rows: 8,
    cols: 2,
    warning: false,
    via: "create",
  },
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

    let input;
    if (c.via === "create") {
      // The flow a person follows: name it, choose Chart, Upload, pick the picture, Continue.
      await page.goto(FRONTEND + "/create", { waitUntil: "networkidle0" });
      await page.select("select", "chart");
      await page.type("input[type=text]", "E2E chart");
      const [uploadBtn] = await page.$$("xpath/.//button[normalize-space()='Upload']");
      check(`${c.name}: Upload is on once the chart has a name`, uploadBtn && !(await uploadBtn.evaluate((b) => b.disabled)));
      if (!uploadBtn) {
        await page.close();
        continue;
      }
      await uploadBtn.click();
      const chooser = await page.waitForSelector('input[type="file"][accept*="text/csv"]', { timeout: 5000 }).catch(() => null);
      check(`${c.name}: the file chooser opens`, !!chooser);
      if (!chooser) {
        await page.close();
        continue;
      }
      await chooser.uploadFile(path.join(ROOT, c.file));
      // With the AI model on offer a picture gets two buttons. The test only ever presses Extract
      // (the built-in reader), so nothing is sent to a third party and no credits are spent.
      const builtIn = await page
        .waitForSelector("xpath/.//button[normalize-space()='Extract']", { timeout: 6000 })
        .catch(() => null);
      const [aiButton] = await page.$$("xpath/.//button[normalize-space()='Extract with AI support']");
      check(
        `${c.name}: a signed-in picture offers Extract and Extract with AI support as separate buttons`,
        !!builtIn && !!aiButton,
        "start the backend with ACCESSFLOW_OPENROUTER_API_KEY set (any value) and UNICHART_URL"
      );
      if (!builtIn) {
        await page.close();
        continue;
      }
      await builtIn.click();
      await page.waitForFunction(() => location.pathname === "/charts", { timeout: 8000 }).catch(() => {});
      check(`${c.name}: the chart tool opens`, new URL(page.url()).pathname === "/charts", page.url());
      input = await page.waitForSelector('input[type="file"][accept*="image/png"]', { timeout: 10000 }).catch(() => null);
      const noted = await page.evaluate(() => document.body.innerText.includes("Picture chosen on the previous page"));
      check(`${c.name}: the picture arrives already selected`, noted);
    } else {
      await page.goto(FRONTEND + "/charts", { waitUntil: "networkidle0" });
      input = await page.waitForSelector('input[type="file"][accept*="image/png"]', { timeout: 10000 }).catch(() => null);
    }
    check(`${c.name}: the chart image panel is offered`, !!input, "no file input; is the backend reachable and CORS set for this port?");
    if (!input) {
      await page.close();
      continue;
    }

    if (c.via === "create") {
      // The choice was made on /create, so the chart tool starts reading by itself.
      const chosen = await page
        .waitForFunction(
          () => document.querySelector('input[type="radio"][value="local"]')?.checked === true,
          { timeout: 8000 }
        )
        .then(() => true)
        .catch(() => false);
      check(`${c.name}: the chart tool shows the built-in reader as chosen`, chosen);
    } else {
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
    }

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

// Automated accessibility scan (axe-core, WCAG 2.0/2.1/2.2 A and AA rules) of the pages that take
// uploads. It finds what a tool can find; it does not replace a keyboard-only pass or a screen
// reader pass, which ACCESSIBILITY.md also requires.
//
// Needs the local dev stack, as for the smoke test (see e2e/smoke.mjs). For the chart panel to
// appear, start the backend with a reader configured, e.g. add ACCESSFLOW_OPENROUTER_API_KEY=x so
// /chart-extraction/options reports an AI model (the key is never used by this script).
// Then:  npm run test:a11y
// Env: FRONTEND_URL (default http://localhost:5173), CHROME_PATH (default: macOS Chrome),
//      A11Y_FAIL_ON (default "moderate": fail on moderate, serious and critical; use "serious" to
//      be less strict).
import puppeteer from "puppeteer-core";
import { AxePuppeteer } from "@axe-core/puppeteer";

const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ORDER = ["minor", "moderate", "serious", "critical"];
const FAIL_FROM = ORDER.indexOf(process.env.A11Y_FAIL_ON || "moderate");
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Put a small picture in the file input the way a person's choice would, without a file on disk.
async function choosePicture(page, selector) {
  await page.waitForSelector(selector, { timeout: 8000 });
  await page.$eval(selector, (input) => {
    const bytes = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], "chart.png", { type: "image/png" }));
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await sleep(300);
}

// Each step puts the page in a state worth scanning, then names it in the report.
const SCANS = [
  { name: "/charts (before choosing a picture)", path: "/charts", ready: "h2" },
  {
    name: "/charts (picture chosen, AI choice shown)",
    path: "/charts",
    ready: "h2",
    act: (page) => choosePicture(page, 'input[type="file"][accept*="image/png"]'),
  },
  { name: "/create", path: "/create", ready: "input[type=text]" },
  {
    name: "/create (Chart chosen, Upload panel open)",
    path: "/create",
    ready: "input[type=text]",
    act: async (page) => {
      await page.select("select", "chart");
      await page.type("input[type=text]", "Scan chart");
      const [upload] = await page.$$("xpath/.//button[normalize-space()='Upload']");
      await upload.click();
      await page.waitForSelector('input[type="file"][accept*="text/csv"]', { timeout: 5000 });
    },
  },
  {
    name: "/create (Chart, picture chosen, AI choice shown)",
    path: "/create",
    ready: "input[type=text]",
    act: async (page) => {
      await page.select("select", "chart");
      await page.type("input[type=text]", "Scan chart");
      const [upload] = await page.$$("xpath/.//button[normalize-space()='Upload']");
      await upload.click();
      await choosePicture(page, 'input[type="file"][accept*="text/csv"]');
      await page.waitForSelector("xpath/.//button[normalize-space()='Extract with AI support']", { timeout: 6000 });
    },
  },
  { name: "/ld (before choosing a picture)", path: "/ld", ready: ".ld-container" },
  {
    name: "/ld (picture chosen, AI agreement shown)",
    path: "/ld",
    ready: ".ld-container",
    act: (page) => choosePicture(page, 'input.ld-file-input[type="file"]'),
  },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
let failures = 0;
let incompleteRun = false;
try {
  for (const scan of SCANS) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(FRONTEND + scan.path, { waitUntil: "networkidle0" });
    await page.waitForSelector(scan.ready, { timeout: 8000 });
    if (scan.act) await scan.act(page);

    const { violations, incomplete } = await new AxePuppeteer(page).withTags(TAGS).analyze();
    const failing = violations.filter((v) => ORDER.indexOf(v.impact || "minor") >= FAIL_FROM);
    failures += failing.length;

    console.log(`\n${failing.length ? "FAIL" : "PASS"}  ${scan.name}  (${violations.length} violations, ${incomplete.length} need a human check)`);
    for (const v of violations) {
      const mark = failing.includes(v) ? "  x" : "  -";
      console.log(`${mark} [${v.impact}] ${v.id}: ${v.help}`);
      for (const n of v.nodes.slice(0, 5)) console.log(`       ${n.target.join(" ")}`);
      console.log(`       ${v.helpUrl}`);
    }
    for (const i of incomplete) console.log(`  ? needs checking: ${i.id} (${i.nodes.length} elements)`);
    await page.close();
  }
} catch (e) {
  console.error("Scan did not complete:", e && e.message ? e.message : e);
  console.error(`Is the frontend running at ${FRONTEND}? See the header of this file for the dev stack.`);
  incompleteRun = true;
} finally {
  await browser.close();
}

if (incompleteRun) {
  console.log("\nNo result: the scan did not finish, so nothing is known about the pages.");
  process.exit(2);
}
console.log(`\n${failures ? `${failures} failing violation group(s)` : "No failing violations"}.`);
console.log("This is automated only. Still needed: a keyboard-only pass and a screen reader pass.");
process.exit(failures ? 1 : 0);

// Try-it (guest) browser test. The frontend must run WITHOUT dev auth so visitors are signed out:
//   frontend: VITE_SUPABASE_URL=http://localhost:9 VITE_SUPABASE_ANON_KEY=x VITE_API_URL=http://localhost:4999 \
//             npm run dev -- --port 5199
//   backend:  as in smoke.mjs (CORS_ORIGINS must include the frontend origin)
// Run:  FRONTEND_URL=http://localhost:5199 node e2e/try.mjs
import puppeteer from "puppeteer-core";

const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5199";
const API = process.env.API_URL || "http://localhost:4999";
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const results = [];
const check = (name, ok, detail = "") => {
  results.push(!!ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `  -> ${detail}`}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
try {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1400, height: 1000 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  const text = (sel) => page.$$eval(sel, (els) => els.map((e) => e.textContent.trim()).join(" | "));

  await page.goto(FRONTEND + "/try", { waitUntil: "networkidle0" });
  await sleep(1500);
  check("Try: signed-out header offers Try it and Log in", /Try it/.test(await text(".app-nav")) && /Log in/.test(await text(".app-nav")));
  check("Try: banner explains no account and no AI", /no account needed/i.test(await text(".try-banner")) && /No AI/.test(await text(".try-banner")));
  check("Try: opens in Markdown mode with the example previewed", /4 nodes|5 nodes|\d+ nodes/.test(await text(".markdown-split__count")), await text(".markdown-split__count"));
  const toolbar = await text(".canvas-toolbar button");
  check("Try: no 'View uploaded image'", !/View uploaded image/.test(toolbar), toolbar);
  check("Try: sharing is fixed at Public", (await page.$eval(".canvas-toolbar .sharing__select", (e) => [e.value, e.disabled].join())) === "public,true");
  check("Try: Copy permalink is disabled until saved", (await page.$eval(".canvas-toolbar .sharing__copy", (e) => e.disabled)) === true);

  await page.click(".accessibility-summary-bar__toggle");
  await sleep(400);
  await page.click("#accessibility-modal-title-input");
  await page.type("#accessibility-modal-title-input", "Guest flow");
  const [save] = await page.$$("xpath/.//button[contains(normalize-space(),'Save')]");
  await save.click();
  await sleep(2500);
  check("Try: Copy permalink works after saving", (await page.$eval(".canvas-toolbar .sharing__copy", (e) => e.disabled)) === false);

  const token = (await page.cookies()).find((c) => c.name === "stem_guest_token")?.value;
  check("Try: a first-party cookie holds the guest token", !!token && token.length >= 32);
  const mine = await (await fetch(API + "/guest/image", { headers: { "X-Guest-Token": token } })).json();
  check("Try: the image is saved, public, and named", mine && mine.title === "Guest flow" && mine.sharing === "public" && mine.guest === true, JSON.stringify(mine && { t: mine.title, s: mine.sharing }));
  const listed = (await (await fetch(API + "/repo")).json()).some((r) => r.flowchart_id === mine.flowchart_id);
  check("Try: it appears in Browse", listed);

  await page.reload({ waitUntil: "networkidle0" });
  await sleep(1500);
  await page.click(".accessibility-summary-bar__toggle");
  await sleep(300);
  check("Try: reopening this browser finds the same image", (await page.$eval("#accessibility-modal-title-input", (e) => e.value)) === "Guest flow");

  const other = await (await browser.createBrowserContext()).newPage();
  await other.goto(FRONTEND + "/try", { waitUntil: "networkidle0" });
  await sleep(1500);
  const otherToken = (await other.cookies()).find((c) => c.name === "stem_guest_token")?.value;
  const otherMine = otherToken
    ? await (await fetch(API + "/guest/image", { headers: { "X-Guest-Token": otherToken } })).json()
    : "no-token";
  check("Try: a different browser does not see it", otherMine === null, JSON.stringify(otherMine).slice(0, 60));

  await page.goto(FRONTEND + "/browse", { waitUntil: "networkidle0" });
  await sleep(800);
  check("Browse: guest images carry a Guest label", /Guest/.test(await text(".repo-chip")));
  check("No uncaught page errors", errors.length === 0, errors.slice(0, 2).join(" ; "));
} catch (e) {
  check("Test run completed", false, String(e?.message || e));
} finally {
  await browser.close();
}
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);

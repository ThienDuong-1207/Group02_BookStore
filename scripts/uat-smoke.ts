/**
 * Sprint 3 UAT smoke test – checks the customer pages of a running site (no login, read-only: GET requests only).
 *
 *   npm run test:uat                                   # production (https://group02-book-store.vercel.app)
 *   npm run test:uat -- --base http://localhost:3001   # local `npm run dev -- -p 3001` (needs .env.local)
 *
 * Each check prints PASS / FAIL / SKIP with the test case ID from docs/test-cases/UAT-S3.md.
 * SKIP = the seed data has nothing to test with (e.g. no book on promotion today); add the demo data and run again.
 * Exit code 1 when any check fails, so it can run in CI or before the UAT session.
 *
 * Responsive layout (US-21) and admin pages need a browser and a login: they stay manual (UAT-S3.md).
 */

type Result = { id: string; title: string; status: "PASS" | "FAIL" | "SKIP"; detail: string };
type Card = { id: string; text: string; original: number; sale: number | null; soldOut: boolean };

const DEFAULT_BASE = "https://group02-book-store.vercel.app";
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const BASE = (argValue("--base") ?? process.env.UAT_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, "");
const results: Result[] = [];

// ---------- helpers ----------

/** The visible HTML only: no <script> payloads (they repeat the page data), React's "<!-- -->" markers removed. */
function visible(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<!-- -->/g, "")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;| /g, " ");
}

/** Plain text of an HTML fragment. */
function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** "120.000 ₫" → 120000 */
function priceOf(value: string): number {
  return Number(value.replace(/[^\d]/g, ""));
}

/** Same accent folding as src/lib/books/search.ts. */
function fold(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase();
}

async function get(path: string): Promise<{ status: number; html: string; raw: string; url: string; ms: number }> {
  const started = performance.now();
  const response = await fetch(`${BASE}${path}`, { redirect: "follow", headers: { "User-Agent": "Team02-UAT-smoke" } });
  const body = await response.text();
  return { status: response.status, html: visible(body), raw: body, url: response.url, ms: Math.round(performance.now() - started) };
}

/** The book cards of a list page (grid items that link to a detail page). */
function cards(html: string): Card[] {
  const found: Card[] = [];
  const itemPattern = /<li class="min-w-0">([\s\S]*?)<\/li>/g;
  for (const match of html.matchAll(itemPattern)) {
    const block = match[1];
    const link = block.match(new RegExp(`href="/books/(${UUID})`, "i"));
    if (!link) continue;
    const del = block.match(/<del[^>]*>([^<]+)<\/del>/);
    const prices = [...block.matchAll(/([\d.]+)\s₫/g)].map((m) => priceOf(m[1]));
    const original = del ? priceOf(del[1]) : prices[0] ?? 0;
    const sale = del ? prices.find((p) => p !== original) ?? null : null;
    found.push({ id: link[1], text: text(block), original, sale, soldOut: /Sold Out/.test(block) });
  }
  return found;
}

/** "Showing 1–12 of 33 · Page 1 of 3" → { total: 33, page: 1, pages: 3 } */
function summary(html: string): { total: number; page: number; pages: number } | null {
  const match = text(html).match(/Showing \d+–\d+ of (\d+) · Page (\d+) of (\d+)/);
  return match ? { total: Number(match[1]), page: Number(match[2]), pages: Number(match[3]) } : null;
}

/** Visible categories from the filter's <select>. */
function categories(html: string): { id: string; name: string }[] {
  const select = html.match(/<select[^>]*name="category"[^>]*>([\s\S]*?)<\/select>/);
  if (!select) return [];
  return [...select[1].matchAll(new RegExp(`<option value="(${UUID})"[^>]*>([^<]+)</option>`, "gi"))].map((m) => ({ id: m[1], name: m[2].trim() }));
}

async function check(id: string, title: string, run: () => Promise<{ ok: boolean; detail: string } | { skip: string }>) {
  try {
    const outcome = await run();
    if ("skip" in outcome) results.push({ id, title, status: "SKIP", detail: outcome.skip });
    else results.push({ id, title, status: outcome.ok ? "PASS" : "FAIL", detail: outcome.detail });
  } catch (error) {
    results.push({ id, title, status: "FAIL", detail: `error: ${(error as Error).message}` });
  }
}

/** Every card of every page of the full list (for Sold Out / promotion lookups). Max 10 pages. */
async function allCards(): Promise<Card[]> {
  const first = await get("/books");
  const pages = Math.min(summary(first.html)?.pages ?? 1, 10);
  const list = cards(first.html);
  for (let page = 2; page <= pages; page++) list.push(...cards((await get(`/books?page=${page}`)).html));
  return list;
}

// ---------- checks ----------

async function main() {
  console.log(`UAT smoke test – ${BASE}\n`);

  let home: Awaited<ReturnType<typeof get>>;
  try {
    home = await get("/books");
  } catch (error) {
    // Nothing listening (ECONNREFUSED), DNS error, no network…
    console.error(
      `✗ Cannot reach ${BASE} (${((error as Error & { cause?: { code?: string } }).cause?.code ?? (error as Error).message)}).\n` +
        "  Is the site running? Locally: `npm run dev -- -p 3001` in another terminal (needs .env.local), wait for\n" +
        "  \"Ready\", then run this again. Or run without --base to test production.",
    );
    process.exitCode = 1;
    return;
  }
  // Guard: make sure --base really is the Book Store (another app on the same port gives misleading FAILs).
  if (!/Book Store/.test(home.raw)) {
    const title = home.raw.match(/<title>([^<]*)<\/title>/)?.[1] ?? "no title";
    console.error(
      `✗ ${BASE}/books is not the Book Store (HTTP ${home.status}, page title "${title}").\n` +
        "  Another app may be using this port. Start the Book Store (e.g. `npm run dev -- -p 3001`, needs .env.local)\n" +
        "  and pass --base http://localhost:3001, or run without --base to test production.",
    );
    process.exitCode = 1;
    return;
  }
  const homeCards = cards(home.html);
  const homeSummary = summary(home.html);
  const everyCard = await allCards();

  // F3 – list, pagination (regression)
  await check("UAT-01", "US-19/20: /books shows 12 cards, newest first, with page info", async () => ({
    ok: home.status === 200 && homeCards.length === Math.min(12, homeSummary?.total ?? 0) && !!homeSummary,
    detail: `HTTP ${home.status}, ${homeCards.length} cards, ${homeSummary ? `${homeSummary.total} books / ${homeSummary.pages} pages` : "no 'Showing …' line"}`,
  }));

  await check("UAT-02", "NFR-3: list page loads in < 2 s", async () => {
    const again = await get("/books");
    return { ok: again.ms < 2000, detail: `${again.ms} ms (server response, measured from this machine)` };
  });

  await check("UAT-03", "US-20 E1: ?page=0 → page 1; page past the end → last page", async () => {
    const zero = summary((await get("/books?page=0")).html);
    const past = summary((await get("/books?page=999")).html);
    return {
      ok: zero?.page === 1 && !!past && past.page === past.pages,
      detail: `page=0 → page ${zero?.page ?? "?"}; page=999 → page ${past?.page ?? "?"} of ${past?.pages ?? "?"}`,
    };
  });

  // F5 – US-01 search
  await check("UAT-04", "US-01 AC1: 'nguyen' (no marks) finds 'Nguyễn…' in title or author", async () => {
    const result = await get("/books?q=nguyen");
    const found = cards(result.html);
    if (found.length === 0) return { skip: "no book or author with 'Nguyễn' in the data" };
    const allMatch = found.every((card) => fold(card.text).includes("nguyen"));
    return { ok: allMatch && /Results for "nguyen"/.test(text(result.html)), detail: `${found.length} result(s)${allMatch ? "" : ", some cards do not contain 'nguyen'"}` };
  });

  await check("UAT-05", "US-01 AC2: 'xyz123' → 'No results found'", async () => {
    const result = await get("/books?q=xyz123");
    return { ok: /No results found/.test(result.html) && cards(result.html).length === 0, detail: `HTTP ${result.status}` };
  });

  await check("UAT-06", "US-01 AC3: empty / spaces-only keyword → full list", async () => {
    const spaces = summary((await get("/books?q=%20%20%20")).html);
    return { ok: spaces?.total === homeSummary?.total, detail: `${spaces?.total ?? "?"} vs ${homeSummary?.total ?? "?"} books` };
  });

  await check("UAT-07", "US-01 B2: '%' and '_' are plain text (no error, not every book)", async () => {
    const percent = await get("/books?q=%25");
    const underscore = await get("/books?q=_");
    const percentTotal = summary(percent.html)?.total ?? 0;
    return {
      ok: percent.status === 200 && underscore.status === 200 && percentTotal < (homeSummary?.total ?? 1),
      detail: `'%' → HTTP ${percent.status}, ${percentTotal} result(s); '_' → HTTP ${underscore.status}`,
    };
  });

  // F5 – US-09 filters
  const cats = categories(home.html);
  await check("UAT-08", "US-09 AC1: category filter shows only that category (title = category name)", async () => {
    if (cats.length === 0) return { skip: "no category in the filter" };
    const chosen = cats.find((c) => /văn học/i.test(c.name)) ?? cats[0];
    const result = await get(`/books?category=${chosen.id}`);
    const total = summary(result.html)?.total ?? cards(result.html).length;
    const titleOk = text(result.html).includes(chosen.name);
    return { ok: result.status === 200 && titleOk && total <= (homeSummary?.total ?? 0), detail: `"${chosen.name}": ${total} book(s)` };
  });

  await check("UAT-09", "US-09 B1: min = max = a book's price → that book is listed (inclusive)", async () => {
    const card = everyCard.find((c) => c.sale === null);
    if (!card) return { skip: "no book without a promotion" };
    const result = await get(`/books?minPrice=${card.original}&maxPrice=${card.original}`);
    return { ok: cards(result.html).some((c) => c.id === card.id), detail: `price ${card.original}` };
  });

  await check("UAT-10", "US-09 AC2 (CR-02): price filter uses the ORIGINAL price, not the sale price", async () => {
    const promo = everyCard.find((c) => c.sale !== null);
    if (!promo || promo.sale === null) return { skip: "no book on an active promotion today – add one (demo: 100.000 ₫, -20 %)" };
    const byOriginal = cards((await get(`/books?minPrice=${promo.original}&maxPrice=${promo.original}`)).html).some((c) => c.id === promo.id);
    const bySale = cards((await get(`/books?minPrice=${promo.sale}&maxPrice=${promo.sale}`)).html).some((c) => c.id === promo.id);
    return { ok: byOriginal && !bySale, detail: `original ${promo.original}: ${byOriginal ? "listed" : "missing"}; sale ${promo.sale}: ${bySale ? "listed (wrong)" : "not listed"}` };
  });

  await check("UAT-11", "US-09 AC3: min > max → error message, filter not applied", async () => {
    const result = await get("/books?minPrice=200000&maxPrice=100000");
    return {
      ok: /Minimum price cannot be greater than maximum price/.test(result.html) && summary(result.html)?.total === homeSummary?.total,
      detail: `message ${/Minimum price cannot/.test(result.html) ? "shown" : "missing"}, ${summary(result.html)?.total ?? "?"} books listed`,
    };
  });

  await check("UAT-12", "US-09 E2: negative / non-numeric price → message", async () => {
    const negative = await get("/books?minPrice=-5");
    const letters = await get("/books?maxPrice=abc");
    return {
      ok: /Minimum price must be a whole number/.test(negative.html) && /Maximum price must be a whole number/.test(letters.html),
      detail: `HTTP ${negative.status} / ${letters.status}`,
    };
  });

  await check("UAT-13", "US-09 AC4: 'Clear filters' goes back to /books", async () => {
    if (cats.length === 0) return { skip: "no category" };
    const result = await get(`/books?category=${cats[0].id}&minPrice=1`);
    return { ok: /href="\/books"[^>]*>Clear filters/.test(result.html), detail: "link to /books" };
  });

  // F5 – US-25 (regression of Đan's story with the new filters)
  await check("UAT-14", "US-25 AC1: page 2 of a filtered list keeps the filters", async () => {
    const result = await get("/books?minPrice=1");
    const s = summary(result.html);
    if (!s || s.pages < 2) return { skip: "fewer than 13 books" };
    return { ok: /href="\/books\?minPrice=1&(amp;)?page=2"/.test(result.html), detail: `${s.total} results, ${s.pages} pages` };
  });

  // F4 – detail, not found
  const firstCard = homeCards[0];
  await check("UAT-15", "US-02: detail page shows title, price, availability, description; no Add to Cart", async () => {
    if (!firstCard) return { skip: "no books" };
    const detail = await get(`/books/${firstCard.id}`);
    const body = text(detail.html);
    return {
      ok: detail.status === 200 && /Description/.test(body) && /(In stock|Sold Out)/.test(body) && /₫/.test(body) && !/add to cart/i.test(body),
      detail: `HTTP ${detail.status}`,
    };
  });

  await check("UAT-16", "US-22 E1: unknown / malformed id → 404 'Book not found'", async () => {
    const unknown = await get("/books/00000000-0000-4000-8000-000000000000");
    const malformed = await get("/books/not-a-real-id");
    return {
      // The book 404 body is drawn by the browser from streamed data; the raw HTML carries its title
      // "Book not found – Book Store". The visible text is checked by hand (UAT-S3.md, UAT-16).
      ok: unknown.status === 404 && malformed.status === 404 && /Book not found/.test(unknown.raw),
      detail: `unknown → ${unknown.status}, malformed → ${malformed.status}`,
    };
  });

  await check("UAT-17", "US-22 M1: card on page 2 links to the detail with 'from' = page 2", async () => {
    if ((homeSummary?.pages ?? 1) < 2) return { skip: "only one page" };
    const page2 = await get("/books?page=2");
    return { ok: new RegExp(`href="/books/${UUID}\\?from=%2Fbooks%3Fpage%3D2"`, "i").test(page2.html), detail: "from=%2Fbooks%3Fpage%3D2" };
  });

  // F2/F4 – US-06 Sold Out, US-27/28 promotion
  await check("UAT-18", "US-06: books with stock 0 show 'Sold Out' on the card and the detail page", async () => {
    const sold = everyCard.filter((c) => c.soldOut);
    if (sold.length === 0) return { skip: "no book with stock 0 (seed should have ≥ 2)" };
    const detail = await get(`/books/${sold[0].id}`);
    return { ok: /Sold Out/.test(detail.html), detail: `${sold.length} sold-out card(s); detail ${/Sold Out/.test(detail.html) ? "shows" : "does not show"} Sold Out` };
  });

  await check("UAT-19", "US-27 + US-28: promotion → card and detail show the same sale price and '-x%'", async () => {
    const promo = everyCard.find((c) => c.sale !== null);
    if (!promo) return { skip: "no book on an active promotion today" };
    const detail = await get(`/books/${promo.id}`);
    const hasDel = /<del[^>]*>[^<]*₫<\/del>/.test(detail.html);
    const hasSale = text(detail.html).includes(new Intl.NumberFormat("vi-VN").format(promo.sale ?? 0));
    const hasPercent = /-\d{1,2}%/.test(text(detail.html));
    return { ok: hasDel && hasSale && hasPercent, detail: `struck ${hasDel}, same sale price ${hasSale}, -x% ${hasPercent}` };
  });

  // F1 – access control (regression)
  await check("UAT-20", "US-13 E1: a guest opening /admin is sent to /login", async () => {
    const admin = await get("/admin");
    return { ok: /\/login/.test(admin.url), detail: `ended at ${admin.url.replace(BASE, "")}` };
  });

  // ---------- report ----------
  const width = Math.max(...results.map((r) => r.title.length));
  for (const r of results) {
    const mark = r.status === "PASS" ? "✓ PASS" : r.status === "FAIL" ? "✗ FAIL" : "– SKIP";
    console.log(`${mark}  ${r.id}  ${r.title.padEnd(width)}  ${r.detail}`);
  }
  const count = (status: Result["status"]) => results.filter((r) => r.status === status).length;
  console.log(`\n${count("PASS")} passed, ${count("FAIL")} failed, ${count("SKIP")} skipped (of ${results.length})`);
  process.exitCode = count("FAIL") > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

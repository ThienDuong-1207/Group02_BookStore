# UAT – Sprint 3 Review demo (Release 1.0)

Test cases for the demo in the Sprint Review S3 video script (part 4C, "Demo Increment theo AC"), in the order the script shows them. Each row says whether the **automated smoke test** covers it (`UAT-xx`) or it is **manual**.

## How to run the automated part

```bash
npm run test:uat                                   # production: https://group02-book-store.vercel.app
npm run test:uat -- --base http://localhost:3001   # local: `npm run dev -- -p 3001` (needs .env.local)
```

`scripts/uat-smoke.ts` only sends GET requests to the customer pages (no login, changes nothing). It prints PASS / FAIL / SKIP per check and exits with code 1 if anything fails.

- **SKIP** means the data has nothing to test with. Prepare the demo data below and run again.
- Responsive layouts and admin actions need a browser and an admin login, so they stay **manual**.

Result on 11/11/2026, production after PR #28–#33: **16 passed, 0 failed, 4 skipped**. UAT-04, UAT-10, UAT-18 and UAT-19 were skipped because there is no "Nguyễn" author, no active promotion, and the US-06 card badge was not merged yet.

## Demo data to prepare (before recording, script §4)

| # | Data | How | Needed by |
|---|---|---|---|
| D1 | A book with original price **100.000 ₫** and an active **20 %** promotion (shows 80.000 ₫) | Admin → Books → Promotion: 20 %, start = yesterday, end = next week | US-09 AC2, US-27, US-28 AC1 · UAT-10, UAT-19 |
| D2 | A book whose promotion **has ended** | Promotion with end date = yesterday | US-28 AC2 |
| D3 | A book in the category **"Văn học"** | Admin → Categories (add "Văn học"), then edit a book's category | US-09 AC1 · UAT-08 |
| D4 | A book or author with **"Nguyễn"** in the name | Admin → Authors: add "Nguyễn Nhật Ánh", then edit a book's author | US-01 AC1 · UAT-04 |
| D5 | ≥ 2 books with **stock 0** | Admin → Edit → Stock 0 (seed already has 2) | US-06 · UAT-18 |
| D6 | A keyword with **> 12 results** | Use a price filter such as Min 1, or a common word | US-25 · UAT-14 |

## Test cases, in the order of the video script

| TC | Script time | Story / AC | Steps (what Thiện does on screen) | Expected | Auto | Result |
|---|---|---|---|---|---|---|
| UAT-S3-01 | 06:25 | US-02 AC1 | From the list, click a book | Detail: title, author, category, price, description, cover, In stock / Sold Out | UAT-15 | |
| UAT-S3-02 | 06:25 | US-02 AC2 | Look at the detail page | No "Add to Cart" button | UAT-15 | |
| UAT-S3-03 | 06:41 | US-22 AC1 | Open `/books/00000000-0000-4000-8000-000000000000` | "Sorry, we couldn't find this book." (HTTP 404), no technical error | UAT-16 + manual (visible text) | |
| UAT-S3-04 | 06:41 | US-22 AC2 | Go to page 3 → open a book → **Back to list** | Back on page 3 (DEF-06 fixed) | UAT-17 (link) + manual | |
| UAT-S3-05 | 07:02 | US-28 AC1 | Open book D1 | ~~100.000 ₫~~ 80.000 ₫ **-20%** | UAT-19 | |
| UAT-S3-06 | 07:02 | US-28 AC2 | Open book D2 | Only the original price | manual (TC-F4-19) | |
| UAT-S3-07 | 07:02 | US-28 AC3 | Promotion with start = today / end = today | Still active on both days | automated unit test `tests/books/detail-promo-price.test.ts` | |
| UAT-S3-08 | 07:30 | US-01 AC1 | Search `nguyen` (no marks) | Books by Nguyễn … are listed (DEF-05 fixed) | UAT-04 | |
| UAT-S3-09 | 07:30 | US-01 AC2 | Search `xyz123` | "No results found" | UAT-05 | |
| UAT-S3-10 | 07:30 | US-01 AC3 | Empty search box → Search | Full list | UAT-06 | |
| UAT-S3-11 | 08:10 | US-09 AC1 | Category **Văn học** → Apply | Only Văn học books; title "Văn học" | UAT-08 | |
| UAT-S3-12 | 08:10 | US-09 AC2 (CR-02) | Min 90000, Max 110000 → Apply | Book D1 is listed (original 100.000 ₫, although it sells at 80.000 ₫) | UAT-10 | |
| UAT-S3-13 | 08:10 | US-09 AC3 | Min 200000, Max 100000 → Apply | "Minimum price cannot be greater than maximum price"; list unchanged | UAT-11 | |
| UAT-S3-14 | 08:10 | US-09 AC4 | **Clear filters** | Full list again | UAT-13 | |
| UAT-S3-15 | 09:00 | US-25 AC1 | Search + filter with > 12 results → page 2 | Page 2 keeps the conditions | UAT-14 | |
| UAT-S3-16 | 09:00 | US-25 AC2 | On page 2 change a filter → Apply | Back to page 1 | manual (TC-F5-28) | |
| UAT-S3-17 | 09:17 | US-21 AC1 | DevTools 375 / 768 / 1366 px on list, search, detail | No horizontal scrolling | manual (TC-F3-36, 49) | |
| UAT-S3-18 | 09:17 | US-21 AC2 | Same widths on `/books` | Grid 1 / 2 / 4 columns | manual (TC-F3-37) | |
| UAT-S3-19 | 09:17 | US-21 AC3 | Admin pages at 768 px, incl. the promotion form | All fields and buttons usable (DEF-07 fixed) | manual (TC-F3-45…48) | |
| UAT-S3-20 | 09:36 | US-06 AC1 | Admin: stock = 0 → customer list and detail | **Sold Out** badge on both | UAT-18 | |
| UAT-S3-21 | 09:36 | US-06 AC2 | Admin: stock `-3` → Save | Error, nothing saved | manual (TC-F2-55) | |
| UAT-S3-22 | 09:36 | US-06 AC3 | Admin: stock 0 → 1 | Badge disappears | manual (TC-F2-56) | |

## Regression checks also in the script (F1–F3)

| Auto | Checks |
|---|---|
| UAT-01 | `/books` shows 12 cards and "Showing 1–12 of N" (US-19, US-20) |
| UAT-02 | List page answers in < 2 s (NFR-3) |
| UAT-03 | `?page=0` → page 1; a page past the end → the last page (US-20 E1) |
| UAT-07 | `%` and `_` in the search are plain text (US-01 B2) |
| UAT-09 | min = max = a book's price still lists it (US-09 B1) |
| UAT-12 | Negative / letters in a price → message (US-09 E2) |
| UAT-20 | A guest opening `/admin` is sent to `/login` (US-13 E1) |

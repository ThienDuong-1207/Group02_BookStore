# Style guide – Book Store Release 1.0 (WBS 2.3.1 · GB-107)

The single source for colours, fonts and the common components. Tokens live in `src/app/globals.css`; use the Tailwind names below (`bg-brand`, `text-muted`, `font-serif`…), never raw hex values, so a colour change is made in one place.

Wireframes: [`wireframe-home-desktop.svg`](wireframe-home-desktop.svg) (1366 px) · [`wireframe-home-mobile.svg`](wireframe-home-mobile.svg) (375 px, menu closed and open).

## 1. Colours

| Token (Tailwind) | Hex | Used for |
|---|---|---|
| `background` | `#faf7f2` | Page background ("paper") |
| `surface` | `#ffffff` | Header, footer, cards, forms |
| `foreground` | `#1f1a17` | Body text, headings |
| `muted` | `#6b625a` | Secondary text: author, hints, dates |
| `line` | `#e7e0d6` | Borders and dividers |
| `brand` / `brand-hover` | `#1e4d3b` / `#163a2c` | Logo, primary buttons, links, active menu item |
| `brand-deep` / `on-brand-muted` | `#123226` / `#b9cdc3` | Footer background and the secondary text on green backgrounds (8.3 : 1 on `brand-deep`, 5.8 : 1 on `brand`) |
| `brand-surface` | `#e8f0ec` | Hover background of menu items, selected category |
| `accent` / `accent-surface` | `#9a5b13` / `#fbf1e2` | Prices and promotions: discounted price, "-x%" label (CR-02) |
| `danger` / `danger-surface` | `#b42318` / `#fdecea` | Errors, "Sold Out", Lock, struck-through original price |
| `success` / `success-surface` | `#2f6f3e` / `#e7f4ec` | Success messages, ACTIVE status |

Every text/background pair above passes **WCAG AA (≥ 4.5 : 1)** – lowest is accent on accent-surface at 4.84 : 1.

## 2. Typography

| Role | Font | Size / weight |
|---|---|---|
| Logo, page titles (`h1`, `h2`), book titles, prices on the detail page | `font-serif`: **Fraunces** (variable, 100–900, normal + italic) → Iowan Old Style → Palatino → Georgia | hero `text-5xl`…`text-7xl` medium · page `h1` `text-3xl`/`text-5xl` medium · section `h2` `text-3xl`/`text-4xl` medium · card title `text-lg` semibold |
| Body, buttons, forms | `font-sans`: **Be Vietnam Pro** (400, 500, 600) → system UI font | `text-base` (16 px) – inputs never smaller, so phones do not zoom |
| Small print | `font-sans` | `text-sm` for secondary text, `text-xs` for badges only |
| Section label (`.eyebrow`) | `font-sans` | `text-xs` semibold, uppercase, letter-spacing 0.14em, `accent` colour |

Both fonts have Vietnamese glyphs and are **served from our own site** (`public/fonts/*.woff2`, declared in
`src/app/fonts.css`, SIL Open Font License): no request to another server, no new npm dependency. Each font is split
into latin / latin-ext / vietnamese files and the browser downloads only the ones a page needs (about 60 KB for an
English page); the two main files are preloaded and `font-display: swap` shows the fallback font first, so the
list page stays under 2 s (NFR-3). *(Changed on 11/11/2026: before, only fonts installed on the device were used.)*

## 3. Layout

- Content width `max-w-6xl` (1152 px), side padding `px-4`.
- Breakpoints: phone < 768 px · tablet `md` ≥ 768 px · desktop `lg` ≥ 1024 px.
- Book grid (US-19): **1 / 2 / 4 columns** at 375 / 768 / 1366 px, gap `gap-x-7 gap-y-10`; on phones the single column is at most 288 px wide and centred.
- Home page `/`: hero (text left, fan of three covers right; stacked on phones) → numbers → categories → on sale → new books → closing band. Sections are 64 px apart.
- Footer stays at the bottom of the window on short pages (`body` is a full-height flex column, footer `mt-auto`).
- No horizontal scrolling at 375 px; tap targets ≥ 44 px (`min-h-11`).

## 4. Components

| Component | Spec |
|---|---|
| **Primary button** | `bg-brand text-brand-foreground hover:bg-brand-hover hover:shadow-md`, `rounded-md px-4 min-h-11 font-medium`, pressed `scale-[0.97]`; focus ring `outline-2 outline-offset-2 outline-brand` |
| **Secondary button** | `border border-line bg-surface hover:border-brand hover:text-brand`, same size |
| **Danger button** | `border-danger text-danger hover:bg-danger-surface` (outline); filled `bg-danger text-white` only for the final confirm step |
| **Input / select** | `min-h-11 rounded-md border border-line bg-surface px-3 text-base`, focus `ring-2 ring-brand`; error: `border-danger` + message under the field |
| **Book cover** | 2 : 3, `.book-cover`: layered soft shadow + darker strip on the left (the spine), corners `3px 6px 6px 3px`; `.shimmer` behind the image while it loads; placeholder when missing |
| **Book card** (US-19) | No box: cover on top, then title 2 lines max (`line-clamp-2`, serif `text-lg`), author `text-sm text-muted`, price `font-semibold` formatted `120.000 ₫`; hover / keyboard focus: the cover lifts 8 px, tilts 1° and its shadow deepens, the title turns `brand`; a discount also shows as a small `bg-accent` tag on the cover corner |
| **Promotion price** (US-27) | original price `line-through text-muted text-sm`, discounted price `text-accent font-semibold`, label `bg-accent-surface text-accent text-xs rounded-full px-2` ("-20%") |
| **Badges** | `rounded-full px-2 py-0.5 text-xs font-medium`: Sold Out `bg-danger-surface text-danger`, ACTIVE `bg-success-surface text-success`, ADMIN `border-brand text-brand` |
| **Alerts** | error `border-danger bg-danger-surface text-danger`, success `border-success bg-success-surface text-success`, `rounded-md px-3 py-2 text-sm` |

## 5. Header and footer (US-29)

**Header (all pages)** – logo (book icon + "Book Store" in serif, **opens the home page `/`**) · **Books** · **Categories** menu (visible categories → `/books?category=<id>`) · **search box** (pill; `GET /books?q=`; the search itself is US-01) · account area: *Log in* + *Register* for guests, *Hi, name* + *Logout* when logged in · **Admin** link only for an ACTIVE admin. The header sits on the paper background; after ~80 px of scrolling it is more compact, white and has a shadow.

**Phone (< 768 px)** – logo + hamburger button (`aria-expanded`). The menu opens below the header with the search box, Home, Books, the category list and the account links; it closes on Escape, on a link click and on navigation.

**Footer (all pages)** – dark green band (`bg-brand-deep`), three columns (one column on phones): store info, explore links (Home, Books, Log in, Register), project info; bottom row `© 2026 Book Store · Team 02`.

**Log in / Register** – from 768 px two halves: a `brand` panel with a quotation and two floating book shapes (decoration, hidden from screen readers), and the form card; on phones only the form.

## 6. Motion

One easing curve everywhere: `--ease-book` = `cubic-bezier(0.2, 0.7, 0.2, 1)`. Movement is small (≤ 28 px), short (0.2–0.7 s) and happens once. **`prefers-reduced-motion: reduce` switches every transition and animation off**, and nothing depends on an animation to be visible or usable.

| Effect | Where | How (so every member can explain it) |
|---|---|---|
| **Scroll reveal** | Book cards, category tiles, section headings | `<Reveal>` (`src/components/motion/Reveal.tsx`): the server renders everything visible; after load, elements still below the screen get `data-wait` (opacity 0, 28 px lower) and an `IntersectionObserver` removes it when they scroll into view. Cards of one row start 70 ms apart. No JavaScript → nothing is hidden |
| **Header shrinks on scroll** | Header | CSS scroll-driven animation (`animation-timeline: scroll()`, first 80 px) on `.site-header` / `.site-header-inner`. Browsers without it (Firefox today) keep the static header |
| **Parallax** | Hero covers on `/` | Same CSS feature, class `.parallax`: each cover drifts a different distance (`--parallax-shift`) over the first 700 px |
| **Entrance** | Hero text and covers, page titles, opened menus, empty states | CSS keyframes `rise` (`.animate-rise`, staggered with `--rise-delay`) and `pop` (`.animate-pop`) |
| **Hover / press** | Cards, buttons, links, category tiles, pagination | CSS transitions: lift, shadow, arrow that slides, underline that grows from the left (`.link-underline`), `active:scale-[0.97]` |
| **List → detail cover** | Clicking a book card | View Transitions API, started by `CoverTransition` (`src/components/motion/CoverTransition.tsx`): the clicked cover and the detail cover share `view-transition-name: book-cover`, and the browser animates between them. Unsupported browser, Ctrl/Cmd-click or reduced motion → normal navigation |
| **Loading** | `/books` while the list is fetched; every cover while its image loads | `src/app/(public)/books/loading.tsx` (skeleton in the same grid) and `.shimmer` |
| **Back to top** | Every page, after ~700 px of scrolling | `BackToTop`: round button, smooth scroll |

**Not updated yet:** the two wireframes in this folder still show the old home (= book list) and the old card with a border.

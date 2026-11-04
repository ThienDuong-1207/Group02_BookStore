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
| `brand-surface` | `#e8f0ec` | Hover background of menu items, selected category |
| `accent` / `accent-surface` | `#9a5b13` / `#fbf1e2` | Prices and promotions: discounted price, "-x%" label (CR-02) |
| `danger` / `danger-surface` | `#b42318` / `#fdecea` | Errors, "Sold Out", Lock, struck-through original price |
| `success` / `success-surface` | `#2f6f3e` / `#e7f4ec` | Success messages, ACTIVE status |

Every text/background pair above passes **WCAG AA (≥ 4.5 : 1)** – lowest is accent on accent-surface at 4.84 : 1.

## 2. Typography

| Role | Font | Size / weight |
|---|---|---|
| Logo, page titles (`h1`, `h2`) | `font-serif`: Iowan Old Style → Palatino Linotype → Palatino → Georgia | h1 `text-2xl`/`text-3xl` semibold · h2 `text-lg` semibold |
| Body, buttons, forms | `font-sans`: system UI font (Segoe UI on Windows, SF on Apple, Roboto on Android) | `text-base` (16 px) – inputs never smaller, so phones do not zoom |
| Small print | `font-sans` | `text-sm` for secondary text, `text-xs` for badges only |

Both stacks use fonts already installed on the device: no web-font download, which keeps the list page under 2 s (NFR-3).

## 3. Layout

- Content width `max-w-6xl` (1152 px), side padding `px-4`.
- Breakpoints: phone < 768 px · tablet `md` ≥ 768 px · desktop `lg` ≥ 1024 px.
- Book grid (US-19): **1 / 2 / 4 columns** at 375 / 768 / 1366 px, gap `gap-4`/`gap-6`.
- Footer stays at the bottom of the window on short pages (`body` is a full-height flex column, footer `mt-auto`).
- No horizontal scrolling at 375 px; tap targets ≥ 44 px (`min-h-11`).

## 4. Components

| Component | Spec |
|---|---|
| **Primary button** | `bg-brand text-brand-foreground hover:bg-brand-hover`, `rounded-md px-4 min-h-11 font-medium`; focus ring `outline-2 outline-offset-2 outline-brand` |
| **Secondary button** | `border border-line bg-surface hover:bg-background`, same size |
| **Danger button** | `border-danger text-danger hover:bg-danger-surface` (outline); filled `bg-danger text-white` only for the final confirm step |
| **Input / select** | `min-h-11 rounded-md border border-line bg-surface px-3 text-base`, focus `ring-2 ring-brand`; error: `border-danger` + message under the field |
| **Book card** (US-19) | `rounded-lg border border-line bg-surface`, cover 2 : 3 on top (`object-cover`, placeholder when missing), title 2 lines max (`line-clamp-2`, serif), author `text-sm text-muted`, price `font-semibold` formatted `120.000 ₫`; hover: `shadow-md` + border `brand` |
| **Promotion price** (US-27) | original price `line-through text-muted text-sm`, discounted price `text-accent font-semibold`, label `bg-accent-surface text-accent text-xs rounded-full px-2` ("-20%") |
| **Badges** | `rounded-full px-2 py-0.5 text-xs font-medium`: Sold Out `bg-danger-surface text-danger`, ACTIVE `bg-success-surface text-success`, ADMIN `border-brand text-brand` |
| **Alerts** | error `border-danger bg-danger-surface text-danger`, success `border-success bg-success-surface text-success`, `rounded-md px-3 py-2 text-sm` |

## 5. Header and footer (US-29)

**Header (all pages)** – logo (book icon + "Book Store" in serif) · **Books** · **Categories** menu (visible categories → `/books?category=<id>`) · **search box** (`GET /books?q=`; the search itself is US-01) · account area: *Log in* + *Register* for guests, *Hi, name* + *Logout* when logged in · **Admin** link only for an ACTIVE admin.

**Phone (< 768 px)** – logo + hamburger button (`aria-expanded`). The menu opens below the header with the search box, Books, the category list and the account links; it closes on Escape, on a link click and on navigation.

**Footer (all pages)** – three columns (one column on phones): store info, explore links, project info; bottom row `© 2026 Book Store · Team 02`.

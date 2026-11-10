"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SEARCH_MAX_LENGTH } from "@/lib/books/search";
import type { CategoryLink } from "@/lib/queries/categories";
import {
  filtersHref,
  hasActiveFilters,
  parsePriceRange,
  type FilterErrors,
  type FilterValues,
} from "@/lib/validation/book-filters";
import { primaryButton, secondaryButton } from "@/components/layout/styles";

type BookFiltersProps = {
  /** Current values from the URL (put back into the fields). */
  values: FilterValues;
  /** Errors the server found in the URL (e.g. a hand-typed `?minPrice=-5`). */
  errors: FilterErrors;
  /** Visible categories only (US-17: hidden ones never appear in the filter). */
  categories: CategoryLink[];
};

const fieldClass =
  "min-h-11 w-full min-w-0 rounded-md border bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-brand";

/**
 * Search bar (US-01) + filter panel (US-09) on the book list page. All state lives in the URL
 * (`/books?q=&category=&minPrice=&maxPrice=`), so reload, Back and sharing keep the filters.
 * AC3 / E2: the price range is checked here before the URL changes (client) and again by the page (server).
 * Applying always drops `page`, so new conditions start on page 1. Without JavaScript the form still submits as a
 * plain GET and the server shows the same messages.
 *
 * US-21 (GB-48) responsive: phone (< 768 px) – one column; the search field and Apply stay visible, category and
 * price fold behind a "Filters" button (opened automatically when there is an error). Tablet – two columns;
 * desktop (≥ 1024 px) – one row. Every control is at least 44 px high and `min-w-0` keeps long category names from
 * widening the page (no horizontal scrolling).
 */
export function BookFilters({ values, errors: serverErrors, categories }: BookFiltersProps) {
  const router = useRouter();
  const panelId = useId();
  const [errors, setErrors] = useState<FilterErrors>(serverErrors);
  const [open, setOpen] = useState(Object.keys(serverErrors).length > 0);
  const activeCount = [values.category, values.minPrice || values.maxPrice].filter(Boolean).length;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: FilterValues = {
      q: String(data.get("q") ?? ""),
      category: String(data.get("category") ?? ""),
      minPrice: String(data.get("minPrice") ?? ""),
      maxPrice: String(data.get("maxPrice") ?? ""),
    };
    const price = parsePriceRange(next.minPrice, next.maxPrice);
    setErrors(price.errors);
    if (Object.keys(price.errors).length > 0) {
      setOpen(true); // on a phone the message must not stay hidden in the folded panel
      return; // AC3 / E2: filter not applied
    }
    router.push(filtersHref(next));
  }

  const minError = errors.minPrice;
  const maxError = errors.maxPrice ?? errors.range;

  return (
    <form
      action="/books"
      method="get"
      role="search"
      aria-label="Search and filter books"
      noValidate
      onSubmit={onSubmit}
      className="mt-4 grid min-w-0 gap-3 rounded-lg border border-line bg-surface p-4 md:grid-cols-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-start"
    >
      <div className="flex min-w-0 flex-col gap-1.5 md:col-span-3 lg:col-span-1">
        <label htmlFor="list-search" className="text-sm font-medium">
          Search
        </label>
        <input
          id="list-search"
          name="q"
          type="search"
          defaultValue={values.q}
          maxLength={SEARCH_MAX_LENGTH}
          placeholder="Title or author…"
          className={`${fieldClass} border-line`}
        />
      </div>

      {/* Phone only: fold / unfold category + price. From 768 px the fields are always shown. */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={`${secondaryButton} justify-between gap-2 md:hidden`}
      >
        <span>
          Filters{activeCount > 0 && <span className="text-muted"> ({activeCount})</span>}
        </span>
        <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}>
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* `md:contents`: on tablet / desktop the wrapper disappears and its fields sit in the form's grid. */}
      <div id={panelId} className={`${open ? "grid" : "hidden"} min-w-0 gap-3 md:contents`}>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="filter-category" className="text-sm font-medium">
            Category
          </label>
          <select id="filter-category" name="category" defaultValue={values.category} className={`${fieldClass} border-line`}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-3 md:contents">
          <PriceField name="minPrice" label="Min price (₫)" placeholder="0" defaultValue={values.minPrice} error={minError} />
          <PriceField name="maxPrice" label="Max price (₫)" placeholder="Any" defaultValue={values.maxPrice} error={maxError} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 md:col-span-3 lg:col-span-4">
        <button type="submit" className={`${primaryButton} flex-1 sm:flex-none`}>
          Apply
        </button>
        {(hasActiveFilters(values) || Object.keys(errors).length > 0) && (
          // AC4: back to the full list (no keyword, no category, no price range).
          <Link href="/books" className={`${secondaryButton} flex-1 sm:flex-none`}>
            Clear filters
          </Link>
        )}
      </div>
    </form>
  );
}

function PriceField({ name, label, placeholder, defaultValue, error }: { name: string; label: string; placeholder: string; defaultValue: string; error?: string }) {
  const errorId = `${name}-error`;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={13}
        placeholder={placeholder}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${fieldClass} ${error ? "border-danger" : "border-line"}`}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

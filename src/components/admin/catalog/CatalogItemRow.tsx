"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { renameCatalogItemAction, setCatalogItemHiddenAction } from "@/lib/admin/catalog-actions";
import type { BookFormState } from "@/lib/admin/book-messages";
import type { CatalogItem } from "@/lib/queries/catalog";
import { formDataToObject, toFieldErrors } from "@/lib/validation/auth";
import { CATALOG, CATALOG_FIELDS, catalogNameSchema, type CatalogKind } from "@/lib/validation/catalog";

const button =
  "inline-flex min-h-11 items-center justify-center rounded-md border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";

/**
 * One category / author (US-17, US-18 M1): name + Hidden badge, Rename (inline form) and Hide / Show.
 * E1 (duplicate) and B1 (name rules) appear under the rename field; E2 (still has books) under the buttons.
 */
export function CatalogItemRow({ kind, item }: { kind: CatalogKind; item: CatalogItem }) {
  const { maxLength } = CATALOG[kind];
  const [editing, setEditing] = useState(false);
  const [renameState, renameAction, renaming] = useActionState<BookFormState, FormData>(
    renameCatalogItemAction.bind(null, kind, item.id),
    {},
  );
  const [hideState, hideAction, hiding] = useActionState<BookFormState, FormData>(
    setCatalogItemHiddenAction.bind(null, kind, item.id),
    {},
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const nameError = clientError ?? renameState.fieldErrors?.name;
  const inputId = `rename-${item.id}`;

  // Close the rename form once the new name is saved.
  useEffect(() => {
    if (renameState.success) setEditing(false);
  }, [renameState]);

  function handleRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = catalogNameSchema(kind).safeParse(formDataToObject(formData, CATALOG_FIELDS));
    if (!parsed.success) {
      setClientError(toFieldErrors(parsed.error).name ?? null);
      return;
    }
    setClientError(null);
    startTransition(() => renameAction(formData));
  }

  const message = renameState.formError ?? hideState.formError;
  const success = editing ? undefined : (hideState.success ?? renameState.success);

  return (
    <li className="flex flex-col gap-2 border-b border-line px-4 py-3 last:border-0">
      {editing ? (
        <form onSubmit={handleRename} noValidate className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label htmlFor={inputId} className="sr-only">
              New name for {item.name}
            </label>
            <input
              id={inputId}
              name="name"
              defaultValue={item.name}
              autoComplete="off"
              autoFocus
              maxLength={maxLength}
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? `${inputId}-error` : undefined}
              onKeyDown={(event) => {
                if (event.key === "Escape") setEditing(false);
              }}
              className={`min-h-11 rounded-md border bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                nameError ? "border-danger" : "border-line"
              }`}
            />
            {nameError && (
              <p id={`${inputId}-error`} role="alert" className="text-sm text-danger">
                {nameError}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={renaming} className={`${button} border-brand bg-brand text-brand-foreground hover:bg-brand-hover`}>
              {renaming ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setClientError(null);
                setEditing(false);
              }}
              className={`${button} border-line bg-surface hover:bg-background`}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex min-w-0 flex-wrap items-center gap-2">
            <span className={`font-medium break-words ${item.is_hidden ? "text-muted" : ""}`}>{item.name}</span>
            {item.is_hidden && (
              <span className="rounded-full border border-line bg-background px-2 py-0.5 text-xs font-medium text-muted">Hidden</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-label={`Rename ${item.name}`}
              onClick={() => setEditing(true)}
              className={`${button} border-line bg-surface hover:border-brand`}
            >
              Rename
            </button>
            <form action={hideAction}>
              <input type="hidden" name="hidden" value={item.is_hidden ? "false" : "true"} />
              <button
                type="submit"
                disabled={hiding}
                aria-label={`${item.is_hidden ? "Show" : "Hide"} ${item.name}`}
                className={`${button} border-line bg-surface hover:border-brand`}
              >
                {hiding ? "Saving…" : item.is_hidden ? "Show" : "Hide"}
              </button>
            </form>
          </div>
        </div>
      )}

      {message && (
        <p role="alert" className="text-sm text-danger">
          {message}
        </p>
      )}
      {success && !hiding && !renaming && (
        <p role="status" className="text-sm text-success">
          {success}
        </p>
      )}
    </li>
  );
}

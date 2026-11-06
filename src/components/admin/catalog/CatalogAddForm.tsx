"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { createCatalogItemAction } from "@/lib/admin/catalog-actions";
import type { BookFormState } from "@/lib/admin/book-messages";
import { FormAlert } from "@/components/forms/FormField";
import { formDataToObject, toFieldErrors } from "@/lib/validation/auth";
import { CATALOG, CATALOG_FIELDS, catalogNameSchema, type CatalogKind } from "@/lib/validation/catalog";

/** US-17 / US-18 M1: add a category or author. B1 is checked here first, then again on the server. */
export function CatalogAddForm({ kind }: { kind: CatalogKind }) {
  const { label, maxLength } = CATALOG[kind];
  const [state, formAction, pending] = useActionState<BookFormState, FormData>(createCatalogItemAction.bind(null, kind), {});
  const [clientError, setClientError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const error = clientError ?? state.fieldErrors?.name;
  const inputId = `new-${kind}-name`;

  // Empty the field after a successful add, ready for the next one.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // keeps what was typed when there is an error
    const formData = new FormData(event.currentTarget);
    const parsed = catalogNameSchema(kind).safeParse(formDataToObject(formData, CATALOG_FIELDS));
    if (!parsed.success) {
      setClientError(toFieldErrors(parsed.error).name ?? null);
      return;
    }
    setClientError(null);
    startTransition(() => formAction(formData));
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <FormAlert message={clientError ? undefined : state.formError} />
      {state.success && !clientError && !pending && (
        <p role="status" className="rounded-md border border-success bg-success-surface px-3 py-2 text-sm text-success">
          {state.success}
        </p>
      )}
      <label htmlFor={inputId} className="text-sm font-medium">
        New {label.toLowerCase()} name<span className="text-danger"> *</span>
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <input
            id={inputId}
            name="name"
            autoComplete="off"
            maxLength={maxLength}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : `${inputId}-hint`}
            className={`min-h-11 rounded-md border bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              error ? "border-danger" : "border-line"
            }`}
          />
          {error ? (
            <p id={`${inputId}-error`} role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : (
            <p id={`${inputId}-hint`} className="text-xs text-muted">
              1–{maxLength} characters; must not match an existing name (upper/lower case is ignored).
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 shrink-0 rounded-md bg-brand px-4 font-medium text-brand-foreground hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60"
        >
          {pending ? "Adding…" : `Add ${label.toLowerCase()}`}
        </button>
      </div>
    </form>
  );
}

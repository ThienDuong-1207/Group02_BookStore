"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import type { BookFormState } from "@/lib/admin/book-messages";
import type { Option } from "@/lib/queries/books";
import { FormAlert, FormField, SubmitButton } from "@/components/forms/FormField";
import { formDataToObject, toFieldErrors, type FieldErrors } from "@/lib/validation/auth";
import { BOOK_FIELDS, bookSchema } from "@/lib/validation/books";

/** Values that pre-fill the form (US-15 M1). All strings, exactly as the inputs hold them. */
export type BookFormValues = Partial<Record<(typeof BOOK_FIELDS)[number], string>>;

type BookFormProps = {
  action: (prev: BookFormState, formData: FormData) => Promise<BookFormState>;
  authors: Option[];
  categories: Option[];
  initial?: BookFormValues;
  submitLabel: string;
  pendingLabel: string;
  /** Empty the form after a successful save (add-book page) so the next book starts clean. */
  resetOnSuccess?: boolean;
};

/**
 * US-05 / US-15 book form: title, author, category, price, stock, description, cover image link.
 * Checked on the client first (errors next to each field); the server action checks again with the same schema.
 */
export function BookForm({ action, authors, categories, initial = {}, submitLabel, pendingLabel, resetOnSuccess }: BookFormProps) {
  const [state, formAction, pending] = useActionState<BookFormState, FormData>(action, {});
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = clientErrors ?? state.fieldErrors ?? {};

  useEffect(() => {
    if (state.success && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // preventDefault keeps what the admin typed when there is an error.
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = bookSchema.safeParse(formDataToObject(formData, BOOK_FIELDS));
    if (!parsed.success) {
      setClientErrors(toFieldErrors(parsed.error));
      return;
    }
    setClientErrors(null);
    startTransition(() => formAction(formData));
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <FormAlert message={clientErrors ? undefined : state.formError} />
      {state.success && !clientErrors && (
        <div role="status" className="rounded-md border border-success bg-success-surface px-3 py-2 text-sm text-success">
          {state.success}
        </div>
      )}

      <FormField label="Title" name="title" maxLength={200} required defaultValue={initial.title} error={errors.title} />

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="Author" name="authorId" options={authors} defaultValue={initial.authorId} error={errors.authorId} />
        <SelectField
          label="Category"
          name="categoryId"
          options={categories}
          defaultValue={initial.categoryId}
          error={errors.categoryId}
        />
        <FormField
          label="Price (VND)"
          name="price"
          inputMode="numeric"
          required
          hint="Whole number greater than 0, e.g. 120000"
          defaultValue={initial.price}
          error={errors.price}
        />
        <FormField
          label="Stock"
          name="stock"
          inputMode="numeric"
          required
          hint="Whole number, 0 or more"
          defaultValue={initial.stock ?? "0"}
          error={errors.stock}
        />
      </div>

      <TextAreaField label="Description" name="description" defaultValue={initial.description} error={errors.description} />

      <FormField
        label="Cover image link"
        name="coverUrl"
        type="url"
        autoComplete="off"
        placeholder="https://…/cover.jpg"
        hint="Paste the link of an image on the Internet (JPG, PNG, WebP or GIF). Leave empty to use a placeholder."
        defaultValue={initial.coverUrl}
        error={errors.coverUrl}
      />

      <div>
        <SubmitButton pending={pending}>{pending ? pendingLabel : submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

const controlClass =
  "rounded-md border bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-brand";

function FieldError({ name, error }: { name: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${name}-error`} role="alert" className="text-sm text-danger">
      {error}
    </p>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  options: Option[];
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        <span className="text-danger"> *</span>
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`min-h-11 ${controlClass} ${error ? "border-danger" : "border-line"}`}
      >
        <option value="">Choose {label.toLowerCase()}…</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      <FieldError name={name} error={error} />
    </div>
  );
}

function TextAreaField({ label, name, defaultValue, error }: { label: string; name: string; defaultValue?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        <span className="text-danger"> *</span>
      </label>
      <textarea
        id={name}
        name={name}
        rows={6}
        maxLength={5000}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : `${name}-hint`}
        className={`py-2 ${controlClass} ${error ? "border-danger" : "border-line"}`}
      />
      {!error && (
        <p id={`${name}-hint`} className="text-xs text-muted">
          Up to 5000 characters
        </p>
      )}
      <FieldError name={name} error={error} />
    </div>
  );
}

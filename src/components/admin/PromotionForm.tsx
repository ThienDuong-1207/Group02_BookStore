"use client";

import { startTransition, useActionState, useState } from "react";
import type { PromotionFormState } from "@/lib/admin/promotion-actions";
import { FormAlert, SubmitButton } from "@/components/forms/FormField";
import { formatPrice } from "@/lib/format";
import { discountedPrice } from "@/lib/promotions/price";
import { formDataToObject, toFieldErrors, type FieldErrors } from "@/lib/validation/auth";
import { PROMOTION_FIELDS, promotionSchema } from "@/lib/validation/promotions";

type Action = (prev: PromotionFormState, formData: FormData) => Promise<PromotionFormState>;

type PromotionFormProps = {
  saveAction: Action;
  removeAction: Action;
  originalPrice: number;
  initial?: { discountPercent: string; startDate: string; endDate: string };
};

/**
 * US-26 admin promotion form: discount 1–90 %, start date, end date (CR-02 AC1, AC2 checked on the client first,
 * then again on the server). Shows the discounted price while the admin types.
 */
export function PromotionForm({ saveAction, removeAction, originalPrice, initial }: PromotionFormProps) {
  const [state, formAction, pending] = useActionState<PromotionFormState, FormData>(saveAction, {});
  const [removeState, removeFormAction, removing] = useActionState<PromotionFormState, FormData>(removeAction, {});
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const [discount, setDiscount] = useState(initial?.discountPercent ?? "");
  const errors = clientErrors ?? state.fieldErrors ?? {};

  const discountNumber = /^\d+$/.test(discount.trim()) ? Number(discount) : NaN;
  const preview = discountNumber >= 1 && discountNumber <= 90 ? discountedPrice(originalPrice, discountNumber) : null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = promotionSchema.safeParse(formDataToObject(formData, PROMOTION_FIELDS));
    if (!parsed.success) {
      setClientErrors(toFieldErrors(parsed.error));
      return;
    }
    setClientErrors(null);
    startTransition(() => formAction(formData));
  }

  const message = removeState.success ?? state.success;

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormAlert message={clientErrors ? undefined : (state.formError ?? removeState.formError)} />
        {message && !clientErrors && (
          <div role="status" className="rounded-md border border-success bg-success-surface px-3 py-2 text-sm text-success">
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Discount (%)" name="discountPercent" error={errors.discountPercent} hint="Whole number from 1 to 90">
            <input
              id="discountPercent"
              name="discountPercent"
              inputMode="numeric"
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
              {...inputProps("discountPercent", errors.discountPercent)}
            />
          </Field>
          <Field label="Start date" name="startDate" error={errors.startDate}>
            <input id="startDate" name="startDate" type="date" defaultValue={initial?.startDate} {...inputProps("startDate", errors.startDate)} />
          </Field>
          <Field label="End date" name="endDate" error={errors.endDate} hint="Last day of the promotion (included)">
            <input id="endDate" name="endDate" type="date" defaultValue={initial?.endDate} {...inputProps("endDate", errors.endDate)} />
          </Field>
        </div>

        <p className="text-sm text-muted" aria-live="polite">
          Original price {formatPrice(originalPrice)}
          {preview !== null && (
            <>
              {" "}
              → promotional price <span className="font-semibold text-foreground">{formatPrice(preview)}</span> (-{discountNumber}%)
            </>
          )}
        </p>

        <div>
          <SubmitButton pending={pending}>{pending ? "Saving…" : "Save promotion"}</SubmitButton>
        </div>
      </form>

      {initial && (
        <form
          action={removeFormAction}
          onSubmit={(event) => {
            if (!window.confirm("Remove this promotion? Customers will see the original price again.")) event.preventDefault();
          }}
        >
          <button
            type="submit"
            disabled={removing}
            className="min-h-11 rounded-md border border-danger px-4 text-sm font-medium text-danger hover:bg-danger-surface focus-visible:outline-2 focus-visible:outline-danger disabled:opacity-60"
          >
            {removing ? "Removing…" : "Remove promotion"}
          </button>
        </form>
      )}
    </div>
  );
}

function inputProps(name: string, error?: string) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${name}-error` : `${name}-hint`,
    className: `min-h-11 rounded-md border bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-brand ${
      error ? "border-danger" : "border-line"
    }`,
  } as const;
}

function Field({ label, name, error, hint, children }: { label: string; name: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        <span className="text-danger"> *</span>
      </label>
      {children}
      {hint && !error && (
        <p id={`${name}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

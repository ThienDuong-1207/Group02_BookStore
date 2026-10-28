"use client";

import { startTransition, useActionState, useState } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/auth/actions";
import type { AuthFormState } from "@/lib/auth/messages";
import { FormAlert, FormField, SubmitButton } from "@/components/forms/FormField";
import {
  REGISTER_FIELDS,
  formDataToObject,
  registerSchema,
  toFieldErrors,
  type FieldErrors,
} from "@/lib/validation/auth";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(registerAction, {});
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const errors = clientErrors ?? state.fieldErrors ?? {};

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // preventDefault keeps what the user typed (a plain form action would clear the inputs).
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    // B2: check on the client first; the server action checks again with the same schema.
    const parsed = registerSchema.safeParse(formDataToObject(formData, REGISTER_FIELDS));
    if (!parsed.success) {
      setClientErrors(toFieldErrors(parsed.error));
      return;
    }
    setClientErrors(null);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <FormAlert message={clientErrors ? undefined : state.formError} />
      <FormField label="Full name" name="fullName" autoComplete="name" maxLength={100} required error={errors.fullName} />
      <FormField label="Email" name="email" type="email" autoComplete="email" required error={errors.email} />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="8–64 characters, at least one letter and one digit"
        error={errors.password}
      />
      <FormField
        label="Phone"
        name="phone"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        hint="10 digits starting with 0"
        error={errors.phone}
      />
      <SubmitButton pending={pending}>{pending ? "Creating account…" : "Create account"}</SubmitButton>
      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand underline-offset-2 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

"use client";

import { startTransition, useActionState, useState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/auth/actions";
import type { AuthFormState } from "@/lib/auth/messages";
import { FormAlert, FormField, SubmitButton } from "@/components/forms/FormField";
import { LOGIN_FIELDS, formDataToObject, loginSchema, toFieldErrors, type FieldErrors } from "@/lib/validation/auth";

/** `next` = page to return to after login (e.g. /admin when a guest was redirected from there). */
export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(loginAction, {});
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const errors = clientErrors ?? state.fieldErrors ?? {};

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse(formDataToObject(formData, LOGIN_FIELDS));
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
      {next && <input type="hidden" name="next" value={next} />}
      <FormField label="Email" name="email" type="email" autoComplete="email" required error={errors.email} />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={errors.password}
      />
      <SubmitButton pending={pending}>{pending ? "Logging in…" : "Log in"}</SubmitButton>
      <p className="text-sm text-muted">
        New customer?{" "}
        <Link href="/register" className="font-medium text-brand underline-offset-2 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

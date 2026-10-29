"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { createUserAction } from "@/lib/admin/user-actions";
import type { AdminFormState } from "@/lib/admin/messages";
import { FormAlert, FormField, SubmitButton } from "@/components/forms/FormField";
import { formDataToObject, toFieldErrors, type FieldErrors } from "@/lib/validation/auth";
import { CREATE_USER_FIELDS, ROLES, createUserSchema } from "@/lib/validation/users";

/** US-14 M2: admin creates an account (name, email, password, role). */
export function CreateUserForm() {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(createUserAction, {});
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = clientErrors ?? state.fieldErrors ?? {};

  // Empty the form after a successful create, so the next account starts from a clean form.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // preventDefault keeps what the admin typed when there is an error.
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    // B1: check on the client first; the server action checks again with the same schema.
    const parsed = createUserSchema.safeParse(formDataToObject(formData, CREATE_USER_FIELDS));
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

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Full name" name="fullName" autoComplete="off" maxLength={100} required error={errors.fullName} />
        <FormField label="Email" name="email" type="email" autoComplete="off" required error={errors.email} />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="8–64 characters, at least one letter and one digit"
          error={errors.password}
        />
        <RoleSelect error={errors.role} />
      </div>

      <div>
        <SubmitButton pending={pending}>{pending ? "Creating account…" : "Create account"}</SubmitButton>
      </div>
    </form>
  );
}

function RoleSelect({ error }: { error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="role" className="text-sm font-medium">
        Role<span className="text-danger"> *</span>
      </label>
      <select
        id="role"
        name="role"
        defaultValue="CUSTOMER"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "role-error" : undefined}
        className={`min-h-11 rounded-md border bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-brand ${
          error ? "border-danger" : "border-line"
        }`}
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {role === "ADMIN" ? "Administrator" : "Customer"}
          </option>
        ))}
      </select>
      {error && (
        <p id="role-error" role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

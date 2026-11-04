"use client";

import { useActionState, useState } from "react";
import { setUserStatusAction } from "@/lib/admin/user-actions";
import { ADMIN_MESSAGES, type AdminFormState } from "@/lib/admin/messages";
import type { AccountStatus } from "@/lib/auth/profile";

const button =
  "inline-flex min-h-11 items-center rounded-md border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";

type Props = { userId: string; email: string; status: AccountStatus; isSelf: boolean };

/**
 * US-14 M3: Lock (asks for confirmation first) / Unlock button for one account.
 * E2: disabled on the admin's own row – the server rejects a self-lock as well.
 */
export function LockToggle({ userId, email, status, isSelf }: Props) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(setUserStatusAction, {});
  const [confirming, setConfirming] = useState(false);
  const locking = status === "ACTIVE";

  return (
    <div className="flex flex-col gap-1">
      <form action={formAction} onSubmit={() => setConfirming(false)} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="status" value={locking ? "LOCKED" : "ACTIVE"} />

        {!locking ? (
          <button type="submit" disabled={pending} className={`${button} border-line hover:bg-background`}>
            {pending ? "Unlocking…" : "Unlock"}
          </button>
        ) : confirming ? (
          <div className="flex flex-col gap-2">
            <span className="text-sm">
              Lock this account?<span className="sr-only"> {email}</span>
            </span>
            <div className="flex gap-2">
              <button type="submit" disabled={pending} className={`${button} border-danger bg-danger text-white hover:opacity-90`}>
                Confirm lock
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={`${button} border-line hover:bg-background`}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={isSelf || pending}
            title={isSelf ? ADMIN_MESSAGES.selfLock : undefined}
            onClick={() => setConfirming(true)}
            className={`${button} border-danger text-danger hover:bg-danger-surface`}
          >
            {pending ? "Locking…" : "Lock"}
          </button>
        )}
      </form>

      {isSelf && locking && <p className="text-xs text-muted">{ADMIN_MESSAGES.selfLock}</p>}
      {state.formError && (
        <p role="alert" className="text-sm text-danger">
          {state.formError}
        </p>
      )}
      {state.success && !pending && (
        <p role="status" className="text-sm text-success">
          {state.success}
        </p>
      )}
    </div>
  );
}

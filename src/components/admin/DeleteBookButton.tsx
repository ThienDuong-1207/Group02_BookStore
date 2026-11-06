"use client";

import { useActionState, useState } from "react";
import { deleteBookAction } from "@/lib/admin/book-actions";
import type { BookFormState } from "@/lib/admin/book-messages";

const button =
  "inline-flex min-h-11 items-center rounded-md border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";

type Props = { bookId: string; title: string; page: number };

/**
 * US-16 M1 / E1: "Delete" first asks for confirmation inside the row; only "Confirm delete" calls the server.
 * Cancel just closes the question – nothing is sent, nothing changes.
 */
export function DeleteBookButton({ bookId, title, page }: Props) {
  const [state, formAction, pending] = useActionState<BookFormState, FormData>(deleteBookAction.bind(null, bookId), {});
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          aria-label={`Delete ${title}`}
          onClick={() => setConfirming(true)}
          className={`${button} border-danger text-danger hover:bg-danger-surface`}
        >
          Delete
        </button>
        {state.formError && (
          <p role="alert" className="text-sm text-danger">
            {state.formError}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-2 rounded-md border border-danger bg-danger-surface p-3">
      <input type="hidden" name="page" value={page} />
      <p className="text-sm">
        Delete <span className="font-medium break-words">{title}</span>? Customers will no longer see it.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={`${button} border-danger bg-danger text-white hover:opacity-90`}>
          {pending ? "Deleting…" : "Confirm delete"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(false)}
          className={`${button} border-line bg-surface hover:bg-background`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

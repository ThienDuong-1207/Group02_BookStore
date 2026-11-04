import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { getEditableBook } from "@/lib/queries/books";
import { getPromotion } from "@/lib/queries/promotions";
import { effectivePrice, promotionStatus, todayInVietnam } from "@/lib/promotions/price";
import { removePromotionAction, savePromotionAction } from "@/lib/admin/promotion-actions";
import { PromotionForm } from "@/components/admin/PromotionForm";

export const metadata: Metadata = { title: "Promotion – Admin – Book Store" };

/** US-26 (CR-02): set, change or remove the promotion of one title. */
export default async function BookPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const book = await getEditableBook(supabase, id);
  if (!book) notFound();
  const promotion = await getPromotion(supabase, book.id);

  const today = todayInVietnam();
  const now = effectivePrice(book.price, promotion, today);

  return (
    <>
      <Link href="/admin/books" className="inline-flex min-h-11 items-center text-sm text-brand hover:underline">
        ← Back to books
      </Link>
      <h1 className="text-2xl font-semibold break-words">Promotion for “{book.title}”</h1>

      <section aria-labelledby="current-heading" className="mt-6 rounded-lg border border-line bg-surface p-5 text-sm">
        <h2 id="current-heading" className="text-lg font-semibold">
          Current price
        </h2>
        {promotion ? (
          <p className="mt-2">
            -{promotion.discount_percent}% from {promotion.start_date} to {promotion.end_date} ·{" "}
            <span className="font-medium">{promotionStatus(promotion, today)}</span>
          </p>
        ) : (
          <p className="mt-2 text-muted">No promotion.</p>
        )}
        <p className="mt-1">
          Customers pay today: <span className="font-semibold">{formatPrice(now.price)}</span>
          {now.discountPercent !== null && <span className="text-muted"> (original {formatPrice(now.originalPrice)})</span>}
        </p>
      </section>

      <section aria-labelledby="form-heading" className="mt-6 rounded-lg border border-line bg-surface p-5">
        <h2 id="form-heading" className="mb-4 text-lg font-semibold">
          {promotion ? "Change promotion" : "Set promotion"}
        </h2>
        <PromotionForm
          saveAction={savePromotionAction.bind(null, book.id)}
          removeAction={removePromotionAction.bind(null, book.id)}
          originalPrice={book.price}
          initial={
            promotion
              ? { discountPercent: String(promotion.discount_percent), startDate: promotion.start_date, endDate: promotion.end_date }
              : undefined
          }
        />
      </section>
    </>
  );
}

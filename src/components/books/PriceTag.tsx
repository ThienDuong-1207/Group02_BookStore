import { formatPrice } from "@/lib/format";
import type { EffectivePrice } from "@/lib/promotions/price";

type PriceTagProps = {
  /** Original price (used when there is no pricing information). */
  price: number;
  /** Today's price from the US-26 service; `discountPercent: null` = no active promotion. */
  pricing?: EffectivePrice;
  /** "card" on the book list (US-27), "detail" on the book page (US-28, larger). */
  size?: "card" | "detail";
};

const SIZES = {
  card: { original: "text-sm", sale: "font-semibold", label: "text-xs px-2", plain: "font-semibold" },
  detail: { original: "text-base", sale: "text-2xl font-semibold", label: "text-sm px-2.5", plain: "text-xl font-semibold" },
} as const;

/**
 * The price as customers see it (style guide §4 "Promotion price"), shared by the list card (US-27) and the
 * detail page (US-28) so both always look and behave the same:
 * - active promotion (CR-02 AC3): original price struck through, sale price in the accent colour, "-x%" label;
 * - no promotion, not started yet or ended (CR-02 AC4): only the original price.
 * Screen readers hear "Original price … Sale price …" instead of two bare numbers.
 */
export function PriceTag({ price, pricing, size = "card" }: PriceTagProps) {
  const style = SIZES[size];
  if (!pricing || pricing.discountPercent === null) {
    return <span className={style.plain}>{formatPrice(pricing?.price ?? price)}</span>;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="sr-only">Original price </span>
      <del className={`${style.original} text-muted`}>{formatPrice(pricing.originalPrice)}</del>
      <span className="sr-only">Sale price </span>
      <span className={`${style.sale} text-accent`}>{formatPrice(pricing.price)}</span>
      <span className={`${style.label} rounded-full bg-accent-surface py-0.5 font-semibold text-accent`}>-{pricing.discountPercent}%</span>
    </span>
  );
}

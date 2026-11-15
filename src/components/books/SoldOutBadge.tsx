/**
 * US-06 "Sold Out" label (style guide §4 Badges: `bg-danger-surface text-danger`).
 * Used on the list card, the detail page and the admin book list, so the label looks the same everywhere.
 */
export function SoldOutBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-danger-surface px-2.5 py-0.5 text-xs font-semibold text-danger ${className}`}>
      Sold Out
    </span>
  );
}

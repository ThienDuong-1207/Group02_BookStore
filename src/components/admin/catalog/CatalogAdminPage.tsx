import { createClient } from "@/lib/supabase/server";
import { listCatalogItems } from "@/lib/queries/catalog";
import { CATALOG, type CatalogKind } from "@/lib/validation/catalog";
import { CatalogAddForm } from "./CatalogAddForm";
import { CatalogItemRow } from "./CatalogItemRow";

/**
 * Shared admin page for categories (US-17) and authors (US-18): add form + list (hidden ones included, A → Z).
 * Access: the admin layout runs requireAdmin() (US-13 layer 2); every action checks again on the server.
 */
export async function CatalogAdminPage({ kind }: { kind: CatalogKind }) {
  const { label, plural } = CATALOG[kind];
  const supabase = await createClient();
  const items = await listCatalogItems(supabase, kind);
  const hiddenCount = items.filter((item) => item.is_hidden).length;
  const title = plural.charAt(0).toUpperCase() + plural.slice(1);

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted">
          {items.length} {items.length === 1 ? label.toLowerCase() : plural}
          {hiddenCount > 0 && ` · ${hiddenCount} hidden`}
        </p>
      </div>

      <section aria-labelledby={`add-${kind}-heading`} className="mt-6 rounded-lg border border-line bg-surface p-5">
        <h2 id={`add-${kind}-heading`} className="mb-3 text-lg font-semibold">
          Add {label.toLowerCase()}
        </h2>
        <CatalogAddForm kind={kind} />
      </section>

      <p className="mt-6 text-sm text-muted">
        Hidden {plural} are not shown to customers and are not offered in the book form. A {label.toLowerCase()} that
        still has books cannot be hidden.
      </p>

      {items.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-line bg-surface p-5 text-sm text-muted">
          No {plural} yet.
        </p>
      ) : (
        <ul aria-label={title} className="mt-3 rounded-lg border border-line bg-surface">
          {items.map((item) => (
            <CatalogItemRow key={item.id} kind={kind} item={item} />
          ))}
        </ul>
      )}
    </>
  );
}

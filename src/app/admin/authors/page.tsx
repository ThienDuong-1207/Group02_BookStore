import type { Metadata } from "next";
import { CatalogAdminPage } from "@/components/admin/catalog/CatalogAdminPage";

export const metadata: Metadata = { title: "Authors – Admin – Book Store" };

/** US-18: add, rename and hide authors (same rules as categories, US-17). */
export default function AdminAuthorsPage() {
  return <CatalogAdminPage kind="authors" />;
}

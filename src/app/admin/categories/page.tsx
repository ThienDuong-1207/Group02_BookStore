import type { Metadata } from "next";
import { CatalogAdminPage } from "@/components/admin/catalog/CatalogAdminPage";

export const metadata: Metadata = { title: "Categories – Admin – Book Store" };

/** US-17: add, rename and hide categories. */
export default function AdminCategoriesPage() {
  return <CatalogAdminPage kind="categories" />;
}

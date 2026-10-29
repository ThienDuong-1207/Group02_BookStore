/**
 * Admin menu (US-13 M1). Set `ready: true` when the story that builds the page is merged,
 * so the menu never links to a page that does not exist yet.
 */
export const ADMIN_SECTIONS = [
  { href: "/admin/books", title: "Books", description: "Add, edit and hide books; update stock.", story: "US-05, 15, 16, 06", ready: false },
  { href: "/admin/categories", title: "Categories", description: "Add, rename and hide categories.", story: "US-17", ready: false },
  { href: "/admin/authors", title: "Authors", description: "Add, rename and hide authors.", story: "US-18", ready: false },
  { href: "/admin/users", title: "Users", description: "Create accounts; lock and unlock them.", story: "US-14", ready: true },
] as const;

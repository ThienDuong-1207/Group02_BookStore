import { redirect } from "next/navigation";

/** Home = book list (PROJECT_SPEC.md §6). */
export default function Home() {
  redirect("/books");
}

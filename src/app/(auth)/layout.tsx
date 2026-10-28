import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";

/** /login and /register: a logged-in user has nothing to do here, so send them to the book list. */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (profile && profile.status === "ACTIVE") redirect("/books");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <div className="rounded-lg border border-line bg-surface p-6 shadow-sm sm:p-8">{children}</div>
    </main>
  );
}

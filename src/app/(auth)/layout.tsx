import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";

/**
 * /login and /register: a logged-in user has nothing to do here, so send them to the book list.
 * Layout (style guide §5): from 768 px the page is split in two – a green panel with a quotation and two
 * floating book shapes (decoration only) on the left, the form on the right. On phones only the form is shown.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (profile && profile.status === "ACTIVE") redirect("/books");

  return (
    <main className="grid flex-1 md:grid-cols-2">
      <aside aria-hidden="true" className="relative hidden flex-col justify-end overflow-hidden bg-brand p-10 text-brand-foreground md:flex lg:p-14">
        <div className="animate-float absolute top-12 right-[30%] w-32 -rotate-[8deg] lg:w-40">
          <div className="book-cover relative aspect-[2/3] bg-brand-deep" />
        </div>
        <div className="animate-float absolute top-24 right-[8%] w-32 rotate-[9deg] [animation-delay:-3s] lg:w-40">
          <div className="book-cover relative aspect-[2/3] bg-accent" />
        </div>
        <blockquote className="max-w-sm font-serif text-3xl leading-tight font-medium italic lg:text-4xl">
          A room without books is like a body without a soul.
        </blockquote>
        <p className="mt-4 text-sm text-on-brand-muted">Attributed to Cicero</p>
      </aside>

      <div className="flex items-center justify-center px-4 py-10">
        <div className="animate-rise w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </main>
  );
}

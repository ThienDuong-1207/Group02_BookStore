import Link from "next/link";

const footerLink = "inline-flex min-h-11 items-center text-sm text-muted hover:text-brand md:min-h-8";

/**
 * Shared site footer (US-29 AC1): store info, links, ©. One column on phones, three from 768 px.
 * AC4: `mt-auto` + the full-height flex body in layout.tsx keep it at the bottom of the window on short pages.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-3">
        <section aria-labelledby="footer-store">
          <h2 id="footer-store" className="font-serif text-lg font-bold text-brand">
            Book Store
          </h2>
          <p className="mt-2 text-sm text-muted">
            Online catalogue of Ms. Le&apos;s book company – the course case study for Release 1.0.
          </p>
          <p className="mt-2 text-sm text-muted">
            Contact:{" "}
            <a href="mailto:support@bookstore.demo" className="text-brand underline-offset-2 hover:underline">
              support@bookstore.demo
            </a>
          </p>
        </section>

        <nav aria-labelledby="footer-explore">
          <h2 id="footer-explore" className="font-sans text-sm font-semibold">
            Explore
          </h2>
          <ul className="mt-2 flex flex-col">
            <li>
              <Link href="/books" className={footerLink}>
                Books
              </Link>
            </li>
            <li>
              <Link href="/login" className={footerLink}>
                Log in
              </Link>
            </li>
            <li>
              <Link href="/register" className={footerLink}>
                Register
              </Link>
            </li>
          </ul>
        </nav>

        <section aria-labelledby="footer-project">
          <h2 id="footer-project" className="font-sans text-sm font-semibold">
            Project
          </h2>
          <p className="mt-2 text-sm text-muted">Software Project Management (72ITSE41503)</p>
          <p className="text-sm text-muted">Van Lang University · Team 02</p>
        </section>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted">
          © 2026 Book Store · Team 02. Sample data for study purposes.
        </p>
      </div>
    </footer>
  );
}

import Link from "next/link";

const footerLink = "inline-flex min-h-11 items-center text-sm text-on-brand-muted transition-colors hover:text-brand-foreground md:min-h-8";
const footerHeading = "font-sans text-xs font-semibold tracking-[0.12em] text-brand-foreground uppercase";

/**
 * Shared site footer (US-29 AC1): store info, links, ©. One column on phones, three from 768 px.
 * AC4: `mt-auto` + the full-height flex body in layout.tsx keep it at the bottom of the window on short pages.
 * Dark green band (style guide §5): it closes the page and separates it clearly from the paper background.
 */
export function Footer() {
  return (
    <footer className="mt-auto bg-brand-deep text-on-brand-muted">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <section aria-labelledby="footer-store">
          <h2 id="footer-store" className="font-serif text-2xl font-semibold text-brand-foreground">
            Book Store
          </h2>
          <p className="mt-3 max-w-sm text-sm">
            Online catalogue of Ms. Le&apos;s book company – the course case study for Release 1.0.
          </p>
          <p className="mt-2 text-sm">
            Contact:{" "}
            <a href="mailto:support@bookstore.demo" className="text-brand-foreground underline-offset-2 hover:underline">
              support@bookstore.demo
            </a>
          </p>
        </section>

        <nav aria-labelledby="footer-explore">
          <h2 id="footer-explore" className={footerHeading}>
            Explore
          </h2>
          <ul className="mt-2 flex flex-col">
            <li>
              <Link href="/" className={footerLink}>
                Home
              </Link>
            </li>
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
          <h2 id="footer-project" className={footerHeading}>
            Project
          </h2>
          <p className="mt-3 text-sm">Software Project Management (72ITSE41503)</p>
          <p className="text-sm">Van Lang University · Team 02</p>
        </section>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs">© 2026 Book Store · Team 02. Sample data for study purposes.</p>
      </div>
    </footer>
  );
}

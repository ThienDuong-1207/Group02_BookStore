import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/profile";
import { ADMIN_SECTIONS } from "./sections";

export const metadata: Metadata = { title: "Admin – Book Store" };

/** US-13 M1: admin dashboard with links to Books, Categories, Authors, Users. */
export default async function AdminDashboard() {
  const profile = await getCurrentProfile();

  return (
    <>
      <h1 className="text-2xl font-semibold">Admin dashboard</h1>
      <p className="mt-1 text-sm text-muted">Logged in as {profile?.email}</p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {ADMIN_SECTIONS.map((section) => {
          const body = (
            <>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-1 text-sm text-muted">{section.description}</p>
              {!section.ready && <p className="mt-3 text-xs text-muted">Coming soon ({section.story})</p>}
            </>
          );
          return (
            <li key={section.href}>
              {section.ready ? (
                <Link
                  href={section.href}
                  className="block h-full rounded-lg border border-line bg-surface p-5 hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
                >
                  {body}
                </Link>
              ) : (
                <div className="h-full rounded-lg border border-dashed border-line bg-surface p-5 opacity-80">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

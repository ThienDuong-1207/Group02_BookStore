import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeNextPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Log in – Book Store" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Log in</h1>
      <p className="mb-6 text-sm text-muted">Welcome back to Book Store.</p>
      <LoginForm next={next ? safeNextPath(next) : undefined} />
    </>
  );
}

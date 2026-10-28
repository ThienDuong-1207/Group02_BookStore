import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book Store – Team 02",
  description: "Online bookstore – Release 1.0 (Software Project Management final project)",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="flex min-h-screen flex-col antialiased">
        <Header />
        {children}
        <footer className="mt-auto border-t border-line bg-surface">
          <p className="mx-auto max-w-6xl px-4 py-4 text-sm text-muted">
            Book Store · Team 02 · Software Project Management (72ITSE41503)
          </p>
        </footer>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book Store – Team 02",
  description: "Online bookstore – Release 1.0 (Software Project Management final project)",
};

/** Shared layout for every page (US-29): header, page content, footer. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      {/* Full-height flex column: the page grows, the footer stays at the bottom (US-29 AC4). overflow-x-clip: no sideways scroll (AC3). */}
      <body className="flex min-h-screen flex-col overflow-x-clip antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

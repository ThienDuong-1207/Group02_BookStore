import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BackToTop } from "@/components/motion/BackToTop";
import { CoverTransition } from "@/components/motion/CoverTransition";
import "./fonts.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book Store – Team 02",
  description: "Online bookstore – Release 1.0 (Software Project Management final project)",
};

/** Shared layout for every page (US-29): header, page content, footer. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <head>
        {/* The two font files almost every page needs: start downloading them together with the CSS. */}
        <link rel="preload" href="/fonts/fraunces-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/be-vietnam-pro-latin-400-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      {/* Full-height flex column: the page grows, the footer stays at the bottom (US-29 AC4). overflow-x-clip: no sideways scroll (AC3). */}
      <body className="flex min-h-screen flex-col overflow-x-clip antialiased">
        <Header />
        {children}
        <Footer />
        <BackToTop />
        <CoverTransition />
      </body>
    </html>
  );
}

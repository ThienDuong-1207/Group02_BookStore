import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book Store – Team 02",
  description: "Online bookstore – Release 1.0 (Software Project Management final project)",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}

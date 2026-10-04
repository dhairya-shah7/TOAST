import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TOAST — University Academic Operating System",
  description:
    "Teaching, Organization, Academics & Student Technology — High-Concurrency University Platform with Daylight Academic UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}

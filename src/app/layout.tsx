import type { Metadata } from "next";
import { Inter, Orbitron, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "TOAST — University Academic Operating System (Vengeance UI Edition)",
  description:
    "Teaching, Organization, Academics & Student Technology — High-Concurrency University Platform built with Vengeance UI interactions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${orbitron.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[#FAFAFA] text-zinc-950 font-sans antialiased selection:bg-zinc-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}

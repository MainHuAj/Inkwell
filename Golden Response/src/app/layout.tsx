import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Inkwell — writing worth reading",
  description: "A flat, multi-author blog where anyone can write, read, and discuss.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${newsreader.variable} font-sans`}>
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to content
          </a>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main id="main" className="flex-1">
              {children}
            </main>
            <footer className="border-t py-8">
              <div className="container flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
                <p>Inkwell — a place to write and be read.</p>
                <p>Built with Next.js, Prisma & PostgreSQL.</p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}

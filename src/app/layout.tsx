import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";

// Slice 1 — real brand fonts kept (Montserrat/Inter fetch from Google at
// BUILD time, a classic Railway build failure, so the skeleton exercises
// it), but the full SEO metadata (@/lib/seo, share images, robots/sitemap)
// returns with the marketing/SEO slice. See docs/26-incremental-deploy.md.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Case Atlas | Peakbritt Financial Group",
  description: "The strategy engine for the producer who's done guessing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

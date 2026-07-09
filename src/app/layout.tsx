import type { Metadata } from "next";
import { Montserrat, Inter, Playfair_Display } from "next/font/google";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/seo";
import "./globals.css";

// Brand typography, aligned with the PeakBritt marketing site
// (site/peakbritt-site.html): Playfair Display for display headlines,
// Montserrat for UI emphasis, Inter for body and dashboards. The app is the
// members' side of the same brand — same serif voice as the front door.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Peakbritt Financial Group`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "insurance case design software",
    "life insurance strategy engine",
    "annuity case design",
    "estate planning strategies for producers",
    "wholesaler handoff",
    "insurance sales software",
    "Peakbritt Financial Group",
    "Case Atlas",
  ],
  authors: [{ name: "Peakbritt Financial Group" }],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${montserrat.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

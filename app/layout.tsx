import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css";
import LayoutClient from "./layout-client";
import { absoluteUrl, getBaseUrl } from "@/lib/seo";
import { buildOrganizationSchema, buildWebsiteSchema } from "@/lib/schema";


const inter = Inter({ subsets: ["latin"] });
const organizationSchema = buildOrganizationSchema();
const websiteSchema = buildWebsiteSchema();

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: "WayToLab - Advanced Diagnostic Healthcare",
  description:
    "Book diagnostic tests from certified labs with home collection, AI-powered reports, and expert consultation",
  keywords: [
    "diagnostic tests",
    "health checkup",
    "lab tests",
    "medical tests",
    "healthcare",
  ],
  authors: [{ name: "WayToLab" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    title: "WayToLab - Advanced Diagnostic Healthcare",
    description: "Book diagnostic tests from certified labs",
    siteName: "WayToLab",
    url: absoluteUrl("/"),
    images: [
      {
        url: absoluteUrl("/logo.png"),
        width: 512,
        height: 512,
        alt: "WayToLab"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "WayToLab - Advanced Diagnostic Healthcare",
    description: "Book diagnostic tests from certified labs with home collection.",
    images: [absoluteUrl("/logo.png")]
  },
  alternates: {
    canonical: absoluteUrl("/")
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>

      <body
        className={`${inter.className} antialiased bg-gradient-to-b from-teal-50/20 via-white to-slate-50`}
      >
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema)
          }}
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema)
          }}
        />
        <LayoutClient>{children}</LayoutClient>
        <SpeedInsights />
      </body>
    </html>
  );
}

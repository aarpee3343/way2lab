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
  title: "Diagnostic Tests & Health Packages in Gurugram and Delhi | WayToLab",
  description:
    "Book blood tests, full body checkups, and health packages online in Gurugram and Delhi NCR with home sample collection, certified labs, and digital reports.",
  keywords: [
    "diagnostic tests gurugram",
    "diagnostic tests gurgaon",
    "diagnostic tests delhi",
    "blood test in gurugram",
    "blood test in delhi",
    "home collection blood test gurgaon",
    "health checkup packages gurugram",
    "full body checkup delhi ncr",
    "lab tests gurugram",
    "lab tests delhi",
    "nabl certified labs",
    "online diagnostic booking",
  ],
  authors: [{ name: "WayToLab" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    title: "Diagnostic Tests & Health Packages in Gurugram and Delhi | WayToLab",
    description:
      "Book blood tests and health packages in Gurugram and Delhi NCR with home collection, certified labs, and fast digital reports.",
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
    title: "Diagnostic Tests & Health Packages in Gurugram and Delhi | WayToLab",
    description:
      "Book blood tests and checkup packages in Gurugram and Delhi NCR with home sample collection and certified labs.",
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

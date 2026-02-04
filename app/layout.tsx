import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutClient from "./layout-client";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
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
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "THE IDENTITY RESET",
  description:
    "You are not stuck with the identity you were given. Question the identity you inherited, become conscious of who you are, and build who you want to become.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: { title: "THE IDENTITY RESET", description: "WAKE. RESET. BECOME.", type: "website" },
};

export const viewport: Viewport = { themeColor: "#000000" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Open+Sans:wght@400;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "HeimerClean Signal Hub", template: "%s | HeimerClean" },
  description: "On-device intelligence and silent Windows optimization.",
  authors: [{ name: "Enes Bozkurt" }],
  creator: "Enes Bozkurt",
  publisher: "HeimerClean",
  other: { developer: "Enes Bozkurt", signature: "enes-bozkurt" },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/brand/heimerclean-icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/brand/heimerclean-icon.png", type: "image/png" }],
  },
  openGraph: { siteName: "HeimerClean", type: "website", images: ["/opengraph-image"] },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body data-developer="Enes Bozkurt">{children}</body></html>;
}

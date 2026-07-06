import type { Metadata, Viewport } from "next";
import AuthGuard from "@/components/AuthGuard";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kutluk Promosyon Panel",
    template: "%s | Kutluk Promosyon Panel",
  },
  description: "Kutluk Promosyon takip, sipariş, cari, kargo ve finans paneli",
  applicationName: "Kutluk Promosyon Panel",
  appleWebApp: {
    capable: true,
    title: "Kutluk Panel",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
    shortcut: "/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#070812",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
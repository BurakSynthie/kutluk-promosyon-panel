import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kutluk Promosyon Panel",
  description: "Kutluk Promosyon takip ve finans paneli",
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
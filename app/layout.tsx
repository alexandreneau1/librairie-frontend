import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bookdog — Librairie indépendante Paris 17e",
  description: "Librairie indépendante au cœur du 17e arrondissement de Paris.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontSize: '18px', margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
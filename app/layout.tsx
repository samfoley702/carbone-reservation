import type { Metadata } from "next";
import { Cormorant_Garamond, Oswald } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Carbone New York",
  description:
    "Carbone, located in NYC's Greenwich Village, is an Italian-American restaurant by Mario Carbone, Rich Torrisi, and Jeff Zalaznick, offering a quintessential New York dining experience.",
  keywords: "Italian fine dining, Italian wine pairings, Carbone NYC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${oswald.variable}`}>
      <body>{children}</body>
    </html>
  );
}

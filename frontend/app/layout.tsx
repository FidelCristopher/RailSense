import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "RailSense | Intelligent Railway Crossing Interlocking",
  description: "Next-Generation Computer Vision for Railway Crossing Safety & Smart Traffic Light Interlocking",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`scroll-smooth ${outfit.variable}`}>
      <body className="bg-neutral-950 text-white font-sans antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}

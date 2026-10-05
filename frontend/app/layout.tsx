import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RailSense | Smart Railway Crossing & Traffic Light Interlocking",
  description: "Real-time AI Computer Vision System for Railway Crossing Safety & Traffic Light Interlocking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

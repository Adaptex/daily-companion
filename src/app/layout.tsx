import type { Metadata } from "next";
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { JarvisFloat } from "@/components/JarvisFloat";
import "./globals.css";

const display = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  subsets: ["latin"],
});

const sans = Inter_Tight({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daily Companion — Morning Edition",
  description: "Your personal morning briefing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <div className="dawn-glow absolute inset-x-0 top-0 h-[480px] pointer-events-none -z-10" />
        <div className="paper-grain absolute inset-0 opacity-40 pointer-events-none -z-10 mix-blend-multiply" />
        {children}
        <JarvisFloat />
      </body>
    </html>
  );
}

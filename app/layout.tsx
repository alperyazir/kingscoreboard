import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <svg className="fixed inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cards-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M30,10 L50,40 L70,10 M50,40 L50,70 M35,50 L65,50" stroke="currentColor" fill="none" strokeWidth="3"/>
              <circle cx="50" cy="25" r="5" fill="currentColor"/>
              <path d="M45,60 Q50,70 55,60" stroke="currentColor" fill="none" strokeWidth="3"/>
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#cards-pattern)"/>
        </svg>
        {children}
      </body>
    </html>
  );
}

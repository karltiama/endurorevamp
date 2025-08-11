import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RootProvider } from "@/providers/root-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppFooter } from "@/components/AppFooter";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Enduro Revamp",
  description: "Training analytics and activity tracking platform",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ErrorBoundary>
          <RootProvider>
            <main className="flex-1">
              {children}
            </main>
            <AppFooter />
          </RootProvider>
        </ErrorBoundary>
        <Script
          src="https://umami.is/script.js"
          data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || ''}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

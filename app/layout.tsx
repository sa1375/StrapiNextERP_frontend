import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import SessionWrapper from "@/components/SessionWrapper";
import { Toaster } from "sonner";

const Inter = localFont({
  src: [
    {
      path: "../assets/fonts/Inter-VariableFont.ttf",
      weight: "400",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "Nava ERP | Landing",
  description:
    "Cloud-native ERP landing page showcasing demo, features, pricing, and FAQs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${Inter.className} antialiased`}>
        <SessionWrapper>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}

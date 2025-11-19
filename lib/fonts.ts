// lib/fonts.ts
import localFont from "next/font/local";

export const inter = localFont({
  src: [{ path: "../assets/fonts/Inter-VariableFont.ttf", weight: "400" }],
  display: "swap",
  variable: "--font-inter",
});

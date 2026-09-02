import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
 title: "YOUTENT — Where Talent Meets Opportunity",
  description:
    "Find talented video editors, voiceover artists and thumbnail designers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
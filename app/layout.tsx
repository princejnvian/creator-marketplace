import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  icons: { icon: "/youtent-favicon.png", shortcut: "/youtent-favicon.png", apple: "/youtent-favicon.png" },
  title: "YOUTENT — Where Talent Meets Opportunity",
  description:
    "YOUTENT connects businesses, creators, and freelancers with talented professionals for video editing, thumbnail design, voice over, and more.",
  keywords: [
    "YOUTENT",
    "creator marketplace",
    "freelancers",
    "video editors",
    "thumbnail designers",
    "voice over artists",
    "YouTube creators",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
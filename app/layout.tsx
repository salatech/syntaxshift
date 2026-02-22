import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SyntaxShift",
  description: "Convert across data and code formats instantly.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

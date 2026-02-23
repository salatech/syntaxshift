import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://syntaxshifts.vercel.app"),
  title: {
    default: "SyntaxShift | Smart Format Transformations",
    template: "%s | SyntaxShift",
  },
  description:
    "Convert code and data formats instantly in your browser. Transform JSON, YAML, XML, Markdown, SVG, HTML, and programming languages.",
  keywords: [
    "syntaxshift",
    "format converter",
    "json to typescript",
    "yaml to json",
    "xml to json",
    "markdown to html",
    "svg to jsx",
    "python to javascript",
    "javascript to python",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "https://syntaxshifts.vercel.app",
    title: "SyntaxShift | Smart Format Transformations",
    description:
      "Convert code and data formats instantly in your browser. JSON, YAML, XML, Markdown, SVG, HTML, Python, and JavaScript.",
    siteName: "SyntaxShift",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "SyntaxShift logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "SyntaxShift | Smart Format Transformations",
    description:
      "Convert code and data formats instantly in your browser. JSON, YAML, XML, Markdown, SVG, HTML, Python, and JavaScript.",
    images: ["/icon.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.json",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }`}
        </Script>
      </body>
    </html>
  );
}


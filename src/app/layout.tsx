import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nazyli.com"),
  title: "Evry Nazyli - AI Engineer",
  description:
    "Portfolio of Evry Nazyli, AI Engineer. A journey through the universe - intelligent systems, LLM applications, and backend engineering.",
  applicationName: "Nazyli Universe",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nazyli.com",
    siteName: "Nazyli Universe",
    title: "Evry Nazyli - AI Engineer",
    description: "A journey through the universe of Evry Nazyli, AI Engineer.",
    images: [
      {
        url: "/nazyli-og.png",
        width: 1200,
        height: 630,
        alt: "Evry Nazyli — AI Engineer portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Evry Nazyli - AI Engineer",
    description: "A journey through the universe of Evry Nazyli, AI Engineer.",
    images: ["/nazyli-og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#05060F",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body className="min-h-dvh bg-void text-starlight">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-abyss focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-[0.25em] focus:text-accent"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}

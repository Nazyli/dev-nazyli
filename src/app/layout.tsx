import type { Metadata, Viewport } from "next";
import {
  GITHUB_PROFILE_URL,
  LINKEDIN_PROFILE_URL,
} from "@/data/contact";
import { SITE_URL } from "@/lib/site";
import { fontVariables } from "./fonts";
import "./globals.css";

const SITE_DESCRIPTION =
  "Portfolio of Evry Nazyli, AI Engineer. A journey through the universe - intelligent systems, LLM applications, and backend engineering.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  title: "Evry Nazyli - AI Engineer",
  description: SITE_DESCRIPTION,
  applicationName: "Nazyli Universe",
  authors: [{ name: "Evry Nazyli", url: SITE_URL }],
  creator: "Evry Nazyli",
  keywords: [
    "Evry Nazyli",
    "AI Engineer",
    "LLM systems",
    "Voice AI",
    "Backend engineering",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Nazyli Universe",
    title: "Evry Nazyli - AI Engineer",
    description: SITE_DESCRIPTION,
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
    description: SITE_DESCRIPTION,
    images: ["/nazyli-og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#05060F",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#person`,
        name: "Evry Nazyli",
        url: SITE_URL,
        jobTitle: "AI Engineer",
        description: SITE_DESCRIPTION,
        knowsAbout: ["LLM systems", "Voice AI", "Backend engineering"],
        sameAs: [GITHUB_PROFILE_URL, LINKEDIN_PROFILE_URL],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Nazyli Universe",
        url: SITE_URL,
        inLanguage: "en",
        publisher: { "@id": `${SITE_URL}/#person` },
      },
    ],
  };

  return (
    <html
      lang="en"
      className={`${fontVariables} antialiased`}
    >
      <body className="min-h-dvh bg-void text-starlight">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
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

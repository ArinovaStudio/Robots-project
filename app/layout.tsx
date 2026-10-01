import type { Metadata, Viewport } from "next";
import { sfPro } from "@/fonts";
import "./globals.css";
import AuthProvider from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";
import { WebVitals } from "@/components/analytics/web-vitals";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connecto.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Connecto - Business Network to Exchange Services",
    template: "%s | Connecto",
  },
  description: "Find and offer B2B services. Connect with verified businesses.",
  alternates: {
    canonical: "/",
    languages: {
      "en-IN": "/",
      "x-default": "/",
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLdOrgAndWebSite = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "Connecto",
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      description: "Find and offer B2B services. Connect with verified businesses.",
      sameAs: [
        "https://www.linkedin.com/company/connecto",
        "https://twitter.com/connecto"
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: "Connecto",
      publisher: {
        "@id": `${baseUrl}/#organization`
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${baseUrl}/directory?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sfPro.className} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdOrgAndWebSite).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#f5f5f5]">
        <AuthProvider>
          <WebVitals />
          <Toaster position="bottom-left" />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

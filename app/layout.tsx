import type { Metadata } from "next";
import { sfPro } from "@/fonts";
import "./globals.css";
import AuthProvider from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connecto.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Connecto - Business Network to Exchange Services",
    template: "%s | Connecto",
  },
  description: "Find and offer B2B services. Connect with verified businesses.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sfPro.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f5f5f5]">
        <AuthProvider>
            <Toaster position="bottom-left" />
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}

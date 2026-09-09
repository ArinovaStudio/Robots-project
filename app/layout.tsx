import type { Metadata } from "next";
import { sfPro } from "@/fonts";
import "./globals.css";
import AuthProvider from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Connecto - B2B Matchmaking",
  description: "Connect with the right businesses and grow your network.",
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
            <Toaster />
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}

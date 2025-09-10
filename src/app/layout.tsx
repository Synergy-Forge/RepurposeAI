import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { TRPCReactProvider } from "@/components/providers/trpc-provider";
import { TranslationProvider } from "@/lib/i18n";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Repurpose - Your content, reborn",
  description: "Create professional videos with AI-powered editing tools. Transform your content with intelligent editing, templates, and 4K export capabilities.",
  keywords: ["video editing", "AI", "content creation", "online editor"],
  authors: [{ name: "Repurpose Team" }],
  openGraph: {
    title: "Repurpose - Your content, reborn",
    description: "Create professional videos with AI-powered editing tools.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.className} antialiased`}>
        <TranslationProvider>
          <SessionProvider>
            <TRPCReactProvider>
              {children}
            </TRPCReactProvider>
          </SessionProvider>
        </TranslationProvider>
      </body>
    </html>
  );
}

import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { draftMode } from "next/headers";

import { ChatWidget } from "@/components/chat/ChatWidget";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PreviewBanner } from "@/components/preview/PreviewBanner";
import { RefreshRouteOnSave } from "@/components/preview/RefreshRouteOnSave";
import { archivo } from "@/lib/fonts";
import { baseOpenGraph } from "@/lib/seo";
import { isIndexable, siteUrl } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "MONIP Group",
    template: "%s | MONIP Group",
  },
  description: "MONIP Group merchandising and product sourcing.",
  openGraph: baseOpenGraph,
  robots: isIndexable() ? undefined : { index: false, follow: false },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { isEnabled: preview } = await draftMode();
  return (
    <html lang="en" className={`${archivo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        {preview && (
          <>
            <PreviewBanner />
            <RefreshRouteOnSave serverURL={siteUrl()} />
          </>
        )}
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        {!preview && (
          <>
            <ChatWidget />
            <Analytics />
          </>
        )}
      </body>
    </html>
  );
}

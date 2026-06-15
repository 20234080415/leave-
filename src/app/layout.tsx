import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/bottom-nav";
import { CapsuleFloatingButton } from "@/components/capsule-floating-button";
import { PwaRegistration } from "@/components/pwa-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "留白 Leave",
    template: "%s · 留白 Leave",
  },
  description: "把想说的话，轻轻放在这里。",
  applicationName: "留白 Leave",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "留白",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f3f0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta name="apple-mobile-web-app-title" content="留白" />
      </head>
      <body>
        <div className="app-shell">
          <main className="page-content">{children}</main>
          <CapsuleFloatingButton />
          <BottomNav />
        </div>
        <PwaRegistration />
      </body>
    </html>
  );
}

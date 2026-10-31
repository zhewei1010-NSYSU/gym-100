import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "健身房 100 次｜每一次，都算數",
  description: "你的私人健身打卡本。記錄每次訓練，一步一步走向 100 次。",
  robots: { index: false, follow: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">{children}</body>
    </html>
  );
}

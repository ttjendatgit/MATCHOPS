import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "vietnamese"],
  variable: "--font-heading",
  display: "swap",
});

import { SignalRProvider } from "@/providers/SignalRProvider";
import ChatBubble from "@/components/chat/ChatBubble";

export const metadata: Metadata = {
  title: {
    default: "MatchOps – Đặt sân thể thao trực tuyến",
    template: "%s | MatchOps",
  },
  description: "Nền tảng đặt sân thể thao trực tuyến hàng đầu Việt Nam",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`dark ${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <SignalRProvider>
          {children}
          <ChatBubble />
          <Toaster richColors position="top-right" />
        </SignalRProvider>
      </body>
    </html>
  );
}

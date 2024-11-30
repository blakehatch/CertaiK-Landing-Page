import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CertaiK",
  description: "AI Agent Smart Contract Auditor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="sticky top-0 bg-black/30 backdrop-blur-lg text-white py-4 shadow-lg z-50">
          <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
            <a href="https://t.me/CertaiKVirtuals" className="text-cyan-400 hover:underline">
              Telegram
            </a>
            <a href="https://x.com/CertaiK_Agent" className="text-cyan-400 hover:underline">
              Twitter
            </a>
            <a href="https://fun.virtuals.io/agents/0x6Cc1Cb82cb8f7a55E74829eEa65F49D3897D4Ef3" className="text-cyan-400 hover:underline">
              Buy $CERTAI
            </a>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

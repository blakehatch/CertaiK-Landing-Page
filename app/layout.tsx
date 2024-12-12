import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";

const figtree = Figtree({ subsets: ['latin'] })

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
        className={`${figtree.className} antialiased`}
      >
        <Header/>  
        {children}
      </body>
    </html>
  );
}

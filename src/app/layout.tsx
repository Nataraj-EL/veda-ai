import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import ClickBurstProvider from "@/components/ClickBurstProvider";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "VedaAI",
  description: "Create, calibrate, and print professional high-quality academic assessments and question papers powered by intelligent parameters.",
  icons: {
    icon: "/images/veda-brand-icon-mono.png",
    shortcut: "/images/veda-brand-icon-mono.png",
    apple: "/images/veda-brand-icon-mono.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <ClickBurstProvider>{children}</ClickBurstProvider>
      </body>
    </html>
  );
}

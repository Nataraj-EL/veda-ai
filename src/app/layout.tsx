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
  title: "VedaAI - AI Assessment & Creator Platform",
  description: "Create, calibrate, and print professional high-quality academic assessments and question papers powered by intelligent parameters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased relative">
        <ClickBurstProvider>{children}</ClickBurstProvider>
        {/* iOS-style bottom gesture line indicator for mobile layouts */}
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 w-[134px] h-[5px] rounded-full bg-[#9c9c9c] pointer-events-none md:hidden" />
      </body>
    </html>
  );
}

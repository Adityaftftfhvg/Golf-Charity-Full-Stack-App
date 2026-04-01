import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Golf Charity — Play. Win. Give.",
  description:
    "A subscription golf platform combining Stableford score tracking, monthly prize draws, and direct charity contributions. Every round you play makes a difference.",
  keywords: ["golf", "charity", "prize draw", "stableford", "subscription"],
  openGraph: {
    title: "Golf Charity — Play. Win. Give.",
    description: "Every round you play makes a difference.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className={`${dmSans.className} min-h-full flex flex-col bg-[#080c14] text-slate-100`}>
        {/* Global grain texture */}
        <div className="grain" aria-hidden="true" />
        {/* Global Navbar — appears on every page */}
        <Navbar />
       


        <main style={{ flex: 1 }}>{children}</main>
<Footer />
      </body>
    </html>
  );
}

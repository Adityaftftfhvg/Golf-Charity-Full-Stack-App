import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
const inter = Inter({
  variable: "--font-dm-sans",   // keep same CSS var — no other files need changing
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-playfair",  // keep same CSS var — no other files need changing
  subsets: ["latin"],
  weight: ["600", "700"],
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
    className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
    <body className={`${inter.className} min-h-full flex flex-col bg-[#080c14] text-slate-100`}>
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

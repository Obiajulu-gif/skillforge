import type { Metadata } from "next";
import { Inter, Outfit, Fira_Code } from "next/font/google";
import "./globals.css";
import { Navbar } from "./components/Navbar";
import { RainbowKitSetup } from "@/RainbowKitSetup";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "SkillForge | The AI Skills Marketplace",
  description: "Monetize your MCP skills and empower AI agents with specialized capabilities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable} ${firaCode.variable} font-sans antialiased bg-background text-foreground`}>
        <RainbowKitSetup>
          <Navbar showDeck />
          {children}
        </RainbowKitSetup>
      </body>
    </html>
  );
}

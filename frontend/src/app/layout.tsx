import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "FormPilot", template: "%s · FormPilot" },
  description: "Your AI co-pilot for job applications. Fill any job form in one click.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-muted font-sans text-text-base antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

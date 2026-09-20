import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import { Chrome } from "@/components/layout/Chrome";
import "./globals.css";

const sans = Noto_Sans_JP({
  variable: "--font-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const serif = Noto_Serif_JP({
  variable: "--font-serif-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-ibm",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "仮想日本人 — Synthetic Survey",
  description:
    "人口統計で加重した仮想日本人パネルに、アンケートを投げて瞬時に集計する合成調査（Synthetic Survey）。実在の回答者ではありません。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${sans.variable} ${serif.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Chrome>{children}</Chrome>
      </body>
    </html>
  );
}

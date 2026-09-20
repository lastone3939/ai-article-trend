import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Chrome } from "@/components/layout/Chrome";
import "./globals.css";

const sans = Noto_Sans_JP({
  variable: "--font-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "仮想日本人 — Synthetic Survey",
  description:
    "仮想日本人パネル（合成）にアンケートを投げ、瞬時に集計する Synthetic Survey。実在の回答者ではありません。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${sans.variable} h-full antialiased`}>
      <body className="h-full overflow-hidden bg-page font-sans">
        <Chrome>{children}</Chrome>
      </body>
    </html>
  );
}

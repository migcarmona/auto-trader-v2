import type { Metadata } from "next";
import "./globals.css";
import dynamic from "next/dynamic";

const Providers = dynamic(
  () => import("./providers").then((m) => ({ default: m.Providers })),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "AstraX — Scalping Engine",
  description: "Painel de controlo do bot de scalping",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="scanlines grid-bg min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

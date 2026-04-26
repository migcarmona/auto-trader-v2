import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoTrader — Scalping Bot",
  description: "Painel de controlo do bot de scalping para Binance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="scanlines grid-bg min-h-screen">
        {children}
      </body>
    </html>
  );
}
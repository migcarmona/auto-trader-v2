import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "./client-providers";

export const metadata: Metadata = {
  title: "AstraX — Scalping Engine",
  description: "Painel de controlo do bot de scalping",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="scanlines grid-bg min-h-screen">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}

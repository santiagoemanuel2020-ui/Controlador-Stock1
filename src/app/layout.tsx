import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockControl — Gestión de Inventario",
  description: "Sistema de gestión de stock para pequeños negocios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

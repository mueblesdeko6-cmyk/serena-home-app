import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Serena Home — Catálogo Mayorista",
  description: "Textiles de cama y hogar premium para hoteles, alquileres y tiendas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

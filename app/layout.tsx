import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'KIPUX — Inventario Inteligente',
  description: 'Gestiona tu inventario de forma inteligente. Controla stock, movimientos, almacenes y auditorías en tiempo real.',
  keywords: ['inventario', 'stock', 'almacén', 'gestión', 'pyme', 'kipux'],
  authors: [{ name: 'KIPUX' }],
  creator: 'KIPUX',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

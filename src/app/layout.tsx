import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AppLayout from "@/components/AppLayout";
import PWARegister from "@/components/PWARegister";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Control de Inventario",
  description: "Sistema profesional de control de inventario multi-tienda",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  appleWebApp: { capable: true, title: "Inventario" },
  icons: [{ rel: "icon", url: "/icon-192.png", sizes: "192x192" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <PWARegister />
        <ThemeProvider>
          <AuthProvider>
            <AppLayout>{children}</AppLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

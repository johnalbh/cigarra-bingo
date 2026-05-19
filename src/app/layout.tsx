import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Bingo Virtual — Fundación Cigarra",
  description:
    "Bingo Virtual de Fundación Cigarra. Compra tu cartón, juega en vivo y apoya la educación de los niños y niñas de Ciudad Bolívar.",
  metadataBase: new URL("https://bingo.cigarra.org"),
  openGraph: {
    title: "Bingo Virtual — Fundación Cigarra",
    description:
      "Vive el Bingo Virtual de Cigarra. Cada cartón apoya nuestra labor educativa.",
    images: ["/images/logo-principal.webp"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

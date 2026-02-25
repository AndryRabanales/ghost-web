import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GhostMessage",
  // --- 👇 AÑADE ESTO ---
  icons: {
    icon: '/icon.png', // Asegúrate de que tu PNG se llame icon.png y esté en src/app/
    // apple: '/apple-icon.png', // Opcional para Apple si tienes otro icono
  },
  // --- 👆 HASTA AQUÍ ---
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
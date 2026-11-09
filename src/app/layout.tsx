import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import GlobalHeader from "@/components/GlobalHeader";
import { UIProvider } from "@/context/UIContext";

export const metadata: Metadata = {
  title: "TurnoVivo App",
  description: "Agenda inteligente anti-no-show",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased bg-zinc-950">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-emerald-500 focus:px-3 focus:py-2 focus:font-bold focus:text-zinc-950"
        >
          Saltar al contenido principal
        </a>
        <AuthProvider>
          <UIProvider>
            <div className="min-h-screen bg-zinc-950">
              <GlobalHeader />
              <main id="main-content" tabIndex={-1} className="focus:outline-none">
                {children}
              </main>
            </div>
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

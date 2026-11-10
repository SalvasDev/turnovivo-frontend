import type { Metadata } from "next";
import { Inter, Maven_Pro } from "next/font/google";
import "./globals.css";
import "@/design-system/tokens/tokens.css";
import { AuthProvider } from "@/context/AuthContext";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import { UIProvider } from "@/context/UIContext";
import styles from "./layout.module.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mavenPro = Maven_Pro({ subsets: ["latin"], variable: "--font-maven-pro", display: "swap" });

export const metadata: Metadata = {
  title: "TurnoVivo App",
  description: "Agenda inteligente anti-no-show",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${mavenPro.variable}`}>
      <body className={styles.body}>
        <a
          href="#main-content"
          className={styles.skipLink}
        >
          Saltar al contenido principal
        </a>
        <AuthProvider>
          <UIProvider>
            <div className={styles.shell}>
              <GlobalHeader />
              <main id="main-content" tabIndex={-1} className={styles.main}>
                {children}
              </main>
              <GlobalFooter />
            </div>
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

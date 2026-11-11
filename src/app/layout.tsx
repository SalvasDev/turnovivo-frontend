import type { Metadata } from "next";
import { Inter, Maven_Pro } from "next/font/google";
import "./globals.css";
import "@/design-system/tokens/tokens.css";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";
import { themeInitScript } from "@/context/theme-init";
import styles from "./layout.module.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mavenPro = Maven_Pro({ subsets: ["latin"], variable: "--font-maven-pro", display: "swap" });

export const metadata: Metadata = {
  title: "TurnoVivo App",
  description: "Real-time appointment booking with a smart waitlist",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mavenPro.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={styles.body}>
        <a
          href="#main-content"
          className={styles.skipLink}
        >
          Jump to main content
        </a>
        <AuthProvider>
          <UIProvider>{children}</UIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

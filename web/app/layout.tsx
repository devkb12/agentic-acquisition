import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { THEME_COLOR, THEME_SCRIPT } from "@/lib/theme";
import "./tokens.css";
import "./globals.css";

const sans = Geist({ variable: "--nf-sans", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({ variable: "--nf-mono", subsets: ["latin"], display: "swap" });
const serif = Newsreader({ variable: "--nf-serif", subsets: ["latin"], display: "swap", axes: ["opsz"] });

export const metadata: Metadata = {
  title: {
    default: "Lodestar · Acquisition intelligence",
    template: "Lodestar · %s",
  },
  description:
    "Lodestar researches Florida and Georgia insurance-defense law firms for TrueGrit Capital and VIMANA. AI researches. People decide.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.dark },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}

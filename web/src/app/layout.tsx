import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { DevAnnotations } from "@/components/dev-annotations";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GastroBeleg",
  description:
    "Lieferschein fotografieren. Fertig. Preiskontrolle für deinen Einkauf und fertige Buchhaltung für deinen Steuerberater.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      // next-themes writes the class on the html element before paint
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          {children}
          <Toaster position="top-center" />
          <DevAnnotations />
        </ThemeProvider>
      </body>
    </html>
  );
}

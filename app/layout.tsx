import type { Metadata } from "next";
import { Bebas_Neue, Syne } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Eco Habit Tracker – Track your daily environmental impact",
  description: "Log your transport, food and energy habits. Get an Eco Score, compete with friends and reduce your carbon footprint – one habit at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${bebasNeue.variable} ${syne.variable}`}>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
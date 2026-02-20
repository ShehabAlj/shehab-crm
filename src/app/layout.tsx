import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shehab CRM",
  description: "Executive Management System",
};

import { createClient } from "@/utils/supabase/server";

// ...

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <Sidebar userEmail={user?.email} />
            <main className="flex-1 overflow-y-auto h-screen p-8">
            {children}
            </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

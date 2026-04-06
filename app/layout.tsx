import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hardware Nation Content Tracker",
  description: "Kanban-style content pipeline tracker for Hardware Nation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}

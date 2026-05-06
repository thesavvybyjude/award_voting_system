import type { Metadata } from "next";
import "./globals.css";
import { VoteProvider } from "@/contexts/VoteContext";

export const metadata: Metadata = {
  title: "Class Awards 2026 — Vote for Your Favorites",
  description:
    "Cast your votes for the Class Awards 2026. Support your favorite nominees across multiple categories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <VoteProvider>{children}</VoteProvider>
      </body>
    </html>
  );
}

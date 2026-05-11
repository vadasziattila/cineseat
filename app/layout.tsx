import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineSeat",
  description: "Online mozijegy-foglalási rendszer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="hu"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

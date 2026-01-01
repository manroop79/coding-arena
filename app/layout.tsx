import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coding Agents Arena",
  description: "Parallel coding agents with live event streaming"
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


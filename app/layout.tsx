import { GoogleTagManager } from '@next/third-parties/google'
import type { Metadata } from "next";
import "./globals.css";
import AppShell from "../components/AppShell";

export const metadata: Metadata = {
  title: "Guardian Collision Network",
  description:
    "Guardian Collision Network helps vehicle owners navigate collision claims, documentation, and repair coordination while connecting them with qualified repair facilities.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AppShell>{children}</AppShell>
        <GoogleTagManager gtmId="GTM-5N2Q6JKF" />
      </body>
    </html>
  );
}
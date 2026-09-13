import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOVA Workspace — AI Workspace for Modern Product & Engineering Teams",
  description:
    "Turn ideas into momentum. One unified workspace for planning, building, and understanding what your product and engineering team is creating.",
  keywords: [
    "AI workspace",
    "product management",
    "issue tracking",
    "engineering velocity",
    "developer tools",
    "contextual AI",
    "linear alternative",
    "software teams"
  ],
  authors: [{ name: "NOVA Workspace Inc." }],
  openGraph: {
    title: "NOVA Workspace — Turn Ideas Into Momentum",
    description:
      "One unified workspace for planning, building, and understanding what your team is creating.",
    url: "https://nova.workspace",
    siteName: "NOVA Workspace",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "NOVA Workspace — AI Workspace for Product & Engineering",
    description:
      "One workspace for planning, building and understanding what your team is creating."
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased scroll-smooth" suppressHydrationWarning>
      <body
        className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] flex flex-col"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BelfastBuild AI — Planning Compliance Pre-Screener",
  description:
    "Agentic RAG over Northern Ireland planning policy. Pre-screen proposals in seconds.",
};

export const viewport: Viewport = {
  themeColor: "#0b132b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import ClientShell from "./ClientShell";

export const metadata: Metadata = {
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased relative font-[Vazirmatn]">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}

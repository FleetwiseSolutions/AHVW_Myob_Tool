import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/StoreProvider";

export const metadata: Metadata = {
  title: "AHVW Myob Tool",
  description: "Create MYOB invoices from completed AHVW jobs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}

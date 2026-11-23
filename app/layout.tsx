import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import Breadcrumbs from "../components/Breadcrumbs";
import { ThemeProvider } from "../components/ThemeProvider";
import ErrorBoundary from "../components/ErrorBoundary";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Salesaty | نظام إدارة المبيعات",
  description: "نظام متكامل لإدارة المبيعات والمخزون والمشتريات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <ThemeProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  fontFamily: "inherit",
                  direction: "rtl",
                  background: "var(--color-card-bg)",
                  color: "var(--color-fg)",
                  boxShadow: "0 10px 25px rgba(250,105,158,0.15)",
                  borderRadius: "16px",
                  padding: "14px 18px",
                  border: "1px solid var(--color-primary-100)",
                },
                success: {
                  iconTheme: { primary: "#22C55E", secondary: "#fff" },
                },
                error: {
                  iconTheme: { primary: "#EF4444", secondary: "#fff" },
                },
              }}
            />
            <ErrorBoundary>
              <Breadcrumbs />
              {children}
            </ErrorBoundary>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
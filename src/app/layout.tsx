import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { getCurrentTenant } from "@/lib/tenant";
import { resolveTheme } from "@/lib/theme/resolve";
import { CartProvider } from "@/lib/cart/CartContext";
import { CartCount } from "@/components/cart/CartCount";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  return {
    title: tenant.shopName,
    description: `${tenant.shopName} — ร้านพระเครื่องออนไลน์ ค้นหาตามจังหวัดและหลวงพ่อ`,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const tenant = await getCurrentTenant();
  const theme = resolveTheme(tenant.theme);

  const themeStyle = {
    "--background": theme.backgroundColor,
    "--foreground": theme.textColor,
    "--primary": theme.primaryColor,
    "--accent": theme.accentColor,
    "--surface": theme.surfaceColor,
    ...(theme.fontFamily && { "--font-theme": `'${theme.fontFamily}'` }),
  } as CSSProperties;

  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={themeStyle}
    >
      {theme.fontFamily && (
        <head>
          <link
            rel="stylesheet"
            href={`https://fonts.googleapis.com/css2?family=${theme.fontFamily.replace(/ /g, "+")}:wght@400;600;700&display=swap`}
          />
        </head>
      )}
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <header className="border-b border-black/10 bg-surface">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                {theme.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={theme.logoUrl} alt={tenant.shopName} className="h-8 w-8 rounded object-cover" />
                )}
                {tenant.shopName}
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/products" className="text-sm underline">
                  สินค้าทั้งหมด
                </Link>
                <Link href="/track-order" className="text-sm underline">
                  ติดตามออร์เดอร์
                </Link>
                <CartCount />
              </div>
            </div>
          </header>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}

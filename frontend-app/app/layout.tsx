import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider, THEME_BOOTSTRAP_SCRIPT } from "@/app/_lib/theme";

export const metadata: Metadata = {
  title: "The Sovereign Associate",
  description: "Elite Legal Intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        {/* Applies the saved theme before hydration to avoid a flash of the
            wrong palette on first paint. Script contents come from the
            ThemeProvider module so the logic stays in one place. */}
        <script
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-surface">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

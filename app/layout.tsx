import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "TimeManage HR System",
  description: "ระบบจัดการเวลาเข้า-ออกงาน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`antialiased bg-[var(--apple-surface-base)] text-[var(--apple-text-primary)] selection:bg-apple-blue selection:text-white min-h-full flex flex-col font-sans`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

import type {Metadata} from 'next';
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Upteky Solution Pvt Ltd',
  description: 'The centralized hub for Upteky Solution Pvt Ltd.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head />
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

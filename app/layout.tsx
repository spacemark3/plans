import type { Metadata } from 'next'
import { Archivo_Black, Geist, Geist_Mono } from 'next/font/google'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

/**
 * The poster face. Headings only — never body text.
 *
 * Archivo Black is NOT a variable font: it ships weight 400 and nothing else,
 * so `weight` must be passed explicitly or next/font throws at build time. That
 * single weight is already black; asking for 700 or 900 anywhere will silently
 * synthesise a faux-bold and ruin the letterforms, which is why the type scale
 * in globals.css pins `--text-poster--font-weight` and friends to 400.
 */
const archivoBlack = Archivo_Black({
  variable: '--font-display',
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Planotaki',
  description: 'Trips and challenges to do together.',
  // It's private — keep it out of every index.
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${archivoBlack.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}

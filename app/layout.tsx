import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ChessToGif',
  description: 'Create beautiful animated GIFs from chess moves and games',
  icons: {
    icon: '/ChessToGIf.png',
    shortcut: '/ChessToGIf.png',
    apple: '/ChessToGIf.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  )
}

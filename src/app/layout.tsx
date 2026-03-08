/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/context/AppContext'
import SWRegistrar from '@/components/SWRegistrar'

export const metadata: Metadata = {
  title: 'Werewords Việt',
  description: 'Companion app cho Werewords bằng tiếng Việt',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <head>
        <meta name="theme-color" content="#030712" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-950 text-white min-h-screen">
        <AppProvider>{children}</AppProvider>
        <SWRegistrar />
      </body>
    </html>
  )
}

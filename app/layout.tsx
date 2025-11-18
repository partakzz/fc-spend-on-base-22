import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const APP_URL = process.env.NEXT_PUBLIC_URL || 'https://fc-spend-on-base-22.vercel.app'

export const metadata: Metadata = {
  title: 'You Spend - Track Your Base Network Transactions',
  description: 'Track your ETH spending on fees and NFTs on Base Network',
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: 'You Spend',
    description: 'Track your ETH spending on fees and NFTs on Base Network',
    images: [`${APP_URL}/api/og`],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `${APP_URL}/api/og`,
    'fc:frame:button:1': 'Launch App',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': APP_URL,
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0052FF',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${APP_URL}/api/og`} />
        <meta property="fc:frame:button:1" content="Launch App" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content={APP_URL} />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'You Spend - Track Your Base Network Transactions',
  description: 'Track your ETH spending on fees and NFTs on Base Network',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `${process.env.NEXT_PUBLIC_URL || 'https://you-spend.vercel.app'}/api/og`,
    'fc:frame:button:1': 'Launch App',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': process.env.NEXT_PUBLIC_URL || 'https://you-spend.vercel.app',
  },
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
        <meta property="og:title" content="You Spend" />
        <meta property="og:description" content="Track your ETH spending on Base Network" />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://you-spend.vercel.app'}/api/og`} />
        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://you-spend.vercel.app'}/api/og`} />
        <meta name="fc:frame:button:1" content="Launch App" />
        <meta name="fc:frame:button:1:action" content="link" />
        <meta name="fc:frame:button:1:target" content={process.env.NEXT_PUBLIC_URL || 'https://you-spend.vercel.app'} />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetch current ETH price from CoinGecko
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { next: { revalidate: 30 } }
    )
    
    const data = await response.json()
    const price = data.ethereum?.usd || 3200
    
    return NextResponse.json({ price })
  } catch (error) {
    console.error('Error fetching ETH price:', error)
    return NextResponse.json({ price: 3200 }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ users: [] })
  }

  try {
    // Using Neynar API for Farcaster user search
    const neynarApiKey = process.env.NEYNAR_API_KEY
    
    if (!neynarApiKey) {
      console.log('No Neynar API key found, returning empty results')
      return NextResponse.json({ users: [] })
    }

    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          'Content-Type': 'application/json',
          'api_key': neynarApiKey,
        },
      }
    )

    if (!response.ok) {
      console.error('Neynar API error:', response.status)
      return NextResponse.json({ users: [] })
    }

    const data = await response.json()
    return NextResponse.json({ users: data.result?.users || [] })
  } catch (error) {
    console.error('Error searching Farcaster users:', error)
    return NextResponse.json({ users: [] })
  }
}

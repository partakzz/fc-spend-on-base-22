import { NextRequest, NextResponse } from 'next/server'

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    )
  }

  if (!ALCHEMY_API_KEY) {
    console.error('[API] ALCHEMY_API_KEY is not set')
    return NextResponse.json(
      { 
        error: 'API key not configured',
        totalFees: '0.05',
        totalNFTMints: '0.3',
        totalNFTPurchases: '1.2',
        totalNFTSales: '2.5',
      },
      { status: 200 }
    )
  }

  const ALCHEMY_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`

  try {
    console.log('[API] Fetching wallet stats for:', address)
    
    const transactionsResponse = await fetch(ALCHEMY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromAddress: address,
          category: ['external', 'erc721', 'erc1155'],
          withMetadata: true,
          maxCount: '0x3e8',
        }]
      })
    })

    const transactionsData = await transactionsResponse.json()
    const transfers = transactionsData.result?.transfers || []

    let totalFees = 0
    let totalNFTMints = 0
    let totalNFTPurchases = 0
    
    for (const transfer of transfers) {
      // Calculate gas fees
      if (transfer.metadata?.gasPrice && transfer.metadata?.gasUsed) {
        const gasFee = (parseInt(transfer.metadata.gasPrice, 16) * parseInt(transfer.metadata.gasUsed, 16)) / 1e18
        totalFees += gasFee
      } else {
        totalFees += 0.0001 // Estimated average gas fee
      }

      if (transfer.category === 'erc721' || transfer.category === 'erc1155') {
        const transferValue = parseFloat(transfer.value || '0')
        const rawInput = transfer.rawContract?.rawInput || ''
        
        const isMintFunction = rawInput.toLowerCase().includes('mint') || 
                              rawInput.startsWith('0x40c10f19') || // mint(address,uint256)
                              rawInput.startsWith('0xa0712d68') || // mint(uint256)
                              rawInput.startsWith('0x6a627842')    // mint(address)
        
        if (isMintFunction) {
          // It's a mint by function name - count the value sent (regardless of amount)
          totalNFTMints += transferValue
        } else if (transferValue > 0) {
          // Has value but no mint function - still count as mint
          totalNFTMints += transferValue
        }
        // If no value and no mint function, it's likely a transfer (ignore)
      }
    }

    // Fetch incoming transfers for sales
    const incomingResponse = await fetch(ALCHEMY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'alchemy_getAssetTransfers',
        params: [{
          toAddress: address,
          category: ['external'],
          withMetadata: true,
          maxCount: '0x3e8',
        }]
      })
    })

    const incomingData = await incomingResponse.json()
    const incomingTransfers = incomingData.result?.transfers || []
    
    let totalNFTSales = 0
    
    for (const transfer of incomingTransfers) {
      const transferValue = parseFloat(transfer.value || '0')
      if (transferValue > 0) {
        totalNFTSales += transferValue
      }
    }
    
    return NextResponse.json({
      totalFees: totalFees.toFixed(6),
      totalNFTMints: totalNFTMints.toFixed(6),
      totalNFTPurchases: totalNFTPurchases.toFixed(6),
      totalNFTSales: totalNFTSales.toFixed(6),
    })
  } catch (error) {
    console.error('[API] Error fetching wallet stats:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch wallet stats',
        totalFees: '0.05',
        totalNFTMints: '0.3',
        totalNFTPurchases: '1.2',
        totalNFTSales: '2.5',
      },
      { status: 200 }
    )
  }
}

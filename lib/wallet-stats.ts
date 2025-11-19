export async function fetchWalletStats(address: string) {
  try {
    console.log('[v0] Fetching wallet stats for:', address)
    
    const response = await fetch(`/api/wallet-stats?address=${address}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch wallet stats')
    }
    
    const data = await response.json()
    
    return {
      totalFees: BigInt(Math.floor(parseFloat(data.totalFees) * 1e18)),
      totalNFTPurchases: BigInt(Math.floor(parseFloat(data.totalNFTPurchases) * 1e18)),
      totalNFTSales: BigInt(Math.floor(parseFloat(data.totalNFTSales) * 1e18)),
    }
  } catch (error) {
    console.error('[v0] Error fetching wallet stats:', error)
    return {
      totalFees: BigInt(0),
      totalNFTPurchases: BigInt(0),
      totalNFTSales: BigInt(0),
    }
  }
}

export async function fetchHistoricalEthPrice(timestamp: number): Promise<number> {
  try {
    const date = new Date(timestamp * 1000)
    const dateString = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/ethereum/history?date=${dateString}`
    )
    const data = await response.json()
    return data.market_data?.current_price?.usd || 2800
  } catch (error) {
    console.error('[v0] Error fetching historical price:', error)
    return 2800
  }
}

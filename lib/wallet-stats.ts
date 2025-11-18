import { createPublicClient, http, formatEther } from 'viem'
import { base } from 'viem/chains'

const ALCHEMY_URL = 'https://base-mainnet.g.alchemy.com/v2/mdOVpuLVkiRVA_kfq7gEq-rRLukXm40B'

const client = createPublicClient({
  chain: base,
  transport: http(ALCHEMY_URL),
})

interface Transaction {
  hash: string
  from: string
  to: string | null
  value: string
  gasPrice: string
  gas: string
  input: string
  blockNumber: string
}

interface TransactionReceipt {
  gasUsed: string
  effectiveGasPrice: string
  status: string
}

function isNFTTransfer(tx: Transaction): { isNFT: boolean; isReceiving: boolean } {
  const input = tx.input.toLowerCase()
  // ERC721 transferFrom: 0x23b872dd
  // ERC721 safeTransferFrom: 0x42842e0e
  // ERC1155 safeTransferFrom: 0xf242432a
  const nftMethods = ['0x23b872dd', '0x42842e0e', '0xf242432a', '0xa22cb465']
  
  const isNFT = nftMethods.some(method => input.startsWith(method))
  
  return { isNFT, isReceiving: false }
}

export async function fetchWalletStats(address: string) {
  try {
    console.log('[v0] Fetching wallet stats for:', address)
    
    const response = await fetch(ALCHEMY_URL, {
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
          maxCount: '0x3e8', // 1000 transactions
        }]
      })
    })

    const data = await response.json()
    const transfers = data.result?.transfers || []

    let totalFees = BigInt(0)
    let totalNFTPurchases = BigInt(0)
    
    // Fetch transactions to calculate gas fees
    const txResponse = await fetch(ALCHEMY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_getBlockByNumber',
        params: ['latest', false]
      })
    })

    // Calculate gas fees and NFT purchases
    for (const transfer of transfers) {
      if (transfer.category === 'erc721' || transfer.category === 'erc1155') {
        // NFT transfer - if value exists, it's a purchase
        if (transfer.value) {
          const valueInWei = BigInt(Math.floor(parseFloat(transfer.value) * 1e18))
          totalNFTPurchases += valueInWei
        }
      }
      
      // Estimate gas fees (using average of ~0.0001 ETH per transaction)
      totalFees += BigInt('100000000000000') // 0.0001 ETH per transaction
    }

    const salesResponse = await fetch(ALCHEMY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'alchemy_getAssetTransfers',
        params: [{
          toAddress: address,
          category: ['external'],
          withMetadata: true,
          maxCount: '0x3e8',
        }]
      })
    })

    const salesData = await salesResponse.json()
    const salesTransfers = salesData.result?.transfers || []
    
    let totalNFTSales = BigInt(0)
    
    for (const transfer of salesTransfers) {
      // Count incoming ETH as potential NFT sales
      if (transfer.value && parseFloat(transfer.value) > 0) {
        const valueInWei = BigInt(Math.floor(parseFloat(transfer.value) * 1e18))
        totalNFTSales += valueInWei
      }
    }

    console.log('[v0] Stats calculated:', {
      totalFees: totalFees.toString(),
      totalNFTPurchases: totalNFTPurchases.toString(),
      totalNFTSales: totalNFTSales.toString(),
    })
    
    return {
      totalFees,
      totalNFTPurchases,
      totalNFTSales,
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

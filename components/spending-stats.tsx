"use client"

import { useEffect, useState } from "react"
import { formatEther } from "viem"
import useSWR from "swr"

interface SpendingStatsProps {
  stats: {
    totalFees: bigint
    totalNFTPurchases: bigint
    totalNFTSales: bigint
  }
  usdMode: 'at_time' | 'now'
  walletAddress: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function SpendingStats({ stats, usdMode, walletAddress }: SpendingStatsProps) {
  const { data: currentEthPrice } = useSWR(
    usdMode === 'now' ? '/api/eth-price' : null,
    fetcher,
    { refreshInterval: 30000 }
  )

  // For demo purposes, using mock historical prices
  // In production, these would be fetched based on transaction timestamps
  const historicalEthPrice = 2800

  const ethPrice = usdMode === 'now' ? (currentEthPrice?.price || 3200) : historicalEthPrice

  const formatUSD = (eth: bigint) => {
    const ethValue = parseFloat(formatEther(eth))
    const usdValue = ethValue * ethPrice
    return `$${usdValue.toFixed(2)}`
  }

  const formatETH = (eth: bigint) => {
    return `${parseFloat(formatEther(eth)).toFixed(6)} ETH`
  }

  return (
    <div className="space-y-6">
      {/* Total Fees */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Total Gas Fees
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">
            {formatETH(stats.totalFees)}
          </span>
          <span className="text-lg text-muted-foreground">
            {formatUSD(stats.totalFees)}
          </span>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Total NFT Purchases */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Total NFT Purchases
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">
            {formatETH(stats.totalNFTPurchases)}
          </span>
          <span className="text-lg text-muted-foreground">
            {formatUSD(stats.totalNFTPurchases)}
          </span>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Total NFT Sales */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Total NFT Sales
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatETH(stats.totalNFTSales)}
          </span>
          <span className="text-lg text-muted-foreground">
            {formatUSD(stats.totalNFTSales)}
          </span>
        </div>
      </div>
    </div>
  )
}

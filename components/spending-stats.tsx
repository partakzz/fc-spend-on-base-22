"use client"

import { useEffect, useState } from "react"
import { formatEther } from "viem"
import useSWR from "swr"
import { Button } from "@/components/ui/button"

interface SpendingStatsProps {
  stats: {
    totalFees: bigint
    totalNFTMints: bigint
    totalNFTPurchases: bigint
    totalNFTSales: bigint
  }
  usdMode: 'at_time' | 'now'
  toggleUsdMode: () => void
  walletAddress: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function SpendingStats({ stats, usdMode, toggleUsdMode, walletAddress }: SpendingStatsProps) {
  const { data: currentEthPrice } = useSWR(
    usdMode === 'now' ? '/api/eth-price' : null,
    fetcher,
    { refreshInterval: 30000 }
  )

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
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1.5 border-b border-border">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="#0052FF"/>
          </svg>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Base
          </span>
        </div>
        <Button 
          onClick={toggleUsdMode}
          variant="outline"
          size="sm"
          className="h-7 text-xs"
        >
          {usdMode === 'at_time' ? 'Time of Txn' : 'Current'}
        </Button>
      </div>

      <div className="space-y-1">
        <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Total Gas Fees
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">
            {formatETH(stats.totalFees)}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatUSD(stats.totalFees)}
          </span>
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="space-y-1">
        <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Total NFT Mints
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">
            {formatETH(stats.totalNFTMints)}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatUSD(stats.totalNFTMints)}
          </span>
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="space-y-1">
        <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Total NFT Purchases
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">
            {formatETH(stats.totalNFTPurchases)}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatUSD(stats.totalNFTPurchases)}
          </span>
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="space-y-1">
        <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Total NFT Sales
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-green-600 dark:text-green-400">
            {formatETH(stats.totalNFTSales)}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatUSD(stats.totalNFTSales)}
          </span>
        </div>
      </div>
    </div>
  )
}

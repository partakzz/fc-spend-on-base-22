"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SpendingStats } from "@/components/spending-stats"

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<{
    totalFees: bigint
    totalNFTPurchases: bigint
    totalNFTSales: bigint
  } | null>(null)
  const [usdMode, setUsdMode] = useState<'at_time' | 'now'>('at_time')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchStats = async (address: string) => {
    try {
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
      console.error('Error fetching wallet stats:', error)
      // Return demo data on error
      return {
        totalFees: BigInt(Math.floor(0.05 * 1e18)),
        totalNFTPurchases: BigInt(Math.floor(1.2 * 1e18)),
        totalNFTSales: BigInt(Math.floor(2.5 * 1e18)),
      }
    }
  }

  const connectWallet = async () => {
    try {
      setIsLoading(true)
      
      let address: string | null = null
      
      // Try to connect with Ethereum provider if available
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({
            method: 'eth_requestAccounts',
          })
          
          if (accounts && accounts.length > 0) {
            address = accounts[0]
          }
        } catch (error) {
          console.log('Wallet connection failed, using demo address')
        }
      }
      
      // Use demo address if no wallet connected
      if (!address) {
        address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
      }
      
      setWalletAddress(address)
      
      const walletStats = await fetchStats(address)
      setStats(walletStats)
      
    } catch (error) {
      console.error('Error connecting wallet:', error)
      
      // Fallback to demo address
      const mockAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
      setWalletAddress(mockAddress)
      
      const walletStats = await fetchStats(mockAddress)
      setStats(walletStats)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUsdMode = () => {
    setUsdMode(prev => prev === 'at_time' ? 'now' : 'at_time')
  }

  if (!mounted) {
    return null
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-5xl font-bold text-center text-primary">
          You Spend
        </h1>

        {!walletAddress ? (
          <Card className="p-8 flex items-center justify-center min-h-[300px]">
            <Button 
              onClick={connectWallet}
              disabled={isLoading}
              size="lg"
              className="text-lg px-8 py-6"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Connecting...
                </>
              ) : (
                'Connect Wallet'
              )}
            </Button>
          </Card>
        ) : (
          <>
            <div className="flex justify-center">
              <Button 
                onClick={toggleUsdMode}
                variant="outline"
                size="lg"
                className="min-w-[200px]"
              >
                {usdMode === 'at_time' ? 'In USD at time' : 'In USD now'}
              </Button>
            </div>

            <Card className="p-6">
              {stats ? (
                <SpendingStats 
                  stats={stats}
                  usdMode={usdMode}
                  walletAddress={walletAddress}
                />
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                </div>
              )}
            </Card>
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Powered by Base Network
        </p>
      </div>
    </main>
  )
}

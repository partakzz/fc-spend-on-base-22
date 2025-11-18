"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import sdk from "@farcaster/frame-sdk"
import { SpendingStats } from "@/components/spending-stats"
import { fetchWalletStats } from "@/lib/wallet-stats"

export default function Home() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<{
    totalFees: bigint
    totalNFTPurchases: bigint
    totalNFTSales: bigint
  } | null>(null)
  const [usdMode, setUsdMode] = useState<'at_time' | 'now'>('at_time')

  useEffect(() => {
    const initSDK = async () => {
      try {
        await sdk.actions.ready()
        setIsSDKLoaded(true)
        
        // Check if context exists and has a wallet address
        const context = await sdk.context
        if (context?.user?.username) {
          console.log('[v0] Farcaster context loaded:', context)
        }
      } catch (error) {
        console.error('[v0] Error initializing Farcaster SDK:', error)
        setIsSDKLoaded(true) // Still set to true to show the UI
      }
    }

    initSDK()
  }, [])

  const connectWallet = async () => {
    if (!isSDKLoaded) return

    try {
      setIsLoading(true)
      
      const provider = await sdk.wallet.ethProvider
      
      if (provider) {
        // Request accounts from the wallet
        const accounts = await provider.request({
          method: 'eth_requestAccounts',
        }) as string[]
        
        if (accounts && accounts.length > 0) {
          const address = accounts[0]
          setWalletAddress(address)
          
          // Fetch wallet statistics using Alchemy API
          const walletStats = await fetchWalletStats(address)
          setStats(walletStats)
        }
      } else {
        // Fallback for demo
        const mockAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        setWalletAddress(mockAddress)
        
        const walletStats = await fetchWalletStats(mockAddress)
        setStats(walletStats)
      }
      
    } catch (error) {
      console.error('[v0] Error connecting wallet:', error)
      
      const mockAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
      setWalletAddress(mockAddress)
      
      const walletStats = await fetchWalletStats(mockAddress)
      setStats(walletStats)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUsdMode = () => {
    setUsdMode(prev => prev === 'at_time' ? 'now' : 'at_time')
  }

  if (!isSDKLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="w-full max-w-md space-y-6">
        {/* App Title */}
        <h1 className="text-5xl font-bold text-center text-primary">
          You Spend
        </h1>

        {!walletAddress ? (
          /* Connect Wallet View */
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
          /* Stats View */
          <>
            {/* USD Mode Toggle */}
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

            {/* Stats Card */}
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

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Powered by Base Network
        </p>
      </div>
    </main>
  )
}

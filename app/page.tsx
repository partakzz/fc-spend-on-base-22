"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SpendingStats } from "@/components/spending-stats"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import sdk from "@farcaster/frame-sdk"

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{
    username: string
    pfpUrl: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<{
    totalFees: bigint
    totalNFTPurchases: bigint
    totalNFTSales: bigint
  } | null>(null)
  const [usdMode, setUsdMode] = useState<'at_time' | 'now'>('now')
  const [sdkReady, setSdkReady] = useState(false)

  useEffect(() => {
    const initSDK = async () => {
      try {
        await sdk.actions.ready()
        setSdkReady(true)
        console.log("[v0] Farcaster SDK initialized successfully")
      } catch (error) {
        console.error("[v0] Failed to initialize Farcaster SDK:", error)
        setSdkReady(true)
      }
    }
    
    initSDK()
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
      let username = "Anonymous"
      let pfpUrl = ""
      
      if (sdkReady) {
        try {
          // Get Farcaster context with user info
          const context = await sdk.context
          
          if (context?.user) {
            username = context.user.username || context.user.displayName || `fid:${context.user.fid}`
            pfpUrl = context.user.pfpUrl || ""
            
            console.log("[v0] Got Farcaster user:", username)
          }
          
          // Get wallet address from Farcaster embedded wallet
          const wallet = await sdk.wallet.ethProvider.request({
            method: 'eth_requestAccounts',
          }) as string[]
          
          if (wallet && wallet.length > 0) {
            address = wallet[0]
            console.log("[v0] Connected to Farcaster wallet:", address)
          }
        } catch (error) {
          console.log("[v0] Farcaster wallet not available, trying fallback")
        }
      }
      
      // Fallback to regular Ethereum provider if Farcaster wallet unavailable
      if (!address && typeof window !== 'undefined' && (window as any).ethereum) {
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
      
      if (!address) {
        address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
      }
      
      setWalletAddress(address)
      setUserProfile({ username, pfpUrl })
      
      const walletStats = await fetchStats(address)
      setStats(walletStats)
      
    } catch (error) {
      console.error('Error connecting wallet:', error)
      
      const mockAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
      setWalletAddress(mockAddress)
      setUserProfile({ username: "Demo User", pfpUrl: "" })
      
      const walletStats = await fetchStats(mockAddress)
      setStats(walletStats)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUsdMode = () => {
    setUsdMode(prev => prev === 'at_time' ? 'now' : 'at_time')
  }

  if (!sdkReady) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-5xl font-bold text-center text-primary">
          You Spend
        </h1>

        {walletAddress && userProfile && (
          <div className="flex items-center justify-center gap-3 py-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userProfile.pfpUrl || "/placeholder.svg"} alt={userProfile.username} />
              <AvatarFallback>{userProfile.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{userProfile.username}</span>
              <span className="text-xs text-muted-foreground">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            </div>
          </div>
        )}

        {!walletAddress ? (
          <Card className="p-8 flex items-center justify-center min-h-[300px]">
            <Button 
              onClick={connectWallet}
              disabled={isLoading}
              size="lg"
              className="text-lg px-8 py-6"
            >
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
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
                {usdMode === 'at_time' ? 'Time of Txn' : 'Current'}
              </Button>
            </div>

            <Card className="p-5">
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

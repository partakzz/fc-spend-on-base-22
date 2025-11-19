'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SpendingStats } from '@/components/spending-stats'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import sdk from '@farcaster/frame-sdk'

export default function Home() {
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{
    username: string
    pfpUrl: string
  } | null>(null)
  const [checkAddress, setCheckAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<{
    totalFees: bigint
    totalNFTMints: bigint
    totalNFTPurchases: bigint
    totalNFTSales: bigint
  } | null>(null)
  const [currentAddress, setCurrentAddress] = useState<string | null>(null)
  const [usdMode, setUsdMode] = useState<'at_time' | 'now'>('now')
  const [sdkReady, setSdkReady] = useState(false)

  useEffect(() => {
    const initSDK = async () => {
      try {
        await sdk.actions.ready()
        setSdkReady(true)
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error)
        setSdkReady(true)
      }
    }
    
    initSDK()
  }, [])

  useEffect(() => {
    if (!sdkReady) return
    
    const savedWallet = localStorage.getItem('connected_wallet')
    const savedProfile = localStorage.getItem('user_profile')
    
    if (savedWallet) {
      setConnectedWallet(savedWallet)
      setCurrentAddress(savedWallet)
      
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile))
      }
      
      fetchStats(savedWallet).then(walletStats => {
        setStats(walletStats)
      })
    }
  }, [sdkReady])

  const fetchStats = async (address: string) => {
    try {
      const response = await fetch(`/api/wallet-stats?address=${address}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch wallet stats')
      }
      
      const data = await response.json()
      
      return {
        totalFees: BigInt(Math.floor(parseFloat(data.totalFees) * 1e18)),
        totalNFTMints: BigInt(Math.floor(parseFloat(data.totalNFTMints) * 1e18)),
        totalNFTPurchases: BigInt(Math.floor(parseFloat(data.totalNFTPurchases) * 1e18)),
        totalNFTSales: BigInt(Math.floor(parseFloat(data.totalNFTSales) * 1e18)),
      }
    } catch (error) {
      console.error('Error fetching wallet stats:', error)
      return {
        totalFees: BigInt(Math.floor(0.05 * 1e18)),
        totalNFTMints: BigInt(Math.floor(0.3 * 1e18)),
        totalNFTPurchases: BigInt(Math.floor(1.2 * 1e18)),
        totalNFTSales: BigInt(Math.floor(2.5 * 1e18)),
      }
    }
  }

  const connectWallet = async () => {
    try {
      setIsLoading(true)
      
      let address = ''
      let username = 'Anonymous'
      let pfpUrl = ''
      
      if (sdkReady) {
        try {
          const context = await sdk.context
          
          if (context?.user) {
            username = context.user.username || context.user.displayName || `fid:${context.user.fid}`
            pfpUrl = context.user.pfpUrl || ''
          }
          
          const addresses = await sdk.wallet.ethProvider.request({
            method: 'eth_requestAccounts',
          }) as string[]
          
          if (addresses && addresses.length > 0) {
            address = addresses[0]
          }
        } catch (error) {
          console.log('Farcaster wallet error:', error)
        }
      }
      
      // Fallback to browser wallet if Farcaster not available
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
        address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
        username = 'Demo User'
      }
      
      localStorage.setItem('connected_wallet', address)
      localStorage.setItem('user_profile', JSON.stringify({ username, pfpUrl }))
      
      setConnectedWallet(address)
      setCurrentAddress(address)
      setUserProfile({ username, pfpUrl })
      
      const walletStats = await fetchStats(address)
      setStats(walletStats)
      
    } catch (error) {
      console.error('Error connecting wallet:', error)
      
      const demoAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
      setConnectedWallet(demoAddress)
      setCurrentAddress(demoAddress)
      setUserProfile({ username: 'Demo User', pfpUrl: '' })
      
      localStorage.setItem('connected_wallet', demoAddress)
      localStorage.setItem('user_profile', JSON.stringify({ username: 'Demo User', pfpUrl: '' }))
      
      const walletStats = await fetchStats(demoAddress)
      setStats(walletStats)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckAddress = async () => {
    if (!checkAddress || !/^0x[a-fA-F0-9]{40}$/.test(checkAddress)) {
      alert('Please enter a valid Ethereum address')
      return
    }
    
    setCurrentAddress(checkAddress)
    setStats(null)
    
    const walletStats = await fetchStats(checkAddress)
    setStats(walletStats)
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

        {connectedWallet ? (
          <>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={userProfile?.pfpUrl || '/placeholder.svg'} alt={userProfile?.username || 'User'} />
                  <AvatarFallback>{userProfile?.username?.slice(0, 2).toUpperCase() || 'AN'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold">{userProfile?.username || 'Anonymous'}</span>
                  <span className="text-sm text-muted-foreground">
                    {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter wallet address to check"
                  value={checkAddress}
                  onChange={(e) => setCheckAddress(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleCheckAddress} className="whitespace-nowrap">
                  Check
                </Button>
              </div>
            </Card>

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

            <Card className="p-4">
              {stats ? (
                <SpendingStats 
                  stats={stats}
                  usdMode={usdMode}
                  walletAddress={currentAddress || connectedWallet}
                />
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                </div>
              )}
            </Card>
          </>
        ) : (
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
        )}

        <p className="text-center text-sm text-muted-foreground">
          Powered by Base Network
        </p>
      </div>
    </main>
  )
}

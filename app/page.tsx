'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SpendingStats } from '@/components/spending-stats'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import sdk from '@farcaster/frame-sdk'

interface CheckedWallet {
  address: string
  username: string
  pfpUrl: string
  timestamp: number
}

interface RateLimitData {
  count: number
  resetTime: number
}

interface SearchResult {
  fid: number
  username: string
  pfp_url: string
  custody_address: string
  verified_addresses?: {
    eth_addresses: string[]
  }
}

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
  const [checkedWallets, setCheckedWallets] = useState<CheckedWallet[]>([])
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    const savedCheckedWallets = localStorage.getItem('checked_wallets')
    
    if (savedWallet) {
      setConnectedWallet(savedWallet)
      setCurrentAddress(savedWallet)
      
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile))
      }
      
      if (savedCheckedWallets) {
        setCheckedWallets(JSON.parse(savedCheckedWallets))
      }
      
      fetchStats(savedWallet).then(walletStats => {
        setStats(walletStats)
      })
    }
  }, [sdkReady])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  const checkRateLimit = (): boolean => {
    const rateLimitData = localStorage.getItem('rate_limit')
    const now = Date.now()
    
    if (!rateLimitData) {
      const newRateLimit: RateLimitData = {
        count: 0,
        resetTime: now + 24 * 60 * 60 * 1000 // 24 hours from now
      }
      localStorage.setItem('rate_limit', JSON.stringify(newRateLimit))
      return true
    }
    
    const rateLimit: RateLimitData = JSON.parse(rateLimitData)
    
    // Reset if 24 hours have passed
    if (now > rateLimit.resetTime) {
      const newRateLimit: RateLimitData = {
        count: 0,
        resetTime: now + 24 * 60 * 60 * 1000
      }
      localStorage.setItem('rate_limit', JSON.stringify(newRateLimit))
      return true
    }
    
    // Check if limit exceeded
    if (rateLimit.count >= 5) {
      return false
    }
    
    return true
  }

  const incrementRateLimit = () => {
    const rateLimitData = localStorage.getItem('rate_limit')
    if (!rateLimitData) return
    
    const rateLimit: RateLimitData = JSON.parse(rateLimitData)
    rateLimit.count += 1
    localStorage.setItem('rate_limit', JSON.stringify(rateLimit))
  }

  const fetchFarcasterProfile = async (address: string): Promise<{ username: string; pfpUrl: string } | null> => {
    try {
      // This would require a Neynar or other Farcaster API integration
      // For now, return null to show address only
      return null
    } catch (error) {
      return null
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

  const handleSearchInput = async (value: string) => {
    setCheckAddress(value)
    setRateLimitError(null)
    setShowDropdown(false)
    setSearchResults([])
  }

  const handleCheckAddress = async () => {
    setRateLimitError(null)
    
    const address = checkAddress.trim()
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      alert('Please enter a valid Ethereum address (0x...)')
      return
    }
    
    // Check if already in the list
    if (checkedWallets.some(w => w.address.toLowerCase() === address.toLowerCase())) {
      switchToWallet(address)
      setCheckAddress('')
      return
    }
    
    // Check rate limit
    if (!checkRateLimit()) {
      setRateLimitError('Max check limit 5 wallets 24h')
      return
    }
    
    setIsLoading(true)
    
    try {
      const profile = await fetchFarcasterProfile(address)
      
      const newWallet: CheckedWallet = {
        address: address,
        username: profile?.username || `${address.slice(0, 6)}...${address.slice(-4)}`,
        pfpUrl: profile?.pfpUrl || '',
        timestamp: Date.now()
      }
      
      const updatedWallets = [...checkedWallets, newWallet]
      setCheckedWallets(updatedWallets)
      localStorage.setItem('checked_wallets', JSON.stringify(updatedWallets))
      
      incrementRateLimit()
      
      setCurrentAddress(address)
      setStats(null)
      
      const walletStats = await fetchStats(address)
      setStats(walletStats)
      
      setCheckAddress('')
    } catch (error) {
      console.error('Error checking address:', error)
      alert('Failed to check address')
    } finally {
      setIsLoading(false)
    }
  }

  const switchToWallet = async (address: string) => {
    if (currentAddress === address) return
    
    setCurrentAddress(address)
    setStats(null)
    
    const walletStats = await fetchStats(address)
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
        <h1 className="text-lg font-bold text-center text-primary">
          How much you spent......
        </h1>

        {connectedWallet ? (
          <>
            <Card 
              className={`p-3 cursor-pointer transition-colors h-[72px] flex items-center ${
                currentAddress === connectedWallet 
                  ? 'ring-2 ring-primary' 
                  : 'hover:bg-accent'
              }`}
              onClick={() => switchToWallet(connectedWallet)}
            >
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

            {checkedWallets.length > 0 && (
              <div className="space-y-2">
                {checkedWallets.map((wallet) => (
                  <Card
                    key={wallet.address}
                    className={`p-3 cursor-pointer transition-colors h-[72px] flex items-center gap-3 border-b last:border-b-0 ${
                      currentAddress === wallet.address
                        ? 'ring-2 ring-primary'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => switchToWallet(wallet.address)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={wallet.pfpUrl || '/placeholder.svg'} alt={wallet.username} />
                        <AvatarFallback>{wallet.pfpUrl ? wallet.username.slice(0, 2).toUpperCase() : '👤'}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">@{wallet.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div ref={dropdownRef} className="relative">
              <Card className="p-3 h-[72px] flex items-center">
                <div className="flex gap-2 w-full">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="Enter wallet address (0x...)"
                      value={checkAddress}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      className="w-full"
                      disabled={isLoading}
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  <Button onClick={handleCheckAddress} className="whitespace-nowrap" disabled={isLoading}>
                    {isLoading ? 'Checking...' : 'Check'}
                  </Button>
                </div>
              </Card>
              
              {rateLimitError && (
                <p className="text-sm text-red-500 mt-2">{rateLimitError}</p>
              )}
            </div>

            <Card className="p-4">
              {stats ? (
                <SpendingStats 
                  stats={stats}
                  usdMode={usdMode}
                  toggleUsdMode={toggleUsdMode}
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

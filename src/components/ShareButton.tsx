'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Share2, Twitter, Facebook, Link as LinkIcon } from 'lucide-react'
import { createBrowserClient } from '@/utils/supabase'

interface ShareButtonProps {
  userId?: string
  mode: 'profile' | 'leaderboard'
  rank?: number
  stats?: {
    points: number
    correctPicks: number
    totalPicks: number
  }
}

export default function ShareButton({ userId, mode, rank, stats }: ShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createBrowserClient()

  const generateShareText = async () => {
    try {
      setIsLoading(true)
      let shareText = ''

      if (mode === 'leaderboard' && rank) {
        shareText = `🏆 I'm ranked #${rank} on GGWP.NO! Come join and make your predictions!`
      } else if (mode === 'profile' && stats) {
        const accuracy = stats.totalPicks > 0 ? Math.round((stats.correctPicks / stats.totalPicks) * 100) : 0
        shareText = `🎮 I've made ${stats.correctPicks} correct predictions out of ${stats.totalPicks} (${accuracy}% accuracy) on GGWP.NO!`
      }

      // Get the base URL from environment variable or default
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const shareUrl = `${baseUrl}/${mode}${userId ? `?user=${userId}` : ''}`

      return { shareText, shareUrl }
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async (platform: 'twitter' | 'facebook' | 'copy') => {
    try {
      const { shareText, shareUrl } = await generateShareText()

      switch (platform) {
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            '_blank'
          )
          break
        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
            '_blank'
          )
          break
        case 'copy':
          await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
          break
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isLoading}
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => handleShare('twitter')}
        >
          <Twitter className="h-4 w-4" />
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => handleShare('facebook')}
        >
          <Facebook className="h-4 w-4" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => handleShare('copy')}
        >
          <LinkIcon className="h-4 w-4" />
          {copied ? 'Copied!' : 'Copy Link'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 
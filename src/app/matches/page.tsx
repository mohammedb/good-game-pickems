// src/app/matches/page.tsx
'use client'

import { useMatches } from '@/hooks/use-matches'
import MatchList from './MatchList'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2 } from 'lucide-react'

export default function MatchesPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { data: matches, isLoading, isError, error } = useMatches()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUserId(user.id)
      }
    }
    checkAuth()
  }, [router, supabase.auth])

  if (isLoading || !userId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <p className="font-semibold text-destructive">Error loading matches</p>
        <p className="text-sm text-muted-foreground">{error?.message}</p>
      </div>
    )
  }

  if (!matches?.length) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No matches found</p>
      </div>
    )
  }

  // Get the current round (first match's round)
  const currentRound = matches[0]?.round || 'Current Round'

  return (
    <MatchList
      matches={matches}
      userId={userId}
      roundStats={{
        totalPicks: 0, // These will need to be fetched separately
        correctPicks: 0,
        roundName: currentRound,
      }}
    />
  )
}

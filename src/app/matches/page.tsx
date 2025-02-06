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
  const [username, setUsername] = useState<string>()
  const [roundStats, setRoundStats] = useState({
    totalPicks: 0,
    correctPicks: 0,
  })
  const [selectedRound, setSelectedRound] = useState<string>()

  // Get all unique rounds
  const allRounds = matches
    ? Array.from(new Set(matches.map((m) => m.round))).sort()
    : []

  // Find the current active round (first round with unfinished matches)
  const getCurrentRound = () => {
    if (!matches?.length) return ''

    for (const round of allRounds) {
      const roundMatches = matches.filter((m) => m.round === round)
      const hasUnfinishedMatches = roundMatches.some((m) => !m.is_finished)
      if (hasUnfinishedMatches) {
        return round
      }
    }
    // If all matches are finished, return the last round
    return allRounds[allRounds.length - 1] || ''
  }

  const currentRound = selectedRound || getCurrentRound()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUserId(user.id)
        // Fetch username
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single()
        if (userData?.username) {
          setUsername(userData.username)
        }
      }
    }
    checkAuth()
  }, [router, supabase])

  // Update round stats when round changes
  useEffect(() => {
    async function fetchRoundPicks() {
      if (!userId || !currentRound || !matches?.length) return

      const roundMatches = matches.filter((m) => m.round === currentRound)

      const { data: picks } = await supabase
        .from('picks')
        .select('*')
        .in(
          'match_id',
          roundMatches.map((m) => m.id),
        )
        .eq('user_id', userId)

      if (picks) {
        const totalPicks = picks.length
        const correctPicks = picks.filter((p) => p.is_correct).length
        setRoundStats({ totalPicks, correctPicks })
      }
    }

    fetchRoundPicks()
  }, [userId, currentRound, matches, supabase])

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

  return (
    <MatchList
      matches={matches}
      userId={userId}
      username={username}
      roundStats={{
        totalPicks: roundStats.totalPicks,
        correctPicks: roundStats.correctPicks,
        roundName: currentRound,
        allRounds: allRounds,
        onRoundChange: setSelectedRound,
      }}
    />
  )
}

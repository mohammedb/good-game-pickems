// src/app/matches/page.tsx
'use client'

import { useMatches, GameTypeFilter } from '@/hooks/use-matches'
import MatchList from './MatchList'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/utils/supabase-client'
import { Loader2 } from 'lucide-react'
import { MatchSkeleton } from '@/components/matches/match-skeleton'
import { GameTypeSelector } from '@/components/game-type-selector'

interface Season {
  id: string
  season_id: string
  name: string
  start_date: string
  end_date: string | null
  is_active: boolean
  match_count: number
  user_count: number
}

export default function MatchesPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [selectedGameType, setSelectedGameType] =
    useState<GameTypeFilter>('all')
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null)
  const [loadingSeasons, setLoadingSeasons] = useState(true)
  const {
    data: matches,
    isLoading,
    isError,
    error,
  } = useMatches(selectedGameType, selectedSeason)
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState<string>()
  const [roundStats, setRoundStats] = useState({
    totalPicks: 0,
    correctPicks: 0,
  })
  const [selectedRound, setSelectedRound] = useState<string>()

  // Fetch available seasons on mount
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const { data, error } = await supabase.rpc('get_seasons')
        if (error) throw error

        const seasonsData = data as Season[]
        setSeasons(seasonsData)

        // Set active season as default if no season selected
        if (!selectedSeason) {
          const activeSeason = seasonsData.find((s) => s.is_active)
          if (activeSeason) {
            setSelectedSeason(activeSeason.season_id)
          }
        }
      } catch (error) {
        console.error('Error fetching seasons:', error)
      } finally {
        setLoadingSeasons(false)
      }
    }

    fetchSeasons()
  }, [supabase, selectedSeason])

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

  if (isLoading || loadingSeasons || !userId) {
    return (
      <div className="container max-w-4xl py-8">
        <MatchSkeleton />
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

  return (
    <MatchList
      matches={matches || []}
      userId={userId}
      username={username}
      roundStats={{
        totalPicks: roundStats.totalPicks,
        correctPicks: roundStats.correctPicks,
        roundName: currentRound,
        allRounds: allRounds,
        onRoundChange: setSelectedRound,
      }}
      selectedGameType={selectedGameType}
      onGameTypeChange={setSelectedGameType}
      seasons={seasons}
      selectedSeason={selectedSeason}
      onSeasonChange={setSelectedSeason}
    />
  )
}

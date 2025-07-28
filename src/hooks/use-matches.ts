import { useQuery } from '@tanstack/react-query'
import { Match } from '@/app/matches/types'

export type GameTypeFilter = 'all' | 'csgo' | 'lol'

async function fetchMatches(gameType: GameTypeFilter): Promise<Match[]> {
  const params = gameType !== 'all' ? `?gameType=${gameType}` : ''
  const response = await fetch(`/api/matches${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch matches')
  }
  return response.json()
}

export function useMatches(gameType: GameTypeFilter = 'all') {
  return useQuery({
    queryKey: ['matches', gameType],
    queryFn: () => fetchMatches(gameType),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes instead of every minute
    staleTime: 4 * 60 * 1000, // Consider data stale after 4 minutes
    retry: 3,
    refetchOnWindowFocus: true,
  })
}

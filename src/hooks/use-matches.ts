import { useQuery } from '@tanstack/react-query'
import { Match } from '@/app/matches/types'

export type GameTypeFilter = 'all' | 'csgo' | 'lol' | 'valorant'

async function fetchMatches(
  gameType: GameTypeFilter,
  seasonId?: string | null,
): Promise<Match[]> {
  const params = new URLSearchParams()
  if (gameType !== 'all') params.set('gameType', gameType)
  if (seasonId) params.set('seasonId', seasonId)

  const query = params.toString()
  const response = await fetch(`/api/matches${query ? `?${query}` : ''}`)
  if (!response.ok) {
    throw new Error('Failed to fetch matches')
  }
  return response.json()
}

export function useMatches(
  gameType: GameTypeFilter = 'all',
  seasonId?: string | null,
) {
  return useQuery({
    queryKey: ['matches', gameType, seasonId],
    queryFn: () => fetchMatches(gameType, seasonId),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes instead of every minute
    staleTime: 4 * 60 * 1000, // Consider data stale after 4 minutes
    retry: 3,
    refetchOnWindowFocus: true,
  })
}

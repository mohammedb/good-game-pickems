import { useQuery } from '@tanstack/react-query'
import { Match } from '@/app/matches/types'

async function fetchMatches(): Promise<Match[]> {
  const response = await fetch('/api/matches')
  if (!response.ok) {
    throw new Error('Failed to fetch matches')
  }
  return response.json()
}

export function useMatches() {
  return useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes instead of every minute
    staleTime: 4 * 60 * 1000, // Consider data stale after 4 minutes
    retry: 3,
    refetchOnWindowFocus: true,
  })
}

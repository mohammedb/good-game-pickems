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
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
    retry: 3,
    refetchOnWindowFocus: true,
  })
}

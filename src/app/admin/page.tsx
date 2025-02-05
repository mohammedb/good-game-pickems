'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@/utils/supabase'
import { toast } from '@/components/ui/use-toast'

interface AdminStats {
  totalUsers: number
  totalPicks: number
  pendingMatches: number
  lastSyncTime: string | null
  lastSyncMatches: number
}

interface Pick {
  id: string
  user_id: string
  match_id: string
  predicted_winner: string
  is_correct: boolean | null
  created_at: string
  user: {
    email: string
  }
  match: {
    team1: string
    team2: string
    start_time: string
  }
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isUpdatingPoints, setIsUpdatingPoints] = useState(false)
  const [recentPicks, setRecentPicks] = useState<Pick[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    async function checkAdminAndLoadData() {
      try {
        // Check if user is authenticated and admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single()

        if (!userData?.is_admin) {
          router.push('/')
          return
        }

        // Fetch admin stats
        const now = new Date().toISOString()

        const [
          { count: userCount },
          { count: pickCount },
          { data: syncData }
        ] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('picks').select('*', { count: 'exact', head: true }),
          supabase.from('sync_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
        ])

        // Get sync status from our API endpoint
        const syncStatusResponse = await fetch('/api/admin/sync')
        const syncStatus = await syncStatusResponse.json()

        setStats({
          totalUsers: userCount || 0,
          totalPicks: pickCount || 0,
          pendingMatches: syncStatus.pending_matches || 0,
          lastSyncTime: syncStatus.last_sync,
          lastSyncMatches: syncStatus.last_sync_matches || 0
        })

        // Fetch recent picks
        const { data: picks } = await supabase
          .from('picks')
          .select(`
            *,
            user:user_id (email),
            match:match_id (team1, team2, start_time)
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentPicks(picks as Pick[] || [])
      } catch (err) {
        console.error('Error loading admin data:', err)
        setError('Failed to load admin data')
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAndLoadData()
  }, [supabase, router])

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Sync failed')
      }

      const result = await response.json()
      
      // Refresh the page data
      router.refresh()
      
      // Show success message
      toast({
        title: 'Success',
        description: `Synced ${result.synced_matches} matches`,
      })
    } catch (err) {
      console.error('Error syncing:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to sync matches',
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleUpdatePoints = async () => {
    try {
      setIsUpdatingPoints(true)
      const response = await fetch('/api/admin/update-points', {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Points update failed')
      }

      const result = await response.json()
      
      // Show success message
      toast({
        title: 'Success',
        description: `Updated points for ${result.processed_picks} picks across ${result.processed_matches} matches`,
      })
      
      router.refresh()
    } catch (err) {
      console.error('Error updating points:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update points',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingPoints(false)
    }
  }

  const handlePointAdjustment = async (pickId: string, isCorrect: boolean) => {
    try {
      const reason = prompt('Please enter a reason for this adjustment:')
      if (!reason) return

      const response = await fetch('/api/admin/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pick_id: pickId,
          is_correct: isCorrect,
          reason
        })
      })

      if (!response.ok) {
        throw new Error('Failed to adjust points')
      }

      // Refresh the page to show updated data
      router.refresh()
    } catch (err) {
      console.error('Error adjusting points:', err)
      setError('Failed to adjust points')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage matches and user predictions
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Total Users</div>
          <div className="mt-2 text-2xl font-bold">{stats?.totalUsers}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Total Predictions</div>
          <div className="mt-2 text-2xl font-bold">{stats?.totalPicks}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Pending Matches</div>
          <div className="mt-2 text-2xl font-bold">{stats?.pendingMatches}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Last Sync</div>
          <div className="mt-2 text-sm">
            {stats?.lastSyncTime 
              ? new Date(stats.lastSyncTime).toLocaleString()
              : 'Never'}
          </div>
        </Card>
      </div>

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Match Synchronization</h2>
          <div className="flex gap-2">
            <Button 
              onClick={handleSync} 
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing...' : 'Sync Matches'}
            </Button>
            <Button
              onClick={handleUpdatePoints}
              disabled={isUpdatingPoints}
              variant="secondary"
            >
              {isUpdatingPoints ? 'Updating...' : 'Update Points'}
            </Button>
          </div>
        </div>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">
            {stats?.pendingMatches === 0 
              ? 'All matches are up to date'
              : `${stats?.pendingMatches} matches need to be synced`}
          </p>
          {stats?.lastSyncTime && (
            <p className="text-sm text-muted-foreground mt-2">
              Last sync: {new Date(stats.lastSyncTime).toLocaleString()} ({stats.lastSyncMatches} matches)
            </p>
          )}
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Recent Predictions</h2>
        <div className="space-y-4">
          {recentPicks.map((pick) => (
            <Card key={pick.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {pick.match.team1} vs {pick.match.team2}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    by {pick.user.email} • Predicted: {pick.predicted_winner}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePointAdjustment(pick.id, true)}
                    disabled={pick.is_correct === true}
                  >
                    Mark Correct
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePointAdjustment(pick.id, false)}
                    disabled={pick.is_correct === false}
                  >
                    Mark Incorrect
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {recentPicks.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">No recent predictions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
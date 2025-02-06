'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { createBrowserClient } from '@/utils/supabase'
import { toast } from '@/components/ui/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Loader2, RefreshCw, Calculator } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Separator } from '@/components/ui/separator'
import { StatsCard } from '@/components/ui/stats-card'
import { ActivityCharts } from '@/components/admin/activity-charts'
import { ActionButton } from '@/components/admin/action-button'
import { FilterBar, FilterOptions } from '@/components/admin/filter-bar'
import { ActivityLog } from '@/components/admin/activity-log'

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

interface ActivityData {
  date: string
  signUps: number
  predictions: number
}

interface ActivityLogEntry {
  id: string
  type: 'sync' | 'points' | 'user' | 'match' | 'error' | 'success'
  message: string
  timestamp: string
  user?: string
  details?: string
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isUpdatingPoints, setIsUpdatingPoints] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)
  const [syncError, setSyncError] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [updateError, setUpdateError] = useState(false)
  const [recentPicks, setRecentPicks] = useState<Pick[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activityData, setActivityData] = useState<ActivityData[]>([])
  const [isLoadingActivity, setIsLoadingActivity] = useState(true)
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(true)
  const [filters, setFilters] = useState<FilterOptions>({
    matchStatus: 'all',
    searchQuery: '',
  })
  const router = useRouter()
  const supabase = createBrowserClient()

  const fetchActivityLogs = useCallback(async () => {
    try {
      setIsLoadingLogs(true)
      const params = new URLSearchParams()

      if (filters.matchStatus !== 'all') {
        params.set('type', filters.matchStatus)
      }
      if (filters.searchQuery) {
        params.set('search', filters.searchQuery)
      }

      const response = await fetch(`/api/admin/logs?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch activity logs')
      }

      setActivityLogs(data)
    } catch (err) {
      console.error('Error fetching activity logs:', err)
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to fetch activity logs',
        variant: 'destructive',
      })
      setActivityLogs([]) // Reset to empty array on error
    } finally {
      setIsLoadingLogs(false)
    }
  }, [filters.matchStatus, filters.searchQuery])

  useEffect(() => {
    async function checkAdminAndLoadData() {
      try {
        // Check if user is authenticated and admin
        const {
          data: { user },
        } = await supabase.auth.getUser()
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

        const [{ count: userCount }, { count: pickCount }, { data: syncData }] =
          await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('picks').select('*', { count: 'exact', head: true }),
            supabase
              .from('sync_logs')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(1),
          ])

        // Get sync status from our API endpoint
        const syncStatusResponse = await fetch('/api/admin/sync')
        const syncStatus = await syncStatusResponse.json()

        setStats({
          totalUsers: userCount || 0,
          totalPicks: pickCount || 0,
          pendingMatches: syncStatus.pending_matches || 0,
          lastSyncTime: syncStatus.last_sync,
          lastSyncMatches: syncStatus.last_sync_matches || 0,
        })

        // Fetch recent picks
        const { data: picks } = await supabase
          .from('picks')
          .select(
            `
            *,
            user:user_id (email),
            match:match_id (team1, team2, start_time)
          `,
          )
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentPicks((picks as Pick[]) || [])

        // Fetch activity data
        const activityResponse = await fetch('/api/admin/activity')
        if (!activityResponse.ok) {
          throw new Error('Failed to fetch activity data')
        }
        const activityData = await activityResponse.json()
        setActivityData(activityData)

        // Fetch activity logs
        await fetchActivityLogs()
      } catch (err) {
        console.error('Error loading admin data:', err)
        setError('Failed to load admin data')
      } finally {
        setIsLoading(false)
        setIsLoadingActivity(false)
        setIsLoadingLogs(false)
      }
    }

    checkAdminAndLoadData()
  }, [supabase, router, fetchActivityLogs])

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
    fetchActivityLogs()
  }

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      setSyncSuccess(false)
      setSyncError(false)

      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Sync failed')
      }

      const result = await response.json()

      // Show success message
      toast({
        title: 'Success',
        description: `Synced ${result.synced_matches} matches`,
      })

      setSyncSuccess(true)

      // Refresh the page data with animation
      const newStats = { ...stats! }
      newStats.lastSyncTime = new Date().toISOString()
      newStats.lastSyncMatches = result.synced_matches
      setStats(newStats)

      // Add sync event to activity log
      await fetchActivityLogs()
    } catch (err) {
      console.error('Error syncing:', err)
      setSyncError(true)
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to sync matches',
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleUpdatePoints = async () => {
    try {
      setIsUpdatingPoints(true)
      setUpdateSuccess(false)
      setUpdateError(false)

      const response = await fetch('/api/admin/update-points', {
        method: 'POST',
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

      setUpdateSuccess(true)

      // Refresh the data
      const { data: picks } = await supabase
        .from('picks')
        .select(
          `
          *,
          user:user_id (email),
          match:match_id (team1, team2, start_time)
        `,
        )
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentPicks((picks as Pick[]) || [])

      // Add points update event to activity log
      await fetchActivityLogs()
    } catch (err) {
      console.error('Error updating points:', err)
      setUpdateError(true)
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to update points',
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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pick_id: pickId,
          is_correct: isCorrect,
          reason,
        }),
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
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 rounded-lg bg-accent" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-lg bg-accent" />
            ))}
          </div>
          <div className="h-[400px] rounded-lg bg-accent" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-8 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and manage your platform&apos;s performance
        </p>
      </div>

      <FilterBar onFilterChange={handleFilterChange} />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border-l-4 border-l-destructive bg-destructive/10 p-4 text-destructive"
        >
          {error}
        </motion.div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          className="hover:border-primary/50"
        >
          <div className="mt-2 text-sm text-muted-foreground">
            Active users on the platform
          </div>
        </StatsCard>

        <StatsCard
          title="Total Predictions"
          value={stats?.totalPicks || 0}
          className="hover:border-primary/50"
        >
          <div className="mt-2 text-sm text-muted-foreground">
            Predictions made by users
          </div>
        </StatsCard>

        <StatsCard
          title="Pending Matches"
          value={stats?.pendingMatches || 0}
          className="hover:border-primary/50"
        >
          <div className="mt-2 text-sm text-muted-foreground">
            Matches awaiting results
          </div>
        </StatsCard>

        <StatsCard
          title="Last Sync"
          value={stats?.lastSyncMatches || 0}
          className="hover:border-primary/50"
        >
          <div className="mt-2 text-sm text-muted-foreground">
            {stats?.lastSyncTime
              ? `Last updated ${formatDistanceToNow(new Date(stats.lastSyncTime))} ago`
              : 'No sync data available'}
          </div>
        </StatsCard>
      </div>

      <ActivityCharts data={activityData} isLoading={isLoadingActivity} />

      <div className="grid gap-4 md:grid-cols-2">
        <ActivityLog logs={activityLogs} isLoading={isLoadingLogs} />

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest predictions made by users</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {recentPicks.map((pick) => (
                <motion.div
                  key={pick.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between border-b p-4 last:border-0 hover:bg-muted/50"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{pick.user.email}</div>
                    <div className="text-sm text-muted-foreground">
                      {pick.match.team1} vs {pick.match.team2}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(pick.created_at))} ago
                    </div>
                    {pick.is_correct === true && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    {pick.is_correct === false && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <X className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage platform data and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Sync Matches</div>
                  <div className="text-sm text-muted-foreground">
                    Update match data from external sources
                  </div>
                </div>
                <ActionButton
                  onClick={handleSync}
                  isLoading={isSyncing}
                  isSuccess={syncSuccess}
                  isError={syncError}
                  loadingText="Syncing..."
                  icon={<RefreshCw className="h-4 w-4" />}
                >
                  Sync
                </ActionButton>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Update Points</div>
                  <div className="text-sm text-muted-foreground">
                    Recalculate user points and rankings
                  </div>
                </div>
                <ActionButton
                  onClick={handleUpdatePoints}
                  isLoading={isUpdatingPoints}
                  isSuccess={updateSuccess}
                  isError={updateError}
                  loadingText="Updating..."
                  icon={<Calculator className="h-4 w-4" />}
                >
                  Update
                </ActionButton>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

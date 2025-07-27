'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { Plus, Calendar, Trophy, Users, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import { BorderBeam } from '@/components/magicui/border-beam'
import { CreateSeasonDialog } from './create-season-dialog'
import { SeasonList } from './season-list'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { format } from 'date-fns'

export interface Season {
  season_id: string
  name: string
  start_date: string
  end_date: string | null
  is_active: boolean
  total_matches: number
  finished_matches: number
  total_users: number
  total_picks: number
  correct_picks: number
  avg_accuracy: number
}

interface SeasonManagementCardProps {
  onSeasonChange?: () => void
}

export function SeasonManagementCard({
  onSeasonChange,
}: SeasonManagementCardProps) {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchSeasons = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch('/api/admin/seasons')
      if (!response.ok) throw new Error('Failed to fetch seasons')

      const data = await response.json()
      setSeasons(data)
    } catch (error) {
      console.error('Error fetching seasons:', error)
      toast({
        title: 'Error',
        description: 'Failed to load seasons',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSeasons()
  }, [])

  const activeSeason = seasons.find((s) => s.is_active)
  const upcomingSeasons = seasons.filter(
    (s) => !s.is_active && new Date(s.start_date) > new Date(),
  )
  const pastSeasons = seasons.filter(
    (s) => !s.is_active && (!s.end_date || new Date(s.end_date) < new Date()),
  )

  const handleSeasonCreated = () => {
    fetchSeasons()
    setShowCreateDialog(false)
    if (onSeasonChange) onSeasonChange()
  }

  const handleSeasonAction = () => {
    fetchSeasons()
    if (onSeasonChange) onSeasonChange()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-48 rounded bg-muted" />
            <div className="h-20 rounded bg-muted" />
            <div className="h-40 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Season Management</CardTitle>
              <CardDescription>
                Manage competition seasons and track performance
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Season
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active Season */}
          {activeSeason && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <Card className="relative overflow-hidden border-2 border-primary">
                <BorderBeam />
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">
                          {activeSeason.name}
                        </h3>
                        <Badge variant="default" className="ml-2">
                          Active
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Started{' '}
                        {format(
                          new Date(activeSeason.start_date),
                          'MMMM d, yyyy',
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Matches</p>
                      <p className="text-2xl font-bold">
                        <NumberTicker value={activeSeason.total_matches} />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activeSeason.finished_matches} completed
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Players</p>
                      <p className="text-2xl font-bold">
                        <NumberTicker value={activeSeason.total_users} />
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Predictions
                      </p>
                      <p className="text-2xl font-bold">
                        <NumberTicker value={activeSeason.total_picks} />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activeSeason.correct_picks} correct
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Accuracy</p>
                      <p className="text-2xl font-bold">
                        {activeSeason.avg_accuracy}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Separator />

          {/* Season Lists */}
          <div className="space-y-4">
            {upcomingSeasons.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Upcoming Seasons
                </h4>
                <SeasonList
                  seasons={upcomingSeasons}
                  onAction={handleSeasonAction}
                />
              </div>
            )}

            {pastSeasons.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Target className="h-4 w-4" />
                  Past Seasons
                </h4>
                <SeasonList
                  seasons={pastSeasons}
                  onAction={handleSeasonAction}
                  variant="past"
                />
              </div>
            )}
          </div>

          {seasons.length === 0 && (
            <div className="py-8 text-center">
              <p className="mb-4 text-muted-foreground">
                No seasons created yet. Create your first season to get started.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Season
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateSeasonDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleSeasonCreated}
        hasActiveSeason={!!activeSeason}
      />
    </>
  )
}

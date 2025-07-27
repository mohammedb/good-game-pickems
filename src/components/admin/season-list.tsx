'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Calendar, Users, Target, TrendingUp } from 'lucide-react'
import { SeasonActions } from './season-actions'
import { Season } from './season-management-card'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SeasonListProps {
  seasons: Season[]
  onAction?: () => void
  variant?: 'upcoming' | 'past' | 'all'
}

export function SeasonList({
  seasons,
  onAction,
  variant = 'all',
}: SeasonListProps) {
  const getSeasonStatus = (season: Season) => {
    const now = new Date()
    const startDate = new Date(season.start_date)
    const endDate = season.end_date ? new Date(season.end_date) : null

    if (season.is_active) return 'active'
    if (startDate > now) return 'upcoming'
    if (endDate && endDate < now) return 'completed'
    return 'inactive'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>
      case 'upcoming':
        return <Badge variant="secondary">Upcoming</Badge>
      case 'completed':
        return <Badge variant="outline">Completed</Badge>
      default:
        return <Badge variant="outline">Inactive</Badge>
    }
  }

  return (
    <div className="space-y-2">
      {seasons.map((season, index) => {
        const status = getSeasonStatus(season)

        return (
          <motion.div
            key={season.season_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={cn(
                'p-4 transition-all duration-200 hover:shadow-md',
                status === 'active' && 'border-primary',
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{season.name}</h4>
                    {getStatusBadge(status)}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(season.start_date), 'MMM d, yyyy')}
                        {season.end_date && (
                          <>
                            {' '}
                            - {format(new Date(season.end_date), 'MMM d, yyyy')}
                          </>
                        )}
                      </span>
                    </div>

                    {season.total_matches > 0 && (
                      <>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span>{season.total_matches} matches</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{season.total_users} players</span>
                        </div>
                        {season.avg_accuracy > 0 && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{season.avg_accuracy}% accuracy</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {season.total_picks > 0 && (
                    <div className="flex gap-6 text-xs">
                      <div>
                        <span className="text-muted-foreground">
                          Predictions:
                        </span>{' '}
                        <span className="font-medium">
                          {season.total_picks.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Correct:</span>{' '}
                        <span className="font-medium text-green-600">
                          {season.correct_picks.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <SeasonActions season={season} onAction={onAction} />
              </div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

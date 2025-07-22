'use client'

import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react'
import {
  formatDistanceToNow,
  format,
  addDays,
  startOfWeek,
  isAfter,
} from 'date-fns'

interface SyncScheduleCardProps {
  lastSyncTime?: string | null
  lastSyncMatches?: number
}

export function SyncScheduleCard({
  lastSyncTime,
  lastSyncMatches,
}: SyncScheduleCardProps) {
  // Calculate next sync time (next Sunday at 2 AM)
  const getNextSyncTime = () => {
    const now = new Date()
    const nextSunday = startOfWeek(addDays(now, 7), { weekStartsOn: 0 })
    nextSunday.setHours(2, 0, 0, 0)

    // If we're past Sunday 2 AM this week, use this Sunday
    const thisSunday = startOfWeek(now, { weekStartsOn: 0 })
    thisSunday.setHours(2, 0, 0, 0)

    if (isAfter(thisSunday, now)) {
      return thisSunday
    }

    return nextSunday
  }

  const nextSyncTime = getNextSyncTime()
  const timeUntilNextSync = formatDistanceToNow(nextSyncTime, {
    addSuffix: true,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Sync Schedule
        </CardTitle>
        <CardDescription>
          Automatic weekly synchronization status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Schedule</p>
            <p className="text-sm text-muted-foreground">
              Every Sunday at 2:00 AM
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Weekly
          </Badge>
        </div>

        <div className="space-y-2 rounded-lg bg-muted/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Next sync</span>
            <span className="text-sm font-medium">{timeUntilNextSync}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Scheduled for</span>
            <span className="text-sm text-muted-foreground">
              {format(nextSyncTime, 'PPP p')}
            </span>
          </div>
        </div>

        {lastSyncTime && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Last sync</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  {formatDistanceToNow(new Date(lastSyncTime), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
            {lastSyncMatches !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Matches synced
                </span>
                <span className="text-sm text-muted-foreground">
                  {lastSyncMatches}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="rounded-lg bg-blue-500/10 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 text-blue-500" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Automatic Points Update</p>
              <p className="text-sm text-muted-foreground">
                Points are automatically recalculated every Sunday at 3:00 AM,
                one hour after the match sync completes.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

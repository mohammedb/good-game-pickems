'use client'

import * as React from 'react'
import { AnimatedList } from '@/components/magicui/animated-list'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import {
  RefreshCw,
  Calculator,
  UserPlus,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityLogEntry {
  id: string
  type: 'sync' | 'points' | 'user' | 'match' | 'error' | 'success'
  message: string
  timestamp: string
  user?: string
  details?: string
}

interface ActivityLogProps {
  logs: ActivityLogEntry[]
  isLoading?: boolean
}

const activityIcons = {
  sync: RefreshCw,
  points: Calculator,
  user: UserPlus,
  match: Trophy,
  error: AlertTriangle,
  success: CheckCircle2,
}

const activityColors = {
  sync: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  points:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  user: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  match:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  success:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

const ActivityItem = React.memo(({ log }: { log: ActivityLogEntry }) => {
  const Icon = activityIcons[log.type]

  return (
    <div className="relative flex items-start gap-4 rounded-lg border bg-card p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-110',
          activityColors[log.type],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium leading-none">{log.message}</p>
          <Badge variant="secondary" className="text-xs font-normal">
            {formatDistanceToNow(new Date(log.timestamp))} ago
          </Badge>
        </div>
        {log.user && (
          <p className="text-sm text-muted-foreground">by {log.user}</p>
        )}
        {log.details && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {log.details}
          </p>
        )}
      </div>
    </div>
  )
})

ActivityItem.displayName = 'ActivityItem'

export const MagicActivityLog = React.memo(function MagicActivityLog({
  logs,
  isLoading,
}: ActivityLogProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              Recent admin actions and system events
            </CardDescription>
          </div>
          <Activity className="h-4 w-4 animate-pulse text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-4 rounded-lg bg-accent/50 p-4"
              >
                <div className="h-10 w-10 rounded-full bg-accent" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 rounded bg-accent" />
                  <div className="h-3 w-3/4 rounded bg-accent" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Recent admin actions and system events
          </CardDescription>
        </div>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-[400px] overflow-hidden p-6">
          <AnimatedList delay={1000}>
            {logs.map((log) => (
              <ActivityItem key={log.id} log={log} />
            ))}
          </AnimatedList>
        </div>
      </CardContent>
    </Card>
  )
})

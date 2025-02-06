'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
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

export function ActivityLog({ logs, isLoading }: ActivityLogProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Recent admin actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-4 rounded-lg bg-accent/50 p-4"
              >
                <div className="h-8 w-8 rounded-full bg-accent" />
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Recent admin actions and system events
          </CardDescription>
        </div>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <AnimatePresence mode="popLayout">
            {logs.map((log) => {
              const Icon = activityIcons[log.type]
              return (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="mb-4 flex items-start gap-4 rounded-lg border p-4 transition-colors last:mb-0 hover:bg-accent/50"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${activityColors[log.type]}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{log.message}</p>
                      <Badge variant="secondary" className="font-normal">
                        {formatDistanceToNow(new Date(log.timestamp))} ago
                      </Badge>
                    </div>
                    {log.user && (
                      <p className="text-sm text-muted-foreground">
                        by {log.user}
                      </p>
                    )}
                    {log.details && (
                      <p className="text-sm text-muted-foreground">
                        {log.details}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

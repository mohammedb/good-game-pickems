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
import { Icons } from '@/lib/icons'

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
  sync: Icons.sync,
  points: Icons.calculator,
  user: Icons.user,
  match: Icons.trophy,
  error: Icons.error,
  success: Icons.success,
}

const activityColors = {
  sync: 'bg-activity-sync/10 text-activity-sync',
  points: 'bg-activity-system/10 text-activity-system',
  user: 'bg-activity-user/10 text-activity-user',
  match: 'bg-activity-pick/10 text-activity-pick',
  error: 'bg-destructive/10 text-destructive',
  success: 'bg-activity-match/10 text-activity-match',
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
        <Icons.activity className="h-4 w-4 text-muted-foreground" />
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

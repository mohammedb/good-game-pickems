'use client'

import * as React from 'react'
import { MagicCard } from '@/components/magicui/magic-card'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

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

interface MagicRecentActivityProps {
  picks: Pick[]
}

export function MagicRecentActivity({ picks }: MagicRecentActivityProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest predictions made by users</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-2 p-2">
          <AnimatePresence mode="popLayout">
            {picks.map((pick, index) => (
              <motion.div
                key={pick.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                layout
              >
                <MagicCard
                  className="overflow-hidden rounded-lg"
                  gradientSize={180}
                  gradientColor="#3b82f6"
                  gradientOpacity={0.2}
                  gradientFrom="#3b82f6"
                  gradientTo="#8b5cf6"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">
                          {pick.user.email}
                        </div>
                        {pick.is_correct === true && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          >
                            <Check className="h-3 w-3" />
                          </motion.div>
                        )}
                        {pick.is_correct === false && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          >
                            <X className="h-3 w-3" />
                          </motion.div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">{pick.match.team1}</span>
                        <span>vs</span>
                        <span className="font-medium">{pick.match.team2}</span>
                        <span className="text-xs">•</span>
                        <span className="text-xs">
                          Picked: {pick.predicted_winner}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(pick.created_at))} ago
                      </div>
                    </div>
                  </div>
                </MagicCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

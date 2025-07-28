'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Swords,
  Trophy,
  TrendingUp,
  Bell,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChallengeNotification {
  id: string
  type:
    | 'challenge_received'
    | 'challenge_accepted'
    | 'challenge_declined'
    | 'challenge_completed'
  title: string
  message: string
  from_username?: string
  stake_points?: number
  winner?: boolean
  challenge_id?: string
}

interface ChallengeNotificationProps {
  notification: ChallengeNotification | null
  isVisible: boolean
  onClose: () => void
  onAction?: (action: string) => void
}

export function ChallengeNotification({
  notification,
  isVisible,
  onClose,
  onAction,
}: ChallengeNotificationProps) {
  useEffect(() => {
    if (isVisible && notification) {
      // Auto-close after 8 seconds for actions, 5 seconds for info
      const duration = notification.type === 'challenge_received' ? 8000 : 5000
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, notification, onClose])

  const getIcon = () => {
    switch (notification?.type) {
      case 'challenge_received':
        return <Swords className="h-5 w-5" />
      case 'challenge_accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'challenge_declined':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'challenge_completed':
        return <Trophy className="h-5 w-5 text-yellow-500" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getBackgroundColor = () => {
    switch (notification?.type) {
      case 'challenge_received':
        return 'bg-primary/10 border-primary/50'
      case 'challenge_accepted':
        return 'bg-green-500/10 border-green-500/50'
      case 'challenge_declined':
        return 'bg-red-500/10 border-red-500/50'
      case 'challenge_completed':
        return notification.winner
          ? 'bg-yellow-500/10 border-yellow-500/50'
          : 'bg-secondary/10 border-secondary/50'
      default:
        return ''
    }
  }

  return (
    <AnimatePresence>
      {isVisible && notification && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed right-4 top-20 z-50 w-full max-w-sm"
        >
          <Card
            className={cn(
              'relative overflow-hidden border-2 shadow-lg',
              getBackgroundColor(),
            )}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">{getIcon()}</div>

                <div className="flex-1 space-y-1">
                  <p className="font-semibold">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>

                  {notification.from_username && (
                    <div className="mt-2 flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {notification.from_username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {notification.from_username}
                      </span>
                    </div>
                  )}

                  {notification.stake_points &&
                    notification.stake_points > 0 && (
                      <div className="mt-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-sm font-medium">
                          {notification.stake_points} points at stake
                        </span>
                      </div>
                    )}
                </div>
              </div>

              {notification.type === 'challenge_received' && (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      onAction?.('view')
                      onClose()
                    }}
                    className="flex-1"
                  >
                    View Challenge
                  </Button>
                  <Button size="sm" variant="outline" onClick={onClose}>
                    Later
                  </Button>
                </div>
              )}

              {notification.type === 'challenge_completed' &&
                notification.challenge_id && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onAction?.('view_results')
                        onClose()
                      }}
                      className="w-full"
                    >
                      View Results
                    </Button>
                  </div>
                )}
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

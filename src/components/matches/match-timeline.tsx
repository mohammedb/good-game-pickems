import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/tailwind'
import { CircleDot, Clock, Star, Trophy, X } from 'lucide-react'

interface MatchEvent {
  id: string
  type: 'goal' | 'card' | 'substitution' | 'highlight'
  minute: number
  description: string
  team: 'home' | 'away'
  isHighlight?: boolean
}

interface MatchTimelineProps {
  events: MatchEvent[]
  className?: string
}

const eventIcons = {
  goal: CircleDot,
  card: X,
  substitution: Star,
  highlight: Trophy
}

export function MatchTimeline({ events, className }: MatchTimelineProps) {
  const [selectedEvent, setSelectedEvent] = React.useState<string | null>(null)

  const sortedEvents = React.useMemo(() => {
    return [...events].sort((a, b) => a.minute - b.minute)
  }, [events])

  return (
    <div className={cn('relative py-8', className)}>
      {/* Timeline line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-border"
      />

      {/* Events */}
      <div className="relative space-y-8">
        {sortedEvents.map((event, index) => {
          const Icon = eventIcons[event.type]
          const isSelected = selectedEvent === event.id

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'relative flex items-center',
                event.team === 'away' && 'flex-row-reverse'
              )}
            >
              {/* Event dot */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedEvent(isSelected ? null : event.id)}
                className={cn(
                  'absolute left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border bg-background shadow-sm transition-colors',
                  isSelected && 'border-primary bg-primary/10'
                )}
              >
                <Icon className={cn(
                  'h-4 w-4',
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                )} />
              </motion.button>

              {/* Event content */}
              <div
                className={cn(
                  'w-[calc(50%-2rem)] rounded-lg border bg-card p-4 shadow-sm',
                  event.team === 'home' ? 'mr-8' : 'ml-8',
                  event.isHighlight && 'border-primary bg-primary/5'
                )}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{event.minute}&apos;</span>
                </div>

                <AnimatePresence mode="wait">
                  {isSelected ? (
                    <motion.p
                      key="description"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 text-sm text-muted-foreground"
                    >
                      {event.description}
                    </motion.p>
                  ) : (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 line-clamp-1 text-sm text-muted-foreground"
                    >
                      {event.description}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
} 
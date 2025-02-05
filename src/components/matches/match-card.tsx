import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, ChevronDown, Clock, Trophy } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/utils/tailwind'
import { TeamLogo } from '@/components/ui/team-logo'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface MatchCardProps {
  match: {
    id: string
    homeTeam: {
      id: string
      name: string
      logo: string
    }
    awayTeam: {
      id: string
      name: string
      logo: string
    }
    startTime: Date
    highlightVideo?: string
    predictionDeadline: Date
    hasPredicted?: boolean
  }
  className?: string
}

export function MatchCard({ match, className }: MatchCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isVideoLoading, setIsVideoLoading] = React.useState(true)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const { toast } = useToast()

  const isUpcoming = match.startTime > new Date()
  const canPredict = match.predictionDeadline > new Date()
  const timeUntilMatch = isUpcoming ? match.startTime.getTime() - Date.now() : 0

  const handleExpandClick = () => {
    setIsExpanded(!isExpanded)
    if (videoRef.current) {
      if (isExpanded) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(error => {
          toast({
            title: 'Error',
            description: 'Unable to play video',
            variant: 'destructive'
          })
        })
      }
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TeamLogo
              src={match.homeTeam.logo}
              alt={match.homeTeam.name}
              size="lg"
              interactive
            />
            <div className="text-2xl font-bold">VS</div>
            <TeamLogo
              src={match.awayTeam.logo}
              alt={match.awayTeam.name}
              size="lg"
              interactive
            />
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(match.startTime, 'PPp')}
            </div>
            {isUpcoming && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-sm font-medium text-primary"
              >
                <Trophy className="h-4 w-4" />
                {canPredict ? 'Make your prediction!' : 'Predictions closed'}
              </motion.div>
            )}
          </div>
        </div>

        {match.highlightVideo && (
          <motion.div
            layout
            className="mt-4"
          >
            <Button
              variant="outline"
              className="w-full"
              onClick={handleExpandClick}
            >
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                {isExpanded ? 'Hide Highlights' : 'Watch Highlights'}
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </div>
            </Button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  {isVideoLoading && (
                    <div className="flex h-48 items-center justify-center rounded-md bg-accent/50">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Play className="h-8 w-8 text-muted-foreground" />
                      </motion.div>
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    src={match.highlightVideo}
                    className={cn(
                      'w-full rounded-md',
                      isVideoLoading ? 'hidden' : 'block'
                    )}
                    controls
                    onLoadedData={() => setIsVideoLoading(false)}
                    onError={() => {
                      setIsVideoLoading(false)
                      toast({
                        title: 'Error',
                        description: 'Failed to load video',
                        variant: 'destructive'
                      })
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {isUpcoming && canPredict && (
          <motion.div
            layout
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button className="w-full" size="lg">
              Make Prediction
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
} 
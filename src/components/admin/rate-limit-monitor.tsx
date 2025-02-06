import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/components/ui/use-toast'
import { Mail, Link2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface RateLimitStats {
  urlShortener: {
    activeUsers: number
    rateLimitedUsers: number
  }
  email: {
    emailsSentToday: number
    queuedEmails: number
    remainingDailyLimit: number
  }
  timestamp: string
}

export function RateLimitMonitor() {
  const [stats, setStats] = useState<RateLimitStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/rate-limits')
        if (!response.ok) {
          throw new Error('Failed to fetch rate limit stats')
        }
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Error fetching rate limit stats:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch rate limit statistics',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-40 animate-pulse rounded-md bg-accent" />
              <div className="h-4 w-60 animate-pulse rounded-md bg-accent" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 w-full animate-pulse rounded-md bg-accent" />
                <div className="h-4 w-3/4 animate-pulse rounded-md bg-accent" />
                <div className="h-4 w-1/2 animate-pulse rounded-md bg-accent" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const emailUsagePercent =
    ((100 - stats.email.remainingDailyLimit) / 100) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-4 md:grid-cols-2"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Email Rate Limits</CardTitle>
          </div>
          <CardDescription>
            Daily email sending limits and queue status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Daily Usage</span>
              <span className="font-medium">
                {100 - stats.email.remainingDailyLimit}/100
              </span>
            </div>
            <Progress value={emailUsagePercent} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Queued Emails</p>
              <p className="text-2xl font-bold">{stats.email.queuedEmails}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Remaining Today</p>
              <p className="text-2xl font-bold">
                {stats.email.remainingDailyLimit}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle>URL Shortener Limits</CardTitle>
          </div>
          <CardDescription>Active users and rate limit status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Active Users</p>
              <p className="text-2xl font-bold">
                {stats.urlShortener.activeUsers}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Rate Limited</p>
              <p className="text-2xl font-bold">
                {stats.urlShortener.rateLimitedUsers}
              </p>
            </div>
          </div>
          <div className="rounded-lg border p-2">
            <p className="text-sm text-muted-foreground">
              {stats.urlShortener.rateLimitedUsers > 0
                ? `${stats.urlShortener.rateLimitedUsers} user${
                    stats.urlShortener.rateLimitedUsers === 1 ? ' is' : 's are'
                  } currently rate limited`
                : 'No users are currently rate limited'}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

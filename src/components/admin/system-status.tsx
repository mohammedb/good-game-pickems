'use client'

import * as React from 'react'
import { OrbitingCircles } from '@/components/magicui/orbiting-circles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Database, Globe, Users, Shield, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SystemStatusProps {
  stats?: {
    totalUsers: number
    totalPicks: number
    pendingMatches: number
    lastSyncTime: string | null
  }
  className?: string
}

export function SystemStatus({ stats, className }: SystemStatusProps) {
  const systemHealth = React.useMemo(() => {
    if (!stats) return 'unknown'

    const hoursSinceSync = stats.lastSyncTime
      ? (Date.now() - new Date(stats.lastSyncTime).getTime()) / (1000 * 60 * 60)
      : 999

    if (hoursSinceSync > 24) return 'warning'
    if (stats.pendingMatches > 10) return 'warning'

    return 'healthy'
  }, [stats])

  const healthColor = {
    healthy: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
    unknown: 'text-gray-500',
  }[systemHealth]

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>System Status</CardTitle>
          <Badge
            variant={systemHealth === 'healthy' ? 'default' : 'secondary'}
            className={cn('capitalize', healthColor)}
          >
            {systemHealth}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative flex h-[300px] w-full items-center justify-center">
          {/* Orbit paths */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            className="size-full pointer-events-none absolute inset-0"
          >
            <circle
              className="stroke-black/10 stroke-1 dark:stroke-white/10"
              cx="50%"
              cy="50%"
              r={50}
              fill="none"
            />
            <circle
              className="stroke-black/10 stroke-1 dark:stroke-white/10"
              cx="50%"
              cy="50%"
              r={80}
              fill="none"
            />
            <circle
              className="stroke-black/10 stroke-1 dark:stroke-white/10"
              cx="50%"
              cy="50%"
              r={120}
              fill="none"
            />
          </svg>

          {/* Inner orbit */}
          <OrbitingCircles
            className="size-[30px] border-none bg-transparent"
            duration={20}
            radius={50}
            path={false}
          >
            <Users className="h-5 w-5 text-primary" />
            <Database className="h-5 w-5 text-blue-500" />
          </OrbitingCircles>

          {/* Middle orbit */}
          <OrbitingCircles
            className="size-[35px] border-none bg-transparent"
            duration={25}
            radius={80}
            reverse
            path={false}
          >
            <Globe className="h-6 w-6 text-green-500" />
            <Activity className="h-6 w-6 text-orange-500" />
          </OrbitingCircles>

          {/* Outer orbit */}
          <OrbitingCircles
            className="size-[40px] border-none bg-transparent"
            duration={30}
            radius={120}
            path={false}
          >
            <Shield className="h-7 w-7 text-purple-500" />
            <Zap className="h-7 w-7 text-yellow-500" />
          </OrbitingCircles>

          {/* Center Status */}
          <div className="absolute flex flex-col items-center">
            <div className={cn('text-4xl font-bold', healthColor)}>
              {stats?.pendingMatches || 0}
            </div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-semibold">{stats?.totalUsers || 0}</p>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{stats?.totalPicks || 0}</p>
            <p className="text-xs text-muted-foreground">Total Picks</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">
              {stats?.lastSyncTime
                ? new Date(stats.lastSyncTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">Last Sync</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

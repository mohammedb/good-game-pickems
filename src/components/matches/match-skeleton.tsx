'use client'

import { cn } from '@/lib/utils'

export function MatchSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Round selector skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-40 animate-pulse rounded-md bg-muted" />
      </div>

      {/* Match cards skeleton */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-lg border bg-card p-6"
        >
          {/* Shimmer effect overlay */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="relative space-y-4">
            {/* Match time */}
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />

            {/* Teams */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                <div className="h-6 w-24 animate-pulse rounded bg-muted" />
              </div>

              <div className="h-8 w-16 animate-pulse rounded bg-muted" />

              <div className="flex items-center space-x-3">
                <div className="h-6 w-24 animate-pulse rounded bg-muted" />
                <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center space-x-2">
              <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

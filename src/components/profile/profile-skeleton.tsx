'use client'

import { cn } from '@/lib/utils'

export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('container mx-auto p-4', className)}>
      {/* Header skeleton with shimmer */}
      <div className="relative mb-8 overflow-hidden rounded-lg border bg-card p-6">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative">
          <div className="mb-2 flex items-center justify-between">
            <div className="h-9 w-48 animate-pulse rounded bg-muted" />
            <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="h-5 w-64 animate-pulse rounded bg-muted" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-lg border bg-card p-6"
          >
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="relative space-y-3">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* Achievements skeleton */}
      <div className="mb-8">
        <div className="mb-4 h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-lg border p-4"
            >
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <div className="relative">
                <div className="mb-3 h-12 w-12 animate-pulse rounded-full bg-muted" />
                <div className="mb-2 h-5 w-28 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="mt-3 h-1.5 w-full animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent picks skeleton */}
      <div>
        <div className="mb-4 h-6 w-28 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-lg border bg-card p-4"
            >
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <div className="relative flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-8 w-20 animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

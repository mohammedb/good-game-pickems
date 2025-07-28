'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { AchievementNotification } from '@/components/achievements/achievement-notification'
import type { Achievement } from '@/lib/achievements/types'

interface AchievementContextType {
  showAchievement: (achievement: Achievement) => void
}

const AchievementContext = createContext<AchievementContextType | undefined>(
  undefined,
)

export function AchievementProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [currentAchievement, setCurrentAchievement] =
    useState<Achievement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [queue, setQueue] = useState<Achievement[]>([])

  const showNextInQueue = useCallback(() => {
    if (queue.length > 0) {
      const [next, ...rest] = queue
      setQueue(rest)
      setCurrentAchievement(next)
      setIsVisible(true)
    }
  }, [queue])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => {
      setCurrentAchievement(null)
      showNextInQueue()
    }, 300) // Wait for exit animation
  }, [showNextInQueue])

  const showAchievement = useCallback(
    (achievement: Achievement) => {
      if (isVisible) {
        // If notification is already showing, add to queue
        setQueue((prev) => [...prev, achievement])
      } else {
        // Show immediately
        setCurrentAchievement(achievement)
        setIsVisible(true)
      }
    },
    [isVisible],
  )

  return (
    <AchievementContext.Provider value={{ showAchievement }}>
      {children}
      <AchievementNotification
        achievement={currentAchievement}
        isVisible={isVisible}
        onClose={handleClose}
      />
    </AchievementContext.Provider>
  )
}

export function useAchievementNotification() {
  const context = useContext(AchievementContext)
  if (!context) {
    throw new Error(
      'useAchievementNotification must be used within AchievementProvider',
    )
  }
  return context
}

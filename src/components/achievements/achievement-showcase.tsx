'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AchievementBadge } from './achievement-badge'
import { Icons } from '@/lib/icons'
import type { Achievement } from '@/lib/achievements/types'

interface AchievementShowcaseProps {
  achievements: (Achievement & {
    unlocked: boolean
    progress: number
    unlocked_at?: string
  })[]
  userId: string
  className?: string
}

const categoryNames = {
  prediction: 'Predictions',
  streak: 'Rekker',
  participation: 'Deltakelse',
  social: 'Sosialt',
}

const rarityOrder = ['legendary', 'epic', 'rare', 'common'] as const

export function AchievementShowcase({
  achievements,
  userId,
  className,
}: AchievementShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedRarity, setSelectedRarity] = useState<string>('all')

  // Calculate stats
  const totalAchievements = achievements.length
  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalPoints = achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0)
  const overallProgress =
    totalAchievements > 0
      ? Math.round((unlockedCount / totalAchievements) * 100)
      : 0

  // Filter achievements
  const filteredAchievements = achievements.filter((achievement) => {
    if (
      selectedCategory !== 'all' &&
      achievement.category !== selectedCategory
    ) {
      return false
    }
    if (selectedRarity !== 'all' && achievement.rarity !== selectedRarity) {
      return false
    }
    return true
  })

  // Group by category for display
  const groupedAchievements = filteredAchievements.reduce(
    (acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = []
      }
      acc[achievement.category].push(achievement)
      return acc
    },
    {} as Record<string, typeof achievements>,
  )

  // Sort achievements within each category
  Object.keys(groupedAchievements).forEach((category) => {
    groupedAchievements[category].sort((a, b) => {
      // Unlocked achievements first
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
      // Then by rarity (legendary first)
      const rarityIndexA = rarityOrder.indexOf(a.rarity)
      const rarityIndexB = rarityOrder.indexOf(b.rarity)
      if (rarityIndexA !== rarityIndexB) return rarityIndexA - rarityIndexB
      // Then by points
      return b.points - a.points
    })
  })

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Card */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Prestasjoner</h3>
            <p className="text-muted-foreground">
              Spor fremgangen din og lås opp belønninger
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{totalPoints}</p>
            <p className="text-sm text-muted-foreground">Totale Poeng</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Total Fremgang</span>
              <span className="text-sm text-muted-foreground">
                {unlockedCount} / {totalAchievements} låst opp
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Rarity breakdown */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {rarityOrder.map((rarity) => {
              const rarityAchievements = achievements.filter(
                (a) => a.rarity === rarity,
              )
              const unlockedRarity = rarityAchievements.filter(
                (a) => a.unlocked,
              ).length

              return (
                <div
                  key={rarity}
                  className="rounded-lg bg-muted/50 p-3 text-center"
                >
                  <Icons.trophy
                    className={cn(
                      'mx-auto mb-2 h-8 w-8',
                      rarity === 'legendary' && 'text-yellow-500',
                      rarity === 'epic' && 'text-purple-500',
                      rarity === 'rare' && 'text-blue-500',
                      rarity === 'common' && 'text-muted-foreground',
                    )}
                  />
                  <p className="text-sm font-medium capitalize">{rarity}</p>
                  <p className="text-xs text-muted-foreground">
                    {unlockedRarity} / {rarityAchievements.length}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Filters and Achievement Grid */}
      <Card className="p-6">
        <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
          <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <TabsList>
              <TabsTrigger value="all">Alle</TabsTrigger>
              {Object.entries(categoryNames).map(([key, name]) => (
                <TabsTrigger key={key} value={key}>
                  {name}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex gap-2">
              {rarityOrder.map((rarity) => (
                <Badge
                  key={rarity}
                  variant={selectedRarity === rarity ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer capitalize',
                    selectedRarity === rarity &&
                      rarity === 'legendary' &&
                      'bg-yellow-500',
                    selectedRarity === rarity &&
                      rarity === 'epic' &&
                      'bg-purple-500',
                    selectedRarity === rarity &&
                      rarity === 'rare' &&
                      'bg-blue-500',
                  )}
                  onClick={() =>
                    setSelectedRarity(
                      selectedRarity === rarity ? 'all' : rarity,
                    )
                  }
                >
                  {rarity}
                </Badge>
              ))}
            </div>
          </div>

          <TabsContent value={selectedCategory} className="mt-0">
            <div className="space-y-8">
              {Object.entries(groupedAchievements).map(
                ([category, categoryAchievements]) => (
                  <div key={category}>
                    {selectedCategory === 'all' && (
                      <h4 className="mb-4 text-lg font-semibold capitalize">
                        {categoryNames[category as keyof typeof categoryNames]}
                      </h4>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {categoryAchievements.map((achievement) => (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card
                            className={cn(
                              'p-4 transition-all duration-300 hover:shadow-lg',
                              achievement.unlocked
                                ? 'border-primary/20 bg-primary/5'
                                : 'opacity-75',
                            )}
                          >
                            <div className="flex items-start gap-4">
                              <AchievementBadge
                                achievement={achievement}
                                unlocked={achievement.unlocked}
                                progress={achievement.progress}
                                size="md"
                                showProgress={!achievement.unlocked}
                              />

                              <div className="flex-1">
                                <h5 className="font-semibold">
                                  {achievement.title}
                                </h5>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {achievement.description}
                                </p>

                                {!achievement.unlocked &&
                                  achievement.progress > 0 && (
                                    <div className="mt-3">
                                      <Progress
                                        value={achievement.progress}
                                        className="h-1.5"
                                      />
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        {achievement.progress}% fullført
                                      </p>
                                    </div>
                                  )}

                                {achievement.unlocked &&
                                  achievement.unlocked_at && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      Låst opp{' '}
                                      {new Date(
                                        achievement.unlocked_at,
                                      ).toLocaleDateString('nb-NO')}
                                    </p>
                                  )}
                              </div>

                              <Badge
                                variant="secondary"
                                className={cn(
                                  'text-xs',
                                  achievement.rarity === 'legendary' &&
                                    'text-yellow-600',
                                  achievement.rarity === 'epic' &&
                                    'text-purple-600',
                                  achievement.rarity === 'rare' &&
                                    'text-blue-600',
                                )}
                              >
                                +{achievement.points}
                              </Badge>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}

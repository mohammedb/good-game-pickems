'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/ui/stats-card'
import { AchievementCard } from '@/components/profile/achievement-card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { useUserStore } from '@/stores/user-store'
import { createBrowserClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { BorderBeam } from '@/components/magicui/border-beam'
import { ProfileSkeleton } from '@/components/profile/profile-skeleton'
import { SparklesText } from '@/components/magicui/sparkles-text'
import { Icons } from '@/lib/icons'

interface Match {
  team1: string
  team2: string
  start_time: string
  team1_map_score: number | null
  team2_map_score: number | null
}

interface Pick {
  id: string
  user_id: string
  match_id: string
  predicted_winner: string
  predicted_team1_maps: number | null
  predicted_team2_maps: number | null
  is_correct: boolean | null
  map_score_correct: boolean | null
  map_score_points: number
  created_at: string
  match: Match
}

interface Achievement {
  id: string
  name: string
  title: string
  description: string
  icon: 'trophy' | 'target' | 'sparkles' | 'medal' | 'crown'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  points: number
  unlocked: boolean
  unlockedAt?: string
  progress: number
}

interface ProfileStats {
  totalPicks: number
  correctPicks: number
  totalPoints: number
  mapScorePoints: number
  recentPicks: Pick[]
  achievements: Achievement[]
  userStats: {
    totalPredictions: number
    correctPredictions: number
    currentStreak: number
    longestStreak: number
    totalPoints: number
    mapScorePoints: number
  } | null
}

interface ProfileContentProps {
  stats: ProfileStats
}

const iconMap = {
  trophy: Icons.trophy,
  target: Icons.target,
  sparkles: Icons.sparkles,
  medal: Icons.medal,
  crown: Icons.crown,
}

export default function ProfileContent({ stats }: ProfileContentProps) {
  const { profile, isLoading, fetchUser } = useUserStore()
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState(profile?.username || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [achievementFilter, setAchievementFilter] = useState<
    'all' | 'unlocked' | 'progress'
  >('all')
  const { toast } = useToast()
  const supabase = createBrowserClient()
  const router = useRouter()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const handleUpdateUsername = async () => {
    if (!profile) return

    try {
      setIsUpdating(true)
      console.log('Starting username update for profile:', profile.id)

      // Validate username
      if (!newUsername.trim()) {
        toast({
          title: 'Feil',
          description: 'Brukernavn kan ikke være tomt',
          variant: 'destructive',
        })
        return
      }

      if (newUsername.length < 3 || newUsername.length > 20) {
        toast({
          title: 'Feil',
          description: 'Brukernavn må være mellom 3 og 20 tegn',
          variant: 'destructive',
        })
        return
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
        toast({
          title: 'Feil',
          description:
            'Brukernavn kan kun inneholde bokstaver, tall, understrek og bindestrek',
          variant: 'destructive',
        })
        return
      }

      // Check if username is taken
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username', newUsername)
        .neq('id', profile.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingUser) {
        toast({
          title: 'Feil',
          description: 'Brukernavnet er allerede i bruk',
          variant: 'destructive',
        })
        return
      }

      console.log('Updating username to:', newUsername)

      // First update the database
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          username: newUsername,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()

      if (updateError) {
        console.error('Database update error:', updateError)
        throw updateError
      }

      console.log('Database update result:', updateData)

      // Then update auth metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { username: newUsername },
      })

      if (metadataError) {
        console.error('Auth metadata update error:', metadataError)
        throw metadataError
      }

      console.log('Auth metadata updated successfully')

      // Fetch updated user data
      await fetchUser()

      setIsEditingUsername(false)
      toast({
        title: 'Suksess',
        description: 'Brukernavn oppdatert',
      })

      // Force a hard refresh of the page to ensure all data is updated
      window.location.reload()
    } catch (error) {
      console.error('Error updating username:', error)
      toast({
        title: 'Feil',
        description: 'Kunne ikke oppdatere brukernavn. Vennligst prøv igjen.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return <ProfileSkeleton />
  }

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 rounded-lg border bg-card p-6"
      >
        <BorderBeam size={350} duration={12} delay={9} />
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {profile?.username || 'Profil'}
          </h1>
          {!isEditingUsername ? (
            <Button
              variant="outline"
              onClick={() => {
                setNewUsername(profile?.username || '')
                setIsEditingUsername(true)
              }}
              className="relative overflow-hidden"
            >
              <span className="relative z-10">Endre Brukernavn</span>
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Skriv inn nytt brukernavn"
                className="w-48"
                disabled={isUpdating}
              />
              <Button onClick={handleUpdateUsername} disabled={isUpdating}>
                {isUpdating ? 'Lagrer...' : 'Lagre'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditingUsername(false)}
                disabled={isUpdating}
              >
                Avbryt
              </Button>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">{profile?.email}</p>
      </motion.div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <StatsCard title="Totale Poeng" value={stats.totalPoints} trend={10} />
        <StatsCard
          title="Riktige Tips"
          value={stats.correctPicks}
          total={stats.totalPicks}
        />
        <StatsCard
          title="Map Score Poeng"
          value={stats.mapScorePoints}
          total={stats.totalPicks * 2}
        />
      </div>

      {/* Achievement Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="mb-4 text-xl font-semibold">Prestasjoner</h2>

        {/* Achievement Progress Overview */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="border-tier-gold/30 bg-gradient-to-br from-tier-gold/5 to-tier-gold/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-tier-gold-foreground">Legendarisk</p>
                <p className="text-2xl font-bold text-tier-gold">
                  {
                    stats.achievements.filter(
                      (a) => a.rarity === 'legendary' && a.unlocked,
                    ).length
                  }
                  /
                  {
                    stats.achievements.filter((a) => a.rarity === 'legendary')
                      .length
                  }
                </p>
              </div>
              <Icons.crown className="h-8 w-8 text-tier-gold" />
            </div>
          </Card>

          <Card className="border-tier-platinum/30 bg-gradient-to-br from-tier-platinum/5 to-tier-platinum/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-tier-platinum-foreground">Episk</p>
                <p className="text-2xl font-bold text-tier-platinum">
                  {
                    stats.achievements.filter(
                      (a) => a.rarity === 'epic' && a.unlocked,
                    ).length
                  }
                  /
                  {stats.achievements.filter((a) => a.rarity === 'epic').length}
                </p>
              </div>
              <Icons.sparkles className="h-8 w-8 text-tier-platinum" />
            </div>
          </Card>

          <Card className="border-info/30 bg-gradient-to-br from-info/5 to-info/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-info-foreground">Sjelden</p>
                <p className="text-2xl font-bold text-info">
                  {
                    stats.achievements.filter(
                      (a) => a.rarity === 'rare' && a.unlocked,
                    ).length
                  }
                  /
                  {stats.achievements.filter((a) => a.rarity === 'rare').length}
                </p>
              </div>
              <Icons.medal className="h-8 w-8 text-info" />
            </div>
          </Card>

          <Card className="border-muted bg-gradient-to-br from-muted/20 to-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Poeng</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.achievements
                    .filter((a) => a.unlocked)
                    .reduce((sum, a) => sum + a.points, 0)}
                </p>
              </div>
              <Icons.trophy className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Recently Unlocked Achievements */}
        {stats.achievements.filter((a) => a.unlocked).length > 0 && (
          <Card className="mb-6 border-success/30 bg-gradient-to-r from-success/5 to-success/10 p-6">
            <h3 className="mb-4 text-lg font-semibold text-success">
              🎉 Sist Opplåst
            </h3>
            <div className="flex flex-wrap gap-3">
              {stats.achievements
                .filter((a) => a.unlocked)
                .sort(
                  (a, b) =>
                    new Date(b.unlockedAt!).getTime() -
                    new Date(a.unlockedAt!).getTime(),
                )
                .slice(0, 3)
                .map((achievement) => {
                  const Icon = iconMap[achievement.icon]
                  return (
                    <motion.div
                      key={achievement.id}
                      whileHover={{ scale: 1.05 }}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                        achievement.rarity === 'legendary'
                          ? 'bg-tier-gold/20'
                          : achievement.rarity === 'epic'
                            ? 'bg-tier-platinum/20'
                            : achievement.rarity === 'rare'
                              ? 'bg-info/20'
                              : 'bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {achievement.title}
                      </span>
                      <span className="text-xs opacity-75">
                        +{achievement.points}p
                      </span>
                    </motion.div>
                  )
                })}
            </div>
          </Card>
        )}

        {/* Achievement Tabs */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={achievementFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setAchievementFilter('all')}
          >
            Alle ({stats.achievements.length})
          </Button>
          <Button
            variant={achievementFilter === 'unlocked' ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setAchievementFilter('unlocked')}
          >
            Opplåst ({stats.achievements.filter((a) => a.unlocked).length})
          </Button>
          <Button
            variant={achievementFilter === 'progress' ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setAchievementFilter('progress')}
          >
            I Progresjon (
            {
              stats.achievements.filter((a) => !a.unlocked && a.progress > 0)
                .length
            }
            )
          </Button>
        </div>

        {/* Achievement Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.achievements
            .filter((achievement) => {
              if (achievementFilter === 'unlocked') return achievement.unlocked
              if (achievementFilter === 'progress')
                return !achievement.unlocked && achievement.progress > 0
              return true
            })
            .sort((a, b) => {
              // Sort by: unlocked first, then by rarity (legendary first), then by progress
              if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
              const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 }
              if (a.rarity !== b.rarity)
                return rarityOrder[a.rarity] - rarityOrder[b.rarity]
              return b.progress - a.progress
            })
            .map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <AchievementCard {...achievement} />
              </motion.div>
            ))}
        </div>

        {stats.achievements.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              Ingen prestasjoner tilgjengelig ennå
            </p>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="mb-4 text-xl font-semibold">Siste Tips</h2>
        <div className="space-y-4">
          {stats.recentPicks.length > 0 ? (
            stats.recentPicks.map((pick) => (
              <Card key={pick.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {pick.match.team1} vs {pick.match.team2}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Tippet: {pick.predicted_winner}
                      {pick.predicted_team1_maps !== null &&
                        pick.predicted_team2_maps !== null && (
                          <span className="ml-2">
                            ({pick.predicted_team1_maps}-
                            {pick.predicted_team2_maps})
                          </span>
                        )}
                    </div>
                    {pick.match.team1_map_score !== null &&
                      pick.match.team2_map_score !== null && (
                        <div className="mt-1 text-sm">
                          Resultat: {pick.match.team1_map_score}-
                          {pick.match.team2_map_score}
                          {pick.map_score_correct && (
                            <span className="ml-2 text-success">
                              (+2 poeng)
                            </span>
                          )}
                        </div>
                      )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div
                      className={`rounded-full px-3 py-1 text-sm ${
                        pick.is_correct === null
                          ? 'bg-status-upcoming/10 text-status-upcoming'
                          : pick.is_correct
                            ? 'bg-success/10 text-success'
                            : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {pick.is_correct === null ? (
                        'Venter på kamp'
                      ) : pick.is_correct ? (
                        <SparklesText
                          sparklesCount={3}
                          colors={{
                            first: 'rgb(34 197 94)', // green-500
                            second: 'rgb(74 222 128)', // green-400
                          }}
                        >
                          Riktig
                        </SparklesText>
                      ) : (
                        'Feil'
                      )}
                    </div>
                    {pick.map_score_correct !== null && (
                      <div
                        className={`text-sm ${
                          pick.map_score_correct
                            ? 'text-success'
                            : 'text-destructive'
                        }`}
                      >
                        {pick.map_score_correct ? 'Riktig score' : 'Feil score'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {new Date(pick.match.start_time).toLocaleString('nb-NO')}
                </div>
              </Card>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="mb-4 text-muted-foreground">
                Ingen tips er lagt inn ennå
              </p>
              <Link href="/matches">
                <Button>Legg Inn Ditt Første Tips</Button>
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

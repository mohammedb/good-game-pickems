'use client'

import React, { useEffect, useState } from 'react'
import { ChallengeCard } from './challenge-card'
import { ChallengeCreationModalEnhanced } from './challenge-creation-modal-enhanced'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Swords,
  Plus,
  Inbox,
  Send,
  Trophy,
  TrendingUp,
  Target,
  TrendingDown,
} from 'lucide-react'
import { ChallengeWithDetails, ChallengeStats } from '@/lib/challenges/types'
import { createBrowserClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function ActiveChallengesList() {
  const [challenges, setChallenges] = useState<ChallengeWithDetails[]>([])
  const [stats, setStats] = useState<ChallengeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const supabase = createBrowserClient()
  const router = useRouter()

  const fetchUserAndChallenges = async () => {
    try {
      setLoading(true)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setCurrentUserId(user.id)

      // Fetch challenges first, then stats
      const fetchedChallenges = await fetchChallenges()
      await fetchStats(user.id, fetchedChallenges)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/challenges')
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Challenge API error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch challenges')
      }

      const data = await response.json()
      const fetchedChallenges = data.challenges || []
      setChallenges(fetchedChallenges)
      return fetchedChallenges
    } catch (error) {
      console.error('Error fetching challenges:', error)
      // Show user-friendly error message
      setChallenges([])
      return []
    }
  }

  const fetchStats = async (
    userId: string,
    challengesList?: ChallengeWithDetails[],
  ) => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select(
          'challenge_wins, challenge_losses, challenge_draws, challenge_points_won, challenge_points_lost',
        )
        .eq('id', userId)
        .single()

      if (userData) {
        const totalChallenges =
          userData.challenge_wins +
          userData.challenge_losses +
          userData.challenge_draws
        const winRate =
          totalChallenges > 0
            ? (userData.challenge_wins / totalChallenges) * 100
            : 0

        // Use passed challenges list or current state
        const challengesToCount = challengesList || challenges

        setStats({
          total_challenges: totalChallenges,
          wins: userData.challenge_wins,
          losses: userData.challenge_losses,
          draws: userData.challenge_draws,
          win_rate: winRate,
          points_won: userData.challenge_points_won,
          points_lost: userData.challenge_points_lost,
          active_challenges: challengesToCount.filter(
            (c) => c.status === 'accepted',
          ).length,
          pending_challenges: challengesToCount.filter(
            (c) => c.status === 'pending',
          ).length,
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Add useEffect to fetch data on component mount
  useEffect(() => {
    fetchUserAndChallenges()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChallengeUpdate = async () => {
    const updatedChallenges = await fetchChallenges()
    if (currentUserId) {
      await fetchStats(currentUserId, updatedChallenges)
    }
  }

  const filterChallenges = (type: string) => {
    if (!currentUserId) return []

    switch (type) {
      case 'sent':
        return challenges.filter((c) => c.challenger_id === currentUserId)
      case 'received':
        return challenges.filter((c) => c.challenged_id === currentUserId)
      case 'pending':
        return challenges.filter((c) => c.status === 'pending')
      case 'active':
        return challenges.filter((c) => c.status === 'accepted')
      case 'completed':
        return challenges.filter((c) => c.status === 'completed')
      default:
        return challenges
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for stats cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="animate-pulse p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="h-4 w-4 rounded bg-muted" />
                </div>
                <div className="space-y-1">
                  <div className="h-8 w-16 rounded bg-muted" />
                  <div className="h-3 w-32 rounded bg-muted" />
                </div>
              </div>
            </Card>
          ))}
        </div>
        {/* Skeleton for main content */}
        <Card>
          <div className="animate-pulse p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-6 w-48 rounded bg-muted" />
                <div className="h-4 w-64 rounded bg-muted" />
              </div>
              <div className="h-10 w-32 rounded bg-muted" />
            </div>
            <div className="mb-6 h-10 w-full rounded bg-muted" />
            <div className="space-y-4">
              <div className="h-32 w-full rounded bg-muted" />
              <div className="h-32 w-full rounded bg-muted" />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-muted/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Vinnerprosent
              </CardTitle>
              <Trophy
                className={cn(
                  'h-4 w-4',
                  stats.win_rate >= 60
                    ? 'text-green-600'
                    : stats.win_rate >= 40
                      ? 'text-yellow-600'
                      : 'text-red-600',
                )}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {stats.win_rate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.wins}W - {stats.losses}L - {stats.draws}D
              </p>
            </CardContent>
          </Card>

          <Card className="border-muted/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Poengbalanse
              </CardTitle>
              {stats.points_won - stats.points_lost > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {stats.points_won - stats.points_lost > 0 ? '+' : ''}
                {stats.points_won - stats.points_lost}
              </div>
              <p className="text-xs text-muted-foreground">
                +{stats.points_won} / -{stats.points_lost}
              </p>
            </CardContent>
          </Card>

          <Card className="border-muted/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Aktive
              </CardTitle>
              <Swords className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {stats.active_challenges}
              </div>
              <p className="text-xs text-muted-foreground">Pågående kamper</p>
            </CardContent>
          </Card>

          <Card className="border-muted/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Ventende
              </CardTitle>
              <Inbox className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {stats.pending_challenges}
              </div>
              <p className="text-xs text-muted-foreground">Venter på svar</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Head2Head Utfordringer
            </h1>
            <p className="text-muted-foreground">
              Konkurrer direkte mot andre spillere
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            size="lg"
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ny Utfordring
          </Button>
        </div>

        {/* Tabs and Content */}
        <Card className="border-muted/40">
          <CardContent className="p-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger
                  value="all"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Alle
                  {challenges.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                      {challenges.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="sent"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Sendt
                </TabsTrigger>
                <TabsTrigger
                  value="received"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Inbox className="mr-2 h-4 w-4" />
                  Mottatt
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Swords className="mr-2 h-4 w-4" />
                  Aktive
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  Fullført
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                <TabsContent value={activeTab} className="mt-0">
                  {filterChallenges(activeTab).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="mb-4 rounded-full bg-muted p-3">
                        {activeTab === 'sent' ? (
                          <Send className="h-8 w-8 text-muted-foreground" />
                        ) : activeTab === 'received' ? (
                          <Inbox className="h-8 w-8 text-muted-foreground" />
                        ) : activeTab === 'active' ? (
                          <Swords className="h-8 w-8 text-muted-foreground" />
                        ) : activeTab === 'completed' ? (
                          <Trophy className="h-8 w-8 text-muted-foreground" />
                        ) : (
                          <Target className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <h3 className="mb-2 text-lg font-semibold">
                        {activeTab === 'all'
                          ? 'Ingen utfordringer ennå'
                          : `Ingen ${activeTab === 'sent' ? 'sendte' : activeTab === 'received' ? 'mottatte' : activeTab === 'active' ? 'aktive' : 'fullførte'} utfordringer`}
                      </h3>
                      <p className="mb-4 max-w-sm text-sm text-muted-foreground">
                        {activeTab === 'all' || activeTab === 'sent'
                          ? 'Start med å utfordre en annen spiller'
                          : activeTab === 'received'
                            ? 'Du har ingen ventende utfordringer'
                            : activeTab === 'active'
                              ? 'Ingen pågående utfordringer akkurat nå'
                              : 'Du har ikke fullført noen utfordringer ennå'}
                      </p>
                      {(activeTab === 'all' || activeTab === 'sent') && (
                        <Button
                          onClick={() => setShowCreateModal(true)}
                          variant="default"
                          size="sm"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Ny utfordring
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {filterChallenges(activeTab).map((challenge) => (
                        <ChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          currentUserId={currentUserId!}
                          onUpdate={handleChallengeUpdate}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Create Challenge Modal */}
      <ChallengeCreationModalEnhanced
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleChallengeUpdate}
      />
    </div>
  )
}

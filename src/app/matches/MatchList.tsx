'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useRouter } from 'next/navigation'
import { submitPrediction, removeUnlockedPredictions } from './actions'
import { Match } from './types'
import Image from 'next/image'
import { Trash2, Lock, Twitch, CheckCircle2, Timer } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PredictionSummary } from './PredictionSummary'

interface MatchListProps {
  matches: Match[]
  userId: string
  username?: string
  roundStats: {
    totalPicks: number
    correctPicks: number
    roundName: string
    allRounds: string[]
    onRoundChange: (round: string) => void
  }
}

export default function MatchList({
  matches,
  userId,
  username,
  roundStats,
}: MatchListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isRemoving, setIsRemoving] = useState(false)
  const [mapScores, setMapScores] = useState<
    Record<string, { team1: number; team2: number }>
  >({})
  const [selectedWinners, setSelectedWinners] = useState<
    Record<string, string>
  >({})

  // Fetch existing predictions when component mounts
  useEffect(() => {
    async function fetchPredictions() {
      try {
        const response = await fetch('/api/picks')
        const data = await response.json()

        if (data.picks) {
          // Initialize map scores and selected winners from existing predictions
          const initialMapScores: Record<
            string,
            { team1: number; team2: number }
          > = {}
          const initialWinners: Record<string, string> = {}

          data.picks.forEach((pick: any) => {
            if (
              pick.predicted_team1_maps !== null &&
              pick.predicted_team2_maps !== null
            ) {
              initialMapScores[pick.match_id] = {
                team1: pick.predicted_team1_maps,
                team2: pick.predicted_team2_maps,
              }
            }
            if (pick.predicted_winner) {
              initialWinners[pick.match_id] = pick.predicted_winner
            }
          })

          setMapScores(initialMapScores)
          setSelectedWinners(initialWinners)
        }
      } catch (error) {
        console.error('Error fetching predictions:', error)
      }
    }

    fetchPredictions()
  }, [])

  // Group matches by round
  const matchesByRound = matches.reduce(
    (acc, match) => {
      const round = match.round
      if (!acc[round]) {
        acc[round] = []
      }
      acc[round].push(match)
      return acc
    },
    {} as Record<string, Match[]>,
  )

  const handleSubmit = async (
    matchId: string,
    winner: string,
    team1Maps?: number,
    team2Maps?: number,
  ) => {
    setSubmitting((prev) => ({ ...prev, [matchId]: true }))
    setErrors((prev) => ({ ...prev, [matchId]: '' }))

    try {
      const mapScore =
        team1Maps !== undefined && team2Maps !== undefined
          ? { team1: team1Maps, team2: team2Maps }
          : mapScores[matchId]

      const currentMatch = matches.find((m) => m.id === matchId)

      // If no map score provided, calculate default
      if (!mapScore && currentMatch) {
        const winningScore = Math.ceil(currentMatch.best_of / 2)
        const losingScore = Math.floor(
          (currentMatch.best_of - winningScore) / 2,
        )
        const isTeam1Winner = winner === currentMatch.team1

        setMapScores((prev) => ({
          ...prev,
          [matchId]: {
            team1: isTeam1Winner ? winningScore : losingScore,
            team2: isTeam1Winner ? losingScore : winningScore,
          },
        }))
      }

      // Get the final map scores to submit
      const finalMapScores =
        mapScore ||
        (currentMatch && {
          team1:
            winner === currentMatch.team1
              ? Math.ceil(currentMatch.best_of / 2)
              : Math.floor(
                  (currentMatch.best_of - Math.ceil(currentMatch.best_of / 2)) /
                    2,
                ),
          team2:
            winner === currentMatch.team2
              ? Math.ceil(currentMatch.best_of / 2)
              : Math.floor(
                  (currentMatch.best_of - Math.ceil(currentMatch.best_of / 2)) /
                    2,
                ),
        })

      // Only submit if we have valid scores
      if (finalMapScores) {
        const result = await submitPrediction(
          matchId,
          winner,
          userId,
          finalMapScores.team1,
          finalMapScores.team2,
        )

        if (result.error) {
          setErrors((prev) => ({
            ...prev,
            [matchId]: result.error,
          }))
          return
        }

        // Update local state to reflect the submission
        setMapScores((prev) => ({
          ...prev,
          [matchId]: finalMapScores,
        }))

        setSelectedWinners((prev) => ({
          ...prev,
          [matchId]: winner,
        }))
      }
    } catch (error) {
      console.error('Error submitting prediction:', error)
      setErrors((prev) => ({
        ...prev,
        [matchId]: 'Kunne ikke lagre prediction. Vennligst prøv igjen.',
      }))
    } finally {
      setSubmitting((prev) => ({ ...prev, [matchId]: false }))
    }
  }

  const handleMapScoreChange = (
    matchId: string,
    team1Score: number,
    team2Score: number,
  ) => {
    const currentMatch = matches.find((m) => m.id === matchId)
    if (!currentMatch) return

    // Validate map scores
    const mapsToWin = Math.ceil(currentMatch.best_of / 2)

    // Always update map scores
    setMapScores((prev) => ({
      ...prev,
      [matchId]: { team1: team1Score, team2: team2Score },
    }))

    // If we have a winner, update the winner and submit
    if (team1Score >= mapsToWin || team2Score >= mapsToWin) {
      const winner =
        team1Score > team2Score
          ? currentMatch.team1
          : team2Score > team1Score
            ? currentMatch.team2
            : null

      if (winner) {
        setSelectedWinners((prev) => ({
          ...prev,
          [matchId]: winner,
        }))
      }
    }

    // Always submit the prediction with current scores and winner
    handleSubmit(
      matchId,
      selectedWinners[matchId] ||
        (team1Score > team2Score ? currentMatch.team1 : currentMatch.team2),
      team1Score,
      team2Score,
    )
  }

  const handleRemoveUnlocked = async () => {
    setIsRemoving(true)
    try {
      const result = await removeUnlockedPredictions(userId)

      if (result.error) {
        toast({
          title: 'Feil',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Suksess',
          description: result.message,
          variant: 'default',
        })

        // If no picks were removed, show a more specific message
        if (result.deletedPicks?.length === 0) {
          toast({
            title: 'Info',
            description: 'Ingen ulåste predictions funnet å fjerne.',
            variant: 'default',
          })
        }

        router.refresh()
      }
    } catch (error) {
      console.error('Error removing predictions:', error)
      toast({
        title: 'Feil',
        description: 'Kunne ikke fjerne predictions. Vennligst prøv igjen.',
        variant: 'destructive',
      })
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="container mx-auto space-y-8 p-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div>
            <h1 className="mb-4 text-3xl font-bold">Kommende Kamper</h1>
            <div className="mb-4">
              <Image
                src="/cs2.png"
                alt="Counter-Strike 2"
                width={128}
                height={128}
                className="h-12 w-48"
              />
            </div>
          </div>
          <p className="text-muted-foreground">
            Legg inn dine predictions for kommende kamper
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemoveUnlocked}
          disabled={isRemoving}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {isRemoving ? 'Fjerner...' : 'Fjern Ulåste Predictions'}
        </Button>
      </div>

      <Card className="mb-8 bg-muted/50 p-4">
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="mb-3 text-base font-semibold">Poeng System</h3>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>2 poeng for riktig vinner</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>+1 bonus poeng for riktig map score</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 text-base font-semibold">
              Regler for Predictions
            </h3>
            <div className="grid gap-2">
              <div className="flex items-start gap-2">
                <Lock className="mt-1 h-3 w-3 shrink-0 text-yellow-500" />
                <span>
                  Predictions låses <strong>2 timer</strong> før kampstart
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Timer className="mt-1 h-3 w-3 shrink-0 text-blue-500" />
                <span>Du kan endre predictions helt frem til låsing</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-1 h-3 w-3 shrink-0 text-green-500" />
                <span>
                  Poeng deles ut når kampen er ferdig og resultatet er bekreftet
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 text-base font-semibold">Status Forklaring</h3>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500">
                  <Timer className="h-3 w-3" />
                  Åpen
                </span>
                <span>Du kan legge inn eller endre prediction</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-500">
                  <Lock className="h-3 w-3" />
                  Låst
                </span>
                <span>Prediction er låst og kan ikke endres</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  Ferdig
                </span>
                <span>Kampen er ferdig og poeng er delt ut</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <PredictionSummary
        totalPicks={roundStats.totalPicks}
        correctPicks={roundStats.correctPicks}
        roundName={roundStats.roundName}
        allRounds={roundStats.allRounds}
        onRoundChange={roundStats.onRoundChange}
        matches={matches}
        selectedWinners={selectedWinners}
        mapScores={mapScores}
        username={username}
      />

      {matches.length > 0 ? (
        <div className="space-y-12">
          {Object.entries(matchesByRound).map(([round, roundMatches]) => (
            <section key={round} className="space-y-4">
              <div className="sticky top-0 z-10 border-b bg-background/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <h2 className="text-2xl font-semibold">{round}</h2>
              </div>

              <div className="grid gap-6">
                {roundMatches.map((match) => {
                  const matchTime = new Date(match.start_time)
                  const now = new Date()
                  const twoHoursFromNow = new Date(
                    now.getTime() + 2 * 60 * 60 * 1000,
                  )
                  const isLocked = matchTime <= twoHoursFromNow

                  return (
                    <Card
                      key={match.id}
                      className="p-6 transition-shadow hover:shadow-md"
                    >
                      <div className="space-y-6">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                                BO{match.best_of}
                              </div>
                              <time className="text-sm text-muted-foreground">
                                {matchTime.toLocaleString('nb-NO')}
                              </time>
                              {match.is_finished ? (
                                <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Ferdig
                                </span>
                              ) : isLocked ? (
                                <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-500">
                                  <Lock className="h-3 w-3" />
                                  Låst
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500">
                                  <Timer className="h-3 w-3" />
                                  Åpen
                                </span>
                              )}
                            </div>
                            {match.stream_link && (
                              <a
                                href={match.stream_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-purple-500 transition-colors hover:text-purple-600"
                              >
                                <Twitch className="h-4 w-4" />
                                <span>Se Stream</span>
                              </a>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="flex items-center gap-3 text-lg font-semibold">
                                {match.team1_logo ? (
                                  <Image
                                    src={match.team1_logo}
                                    alt={match.team1}
                                    width={40}
                                    height={40}
                                    className="rounded-full"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                    <span className="text-xs">
                                      {match.team1.substring(0, 2)}
                                    </span>
                                  </div>
                                )}
                                {match.team1}
                              </h3>
                            </div>

                            <div className="px-4">
                              <span className="font-medium text-muted-foreground">
                                vs
                              </span>
                            </div>

                            <div className="flex-1 text-right">
                              <h3 className="flex items-center justify-end gap-3 text-lg font-semibold">
                                {match.team2}
                                {match.team2_logo ? (
                                  <Image
                                    src={match.team2_logo}
                                    alt={match.team2}
                                    width={40}
                                    height={40}
                                    className="rounded-full"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                    <span className="text-xs">
                                      {match.team2.substring(0, 2)}
                                    </span>
                                  </div>
                                )}
                              </h3>
                            </div>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        {errors[match.id] && (
                          <div className="rounded-md bg-destructive/10 p-3 text-destructive dark:bg-destructive/20">
                            {errors[match.id].replace('tipset', 'prediction')}
                          </div>
                        )}

                        <div className="relative">
                          {(isLocked || match.is_finished) && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
                              <div className="space-y-3 text-center">
                                {match.is_finished ? (
                                  <>
                                    <div className="flex flex-col items-center gap-2">
                                      <div className="flex items-center gap-3">
                                        <span
                                          className={cn(
                                            'text-lg font-semibold',
                                            match.winner_id ===
                                              match.team1_id &&
                                              'text-green-500',
                                          )}
                                        >
                                          {match.team1}
                                        </span>
                                        <div className="text-3xl font-bold">
                                          {match.team1_map_score} -{' '}
                                          {match.team2_map_score}
                                        </div>
                                        <span
                                          className={cn(
                                            'text-lg font-semibold',
                                            match.winner_id ===
                                              match.team2_id &&
                                              'text-green-500',
                                          )}
                                        >
                                          {match.team2}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      <p className="text-sm text-muted-foreground">
                                        Ferdig
                                      </p>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
                                    <p className="text-sm text-muted-foreground">
                                      Prediction er låst
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                          <RadioGroup
                            name={`winner-${match.id}`}
                            className="flex justify-center gap-4"
                            onValueChange={(value) => {
                              setSelectedWinners((prev) => ({
                                ...prev,
                                [match.id]: value,
                              }))
                              handleSubmit(match.id, value)
                            }}
                            value={selectedWinners[match.id]}
                            disabled={submitting[match.id] || isLocked}
                          >
                            <div className="flex-1">
                              <label
                                className={cn(
                                  'flex w-full cursor-pointer items-center rounded-lg border-2 p-4 transition-all',
                                  'hover:border-accent hover:bg-accent',
                                  'data-[state=checked]:border-primary data-[state=checked]:bg-primary/5',
                                  'space-x-2',
                                )}
                                htmlFor={`${match.id}-team1`}
                              >
                                <div className="flex w-full items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    {match.team1_logo ? (
                                      <Image
                                        src={match.team1_logo}
                                        alt={match.team1}
                                        width={24}
                                        height={24}
                                        className="rounded-full"
                                      />
                                    ) : (
                                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                                        <span className="text-xs">
                                          {match.team1.substring(0, 2)}
                                        </span>
                                      </div>
                                    )}
                                    <span className="font-medium">
                                      {match.team1}
                                    </span>
                                  </div>
                                  <RadioGroupItem
                                    value={match.team1}
                                    id={`${match.id}-team1`}
                                    className="data-[state=checked]:border-primary"
                                  />
                                </div>
                              </label>
                            </div>
                            <div className="flex-1">
                              <label
                                className={cn(
                                  'flex w-full cursor-pointer items-center rounded-lg border-2 p-4 transition-all',
                                  'hover:border-accent hover:bg-accent',
                                  'data-[state=checked]:border-primary data-[state=checked]:bg-primary/5',
                                  'space-x-2',
                                )}
                                htmlFor={`${match.id}-team2`}
                              >
                                <div className="flex w-full items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    {match.team2_logo ? (
                                      <Image
                                        src={match.team2_logo}
                                        alt={match.team2}
                                        width={24}
                                        height={24}
                                        className="rounded-full"
                                      />
                                    ) : (
                                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                                        <span className="text-xs">
                                          {match.team2.substring(0, 2)}
                                        </span>
                                      </div>
                                    )}
                                    <span className="font-medium">
                                      {match.team2}
                                    </span>
                                  </div>
                                  <RadioGroupItem
                                    value={match.team2}
                                    id={`${match.id}-team2`}
                                    className="data-[state=checked]:border-primary"
                                  />
                                </div>
                              </label>
                            </div>
                          </RadioGroup>

                          {!isLocked && !match.is_finished && (
                            <div className="mt-4 space-y-4">
                              <Separator />
                              <div className="text-center text-sm font-medium text-muted-foreground">
                                Map Score Prediction (+1 poeng for riktig score)
                              </div>
                              <div className="flex items-center justify-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={
                                      mapScores[match.id]?.team1?.toString() ??
                                      '0'
                                    }
                                    onValueChange={(value: string) => {
                                      const team1Score = parseInt(value)
                                      const currentTeam2 =
                                        mapScores[match.id]?.team2 || 0
                                      // Prevent equal scores
                                      if (team1Score === currentTeam2) {
                                        return
                                      }
                                      handleMapScoreChange(
                                        match.id,
                                        team1Score,
                                        currentTeam2,
                                      )
                                    }}
                                  >
                                    <SelectTrigger className="w-16">
                                      <SelectValue defaultValue="0">
                                        {mapScores[
                                          match.id
                                        ]?.team1?.toString() ?? '0'}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from(
                                        { length: match.best_of },
                                        (_, i) => {
                                          const currentTeam2 =
                                            mapScores[match.id]?.team2 || 0
                                          const isDisabled = i === currentTeam2
                                          return (
                                            <SelectItem
                                              key={i}
                                              value={i.toString()}
                                              disabled={isDisabled}
                                              className={
                                                isDisabled
                                                  ? 'cursor-not-allowed opacity-50'
                                                  : ''
                                              }
                                            >
                                              {i}
                                            </SelectItem>
                                          )
                                        },
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <span className="text-sm font-medium">-</span>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={
                                      mapScores[match.id]?.team2?.toString() ??
                                      '0'
                                    }
                                    onValueChange={(value: string) => {
                                      const team2Score = parseInt(value)
                                      const currentTeam1 =
                                        mapScores[match.id]?.team1 || 0
                                      // Prevent equal scores
                                      if (team2Score === currentTeam1) {
                                        return
                                      }
                                      handleMapScoreChange(
                                        match.id,
                                        currentTeam1,
                                        team2Score,
                                      )
                                    }}
                                  >
                                    <SelectTrigger className="w-16">
                                      <SelectValue defaultValue="0">
                                        {mapScores[
                                          match.id
                                        ]?.team2?.toString() ?? '0'}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from(
                                        { length: match.best_of },
                                        (_, i) => {
                                          const currentTeam1 =
                                            mapScores[match.id]?.team1 || 0
                                          const isDisabled = i === currentTeam1
                                          return (
                                            <SelectItem
                                              key={i}
                                              value={i.toString()}
                                              disabled={isDisabled}
                                              className={
                                                isDisabled
                                                  ? 'cursor-not-allowed opacity-50'
                                                  : ''
                                              }
                                            >
                                              {i}
                                            </SelectItem>
                                          )
                                        },
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="text-center text-xs text-muted-foreground">
                                First to {Math.ceil(match.best_of / 2)} maps
                              </div>
                            </div>
                          )}

                          {match.is_finished && (
                            <div className="mt-4 space-y-2">
                              <Separator />
                              <div className="text-center">
                                <div className="text-sm font-medium text-muted-foreground">
                                  Final Map Score
                                </div>
                                <div className="text-lg font-bold">
                                  {match.team1_map_score}-
                                  {match.team2_map_score}
                                </div>
                              </div>
                            </div>
                          )}

                          {submitting[match.id] && (
                            <div className="mt-2 text-center text-sm text-muted-foreground">
                              Lagrer prediction...
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="rounded-lg border border-dashed p-8">
            <h3 className="mb-2 text-lg font-semibold">
              Ingen Kommende Kamper
            </h3>
            <p className="text-muted-foreground">
              Sjekk tilbake senere for nye kamper
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

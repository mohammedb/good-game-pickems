'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useRouter } from 'next/navigation'
import { submitPrediction } from './actions'
import { Match } from './types'
import Image from 'next/image'

interface MatchListProps {
  matches: Match[]
  userId: string
}

export default function MatchList({ matches, userId }: MatchListProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (matchId: string, winner: string) => {
    setSubmitting(prev => ({ ...prev, [matchId]: true }))
    setErrors(prev => ({ ...prev, [matchId]: '' }))

    try {
      const result = await submitPrediction(matchId, winner, userId)

      if (result.error) {
        setErrors(prev => ({
          ...prev,
          [matchId]: result.error
        }))
      }
    } catch (error) {
      console.error('Error submitting prediction:', error)
      setErrors(prev => ({
        ...prev,
        [matchId]: 'Failed to submit prediction. Please try again.'
      }))
    } finally {
      setSubmitting(prev => ({ ...prev, [matchId]: false }))
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upcoming Matches</h1>
        <p className="text-muted-foreground">
          Make your predictions for upcoming matches
        </p>
      </div>

      {matches.length > 0 ? (
        <div className="grid gap-6">
          {matches.map((match) => (
            <Card key={match.id} className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Round {match.round}
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        • BO{match.best_of}
                      </div>
                    </div>
                    <time className="text-sm text-muted-foreground">
                      {new Date(match.start_time).toLocaleString()}
                    </time>
                  </div>

                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center gap-3">
                      {match.team1_logo ? (
                        <Image
                          src={match.team1_logo}
                          alt={match.team1}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-muted rounded-full" />
                      )}
                      {match.team1}
                    </h3>
                    <span className="text-muted-foreground">vs</span>
                    <h3 className="text-lg font-semibold flex items-center gap-3">
                      {match.team2}
                      {match.team2_logo ? (
                        <Image
                          src={match.team2_logo}
                          alt={match.team2}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-muted rounded-full" />
                      )}
                    </h3>
                  </div>
                </div>

                <Separator />

                {errors[match.id] && (
                  <div className="p-3 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {errors[match.id]}
                  </div>
                )}

                <RadioGroup
                  name={`winner-${match.id}`}
                  className="gap-4"
                  onValueChange={(value) => handleSubmit(match.id, value)}
                  disabled={submitting[match.id]}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={match.team1} id={`${match.id}-team1`} />
                    <Label htmlFor={`${match.id}-team1`}>{match.team1}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={match.team2} id={`${match.id}-team2`} />
                    <Label htmlFor={`${match.id}-team2`}>{match.team2}</Label>
                  </div>
                </RadioGroup>

                {submitting[match.id] && (
                  <div className="text-sm text-muted-foreground">
                    Submitting prediction...
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="rounded-lg border border-dashed p-8">
            <h3 className="text-lg font-semibold mb-2">No Upcoming Matches</h3>
            <p className="text-muted-foreground">
              Check back later for new matches to predict
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 
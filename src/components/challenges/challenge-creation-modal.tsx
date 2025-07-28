'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import {
  Loader2,
  AlertCircle,
  Trophy,
  Swords,
  Calendar,
  User,
  Zap,
  Check,
  Target,
  Users,
  Sparkles,
  Info,
  MessageSquare,
} from 'lucide-react'
import { format } from 'date-fns'
import { ChallengeType, CreateChallengeRequest } from '@/lib/challenges/types'
import { createBrowserClient } from '@/utils/supabase-client'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { NumberTicker } from '@/components/magicui/number-ticker'

interface ChallengeCreationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  preSelectedMatchId?: string
}

interface Match {
  id: string
  team1: string
  team2: string
  team1_logo?: string
  team2_logo?: string
  start_time: string
  round: string
}

export function ChallengeCreationModal({
  open,
  onOpenChange,
  onSuccess,
  preSelectedMatchId,
}: ChallengeCreationModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [matches, setMatches] = useState<Match[]>([])
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [userPoints, setUserPoints] = useState(0)

  const [formData, setFormData] = useState({
    challenged_username: '',
    challenge_type: 'single_match' as ChallengeType,
    stake_points: 0,
    message: '',
    selected_matches: preSelectedMatchId
      ? [preSelectedMatchId]
      : ([] as string[]),
    selected_round: '',
  })

  const supabase = createBrowserClient()

  // Fetch user points
  useEffect(() => {
    async function fetchUserPoints() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', user.id)
        .single()

      if (data) {
        setUserPoints(data.total_points)
      }
    }

    if (open) {
      fetchUserPoints()
    }
  }, [open, supabase])

  // Fetch available matches
  useEffect(() => {
    async function fetchMatches() {
      setLoadingMatches(true)
      const { data, error } = await supabase
        .from('matches')
        .select('id, team1, team2, team1_logo, team2_logo, start_time, round')
        .eq('is_finished', false)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })

      if (!error && data) {
        setMatches(data)
      }
      setLoadingMatches(false)
    }

    if (open) {
      fetchMatches()
    }
  }, [open, supabase])

  // Pre-select match if provided
  useEffect(() => {
    if (preSelectedMatchId && open) {
      setFormData((prev) => ({
        ...prev,
        selected_matches: [preSelectedMatchId],
        challenge_type: 'single_match',
      }))
    }
  }, [preSelectedMatchId, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validation
      if (!formData.challenged_username) {
        throw new Error('Vennligst skriv inn et brukernavn')
      }

      if (formData.selected_matches.length === 0) {
        throw new Error('Vennligst velg minst én kamp')
      }

      if (formData.stake_points > userPoints) {
        throw new Error('Ikke nok poeng for innsats')
      }

      // Prepare request
      const request: CreateChallengeRequest = {
        challenged_username: formData.challenged_username,
        challenge_type: formData.challenge_type,
        match_ids: formData.selected_matches,
        stake_points:
          formData.stake_points > 0 ? formData.stake_points : undefined,
        message: formData.message || undefined,
      }

      // Send request
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke opprette utfordring')
      }

      toast({
        title: 'Utfordring Opprettet',
        description: `Utfordring sendt til ${formData.challenged_username}!`,
      })

      onOpenChange(false)
      onSuccess?.()

      // Reset form
      setFormData({
        challenged_username: '',
        challenge_type: 'single_match',
        stake_points: 0,
        message: '',
        selected_matches: [],
        selected_round: '',
      })
    } catch (error) {
      toast({
        title: 'Feil',
        description:
          error instanceof Error
            ? error.message
            : 'Kunne ikke opprette utfordring',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMatchSelection = (matchId: string) => {
    setFormData((prev) => ({
      ...prev,
      selected_matches: prev.selected_matches.includes(matchId)
        ? prev.selected_matches.filter((id) => id !== matchId)
        : [...prev.selected_matches, matchId],
    }))
  }

  const selectRoundMatches = (round: string) => {
    const roundMatches = matches
      .filter((m) => m.round === round)
      .map((m) => m.id)
    setFormData((prev) => ({
      ...prev,
      selected_matches: roundMatches,
      selected_round: round,
      challenge_type: 'round',
    }))
  }

  const rounds = Array.from(new Set(matches.map((m) => m.round))).filter(
    Boolean,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader className="relative">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          <DialogTitle className="relative flex items-center gap-2 text-xl">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Swords className="h-5 w-5 text-primary" />
            </motion.div>
            Opprett Hodestups-utfordring
          </DialogTitle>
          <DialogDescription className="text-base">
            Utfordre en annen spiller til en spennende prediction-kamp!
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-6 overflow-y-auto px-1"
        >
          {/* Step indicator */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors',
                  formData.challenged_username
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                1
              </div>
              <div
                className={cn(
                  'h-0.5 w-16 transition-colors',
                  formData.challenge_type ? 'bg-primary' : 'bg-muted',
                )}
              />
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors',
                  formData.selected_matches.length > 0
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                2
              </div>
              <div
                className={cn(
                  'h-0.5 w-16 transition-colors',
                  formData.selected_matches.length > 0
                    ? 'bg-primary'
                    : 'bg-muted',
                )}
              />
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors',
                  'bg-muted text-muted-foreground',
                )}
              >
                3
              </div>
            </div>
          </div>

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Label htmlFor="username" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Velg motstander
            </Label>
            <div className="relative">
              <Input
                id="username"
                placeholder="Skriv inn spillerens brukernavn"
                value={formData.challenged_username}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    challenged_username: e.target.value,
                  }))
                }
                required
                disabled={isLoading}
                className="pl-10"
              />
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              {formData.challenged_username && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Check className="h-4 w-4 text-success" />
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Velg utfordringstype
            </Label>
            <RadioGroup
              value={formData.challenge_type}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  challenge_type: value as ChallengeType,
                }))
              }
              disabled={isLoading}
              className="grid gap-3"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={cn(
                    'relative cursor-pointer p-4 transition-all duration-200',
                    formData.challenge_type === 'single_match'
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'hover:border-muted-foreground/50 hover:shadow-sm',
                  )}
                >
                  <label
                    htmlFor="single"
                    className="flex cursor-pointer items-start gap-3"
                  >
                    <RadioGroupItem
                      value="single_match"
                      id="single"
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Enkelt Kamp</p>
                      <p className="text-sm text-muted-foreground">
                        Velg én spesifikk kamp å predikere
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Populær
                    </Badge>
                  </label>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={cn(
                    'relative cursor-pointer p-4 transition-all duration-200',
                    formData.challenge_type === 'round'
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'hover:border-muted-foreground/50 hover:shadow-sm',
                  )}
                >
                  <label
                    htmlFor="round"
                    className="flex cursor-pointer items-start gap-3"
                  >
                    <RadioGroupItem
                      value="round"
                      id="round"
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Hel Runde</p>
                      <p className="text-sm text-muted-foreground">
                        Konkurrere om alle kamper i en runde
                      </p>
                    </div>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </label>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={cn(
                    'relative cursor-pointer p-4 transition-all duration-200',
                    formData.challenge_type === 'custom'
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'hover:border-muted-foreground/50 hover:shadow-sm',
                  )}
                >
                  <label
                    htmlFor="custom"
                    className="flex cursor-pointer items-start gap-3"
                  >
                    <RadioGroupItem
                      value="custom"
                      id="custom"
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Egendefinert Utvalg</p>
                      <p className="text-sm text-muted-foreground">
                        Håndplukk hvilke kamper å inkludere
                      </p>
                    </div>
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </label>
                </Card>
              </motion.div>
            </RadioGroup>
          </motion.div>

          <AnimatePresence>
            {formData.challenge_type === 'round' && rounds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <Label>Velg Runde</Label>
                <div className="grid grid-cols-2 gap-2">
                  {rounds.map((round, index) => (
                    <motion.div
                      key={round}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Button
                        type="button"
                        variant={
                          formData.selected_round === round
                            ? 'default'
                            : 'outline'
                        }
                        onClick={() => selectRoundMatches(round)}
                        disabled={isLoading}
                        className="w-full justify-start"
                      >
                        {round}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Velg kamper
              </Label>
              {formData.selected_matches.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Check className="h-3 w-3" />
                  {formData.selected_matches.length} valgt
                </Badge>
              )}
            </div>
            {loadingMatches ? (
              <div className="flex flex-col items-center justify-center space-y-2 p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Laster kamper...
                </p>
              </div>
            ) : matches.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Ingen kommende kamper tilgjengelig for øyeblikket.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border bg-muted/20 p-3">
                <AnimatePresence>
                  {matches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Card
                        className={cn(
                          'relative cursor-pointer overflow-hidden p-4 transition-all duration-200',
                          formData.selected_matches.includes(match.id)
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'hover:bg-accent hover:shadow-sm',
                          formData.challenge_type === 'round' &&
                            'cursor-default',
                        )}
                        onClick={() =>
                          formData.challenge_type !== 'round' &&
                          toggleMatchSelection(match.id)
                        }
                      >
                        {formData.selected_matches.includes(match.id) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute right-2 top-2"
                          >
                            <Check className="h-4 w-4 text-primary" />
                          </motion.div>
                        )}
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{match.team1}</span>
                            <span className="text-xs text-muted-foreground">
                              vs
                            </span>
                            <span className="font-medium">{match.team2}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Calendar className="h-3 w-3" />
                              {format(
                                new Date(match.start_time),
                                'dd. MMM HH:mm',
                              )}
                            </Badge>
                            {match.round && (
                              <Badge variant="secondary" className="text-xs">
                                {match.round}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Label htmlFor="stake" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Innsatspoeng (Valgfritt)
            </Label>
            <div className="space-y-3">
              <div className="relative">
                <Input
                  id="stake"
                  type="number"
                  min="0"
                  max={userPoints}
                  value={formData.stake_points}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      stake_points: parseInt(e.target.value) || 0,
                    }))
                  }
                  disabled={isLoading}
                  className="pl-10 pr-20"
                  placeholder="0"
                />
                <Zap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  / {userPoints}
                </span>
              </div>
              {userPoints > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">
                    Dine poeng:
                  </span>
                  <span className="font-semibold">
                    <NumberTicker value={userPoints} />
                  </span>
                </div>
              )}
              {formData.stake_points > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 text-sm text-warning"
                >
                  <Info className="h-4 w-4" />
                  <span>
                    Vinneren får {formData.stake_points * 2} poeng totalt
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Melding (Valgfritt)
            </Label>
            <Textarea
              id="message"
              placeholder="Legg til en personlig melding til utfordringen din..."
              value={formData.message}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, message: e.target.value }))
              }
              disabled={isLoading}
              rows={3}
              className="resize-none"
            />
            {formData.message && (
              <p className="text-right text-xs text-muted-foreground">
                {formData.message.length} / 200 tegn
              </p>
            )}
          </motion.div>

          <AnimatePresence>
            {formData.stake_points > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert className="border-warning/50 bg-warning/10">
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Innsats: {formData.stake_points} poeng</strong>
                    <br />
                    Vinneren får {formData.stake_points * 2} poeng! Begge
                    spillere må ha nok poeng.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter className="mt-4 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              size="lg"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isLoading ||
                formData.selected_matches.length === 0 ||
                !formData.challenged_username
              }
              size="lg"
              className="shadow-md transition-all duration-200 hover:shadow-lg"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sender...
                  </motion.div>
                ) : (
                  <motion.div
                    key="send"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Swords className="h-4 w-4" />
                    Send Utfordring
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

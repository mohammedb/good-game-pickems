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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  HelpCircle,
  Lightbulb,
  Star,
  TrendingUp,
  Gamepad2,
  Timer,
  ArrowRight,
  Search,
  Flame,
  Crown,
} from 'lucide-react'
import { format } from 'date-fns'
import { ChallengeType, CreateChallengeRequest } from '@/lib/challenges/types'
import { createBrowserClient } from '@/utils/supabase-client'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { BorderBeam } from '@/components/magicui/border-beam'

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

interface ChallengeTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  type: ChallengeType
  stakePoints?: number
  message?: string
  popular?: boolean
}

interface RecentOpponent {
  id: string
  username: string
  wins: number
  losses: number
  lastPlayed: string
}

export function ChallengeCreationModalEnhanced({
  open,
  onOpenChange,
  onSuccess,
  preSelectedMatchId,
}: ChallengeCreationModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [matches, setMatches] = useState<Match[]>([])
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [userPoints, setUserPoints] = useState(0)
  const [showTemplates, setShowTemplates] = useState(true)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [recentOpponents, setRecentOpponents] = useState<RecentOpponent[]>([])
  const [showOpponentSuggestions, setShowOpponentSuggestions] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

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

  // Challenge templates for quick creation
  const templates: ChallengeTemplate[] = [
    {
      id: 'friendly',
      name: 'Vennlig Duell',
      description: 'En avslappet kamp uten innsats',
      icon: <Gamepad2 className="h-4 w-4" />,
      type: 'single_match',
      stakePoints: 0,
      message: 'La oss se hvem som predikerer best!',
    },
    {
      id: 'high-stakes',
      name: 'Høy Innsats',
      description: 'Sats stort, vinn stort!',
      icon: <TrendingUp className="h-4 w-4" />,
      type: 'single_match',
      stakePoints: 50,
      message: 'Tør du å satse stort?',
      popular: true,
    },
    {
      id: 'weekend-warrior',
      name: 'Helgekriger',
      description: 'Konkurrer om hele helgens kamper',
      icon: <Calendar className="h-4 w-4" />,
      type: 'round',
      stakePoints: 20,
    },
    {
      id: 'quick-match',
      name: 'Rask Kamp',
      description: 'Neste kamp, rask avgjørelse',
      icon: <Timer className="h-4 w-4" />,
      type: 'single_match',
      stakePoints: 10,
    },
  ]

  // Fetch user points and check if first time
  useEffect(() => {
    async function fetchUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('users')
        .select('total_points, challenge_wins, challenge_losses')
        .eq('id', user.id)
        .single()

      if (data) {
        setUserPoints(data.total_points)
        // Check if user is new to challenges
        setIsFirstTime(data.challenge_wins === 0 && data.challenge_losses === 0)
      }

      // Fetch recent opponents (mock data for now)
      setRecentOpponents([
        {
          id: '1',
          username: 'PlayerOne',
          wins: 3,
          losses: 2,
          lastPlayed: '2024-01-15',
        },
        {
          id: '2',
          username: 'ProGamer',
          wins: 1,
          losses: 4,
          lastPlayed: '2024-01-10',
        },
      ])
    }

    if (open) {
      fetchUserData()
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
        title: 'Utfordring Opprettet! 🎯',
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
      setCurrentStep(1)
      setShowTemplates(true)
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

  const applyTemplate = (template: ChallengeTemplate) => {
    setFormData((prev) => ({
      ...prev,
      challenge_type: template.type,
      stake_points: template.stakePoints || 0,
      message: template.message || '',
    }))
    setShowTemplates(false)
  }

  const getStepProgress = () => {
    if (formData.selected_matches.length > 0) return 3
    if (formData.challenge_type) return 2
    if (formData.challenged_username) return 1
    return 0
  }

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
            {isFirstTime ? (
              <span className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 animate-pulse text-warning" />
                Din første utfordring! La oss komme i gang.
              </span>
            ) : (
              'Utfordre en annen spiller til en spennende prediction-kamp!'
            )}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-6 overflow-y-auto px-1"
        >
          {/* Enhanced Step indicator */}
          <div className="relative">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex flex-1 items-center gap-2">
                <motion.div
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all duration-300',
                    getStepProgress() >= 1
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-muted text-muted-foreground',
                  )}
                  animate={{ scale: getStepProgress() >= 1 ? [1, 1.1, 1] : 1 }}
                >
                  {getStepProgress() >= 1 ? <Check className="h-5 w-5" /> : '1'}
                  {getStepProgress() >= 1 && (
                    <motion.div
                      className="absolute inset-0 rounded-full ring-2 ring-primary"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                <div
                  className={cn(
                    'h-0.5 flex-1 transition-all duration-500',
                    getStepProgress() >= 2 ? 'bg-primary' : 'bg-muted',
                  )}
                />
                <motion.div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all duration-300',
                    getStepProgress() >= 2
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-muted text-muted-foreground',
                  )}
                  animate={{ scale: getStepProgress() >= 2 ? [1, 1.1, 1] : 1 }}
                >
                  {getStepProgress() >= 2 ? <Check className="h-5 w-5" /> : '2'}
                </motion.div>
                <div
                  className={cn(
                    'h-0.5 flex-1 transition-all duration-500',
                    getStepProgress() >= 3 ? 'bg-primary' : 'bg-muted',
                  )}
                />
                <motion.div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all duration-300',
                    getStepProgress() >= 3
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-muted text-muted-foreground',
                  )}
                  animate={{ scale: getStepProgress() >= 3 ? [1, 1.1, 1] : 1 }}
                >
                  {getStepProgress() >= 3 ? <Check className="h-5 w-5" /> : '3'}
                </motion.div>
              </div>
              {isFirstTime && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="ml-4 flex items-center gap-1 text-xs text-muted-foreground"
                >
                  <HelpCircle className="h-3 w-3" />
                  Tips aktivert
                </motion.div>
              )}
            </div>

            {/* Step labels */}
            <div className="-mt-2 flex justify-between text-xs text-muted-foreground">
              <span className="flex-1 text-center">Velg motstander</span>
              <span className="flex-1 text-center">Velg type</span>
              <span className="flex-1 text-center">Velg kamper</span>
            </div>
          </div>

          {/* Templates for quick start */}
          <AnimatePresence>
            {showTemplates && !preSelectedMatchId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-warning" />
                    Rask start-maler
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTemplates(false)}
                  >
                    Hopp over
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {templates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={cn(
                          'relative cursor-pointer p-3 transition-all duration-200 hover:border-primary/50 hover:shadow-md',
                          template.popular && 'ring-1 ring-warning/20',
                        )}
                        onClick={() => applyTemplate(template)}
                      >
                        {template.popular && (
                          <Badge
                            variant="outline"
                            className="absolute -right-2 -top-2 border-warning/50 bg-warning/10 text-[10px] text-warning"
                          >
                            <Star className="mr-0.5 h-2.5 w-2.5" />
                            Populær
                          </Badge>
                        )}
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'rounded-lg p-2',
                              template.popular ? 'bg-warning/10' : 'bg-muted',
                            )}
                          >
                            {template.icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {template.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {template.description}
                            </p>
                            {template.stakePoints &&
                              template.stakePoints > 0 && (
                                <Badge
                                  variant="outline"
                                  className="mt-1 gap-0.5 text-[10px]"
                                >
                                  <Zap className="h-2.5 w-2.5" />
                                  {template.stakePoints} poeng
                                </Badge>
                              )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 1: Choose opponent */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Label htmlFor="username" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Steg 1: Velg motstander
            </Label>
            <div className="relative">
              <Input
                id="username"
                placeholder="Skriv inn spillerens brukernavn"
                value={formData.challenged_username}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    challenged_username: e.target.value,
                  }))
                  setShowOpponentSuggestions(e.target.value.length > 0)
                }}
                onFocus={() => setShowOpponentSuggestions(true)}
                required
                disabled={isLoading}
                className="pl-10"
                autoComplete="off"
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

            {/* Recent opponents suggestions */}
            <AnimatePresence>
              {showOpponentSuggestions && recentOpponents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Search className="h-3 w-3" />
                    Nylige motstandere
                  </p>
                  <div className="grid gap-2">
                    {recentOpponents.map((opponent, index) => (
                      <motion.div
                        key={opponent.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className="cursor-pointer p-3 transition-colors hover:bg-accent"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              challenged_username: opponent.username,
                            }))
                            setShowOpponentSuggestions(false)
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {opponent.username[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {opponent.username}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {opponent.wins}S - {opponent.losses}T
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isFirstTime && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3"
              >
                <HelpCircle className="mt-0.5 h-4 w-4 text-primary" />
                <div className="space-y-1 text-xs">
                  <p className="font-medium">Tips: Velg en motstander</p>
                  <p className="text-muted-foreground">
                    Skriv inn brukernavnet til spilleren du vil utfordre. Du kan
                    finne brukernavn på ledertavlen!
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Step 2: Choose challenge type */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Steg 2: Velg utfordringstype
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
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary" className="text-xs">
                        Populær
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        1 kamp
                      </span>
                    </div>
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
                    <div className="flex flex-col items-end gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        3-5 kamper
                      </span>
                    </div>
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
                    <div className="flex flex-col items-end gap-1">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        Fleksibel
                      </span>
                    </div>
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

          {/* Step 3: Select matches */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Steg 3: Velg kamper
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

          {/* Optional: Stake points */}
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
                  step="10"
                />
                <Zap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  / {userPoints}
                </span>
              </div>
              {userPoints > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-sm text-muted-foreground">
                      Dine poeng:
                    </span>
                    <span className="font-semibold">
                      <NumberTicker value={userPoints} />
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[10, 25, 50, 100].map((points) => (
                      <Button
                        key={points}
                        type="button"
                        variant={
                          formData.stake_points === points
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            stake_points: points,
                          }))
                        }
                        disabled={points > userPoints}
                        className="flex-1"
                      >
                        {points}
                      </Button>
                    ))}
                  </div>
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

          {/* Optional: Message */}
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
              maxLength={200}
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
                <Alert className="relative overflow-hidden border-warning/50 bg-warning/10">
                  <BorderBeam size={200} duration={12} borderWidth={2} />
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

          {/* Challenge preview */}
          <AnimatePresence>
            {formData.challenged_username &&
              formData.selected_matches.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-3"
                >
                  <Label className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    Forhåndsvisning av utfordring
                  </Label>
                  <Card className="relative overflow-hidden border-primary/20 bg-primary/5 p-4">
                    <BorderBeam size={250} duration={15} borderWidth={1} />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Motstander:</span>
                        <span className="text-sm font-semibold">
                          {formData.challenged_username}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Type:</span>
                        <Badge variant="outline">
                          {formData.challenge_type === 'single_match'
                            ? 'Enkelt kamp'
                            : formData.challenge_type === 'round'
                              ? 'Hel runde'
                              : 'Egendefinert'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Antall kamper:
                        </span>
                        <span className="text-sm font-semibold">
                          {formData.selected_matches.length}
                        </span>
                      </div>
                      {formData.stake_points > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Innsats:</span>
                          <Badge
                            variant="outline"
                            className="gap-1 border-amber-500/50"
                          >
                            <Zap className="h-3 w-3" />
                            {formData.stake_points} poeng
                          </Badge>
                        </div>
                      )}
                      {formData.message && (
                        <div className="border-t pt-2">
                          <p className="text-xs text-muted-foreground">
                            Melding:
                          </p>
                          <p className="mt-1 text-sm italic">
                            &ldquo;{formData.message}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}
          </AnimatePresence>
        </form>

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
            className="bg-gradient-to-r from-primary to-primary/80 shadow-md transition-all duration-200 hover:shadow-lg"
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
      </DialogContent>
    </Dialog>
  )
}

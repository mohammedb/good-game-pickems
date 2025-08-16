'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { SiCounterstrike, SiValorant, SiLeagueoflegends } from 'react-icons/si'
import {
  Trophy,
  Zap,
  Target,
  TrendingUp,
  Award,
  Crown,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'

interface Prediction {
  id: string
  match_id: string
  predicted_winner: string
  points_awarded?: number
  is_correct?: boolean
  matches: {
    id: string
    team1: string
    team2: string
    team1_logo?: string
    team2_logo?: string
    start_time: string
    team1_score?: number
    team2_score?: number
    game_type?: string
    is_finished: boolean
    winner_id?: string
  }
}

interface OverlayData {
  user: {
    username: string
    total_points: number
    correct_picks: number
    total_picks: number
  }
  predictions: Prediction[]
}

// Position classes need to be defined outside component to avoid reference errors
const positionClasses = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
}

const themeClasses = {
  dark: {
    container:
      'bg-gradient-to-br from-gray-900/98 via-gray-800/95 to-gray-900/98 text-white border border-gray-600/50 shadow-2xl shadow-black/50 backdrop-blur-xl',
    header:
      'border-b border-gray-600/30 bg-gradient-to-r from-gray-700/20 to-gray-600/20',
    card: 'bg-gradient-to-br from-gray-800/60 to-gray-700/40 border-gray-600/40 hover:border-gray-500/60',
    accent: 'text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  light: {
    container:
      'bg-gradient-to-br from-white/98 via-gray-50/95 to-white/98 text-gray-900 border border-gray-300/50 shadow-2xl shadow-gray-500/20 backdrop-blur-xl',
    header:
      'border-b border-gray-200/50 bg-gradient-to-r from-gray-100/40 to-gray-50/40',
    card: 'bg-gradient-to-br from-white/80 to-gray-50/60 border-gray-300/40 hover:border-gray-400/60',
    accent: 'text-blue-600',
    glow: 'shadow-blue-500/10',
  },
  transparent: {
    container:
      'bg-gradient-to-br from-black/85 via-gray-900/80 to-black/85 text-white border border-white/20 shadow-2xl shadow-black/70 backdrop-blur-2xl',
    header:
      'border-b border-white/15 bg-gradient-to-r from-white/5 to-white/10',
    card: 'bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:border-white/30',
    accent: 'text-cyan-300',
    glow: 'shadow-cyan-500/20',
  },
  neon: {
    container:
      'bg-gradient-to-br from-purple-900/95 via-pink-900/90 to-purple-900/95 text-purple-100 border border-purple-400/60 shadow-2xl shadow-purple-500/50 backdrop-blur-xl',
    header:
      'border-b border-purple-400/30 bg-gradient-to-r from-purple-600/20 to-pink-600/20',
    card: 'bg-gradient-to-br from-purple-800/60 to-pink-800/40 border-purple-400/40 hover:border-purple-300/60',
    accent: 'text-pink-300',
    glow: 'shadow-pink-500/40',
  },
  gaming: {
    container:
      'bg-gradient-to-br from-emerald-900/95 via-teal-900/90 to-emerald-900/95 text-emerald-100 border border-emerald-400/60 shadow-2xl shadow-emerald-500/50 backdrop-blur-xl',
    header:
      'border-b border-emerald-400/30 bg-gradient-to-r from-emerald-600/20 to-teal-600/20',
    card: 'bg-gradient-to-br from-emerald-800/60 to-teal-800/40 border-emerald-400/40 hover:border-emerald-300/60',
    accent: 'text-teal-300',
    glow: 'shadow-teal-500/40',
  },
  premium: {
    container:
      'bg-gradient-to-br from-slate-900/98 via-zinc-900/95 to-slate-900/98 text-zinc-100 border border-amber-500/30 shadow-2xl shadow-amber-500/20 backdrop-blur-xl',
    header:
      'border-b border-amber-500/20 bg-gradient-to-r from-amber-600/10 to-orange-600/10',
    card: 'bg-gradient-to-br from-zinc-800/70 to-slate-800/50 border-amber-500/20 hover:border-amber-400/40',
    accent: 'text-amber-300',
    glow: 'shadow-amber-500/30',
  },
}

// Animation variants for smooth transitions
const containerVariants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.23, 1, 0.32, 1],
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -20,
    transition: { duration: 0.3 },
  },
}

const cardVariants = {
  initial: { opacity: 0, x: -30, scale: 0.9 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1],
    },
  },
  exit: {
    opacity: 0,
    x: 30,
    scale: 0.9,
    transition: { duration: 0.3 },
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
}

const statsVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: 0.2 },
  },
}

const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

const headerVariants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.1 },
  },
}

const predictionsVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.4, delay: 0.3 },
  },
}

const footerVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: 0.5 },
  },
}

export default function OverlayPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const apiKey = params.apiKey as string

  console.log('API Key from params:', apiKey) // Debug log

  // Customization options from URL params
  const theme = searchParams.get('theme') || 'dark'
  const position = searchParams.get('position') || 'bottom-right'
  const limit = parseInt(searchParams.get('limit') || '5')
  const showStats = searchParams.get('stats') !== 'false'
  const refreshInterval = parseInt(searchParams.get('refresh') || '30') * 1000
  const showScore = searchParams.get('score') !== 'false'
  const compact = searchParams.get('compact') === 'true'

  const [data, setData] = useState<OverlayData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `/api/v1/overlay?limit=${limit}`
        console.log('Fetching:', url, 'with API key:', apiKey)

        const response = await fetch(url, {
          headers: {
            'X-API-Key': apiKey,
          },
        })

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: 'Unknown error' }))
          console.error('API Error:', response.status, errorData)
          throw new Error(
            errorData.error?.message || `API Error: ${response.status}`,
          )
        }

        const result = await response.json()
        setData(result.data)
        setError(null)
        setLastUpdate(new Date())
      } catch (err: any) {
        setError(err.message || 'Invalid API key or connection error')
        console.error('Overlay error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchData()

    // Set up polling
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [apiKey, limit, refreshInterval])

  if (isLoading) {
    const currentTheme =
      themeClasses[theme as keyof typeof themeClasses] || themeClasses.dark

    return (
      <div
        className={`fixed ${positionClasses[position as keyof typeof positionClasses]} z-[9999]`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-w-[360px] max-w-[480px] rounded-2xl border border-gray-700 bg-gray-900/95 p-8 text-white"
        >
          {/* Premium Loading Header */}
          <div className="mb-6 border-b border-gray-600/30 pb-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="rounded-xl bg-gray-800 p-3"
              >
                <Trophy className="h-6 w-6" />
              </motion.div>
              <div className="flex-1 space-y-2">
                <div className="h-6 animate-pulse rounded-lg bg-gray-700" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-700" />
              </div>
            </div>
          </div>

          {/* Loading Stats */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-gray-700 bg-gray-800 p-4 text-center"
              >
                <div className="mb-2 h-8 animate-pulse rounded-lg bg-gray-700" />
                <div className="h-3 animate-pulse rounded bg-gray-700" />
              </motion.div>
            ))}
          </div>

          {/* Loading Cards */}
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="rounded-xl border border-gray-700 bg-gray-800 p-4"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 animate-pulse rounded bg-gray-700" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-gray-700" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Elegant Loading Dots */}
          <div className="mt-6 flex items-center justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
                className={`h-2 w-2 rounded-full ${currentTheme.accent.includes('blue') ? 'bg-blue-400' : currentTheme.accent.includes('purple') ? 'bg-purple-400' : currentTheme.accent.includes('cyan') ? 'bg-cyan-400' : currentTheme.accent.includes('pink') ? 'bg-pink-400' : currentTheme.accent.includes('teal') ? 'bg-teal-400' : 'bg-amber-400'}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div
        className={`fixed ${positionClasses[position as keyof typeof positionClasses]} z-[9999]`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-w-[360px] max-w-[480px] rounded-2xl border border-red-500/50 bg-gradient-to-br from-red-900/95 via-red-800/90 to-red-900/95 p-8 text-white shadow-2xl shadow-red-500/30 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mb-4 flex items-center gap-4"
          >
            <div className="rounded-xl border border-red-500/30 bg-red-500/20 p-3">
              <Zap className="h-8 w-8 text-red-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-100">
                Connection Error
              </h3>
              <p className="text-sm text-red-300">
                Unable to fetch predictions
              </p>
            </div>
          </motion.div>

          <div className="mb-6 space-y-3">
            <p className="font-medium text-red-200">
              {error || 'No data available'}
            </p>
            <p className="text-sm text-red-300/80">
              • Check your API key and permissions
            </p>
            <p className="text-sm text-red-300/80">
              • Verify your internet connection
            </p>
            <p className="text-sm text-red-300/80">
              • Contact support if issues persist
            </p>
          </div>

          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-xs text-red-400"
          >
            Retrying connection...
          </motion.div>
        </motion.div>
      </div>
    )
  }

  const currentTheme =
    themeClasses[theme as keyof typeof themeClasses] || themeClasses.dark
  const accuracyRate =
    data.user.total_picks > 0
      ? Math.round((data.user.correct_picks / data.user.total_picks) * 100)
      : 0

  return (
    <div
      className={`fixed ${positionClasses[position as keyof typeof positionClasses]} z-[9999]`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className={`rounded-2xl ${compact ? 'p-6' : 'p-8'} border border-gray-700 bg-gray-900/95 text-white shadow-2xl shadow-black/50 backdrop-blur-xl ${compact ? 'min-w-[280px] max-w-[360px]' : 'min-w-[360px] max-w-[480px]'}`}
      >
        {/* Header - matching loading state */}
        <div className="mb-6 border-b border-gray-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-3 shadow-inner">
              {accuracyRate >= 80 ? (
                <Trophy
                  className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} drop-shadow-glow text-yellow-400`}
                />
              ) : accuracyRate >= 60 ? (
                <Award
                  className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} drop-shadow-glow text-blue-400`}
                />
              ) : (
                <Target
                  className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} text-gray-400`}
                />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">
                {data.user.username}&apos;s Predictions
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                <span className="font-semibold text-blue-400">
                  {data.user.total_points}
                </span>{' '}
                points •
                <span className="font-semibold text-green-400">
                  {data.user.correct_picks}
                </span>
                /{data.user.total_picks} correct
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid - matching loading state */}
        {showStats && !compact && (
          <motion.div
            variants={statsVariants}
            className="mb-6 grid grid-cols-3 gap-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="hover:bg-gray-750 cursor-pointer rounded-xl border border-blue-500/50 bg-gray-800 p-4 text-center transition-all hover:border-blue-400"
            >
              <motion.div
                className="text-2xl font-bold text-blue-400"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {data.user.total_points}
              </motion.div>
              <div className="text-sm text-blue-300/60">Points</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="hover:bg-gray-750 cursor-pointer rounded-xl border border-green-500/50 bg-gray-800 p-4 text-center transition-all hover:border-green-400"
            >
              <div className="text-2xl font-bold text-green-400">
                {data.user.correct_picks}/{data.user.total_picks}
              </div>
              <div className="text-sm text-green-300/60">Correct</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="hover:bg-gray-750 cursor-pointer rounded-xl border border-purple-500/50 bg-gray-800 p-4 text-center transition-all hover:border-purple-400"
            >
              <div className="text-2xl font-bold text-purple-400">
                {accuracyRate}%
              </div>
              <div className="text-sm text-purple-300/60">Accuracy</div>
            </motion.div>
          </motion.div>
        )}

        {/* Predictions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className={`relative z-0 ${compact ? 'space-y-2' : 'space-y-3'}`}
        >
          {data.predictions && data.predictions.length > 0 ? (
            data.predictions.map((prediction, index) => {
              const match = prediction.matches
              const isLive =
                !match.is_finished && new Date(match.start_time) <= new Date()

              return (
                <div
                  key={prediction.id}
                  className={`
                    relative ${compact ? 'p-3' : 'p-4'} rounded-xl border backdrop-blur-sm transition-all duration-300
                    ${
                      match.is_finished
                        ? prediction.is_correct
                          ? 'border-green-500/50 bg-green-900/20 shadow-lg shadow-green-500/10'
                          : 'border-red-500/50 bg-red-900/20 shadow-lg shadow-red-500/10'
                        : isLive
                          ? 'animate-pulse-slow border-yellow-500/50 bg-yellow-900/20 shadow-lg shadow-yellow-500/10'
                          : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800/70'
                    }
                  `}
                >
                  {/* Live Indicator */}
                  {isLive && (
                    <>
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute left-0 top-0 h-1 w-full rounded-t-xl bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400"
                      />
                      <motion.div
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-yellow-500/10 to-transparent"
                      />
                    </>
                  )}

                  {/* Main content matching loading state exactly */}
                  <div className="mb-3 flex items-center gap-3">
                    {/* Game Icon */}
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border shadow-inner backdrop-blur-sm ${
                        match.is_finished && prediction.is_correct
                          ? 'border-green-500/30 bg-gradient-to-br from-green-500/30 to-green-600/20'
                          : match.is_finished && !prediction.is_correct
                            ? 'border-red-500/30 bg-gradient-to-br from-red-500/30 to-red-600/20'
                            : isLive
                              ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/30 to-orange-500/20'
                              : 'border-gray-600 bg-gray-700'
                      }`}
                    >
                      {match.game_type === 'lol' ? (
                        <SiLeagueoflegends className="h-5 w-5 text-white" />
                      ) : match.game_type === 'valorant' ? (
                        <SiValorant className="h-5 w-5 text-white" />
                      ) : (
                        <SiCounterstrike className="h-5 w-5 text-white" />
                      )}
                    </motion.div>

                    {/* Content matching loading bars */}
                    <div className="flex-1 space-y-2">
                      {/* Top bar - Teams */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${prediction.predicted_winner === match.team1 ? 'text-blue-400' : 'text-white'}`}
                        >
                          {match.team1}
                        </span>
                        <span className="text-xs text-gray-400">vs</span>
                        <span
                          className={`font-semibold ${prediction.predicted_winner === match.team2 ? 'text-blue-400' : 'text-white'}`}
                        >
                          {match.team2}
                        </span>
                      </div>

                      {/* Bottom bar - Status/Result */}
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Pick: {prediction.predicted_winner}</span>
                        {match.is_finished ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs">
                              {match.team1_score} - {match.team2_score}
                            </span>
                            {prediction.is_correct ? (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                              >
                                <CheckCircle className="drop-shadow-glow h-4 w-4 text-green-400" />
                              </motion.div>
                            ) : (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                              >
                                <XCircle className="drop-shadow-glow h-4 w-4 text-red-400" />
                              </motion.div>
                            )}
                          </div>
                        ) : isLive ? (
                          <span className="text-xs text-yellow-400">LIVE</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-6 text-center text-gray-400">
              <p>No predictions yet</p>
              <p className="mt-2 text-sm">Make some picks to see them here!</p>
            </div>
          )}
        </motion.div>

        {/* Premium Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`relative z-10 ${compact ? 'mt-3 pt-3' : 'mt-4 pt-4'} border-t border-gray-700`}
        >
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <span
                className={`${compact ? 'text-xs' : 'text-sm'} bg-gradient-to-r font-bold ${
                  theme === 'neon'
                    ? 'from-purple-300 to-pink-300'
                    : theme === 'gaming'
                      ? 'from-emerald-300 to-teal-300'
                      : theme === 'premium'
                        ? 'from-amber-300 to-orange-300'
                        : 'from-white to-white/70'
                } bg-clip-text text-transparent`}
              >
                ggwp.no
              </span>
            </motion.div>

            {/* Last Update Timer */}
            <div className="flex items-center gap-3">
              <motion.div
                className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-xs'} text-gray-400`}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <TrendingUp className="h-3 w-3" />
                </motion.div>
                <span>Live Updates</span>
              </motion.div>

              {/* Refresh Indicator */}
              <motion.div
                key={lastUpdate.getTime()}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.5 }}
                className="relative"
              >
                <div className="h-2 w-2 rounded-full bg-green-400" />
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 h-2 w-2 rounded-full bg-green-400"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  AnimatePresence,
} from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Trophy,
  Users,
  TrendingUp,
  Sparkles,
  Calendar,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { InteractiveGridPattern } from '@/components/magicui/interactive-grid-pattern'
import { SparklesText } from '@/components/magicui/sparkles-text'
import { PulsatingButton } from '@/components/magicui/pulsating-button'
import { BorderBeam } from '@/components/magicui/border-beam'
import { OrbitingCircles } from '@/components/magicui/orbiting-circles'

function HeroBackground({
  shouldReduceMotion,
}: {
  shouldReduceMotion: boolean
}) {
  const { scrollY } = useScroll()

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden">
      {/* Interactive Grid Pattern */}
      <InteractiveGridPattern
        className="stroke-[hsl(var(--brand-cyan))]/20 dark:stroke-[hsl(var(--brand-cyan))]/10"
        width={50}
        height={50}
        maxOpacity={0.6}
      />

      {/* Gradient Overlays */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* Radial gradient from center */}
        <div className="bg-radial-gradient absolute inset-0 from-transparent via-background/50 to-background/80" />

        {/* Top gradient */}
        <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-background/80 to-transparent" />

        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-background via-background/95 to-transparent" />
      </div>
    </div>
  )
}

function StatsOrbit() {
  return (
    <div className="relative h-[500px] w-[500px] opacity-20 dark:opacity-10">
      <OrbitingCircles
        radius={180}
        duration={20}
        delay={0}
        iconSize={60}
        className="border-none bg-transparent"
      >
        <Trophy className="h-8 w-8 text-[hsl(var(--brand-cyan))]" />
      </OrbitingCircles>
      <OrbitingCircles
        radius={180}
        duration={20}
        delay={7}
        iconSize={60}
        className="border-none bg-transparent"
      >
        <Users className="h-8 w-8 text-[hsl(var(--brand-green))]" />
      </OrbitingCircles>
      <OrbitingCircles
        radius={180}
        duration={20}
        delay={14}
        iconSize={60}
        className="border-none bg-transparent"
      >
        <TrendingUp className="h-8 w-8 text-[hsl(var(--brand-purple))]" />
      </OrbitingCircles>
    </div>
  )
}

interface Stats {
  totalPredictions: number
  activeUsers: number
  upcomingMatches: number
}

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const scale = useTransform(scrollY, [0, 300], [1, 0.95])
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    setMounted(true)

    // Fetch stats
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          setStats({
            totalPredictions: data.totalPredictions,
            activeUsers: data.activeUsers,
            upcomingMatches: data.upcomingMatches,
          })
        } else {
          console.error('Stats API error:', response.status)
          // Set defaults
          setStats({
            totalPredictions: 0,
            activeUsers: 0,
            upcomingMatches: 0,
          })
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        // Set defaults on error
        setStats({
          totalPredictions: 0,
          activeUsers: 0,
          upcomingMatches: 0,
        })
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <section className="relative min-h-[100vh] overflow-hidden">
      <HeroBackground shouldReduceMotion={!!shouldReduceMotion} />

      {/* Decorative Elements */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
        <StatsOrbit />
      </div>

      <motion.div
        style={{ scale: shouldReduceMotion ? 1 : scale }}
        className="container relative z-20 flex min-h-[100vh] flex-col items-center justify-center text-center"
      >
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl space-y-8"
        >
          {/* Logo with enhanced animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.1,
            }}
            className="mb-8 flex justify-center"
          >
            <motion.div
              whileHover={{
                scale: 1.05,
                rotate: [0, -5, 5, -5, 0],
                transition: { duration: 0.5 },
              }}
              className="group relative cursor-pointer"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-purple))] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-50" />
              <div className="relative overflow-hidden rounded-full">
                <BorderBeam size={250} duration={12} delay={0} />
                <Image
                  src="/logo.png"
                  alt="GGWP.NO Logo"
                  width={180}
                  height={180}
                  className="relative"
                  priority
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="space-y-4"
          >
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
              Legg Inn Dine Predictions
            </h1>
            <SparklesText
              className="text-5xl font-bold sm:text-7xl"
              colors={{
                first: 'hsl(var(--brand-cyan))',
                second: 'hsl(var(--brand-green))',
              }}
              sparklesCount={12}
            >
              Vinn Premier Soon™
            </SparklesText>
          </motion.div>

          {/* Subtitle with better animation */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Bli med i Norges største e-sport predictions plattform og test dine
            kunnskaper mot andre fans
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-center"
          >
            <Link href="/matches">
              <PulsatingButton
                className="group h-12 bg-[hsl(var(--brand-cyan))] px-8 text-lg font-semibold text-black hover:bg-[hsl(var(--brand-cyan))]/90"
                pulseColor="hsl(var(--brand-cyan))"
                duration="2s"
              >
                <span className="flex items-center gap-2">
                  Start å Predicte
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </span>
              </PulsatingButton>
            </Link>

            <Link href="/signup">
              <Button
                variant="outline"
                size="lg"
                className="group h-12 border-2 px-8 text-lg font-semibold backdrop-blur-sm hover:bg-background/90"
              >
                <span className="flex items-center gap-2">
                  Registrer Deg
                  <Sparkles className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
              </Button>
            </Link>
          </motion.div>

          {/* Stats Preview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: mounted ? 1 : 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="grid grid-cols-3 gap-8 pt-12"
          >
            {[
              {
                icon: Trophy,
                label: loadingStats ? null : stats?.totalPredictions || 0,
                suffix: '+',
                sublabel: 'Predictions',
              },
              {
                icon: Users,
                label: loadingStats ? null : stats?.activeUsers || 0,
                suffix: '+',
                sublabel: 'Aktive Spillere',
              },
              {
                icon: Calendar,
                label: loadingStats ? null : stats?.upcomingMatches || 0,
                suffix: '',
                sublabel: 'Kommende Kamper',
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.8 }}
                className="text-center"
              >
                <stat.icon className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <div className="text-2xl font-bold">
                  {stat.label === null ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {stat.label}
                      {stat.suffix}
                    </>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.sublabel}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-sm text-muted-foreground">Scroll ned</span>
            <div className="h-6 w-0.5 bg-gradient-to-b from-muted-foreground to-transparent" />
          </motion.div>
        </motion.div>
      </motion.div>

      <style jsx>{`
        .bg-radial-gradient {
          background: radial-gradient(
            circle at center,
            transparent 0%,
            hsl(var(--background) / 0.5) 50%,
            hsl(var(--background) / 0.8) 100%
          );
        }
      `}</style>
    </section>
  )
}

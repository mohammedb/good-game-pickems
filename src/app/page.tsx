'use client'

import { useEffect, useState } from 'react'
import {
  Trophy,
  Calendar,
  User2,
  TrendingUp,
  Activity,
  Users,
  Target,
  Award,
  BarChart3,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { HeroSection } from '@/components/hero-section/hero-section'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { BorderBeam } from '@/components/magicui/border-beam'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

interface PlatformStats {
  totalPredictions: number
  activeUsers: number
  averageAccuracy: number
  upcomingMatches: number
}

export default function Home() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)

  const [statsRef, statsInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const [featuresRef, featuresInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        } else {
          console.error('Stats API returned error:', response.status)
          // Set default values
          setStats({
            totalPredictions: 0,
            activeUsers: 0,
            averageAccuracy: 85,
            upcomingMatches: 0,
          })
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        // Set default values on error
        setStats({
          totalPredictions: 0,
          activeUsers: 0,
          averageAccuracy: 85,
          upcomingMatches: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <main className="min-h-screen">
      <HeroSection />

      {/* Stats Section */}
      <section className="bg-gradient-to-b from-background to-secondary/20 py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold">Platform Statistikk</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Se hvordan vårt fellesskap presterer og vokser
            </p>
          </motion.div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="group relative overflow-hidden rounded-xl border bg-card p-8 transition-all hover:shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand-cyan))]/5 to-transparent opacity-50" />
              <div className="relative">
                <div className="mb-6 inline-flex rounded-full bg-[hsl(var(--brand-cyan))]/10 p-3">
                  <Trophy className="h-8 w-8 text-[hsl(var(--brand-cyan))]" />
                </div>
                <h3 className="mb-2 text-3xl font-bold">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-lg">Laster...</span>
                    </div>
                  ) : (
                    <NumberTicker value={stats?.totalPredictions || 0} />
                  )}
                </h3>
                <p className="text-lg font-medium text-foreground">
                  Predictions
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Totalt antall predictions gjort på plattformen
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group relative overflow-hidden rounded-xl border bg-card p-8 transition-all hover:shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand-green))]/5 to-transparent opacity-50" />
              <div className="relative">
                <div className="mb-6 inline-flex rounded-full bg-[hsl(var(--brand-green))]/10 p-3">
                  <Users className="h-8 w-8 text-[hsl(var(--brand-green))]" />
                </div>
                <h3 className="mb-2 text-3xl font-bold">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-lg">Laster...</span>
                    </div>
                  ) : (
                    <NumberTicker value={stats?.activeUsers || 0} />
                  )}
                </h3>
                <p className="text-lg font-medium text-foreground">
                  Aktive Spillere
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Brukere som har gjort minst én prediction
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group relative overflow-hidden rounded-xl border bg-card p-8 transition-all hover:shadow-lg sm:col-span-2 lg:col-span-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand-purple))]/5 to-transparent opacity-50" />
              <div className="relative">
                <div className="mb-6 inline-flex rounded-full bg-[hsl(var(--brand-purple))]/10 p-3">
                  <BarChart3 className="h-8 w-8 text-[hsl(var(--brand-purple))]" />
                </div>
                <h3 className="mb-2 text-3xl font-bold">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-lg">Laster...</span>
                    </div>
                  ) : (
                    <>
                      <NumberTicker value={stats?.averageAccuracy || 0} />
                      <span className="ml-1 text-2xl font-normal text-muted-foreground">
                        %
                      </span>
                    </>
                  )}
                </h3>
                <p className="text-lg font-medium text-foreground">
                  Nøyaktighet
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Gjennomsnittlig treffsikkerhet blant topp 10 spillere
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <motion.section
        ref={featuresRef}
        initial="hidden"
        animate={featuresInView ? 'show' : 'hidden'}
        variants={container}
        className="bg-gradient-to-b from-secondary/20 via-background to-background py-24"
      >
        <div className="container mx-auto px-4">
          <motion.h2
            variants={fadeIn}
            className="mb-4 text-center text-3xl font-bold"
          >
            Slik Fungerer Det
          </motion.h2>

          <motion.p
            variants={fadeIn}
            className="mx-auto mb-12 max-w-2xl text-center text-lg text-muted-foreground"
          >
            Kom i gang på få minutter og bli en del av Norges mest spennende
            predictions-community
          </motion.p>

          <motion.div
            variants={container}
            className="grid grid-cols-1 gap-8 md:grid-cols-3"
          >
            <motion.div
              variants={item}
              className="group relative h-[320px]"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="relative h-full overflow-hidden rounded-lg border border-border bg-card">
                <BorderBeam size={250} duration={12} delay={0} />
                <div className="relative p-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand-cyan))]/5 via-transparent to-transparent" />
                  <div className="relative z-10">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--brand-cyan))]/10 backdrop-blur-sm">
                      <Target className="h-7 w-7 text-[hsl(var(--brand-cyan))]" />
                    </div>
                    <h3 className="mb-3 text-xl font-bold">
                      1. Velg Dine Kamper
                    </h3>
                    <p className="leading-relaxed text-muted-foreground">
                      Se gjennom kommende kamper og legg inn dine predictions
                      før de starter. Analyser lagstatistikk og form.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={item}
              className="group relative h-[320px]"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="relative h-full overflow-hidden rounded-lg border border-border bg-card">
                <BorderBeam size={250} duration={12} delay={4} />
                <div className="relative p-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand-green))]/5 via-transparent to-transparent" />
                  <div className="relative z-10">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--brand-green))]/10 backdrop-blur-sm">
                      <TrendingUp className="h-7 w-7 text-[hsl(var(--brand-green))]" />
                    </div>
                    <h3 className="mb-3 text-xl font-bold">2. Tjen Poeng</h3>
                    <p className="leading-relaxed text-muted-foreground">
                      Få poeng for hver riktig prediction. Jo mer presise dine
                      valg er, desto flere poeng tjener du.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={item}
              className="group relative h-[320px]"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="relative h-full overflow-hidden rounded-lg border border-border bg-card">
                <BorderBeam size={250} duration={12} delay={8} />
                <div className="relative p-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand-purple))]/5 via-transparent to-transparent" />
                  <div className="relative z-10">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--brand-purple))]/10 backdrop-blur-sm">
                      <Award className="h-7 w-7 text-[hsl(var(--brand-purple))]" />
                    </div>
                    <h3 className="mb-3 text-xl font-bold">
                      3. Klatre i Rankingen
                    </h3>
                    <p className="leading-relaxed text-muted-foreground">
                      Konkurrer med andre spillere og klatre på topplisten. Vinn
                      premier og ære!
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="mt-auto w-full border-t bg-gradient-to-b from-background to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 grid gap-8 md:grid-cols-3">
            <div>
              <h4 className="mb-3 font-semibold">Om GGWP.NO</h4>
              <p className="text-sm text-muted-foreground">
                Norges ledende predictions-plattform for esport
              </p>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">Kontakt</h4>
              <p className="text-sm text-muted-foreground">support@ggwp.no</p>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">Følg Oss</h4>
              <a
                href="https://x.com/KekMekn"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-[hsl(var(--brand-cyan))]"
              >
                @KekMekn på X
              </a>
            </div>
          </div>
          <div className="border-t pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 GGWP.NO · Drevet av{' '}
              <a
                href="https://x.com/KekMekn"
                target="_blank"
                rel="noreferrer"
                className="font-semibold transition-colors hover:text-[hsl(var(--brand-cyan))]"
              >
                KekMek
              </a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}

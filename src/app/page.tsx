'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  Trophy,
  Calendar,
  User2,
  TrendingUp,
  Activity,
  Users,
} from 'lucide-react'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Button } from '@/components/ui/button'

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

export default function Home() {
  const [statsRef, statsInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const [featuresRef, featuresInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/videos/hero-background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-primary/20 via-background to-background" />

        <div className="container relative z-20 flex h-full flex-col items-center justify-center text-center">
          <motion.h1
            className="mb-6 text-4xl font-bold sm:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Legg Inn Dine Predictions
            <span className="block bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              Vinn Stort
            </span>
          </motion.h1>

          <motion.p
            className="mb-8 max-w-2xl text-lg text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Bli med i fellesskapet av e-sport-entusiaster og test dine
            predictions-ferdigheter. Legg inn predictions på kommende kamper og
            klatre på topplisten!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link href="/matches">
              <Button size="lg" className="group relative overflow-hidden">
                <span className="relative z-10">Start å Predikere</span>
                <motion.div
                  className="absolute inset-0 bg-primary/20"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <motion.div
              className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Trophy className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-2xl font-semibold">
                Totale Predictions
              </h3>
              <p className="text-muted-foreground">
                Følg din treffsikkerhet og forbedre deg over tid
              </p>
            </motion.div>

            <motion.div
              className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Users className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-2xl font-semibold">Aktive Brukere</h3>
              <p className="text-muted-foreground">
                Bli med i et voksende fellesskap av e-sport-entusiaster
              </p>
            </motion.div>

            <motion.div
              className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm sm:col-span-2 lg:col-span-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Calendar className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-2xl font-semibold">Kommende Kamper</h3>
              <p className="text-muted-foreground">
                Hold deg oppdatert med de nyeste kampene og legg inn dine
                predictions
              </p>
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
        className="bg-gradient-to-b from-background to-muted/20 py-20"
      >
        <div className="container mx-auto px-4">
          <motion.h2
            variants={fadeIn}
            className="mb-12 text-center text-3xl font-bold"
          >
            Slik Fungerer Det
          </motion.h2>

          <motion.div
            variants={container}
            className="grid grid-cols-1 gap-8 md:grid-cols-3"
          >
            <motion.div
              variants={item}
              className="group relative h-[280px]"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="relative h-full overflow-hidden rounded-lg border border-muted bg-card p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">
                    1. Velg Dine Kamper
                  </h3>
                  <p className="text-muted-foreground">
                    Se gjennom kommende kamper og legg inn dine predictions før
                    de starter.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={item}
              className="group relative h-[280px]"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="relative h-full overflow-hidden rounded-lg border border-muted bg-card p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 to-red-600/10 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">2. Tjen Poeng</h3>
                  <p className="text-muted-foreground">
                    Få poeng for hver riktig prediction og se poengsummen din
                    vokse.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={item}
              className="group relative h-[280px]"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="relative h-full overflow-hidden rounded-lg border border-muted bg-card p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">
                    3. Klatre i Rankingen
                  </h3>
                  <p className="text-muted-foreground">
                    Konkurrer med andre og nå toppen av topplisten.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="mt-auto w-full border-t border-t-foreground/10 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Drevet av{' '}
            <a
              href="https://x.com/KekMekn"
              target="_blank"
              rel="noreferrer"
              className="font-semibold transition-colors hover:text-primary"
            >
              KekMek
            </a>
          </p>
        </div>
      </footer>
    </main>
  )
}

'use client'

import { useEffect } from 'react'
import {
  Trophy,
  Calendar,
  User2,
  TrendingUp,
  Activity,
  Users,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { HeroSection } from '@/components/hero-section/hero-section'

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
      <HeroSection />

      {/* Stats Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <motion.div
              className="rounded-lg border border-[#96AAFF]/20 bg-card p-6 text-card-foreground shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Trophy className="mb-4 h-12 w-12 text-[#64FFFF]" />
              <h3 className="mb-2 text-2xl font-semibold">
                Totale Predictions
              </h3>
              <p className="text-muted-foreground">
                Følg din treffsikkerhet og forbedre deg over tid
              </p>
            </motion.div>

            <motion.div
              className="rounded-lg border border-[#96AAFF]/20 bg-card p-6 text-card-foreground shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Users className="mb-4 h-12 w-12 text-[#BEFFD2]" />
              <h3 className="mb-2 text-2xl font-semibold">Aktive Brukere</h3>
              <p className="text-muted-foreground">
                Bli med i et voksende fellesskap av e-sport-entusiaster
              </p>
            </motion.div>

            <motion.div
              className="rounded-lg border border-[#96AAFF]/20 bg-card p-6 text-card-foreground shadow-sm sm:col-span-2 lg:col-span-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Calendar className="mb-4 h-12 w-12 text-[#64FFFF]" />
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
        className="bg-gradient-to-b from-background via-[#96AAFF]/5 to-[#BEFFD2]/5 py-20"
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
                <div className="absolute inset-0 bg-gradient-to-r from-[#64FFFF]/10 to-[#96AAFF]/10 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#64FFFF]/10">
                    <Calendar className="h-6 w-6 text-[#64FFFF]" />
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
                <div className="absolute inset-0 bg-gradient-to-r from-[#BEFFD2]/10 to-[#64FFFF]/10 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#BEFFD2]/10">
                    <TrendingUp className="h-6 w-6 text-[#BEFFD2]" />
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
                <div className="absolute inset-0 bg-gradient-to-r from-[#96AAFF]/10 to-[#BEFFD2]/10 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#96AAFF]/10">
                    <Trophy className="h-6 w-6 text-[#96AAFF]" />
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
      <footer className="mt-auto w-full border-t border-[#96AAFF]/10 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Drevet av{' '}
            <a
              href="https://x.com/KekMekn"
              target="_blank"
              rel="noreferrer"
              className="font-semibold transition-colors hover:text-[#64FFFF]"
            >
              KekMek
            </a>
          </p>
        </div>
      </footer>
    </main>
  )
}

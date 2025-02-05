'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Trophy, Calendar, User2, TrendingUp, Activity, Users } from 'lucide-react'
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
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

export default function Home() {
  const [statsRef, statsInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const [featuresRef, featuresInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        
        <div className="container relative flex h-full flex-col items-center justify-center text-center">
          <motion.h1 
            className="mb-6 text-4xl font-bold sm:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Make Your Predictions
            <span className="block bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              Win Big
            </span>
          </motion.h1>

          <motion.p 
            className="mb-8 max-w-2xl text-lg text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Join the community of esports enthusiasts and test your prediction skills.
            Make picks for upcoming matches and climb the leaderboard!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link href="/matches">
              <Button size="lg" className="group relative overflow-hidden">
                <span className="relative z-10">Start Predicting</span>
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
              <h3 className="mb-2 text-2xl font-semibold">Total Predictions</h3>
              <p className="text-muted-foreground">Track your prediction accuracy and improve over time</p>
            </motion.div>

            <motion.div
              className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Users className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-2xl font-semibold">Active Users</h3>
              <p className="text-muted-foreground">Join a growing community of esports predictors</p>
            </motion.div>

            <motion.div
              className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm sm:col-span-2 lg:col-span-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Calendar className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-2xl font-semibold">Upcoming Matches</h3>
              <p className="text-muted-foreground">Stay updated with the latest matches and make your picks</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <motion.section 
        ref={featuresRef}
        initial="hidden"
        animate={featuresInView ? "show" : "hidden"}
        variants={container}
        className="py-20 bg-gradient-to-b from-background to-muted/20"
      >
        <div className="container mx-auto px-4">
          <motion.h2 
            variants={fadeIn}
            className="text-3xl font-bold text-center mb-12"
          >
            How It Works
          </motion.h2>

          <motion.div 
            variants={container}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div 
              variants={item}
              className="relative group"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6 rounded-lg border border-muted">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">1. Pick Your Matches</h3>
                <p className="text-muted-foreground">
                  Browse upcoming matches and make your predictions before they start.
                </p>
              </div>
            </motion.div>

            <motion.div 
              variants={item}
              className="relative group"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 to-red-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6 rounded-lg border border-muted">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">2. Earn Points</h3>
                <p className="text-muted-foreground">
                  Get points for each correct prediction and watch your score grow.
                </p>
              </div>
            </motion.div>

            <motion.div 
              variants={item}
              className="relative group"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6 rounded-lg border border-muted">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">3. Climb the Ranks</h3>
                <p className="text-muted-foreground">
                  Compete with others and reach the top of the leaderboard.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="w-full border-t border-t-foreground/10 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by{' '}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="font-semibold hover:text-primary transition-colors"
            >
              Supabase
            </a>
          </p>
        </div>
      </footer>
    </main>
  )
}

'use client'

import { useEffect, useState } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function HeroBackground({
  shouldReduceMotion,
}: {
  shouldReduceMotion: boolean
}) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], ['0%', '50%'])
  const [videoError, setVideoError] = useState(false)

  return (
    <div className="absolute inset-0 h-full w-full">
      {!videoError ? (
        <motion.div
          style={{ y: shouldReduceMotion ? 0 : y }}
          className="absolute inset-0 h-full w-full"
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover brightness-[0.85]"
            onError={() => setVideoError(true)}
          >
            <source src="/videos/hero-background.mp4" type="video/mp4" />
          </video>
        </motion.div>
      ) : (
        <motion.div
          style={{ y: shouldReduceMotion ? 0 : y }}
          className="absolute inset-0 h-full w-full"
        >
          <Image
            src="/images/hero-fallback.jpg"
            alt="Hero background"
            fill
            priority
            className="object-cover brightness-[0.85]"
          />
        </motion.div>
      )}
      <div className="absolute inset-0 z-10">
        {/* Subtle top overlay */}
        <div className="absolute inset-x-0 top-0 h-[35%] bg-gradient-to-b from-background/50 to-transparent" />

        {/* Strong bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-t from-background via-background/90 to-transparent" />
      </div>
    </div>
  )
}

function CTAButton({ isLoading }: { isLoading?: boolean }) {
  return (
    <Button
      size="lg"
      className="group relative overflow-hidden bg-[#64FFFF] text-black transition-transform hover:scale-105 hover:bg-[#64FFFF]/90"
      disabled={isLoading}
    >
      <span className="relative z-10 flex items-center gap-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        Start å Predicte
      </span>
      <motion.div
        className="absolute inset-0 bg-[#BEFFD2]/20"
        initial={{ x: '-100%' }}
        whileHover={{ x: 0 }}
        transition={{ duration: 0.3 }}
      />
    </Button>
  )
}

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion()
  const [isLoading, setIsLoading] = useState(false)
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  const scale = useTransform(scrollY, [0, 300], [1, 0.8])
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  const handleClick = async () => {
    setIsLoading(true)
    // Simulate loading state for demo
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  return (
    <section className="relative h-[90vh] overflow-hidden">
      <HeroBackground shouldReduceMotion={!!shouldReduceMotion} />

      <motion.div
        style={{ opacity, scale: shouldReduceMotion ? 1 : scale }}
        className="container relative z-20 flex h-full flex-col items-center justify-center text-center"
      >
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          <motion.h1 className="text-4xl font-bold sm:text-6xl">
            Legg Inn Dine Predictions
            <motion.span
              initial={{ backgroundPosition: '200% 0' }}
              animate={{ backgroundPosition: '0% 0' }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="block bg-gradient-to-r from-[#64FFFF] via-[#BEFFD2] to-[#64FFFF] bg-[length:200%_auto] bg-clip-text text-transparent"
            >
              Vinn Premier Soon™
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mx-auto max-w-2xl text-lg text-muted-foreground"
          >
            Bli med i Norges største e-sport predictions plattform og test dine
            kunnskaper mot andre fans.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-col gap-4 sm:flex-row sm:justify-center"
          >
            <CTAButton isLoading={isLoading} />
            <Link href="/signup" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full bg-background/80 backdrop-blur-sm hover:bg-background/90 sm:w-auto"
              >
                Registrer Deg
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}

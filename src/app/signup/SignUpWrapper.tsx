'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import SignUpForm from './SignUpForm'

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export default function SignUpWrapper() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-background via-accent to-background opacity-50"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
          backgroundSize: '400% 400%',
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'linear',
        }}
      />

      <Card className="relative w-full max-w-lg bg-background/95 p-8 backdrop-blur-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key="signup"
            className="flex flex-col items-center space-y-6"
            {...fadeIn}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="mb-2 text-3xl font-bold">
                Velkommen til GGWP.NO!
              </h1>
              <p className="text-muted-foreground">
                Opprett en konto for å begynne å spille
              </p>
            </motion.div>
            <SignUpForm />
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  )
}
